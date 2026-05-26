import pandas as pd
import requests
import time
from pathlib import Path

input_file = Path("data/manual/race_data_template.csv")
output_file = Path("data/manual/rb_wikipedia_metadata.csv")

WIKI_API = "https://en.wikipedia.org/w/api.php"

HEADERS = {
    "User-Agent": "NFLRaceRiskStudentProject/1.0 (educational research; contact: your-email@example.com)"
}

REQUEST_DELAY = 2.5
MAX_RETRIES = 5

def safe_get(params):
    for attempt in range(MAX_RETRIES):
        response = requests.get(
            WIKI_API,
            params=params,
            headers=HEADERS,
            timeout=20
        )

        if response.status_code == 429:
            wait_time = 10 * (attempt + 1)
            print(f"Rate limited. Waiting {wait_time} seconds...")
            time.sleep(wait_time)
            continue

        response.raise_for_status()
        time.sleep(REQUEST_DELAY)
        return response

    raise Exception("Too many 429 errors. Stop and try again later.")

def wiki_search_player(player_name):
    params = {
        "action": "query",
        "list": "search",
        "srsearch": f"{player_name} American football",
        "format": "json",
        "srlimit": 1
    }

    r = safe_get(params)
    results = r.json().get("query", {}).get("search", [])

    return results[0]["title"] if results else ""

def get_page_data(title):
    if not title:
        return "", "", ""

    params = {
        "action": "query",
        "prop": "extracts|info|categories",
        "exintro": True,
        "explaintext": True,
        "inprop": "url",
        "cllimit": "max",
        "titles": title,
        "format": "json"
    }

    r = safe_get(params)
    pages = r.json().get("query", {}).get("pages", {})

    for _, page in pages.items():
        summary = page.get("extract", "")
        url = page.get("fullurl", "")
        categories = " | ".join(
            cat.get("title", "").replace("Category:", "")
            for cat in page.get("categories", [])
        )
        return summary, url, categories

    return "", "", ""

df = pd.read_csv(input_file)
rbs = df[df["position_group"] == "RB"].copy()

# Resume existing progress if file already exists
if output_file.exists():
    existing = pd.read_csv(output_file)
    completed_ids = set(existing["player_id"].astype(str))
    rows = existing.to_dict("records")
    print(f"Resuming from existing file. Already completed: {len(completed_ids)}")
else:
    completed_ids = set()
    rows = []

for _, row in rbs.iterrows():
    player_id = str(row["player_id"])

    if player_id in completed_ids:
        continue

    player_name = row["player_name"]
    print(f"Searching: {player_name}")

    try:
        title = wiki_search_player(player_name)
        summary, url, categories = get_page_data(title)
    except Exception as e:
        title = ""
        summary = ""
        url = ""
        categories = ""
        print(f"Error for {player_name}: {e}")

    rows.append({
        "player_id": player_id,
        "player_name": player_name,
        "position_group": row["position_group"],
        "wiki_title": title,
        "wiki_url": url,
        "summary": summary,
        "categories": categories
    })

    # Save after every player so progress is not lost
    pd.DataFrame(rows).to_csv(output_file, index=False)

print(f"Saved: {output_file}")