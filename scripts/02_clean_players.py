import pandas as pd
from pathlib import Path

# -----------------------------
# FILE PATHS
# -----------------------------
input_file = Path("data/raw/seasonal_rosters_2000_2024.csv")
output_file = Path("data/cleaned/players_clean.csv")

output_file.parent.mkdir(parents=True, exist_ok=True)

# -----------------------------
# LOAD RAW DATA
# -----------------------------
df = pd.read_csv(input_file)

print("Raw columns:")
print(df.columns.tolist())

# -----------------------------
# FIND / STANDARDIZE COLUMNS
# -----------------------------
# nfl_data_py column names may vary slightly by version.
# This helper checks for possible column names.

def find_column(possible_names):
    for name in possible_names:
        if name in df.columns:
            return name
    raise ValueError(f"Could not find any of these columns: {possible_names}")

player_id_col = find_column(["player_id", "gsis_id", "pfr_id"])
name_col = find_column(["player_name", "full_name", "name"])
season_col = find_column(["season"])
team_col = find_column(["team", "recent_team"])
position_col = find_column(["position"])

# -----------------------------
# KEEP IMPORTANT COLUMNS
# -----------------------------
players = df[[player_id_col, season_col, name_col, team_col, position_col]].copy()

players = players.rename(columns={
    player_id_col: "player_id",
    season_col: "season",
    name_col: "player_name",
    team_col: "team",
    position_col: "position"
})

# -----------------------------
# CLEAN TEXT
# -----------------------------
players["player_id"] = players["player_id"].astype(str).str.strip()
players["player_name"] = players["player_name"].astype(str).str.strip()
players["team"] = players["team"].astype(str).str.strip()
players["position"] = players["position"].astype(str).str.strip().str.upper()

# -----------------------------
# CREATE POSITION GROUPS
# -----------------------------
position_map = {
    "QB": "QB",

    "RB": "RB",
    "HB": "RB",
    "FB": "RB",

    "WR": "WR",

    "CB": "DB",
    "DB": "DB",
    "FS": "DB",
    "SS": "DB",
    "S": "DB",

    "LB": "LB",
    "OLB": "LB",
    "MLB": "LB",
    "ILB": "LB"
}

players["position_group"] = players["position"].map(position_map)

# -----------------------------
# FILTER TO TARGET POSITIONS
# -----------------------------
players = players[players["position_group"].notna()].copy()

# -----------------------------
# REMOVE DUPLICATES
# -----------------------------
players = players.drop_duplicates(
    subset=["player_id", "season", "team", "position"]
)

# -----------------------------
# SORT DATA
# -----------------------------
players = players.sort_values(
    by=["season", "position_group", "player_name"]
)

# -----------------------------
# SAVE CLEAN DATA
# -----------------------------
players.to_csv(output_file, index=False)

print(f"Saved cleaned player dataset to: {output_file}")
print(f"Rows: {len(players)}")
print(players.head())