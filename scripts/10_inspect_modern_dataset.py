import pandas as pd

df = pd.read_csv("data/cleaned/master_nfl_depth_chart_with_race.csv")

print("Rows, columns:", df.shape)
print("\nColumns:")
print(df.columns.tolist())

print("\nFirst rows:")
print(df.head())

print("\nRace counts:")
print(df["InferredRace"].value_counts(dropna=False))

print("\nPosition counts:")
print(df["PrimaryPosition"].value_counts(dropna=False))