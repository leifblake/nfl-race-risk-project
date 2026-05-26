import pandas as pd
from pathlib import Path

input_file = Path("data/cleaned/players_with_race.csv")
output_file = Path("data/cleaned/position_race_summary.csv")

df = pd.read_csv(input_file)

# Remove unknowns
known = df[df["race"] != "Other/Unknown"].copy()

# Count player-seasons
summary = (
    known
    .groupby(["position_group", "race"])
    .size()
    .reset_index(name="count")
)

# Total players per position
summary["position_total"] = (
    summary.groupby("position_group")["count"]
    .transform("sum")
)

# Percentage within position
summary["percent_of_position"] = (
    summary["count"] / summary["position_total"] * 100
).round(2)

summary = summary.sort_values(
    by=["position_group", "percent_of_position"],
    ascending=[True, False]
)

summary.to_csv(output_file, index=False)

print(summary)

print(f"\nSaved summary to: {output_file}")