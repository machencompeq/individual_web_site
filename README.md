# individual_web_site
Ming-An,Chen個人網站

好玩、會動的個人網站：可以點的跳躍照、可以丟的物理玩具間（matter.js）、可以甩的相簿、可以翻的獎狀牌。3D 物件用 **Blender** 以程式建模，用 **three.js** 即時顯示。

## 結構
| 路徑 | 說明 |
| --- | --- |
| `index.html` / `style.css` / `script.js` | 頁面、樣式、所有互動（跳躍、玩具間物理、相簿、翻牌、作品分頁、彩蛋） |
| `three-scenes.js` | 載入 `.glb`，CRT 螢幕上的終端機動畫、拖曳旋轉 |
| `3d/build_assets.py` | Blender 建模腳本：輸出 `assets/3d/*.glb` 與渲染圖 `*.png` |
| `3d/make_screen.py` | CRT 螢幕貼圖 |
| `tools/` | CI 用的建置、檢查、瀏覽器煙霧測試 |

## 重新產生 3D 素材
```bash
pip install bpy==5.1.2 pillow
python 3d/make_screen.py
python 3d/build_assets.py          # 加 --fast 快速預覽，--only=desk,heap 只做部分
```

## CI/CD（`.github/workflows/`）
- **ci-cd.yml**：每次 push / PR 都會組出 `_site/`、檢查檔案與連結、用 Chromium 實際打開網站測試（3D、程式碼檢視、篩選、圖片檢視、手機版），截圖放在 Artifacts。推到 `main` 時自動部署到 GitHub Pages。
- **render-3d.yml**：改了 `3d/` 底下的腳本時，在 CI 裡用 Blender 重新建模與渲染，結果放在 Artifacts。

> 第一次部署前，請到 repo 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
