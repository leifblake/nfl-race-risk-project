import pandas as pd

players = pd.read_csv(
    "data/manual/all_player_demographic_clean.csv"
)

print(
    sorted(
        players["position_id"]
        .dropna()
        .unique()
    )
)