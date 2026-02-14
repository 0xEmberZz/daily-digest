#!/bin/bash
# publish.sh — Generate digest, archive, update index, push to GitHub
# Usage: ./scripts/publish.sh [--hours 48] [--top-n 15] [--lang zh]

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIGESTS_DIR="$REPO_DIR/digests"
DATE=$(date +%Y-%m-%d)
INDEX_FILE="$DIGESTS_DIR/index.json"

export PATH="$HOME/.bun/bin:$PATH"

# Read API key from config
CONFIG="$HOME/.hn-daily-digest/config.json"
if [ -f "$CONFIG" ]; then
    export GEMINI_API_KEY=$(python3 -c "import json; print(json.load(open('$CONFIG'))['geminiApiKey'])" 2>/dev/null || echo "")
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "[publish] Error: No GEMINI_API_KEY found"
    exit 1
fi

echo "[publish] Generating digest for $DATE..."

# Generate digest
bun "$HOME/.openclaw/workspace/skills/ai-daily-digest/scripts/digest.ts" \
    "${@:---hours 48 --top-n 15 --lang zh}" \
    --output "$DIGESTS_DIR/$DATE.md"

# Copy as latest
cp "$DIGESTS_DIR/$DATE.md" "$DIGESTS_DIR/latest.md"

# Update index.json — prepend new date
if [ -f "$INDEX_FILE" ]; then
    python3 -c "
import json
with open('$INDEX_FILE') as f:
    data = json.load(f)
dates = data.get('dates', [])
if '$DATE' not in dates:
    dates.insert(0, '$DATE')
    dates.sort(reverse=True)
with open('$INDEX_FILE', 'w') as f:
    json.dump({'dates': dates}, f)
"
else
    echo '{"dates":["'$DATE'"]}' > "$INDEX_FILE"
fi

echo "[publish] Archived as $DATE.md, updated index.json"

# Push to GitHub
cd "$REPO_DIR"
git add digests/
git commit -m "Digest $DATE" --allow-empty
git push

echo "[publish] Pushed to GitHub. Done."
