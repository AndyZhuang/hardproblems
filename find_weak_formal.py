"""Print all weak formals grouped by category for manual review."""
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('weak_formals.json', encoding='utf-8') as f:
    weak = json.load(f)

from collections import defaultdict
by_cat = defaultdict(list)
for p in weak:
    by_cat[p['category']].append(p)

for cat in sorted(by_cat):
    print(f'\n===== {cat} ({len(by_cat[cat])}) =====')
    for p in by_cat[cat]:
        print(f"  [{p['id']}] ({len(p['formal'])}) {p['formal']}")
