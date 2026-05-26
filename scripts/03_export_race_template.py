import pandas as pd
from pathlib import Path

input_file = Path("data/cleaned/players_clean.csv")
output_file = Path("data/manual/race_data_template.csv")

# Load cleaned player dataset
df = pd.read_csv(input_file)

# Keep one row per unique player
unique_players = (
    df[["player_id", "player_name", "position_group"]]
    .drop_duplicates(subset=["player_id"])
    .sort_values(by=["position_group", "player_name"])
)

# Add empty columns for manual classification
unique_players["race"] = ""
unique_players["race_source"] = ""
unique_players["confidence"] = ""
unique_players["notes"] = ""

# Save template
unique_players.to_csv(output_file, index=False)

print(f"Race template saved to: {output_file}")
print(f"Unique players: {len(unique_players)}")