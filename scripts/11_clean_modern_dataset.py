import pandas as pd
from pathlib import Path

input_file = Path("data/cleaned/master_nfl_depth_chart_with_race.csv")
output_file = Path("data/cleaned/modern_players_clean.csv")

df = pd.read_csv(input_file)

# Keep useful columns
df = df[[
    "TeamName",
    "PrimaryPosition",
    "PrimaryDepth",
    "PlayerName",
    "PlayerUID",
    "PlayerURL",
    "InferredRace",
    "RaceConfidence",
    "PlayerHeightInches",
    "PlayerWeightLBS",
    "PlayerBirthdate",
    "PlayerCollege",
    "DraftYear",
    "DraftPosition",
    "DraftOrganization"
]].copy()

# Clean race labels
df["race"] = df["InferredRace"].replace({
    "Latino Hispanic": "Latino",
    "Indian": "Asian",
    "Asian": "Asian",
    "Black": "Black",
    "White": "White"
})

# If there are any Pacific Islander labels in the raw data, preserve them.
df["race"] = df["race"].replace({
    "Pacific Islander": "Pacific Islander"
})

# Clean position
df["position"] = df["PrimaryPosition"].astype(str).str.upper().str.strip()

# Position groups
position_map = {
    "QB": "QB",

    "RB": "RB",
    "FB": "RB",

    "WR": "WR",

    "CB": "DB",
    "FS": "DB",
    "SS": "DB",
    "S": "DB",

    "LB": "LB",
    "MLB": "LB",
    "OLB": "LB",
    "ILB": "LB",

    "LT": "OL",
    "LG": "OL",
    "C": "OL",
    "RG": "OL",
    "RT": "OL",

    "LDE": "DL",
    "RDE": "DL",
    "DE": "DL",
    "LDT": "DL",
    "RDT": "DL",
    "DT": "DL",
    "NT": "DL",

    "TE": "TE"
}

df["position_group"] = df["position"].map(position_map)

# Remove rows without a usable race or position group
df = df[df["race"].notna()].copy()
df = df[df["position_group"].notna()].copy()

# Save
df.to_csv(output_file, index=False)

print(f"Saved cleaned modern dataset to: {output_file}")
print("Rows:", len(df))

print("\nRace counts:")
print(df["race"].value_counts())

print("\nPosition group counts:")
print(df["position_group"].value_counts())