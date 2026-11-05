import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
SEED_DIR = ROOT_DIR / "seed_data"


def load_json(filename):
    file_path = SEED_DIR / filename

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def get_brand_rules():
    return load_json("brand_rules.json")


def get_pricing():
    return load_json("pricing_v2.json")