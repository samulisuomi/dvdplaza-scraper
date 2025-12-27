#!/bin/bash

URL="$1"

if [ -z "$URL" ]; then
  echo "Usage: $0 <URL>"
  exit 1
fi

# Extract pathname from URL
PATH_PART=$(echo "$URL" | sed -E 's|^https?://[^/]+||' | sed 's|^/||' | sed 's|/$||' | sed 's|\?.*||')

if [ -z "$PATH_PART" ]; then
  OUTPUT_FILE="./output/index.html"
else
  # URL decode using Node.js
  DECODED_PATH=$(node -e "console.log(decodeURIComponent('$PATH_PART'))")
  
  # Create directory structure under output/
  mkdir -p "./output/$DECODED_PATH"
  
  OUTPUT_FILE="./output/$DECODED_PATH/index.html"
fi

# Early return if file already exists
if [ -f "$OUTPUT_FILE" ]; then
  echo "File already exists: $OUTPUT_FILE"
  exit 0
fi

# Download with monolith
monolith "$URL" -o "$OUTPUT_FILE"

echo "Saved to: $OUTPUT_FILE"

echo "Converting anchor tags to relative..."

# After monolith download, add these lines:
DOMAIN=$(echo "$URL" | sed -E 's|^https?://([^/]+).*|\1|')
sed -i '' "s|https://${DOMAIN}/|/|g" "$OUTPUT_FILE"
sed -i '' "s|https://${DOMAIN}\"|\"|g" "$OUTPUT_FILE"
sed -i '' "s|<base[^>]*>||g" "$OUTPUT_FILE"

echo "Done"