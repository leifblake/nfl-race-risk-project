import pandas as pd
from pathlib import Path

YEARS = range(2009, 2018)

INJURIES_PATH = Path("data/manual/all_injuries_clean.csv")
PLAYERS_PATH = Path("data/manual/all_player_demographic_clean.csv")
RACE_PATH = Path("data/cleaned/modern_position_race_summary.csv")
OUTPUT_PATH = Path("data/cleaned/position_injury_risk.csv")
DEBUG_PATH = Path("data/cleaned/injury_position_merge_debug.csv")

def clean_name(name):
    if pd.isna(name):
        return ""
    return (
        str(name)
        .lower()
        .replace(".", "")
        .replace(",", "")
        .replace("'", "")
        .replace("-", " ")
        .replace(" jr", "")
        .replace(" sr", "")
        .replace(" ii", "")
        .replace(" iii", "")
        .replace(" iv", "")
        .strip()
    )

def map_position(pos):
    if pd.isna(pos):
        return None

    pos = str(pos).strip().upper()

    if pos == "QB":
        return "QB"
    if pos in ["RB", "FB"]:
        return "RB"
    if pos == "WR":
        return "WR"
    if pos == "TE":
        return "TE"
    if pos in ["C", "G", "OG", "OT", "T", "OL"]:
        return "OL"

    if pos in ["CB", "DB", "FS", "SS", "S"]:
        return "DB"
    if pos in ["LB", "ILB", "OLB", "MLB"]:
        return "LB"
    if pos in ["DE", "DT", "DL", "NT", "EDGE"]:
        return "DL"

    return None

print("Loading current injury and player files...")
injuries = pd.read_csv(INJURIES_PATH)
players = pd.read_csv(PLAYERS_PATH)
race_data = pd.read_csv(RACE_PATH)

print("Downloading nflverse weekly roster files...")
roster_frames = []

for year in YEARS:
    url = f"https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_{year}.csv"
    print(f"  {year}")
    try:
        temp = pd.read_csv(url, low_memory=False)
        temp["year"] = year
        roster_frames.append(temp)
    except Exception as e:
        print(f"Could not load {year}: {e}")

rosters = pd.concat(roster_frames, ignore_index=True)

print("\nNFLverse roster columns:")
print(rosters.columns.tolist())

# Keep only likely useful columns
possible_name_cols = ["player_name", "full_name", "name", "display_name"]
name_col = next((c for c in possible_name_cols if c in rosters.columns), None)

if name_col is None:
    raise ValueError("Could not find player name column in nflverse roster data.")

if "position" not in rosters.columns:
    raise ValueError("Could not find position column in nflverse roster data.")

rosters["clean_name"] = rosters[name_col].apply(clean_name)
rosters["nflverse_position_group"] = rosters["position"].apply(map_position)

# One row per player-year-position group
rosters_clean = (
    rosters
    .dropna(subset=["nflverse_position_group"])
    .groupby(["clean_name", "year"])["nflverse_position_group"]
    .agg(lambda x: x.mode().iloc[0] if not x.mode().empty else x.iloc[0])
    .reset_index()
)

print("\nRoster position groups found:")
print(sorted(rosters_clean["nflverse_position_group"].dropna().unique()))

# Merge original injury/player files first
players["clean_name"] = players["name"].apply(clean_name)

merged = injuries.merge(
    players[["name", "team", "year", "position_id", "clean_name"]],
    on=["name", "team", "year"],
    how="left"
)

# Add nflverse detailed position by cleaned name + year
merged = merged.merge(
    rosters_clean,
    on=["clean_name", "year"],
    how="left"
)

# Use nflverse detailed group when available.
# Fall back to original broad position_id when not available.
merged["position_group"] = merged["nflverse_position_group"]

fallback = merged["position_group"].isna()
merged.loc[fallback, "position_group"] = merged.loc[fallback, "position_id"].apply(map_position)

merged["injury_burden"] = (
    merged["num_games_injured"] +
    merged["num_games_missing"]
)

# Save debug file so you can inspect merge quality
merged.to_csv(DEBUG_PATH, index=False)

print("\nMerge quality:")
print("Total injury rows:", len(merged))
print("Rows with nflverse position:", merged["nflverse_position_group"].notna().sum())
print("Rows still missing position group:", merged["position_group"].isna().sum())
print(f"Debug file saved to: {DEBUG_PATH}")

injury_summary = (
    merged
    .dropna(subset=["position_group"])
    .groupby("position_group")
    .agg(
        avg_injury_burden=("injury_burden", "mean"),
        total_games_missed=("num_games_missing", "sum"),
        total_games_injured=("num_games_injured", "sum"),
        player_seasons=("name", "count")
    )
    .reset_index()
)

# Race data already uses QB/RB/WR/TE/OL/DB/LB/DL
race_grouped = race_data.copy()
race_grouped["position_group"] = race_grouped["position_group"].astype(str).str.upper()

black_counts = (
    race_grouped[race_grouped["race"] == "Black"]
    .groupby("position_group")["count"]
    .sum()
)

total_counts = (
    race_grouped
    .groupby("position_group")["count"]
    .sum()
)

black_share = (
    (black_counts / total_counts * 100)
    .reset_index(name="black_share")
)

final = injury_summary.merge(
    black_share,
    on="position_group",
    how="left"
)

final = final[final["position_group"].isin([
    "QB", "RB", "WR", "TE", "OL", "DB", "LB", "DL"
])].copy()

final = final.sort_values(
    by="avg_injury_burden",
    ascending=False
)

final.to_csv(OUTPUT_PATH, index=False)

print("\nSaved:")
print(OUTPUT_PATH)

print("\nFinal dataset:")
print(final)