import pandas as pd
import nfl_data_py as nfl
from pathlib import Path

# -----------------------------
# SETTINGS
# -----------------------------
START_YEAR = 2000
END_YEAR = 2024

years = list(range(START_YEAR, END_YEAR + 1))

output_dir = Path("data/raw")
output_dir.mkdir(parents=True, exist_ok=True)

output_file = output_dir / f"seasonal_rosters_{START_YEAR}_{END_YEAR}.csv"

# -----------------------------
# DOWNLOAD DATA
# -----------------------------
print(f"Downloading seasonal rosters for {START_YEAR}-{END_YEAR}...")

rosters = nfl.import_seasonal_rosters(years)

print("Download complete.")
print("Columns available:")
print(rosters.columns.tolist())

# -----------------------------
# SAVE RAW DATA
# -----------------------------
rosters.to_csv(output_file, index=False)

print(f"Saved raw roster data to: {output_file}")
print(f"Rows: {len(rosters)}")