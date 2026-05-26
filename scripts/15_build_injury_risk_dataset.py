import pandas as pd
from pathlib import Path

injuries = pd.read_csv("data/manual/all_injuries_clean.csv")
players = pd.read_csv("data/manual/all_player_demographic_clean.csv")
race_data = pd.read_csv("data/cleaned/modern_position_race_summary.csv")


def map_position(pos):
    """
    Convert detailed football positions into the same position groups
    used throughout the rest of the project.
    """
    if pd.isna(pos):
        return None

    pos = str(pos).strip().upper()

    # Offense
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

    # Defense
    if pos in ["CB", "DB", "FS", "SS", "S"]:
        return "DB"

    if pos in ["LB", "ILB", "OLB", "MLB"]:
        return "LB"

    if pos in ["DE", "DT", "DL", "NT"]:
        return "DL"

    return None


# Map player positions into project position groups
players["injury_position_group"] = players["position_id"].apply(map_position)

merged = injuries.merge(
    players[["name", "team", "year", "injury_position_group"]],
    on=["name", "team", "year"],
    how="left"
)

merged["injury_burden"] = (
    merged["num_games_injured"] +
    merged["num_games_missing"]
)

injury_summary = (
    merged
    .dropna(subset=["injury_position_group"])
    .groupby("injury_position_group")
    .agg(
        avg_injury_burden=("injury_burden", "mean"),
        total_games_missed=("num_games_missing", "sum"),
        total_games_injured=("num_games_injured", "sum"),
        player_seasons=("name", "count")
    )
    .reset_index()
    .rename(columns={"injury_position_group": "position_group"})
)

# Keep race position groups consistent with the rest of the project.
# DO NOT combine DB/LB/DL into DEF anymore.
race_grouped = race_data.copy()
race_grouped["injury_position_group"] = race_grouped["position_group"]

# Recalculate Black share using counts, not averaging percentages
black_counts = (
    race_grouped[race_grouped["race"] == "Black"]
    .groupby("injury_position_group")["count"]
    .sum()
)

total_counts = (
    race_grouped
    .groupby("injury_position_group")["count"]
    .sum()
)

black_share = (
    (black_counts / total_counts * 100)
    .reset_index(name="black_share")
    .rename(columns={"injury_position_group": "position_group"})
)

final = injury_summary.merge(
    black_share,
    on="position_group",
    how="left"
)

# Keep football position groups only
final = final[final["position_group"].isin([
    "QB", "RB", "WR", "TE", "OL", "DB", "LB", "DL"
])].copy()

final = final.sort_values(
    by="avg_injury_burden",
    ascending=False
)

output_path = Path("data/cleaned/position_injury_risk.csv")
final.to_csv(output_path, index=False)

print("\nSaved:")
print(output_path)

print("\nFinal dataset:")
print(final)