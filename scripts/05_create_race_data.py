import pandas as pd
from pathlib import Path

input_file = Path("data/manual/rb_wikipedia_metadata.csv")
output_file = Path("data/manual/rb_race_data.csv")

df = pd.read_csv(input_file)

def suggest_race(row):
    text = f"{row.get('summary', '')} {row.get('categories', '')}".lower()

    if any(word in text for word in [
        "african-american",
        "african american",
        "black american"
    ]):
        return "Black", "Medium", "Wikipedia metadata matched Black/African-American language."

    if any(word in text for word in [
        "white american",
        "european-american",
        "european american"
    ]):
        return "White", "Medium", "Wikipedia metadata matched White/European-American language."

    if any(word in text for word in [
        "latino",
        "hispanic",
        "mexican-american",
        "mexican american",
        "puerto rican"
    ]):
        return "Latino", "Medium", "Wikipedia metadata matched Latino/Hispanic language."

    if any(word in text for word in [
        "asian-american",
        "asian american",
        "japanese-american",
        "korean-american",
        "filipino-american"
    ]):
        return "Asian", "Medium", "Wikipedia metadata matched Asian-American language."

    if any(word in text for word in [
        "biracial",
        "multiracial",
        "mixed race",
        "mixed-race"
    ]):
        return "Multiracial", "Medium", "Wikipedia metadata matched multiracial language."

    if any(word in text for word in [
        "samoan",
        "tongan",
        "polynesian",
        "pacific islander"
    ]):
        return "Pacific Islander", "Medium", "Wikipedia metadata matched Pacific Islander language."

    return "White", "Low", "No minority ethnicity markers detected in metadata. Provisional White classification; should be manually reviewed."

rows = []

for _, row in df.iterrows():
    race, confidence, notes = suggest_race(row)

    rows.append({
        "player_id": row["player_id"],
        "player_name": row["player_name"],
        "position_group": row["position_group"],
        "race": race,
        "race_source": row.get("wiki_url", "Wikipedia metadata"),
        "confidence": confidence,
        "notes": notes
    })

out = pd.DataFrame(rows)

out.to_csv(output_file, index=False)

print(f"Saved: {output_file}")
print("\nRace counts:")
print(out["race"].value_counts())