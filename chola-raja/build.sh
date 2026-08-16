#!/bin/sh
# ============================================================
# build.sh - squash the whole game into one file.
#
# There is no npm, no bundler and no build tool here on purpose.
# The game runs perfectly well from index.html while you work on it.
# This script only exists to produce a single file you can email,
# put on a USB stick, or publish as a link.
#
#   sh build.sh
#
# It writes two things into dist/:
#   chola-raja.html   a complete page - double-click it and play, offline
#   artifact.html     the same thing without the <html>/<head> wrapper,
#                     for publishing to a hosting service that adds its own
# ============================================================
set -e
cd "$(dirname "$0")"
mkdir -p dist

FILES="js/util.js js/input.js js/audio.js js/art.js js/world.js js/player.js js/enemies.js js/levels.js js/story.js js/ui.js js/game.js"

BODY=dist/.body.tmp
{
  echo '<title>Chola Raja - The Rescue of Kundavai</title>'
  echo '<style>'
  cat css/style.css
  echo '</style>'
  echo ''
  echo '<div id="stage">'
  echo '  <canvas id="screen" width="400" height="225"></canvas>'
  echo '</div>'
  echo ''
  for f in $FILES; do
    echo "<script>/* ---- $f ---- */"
    cat "$f"
    echo '</script>'
  done
} > "$BODY"

cp "$BODY" dist/artifact.html

{
  echo '<!DOCTYPE html>'
  echo '<html lang="en">'
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">'
  cat "$BODY" | head -n 1
  echo '</head>'
  echo '<body>'
  tail -n +2 "$BODY"
  echo '</body>'
  echo '</html>'
} > dist/chola-raja.html

rm -f "$BODY"

echo "built:"
ls -l dist/chola-raja.html dist/artifact.html
