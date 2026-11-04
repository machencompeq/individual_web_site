# individual_web_site
Ming-An,Chen個人網站

**MingAn OS**：整個網站就是一台電腦。開機畫面 → 經典桌面（XP 綠色山丘 · Win98 · Mac Aqua · Hacker），點圖示開視窗，按 `/` 打指令。

## 更新內容（只改一個檔案）
所有文字、照片、獎狀、作品、經歷都在 **`content.js`**。改完存檔、重新整理就好，不用碰其他程式。

## 怎麼玩
- 桌面圖示點兩下打開視窗（手機點一下），視窗可以拖、縮小、放大、調整大小
- 按 `/` 叫出指令列：`/open 相簿`、`/theme hacker`、`/jump`、`/close`、`/cv`、`/help`
- 終端機吃同一套指令（加不加 `/` 都可以），還有隱藏指令
- 桌面上的洺安點了會跳；右下角「一般模式」是給面試官看的普通履歷頁
- 3D：開機鏡頭飛進 CRT 螢幕、會動的桌布（XP 草地隨風擺 / Hacker 程式碼隧道 / Mac 流光）、閒置 45 秒的 3D 螢幕保護程式（`/screensaver`）、3D展示.app、相簿 3D 旋轉木馬、獎狀 3D 展示牆
- 慢的裝置會自動降低畫質；網址加 `?hq` 強制高畫質、`?noboot` 跳過開機

## 結構
| 路徑 | 說明 |
| --- | --- |
| `index.html` | 桌面、選單、指令列、一般履歷模式、各 App 內容模板 |
| `style.css` | 四種主題（同一套 token）、視窗、手機版 |
| `script.js` | 開機、視窗管理、`/` 指令、終端機、相簿、獎狀、玩具間（matter.js）、桌面寵物 |
| `content.js` | **網站所有內容**（要更新資料改這裡） |
| `three-fx.js` | 3D 桌布、開機動畫、螢幕保護程式、3D 展示、3D 獎狀牆 |
| `three-scenes.js` | 載入 Blender 匯出的 `.glb`，在「作品」視窗裡即時顯示 |
| `3d/build_assets.py` | Blender 建模腳本：`assets/3d/*.glb` 和圖示 |
| `3d/build_wallpapers.py` | 經典風格桌布（原創，非官方桌布） |
| `tools/` | CI 用的建置、檢查、瀏覽器煙霧測試 |

## 重新產生 3D 素材
```bash
pip install bpy==5.1.2 pillow
python 3d/make_screen.py && python 3d/build_assets.py && python 3d/build_wallpapers.py
```

## CI/CD（`.github/workflows/`）
- **ci-cd.yml**：每次 push / PR 組出 `_site/`、檢查檔案與連結、用 Chromium 實際操作網站（開機、視窗、`/` 指令、終端機、3D、相簿、獎狀、一般模式、桌機 + 手機），推到 `main` 自動部署 GitHub Pages。
- **render-3d.yml**：改了 `3d/` 底下的腳本時，在 CI 裡用 Blender 重新渲染。

> 第一次部署前，請到 repo 的 **Settings → Pages → Source** 選 **GitHub Actions**。
