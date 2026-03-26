#!/bin/bash

# Guard: require a commit message
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh \"commit message\""
  exit 1
fi

# Category directories — single source of truth
CATEGORIES=(
  images/breads
  images/pastries
  images/cakes
  images/seasonal/spring
  images/seasonal/summer
  images/seasonal/fall
  images/seasonal/winter
)

# Step 1: Optimize images (skip already-optimized)
echo "Optimizing images..."
for dir in "${CATEGORIES[@]}"; do
  if ls "$dir"/*.jpg 1> /dev/null 2>&1; then
    for img in "$dir"/*.jpg; do
      width=$(identify -format '%w' "$img")
      size=$(stat --printf='%s' "$img")
      # Skip if already ≤1200px wide and ≤300KB (307200 bytes)
      if [ "$width" -le 1200 ] && [ "$size" -le 307200 ]; then
        continue
      fi
      mogrify -resize '1200x>' -quality 80 -strip "$img"
    done
  fi
done

# Step 2: Generate slideshow manifests (preserve existing alt text)
echo "Generating manifests..."
for dir in "${CATEGORIES[@]}"; do
  manifest="$dir/manifest.json"
  if ls "$dir"/*.jpg 1> /dev/null 2>&1; then
    # Read existing manifest if present
    if [ -f "$manifest" ]; then
      existing="$manifest"
    else
      existing=""
    fi
    # Build new manifest: keep existing alt text, add new files with empty alt
    ls "$dir"/*.jpg | jq -R -s --slurpfile old "${existing:-/dev/null}" '
      split("\n") | map(select(. != "")) | map({
        src: .,
        alt: (. as $f | ($old[0] // [])[] | select(.src == $f) | .alt) // ""
      })
    ' > "$manifest.tmp" 2>/dev/null && mv "$manifest.tmp" "$manifest" || \
    ls "$dir"/*.jpg | jq -R -s '
      split("\n") | map(select(. != "")) | map({ src: ., alt: "" })
    ' > "$manifest"
  else
    echo '[]' > "$manifest"
  fi
done

# Check for empty alt text and warn
echo "Checking for missing alt text..."
missing=0
for dir in "${CATEGORIES[@]}"; do
  if [ -f "$dir/manifest.json" ]; then
    empties=$(jq '[.[] | select(.alt == "")] | length' "$dir/manifest.json")
    if [ "$empties" -gt 0 ]; then
      echo "  WARNING: $dir/manifest.json has $empties images with empty alt text"
      missing=$((missing + empties))
    fi
  fi
done
if [ "$missing" -gt 0 ]; then
  echo ""
  read -p "$missing images missing alt text. Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. Add alt text to manifest.json files and try again."
    exit 1
  fi
fi

# Step 3: Commit and push
git add .
git commit -m "$1"
git push origin main
