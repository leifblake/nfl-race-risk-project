import pandas as pd

injuries = pd.read_csv("data/manual/all_injuries_clean.csv")
players = pd.read_csv("data/manual/all_player_demographic_clean.csv")

print("INJURIES")
print(injuries.shape)
print(injuries.columns.tolist())
print(injuries.head())

print("\nPLAYERS")
print(players.shape)
print(players.columns.tolist())
print(players.head())