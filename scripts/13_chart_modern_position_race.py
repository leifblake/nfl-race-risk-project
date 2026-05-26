import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

input_file = Path("data/cleaned/modern_position_race_summary.csv")
output_file = Path("data/cleaned/modern_position_race_chart.png")

df = pd.read_csv(input_file)

# Combine Asian + Pacific Islander
df["race"] = df["race"].replace({
    "Pacific Islander": "Asian/Pacific Islander",
    "Asian": "Asian/Pacific Islander"
})

# Re-sum combined rows
df = (
    df.groupby(["position_group", "race"], as_index=False)
    ["count"]
    .sum()
)

# Recalculate totals
df["position_total"] = (
    df.groupby("position_group")["count"]
    .transform("sum")
)

df["percent_of_position"] = (
    df["count"] / df["position_total"] * 100
).round(2)

position_order = ["QB", "RB", "WR", "DB", "LB", "OL", "DL", "TE"]

pivot = df.pivot(
    index="position_group",
    columns="race",
    values="percent_of_position"
).fillna(0)

pivot = pivot.reindex([p for p in position_order if p in pivot.index])

# Softer coordinated palette
color_map = {
    "Black": "#4E79A7",
    "White": "#F2C57C",
    "Latino": "#59A14F",
    "Asian/Pacific Islander": "#B07AA1",
    "Middle Eastern": "#E15759"
}

colors = [
    color_map.get(col, "#BAB0AC")
    for col in pivot.columns
]

ax = pivot.plot(
    kind="bar",
    stacked=True,
    figsize=(12, 7),
    color=colors
)

ax.set_title("Modern NFL Race Distribution by Position Group")
ax.set_xlabel("Position Group")
ax.set_ylabel("Percent of Position")

ax.legend(
    title="Race",
    bbox_to_anchor=(1.05, 1),
    loc="upper left"
)

plt.tight_layout()

plt.savefig(output_file, dpi=300)

print(f"Saved chart to: {output_file}")