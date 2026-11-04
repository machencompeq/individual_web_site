#!/usr/bin/env bash
# 把要上線的檔案組成 _site/（原始大檔、Blender 原始碼不會上傳）
set -euo pipefail
OUT="${1:-_site}"
mkdir -p "$OUT/image" "$OUT/video"
cp index.html style.css script.js three-scenes.js "$OUT/"
cp image/favicon.png "$OUT/image/"
cp -r image/web "$OUT/image/"
cp -r assets code "$OUT/"
cp video/web.mp4 "$OUT/video/"
touch "$OUT/.nojekyll"
du -sh "$OUT"
