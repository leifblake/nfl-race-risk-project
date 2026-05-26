import pandas as pd
from pathlib import Path

players_file = Path("data/cleaned/players_clean.csv")
race_file = Path("data/manual/race_data.csv")
output_file = Path("data/cleaned/players_with_race.csv")

players = pd.read_csv(players_file)
race = pd.read_csv(race_file)

required_columns = [
    "player_id",
    "race",
    "race_source",
    "confidence",
    "notes"
]

missing = [col for col in required_columns if col not in race.columns]

if missing:
    raise ValueError(f"Missing columns in race_data.csv: {missing}")

race = race[required_columns].copy()

merged = players.merge(
    race,
    on="player_id",
    how="left"
)

merged["race"] = merged["race"].fillna("Other/Unknown")
merged["race_source"] = merged["race_source"].fillna("Not classified")
merged["confidence"] = merged["confidence"].fillna("Low")
merged["notes"] = merged["notes"].fillna("")

merged.to_csv(output_file, index=False)

print(f"Saved merged dataset to: {output_file}")
print(f"Rows: {len(merged)}")

print("\nRace counts:")
print(merged["race"].value_counts())

print("\nPosition counts:")
print(merged["position_group"].value_counts())