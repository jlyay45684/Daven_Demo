# NEXUS — 穿越星際的邊界

NEXUS 是獨立部署的互動式星際視覺作品。保留原始繁體中文敘事、深色宇宙視覺、Three.js 3D 場景及頁面互動；不需要 Genspark Runtime、Node.js 套件安裝或建置流程。

## Live Demo

https://jlyay45684.github.io/Daven_Demo/NEXUS/nexus.html

## 專案檔案

| 檔案 | 職責 |
|---|---|
| `nexus.html` | 六個場景章節、HUD、導覽、文案與載入入口 |
| `nexus.css` | 色彩系統、排版、面板、動畫、響應式版型 |
| `nexus-ui.js` | 游標、滑鼠視差、章節導覽、文字解碼、卡片傾斜、躍遷按鈕與品質選擇 |
| `nexus-scene.js` | Three.js 場景、粒子、GLSL Shader、相機路徑、重力透鏡與後製效果 |

本版不需要額外圖片、字型檔或本機貼圖；核心星體、粒子、光暈與材質由程式即時生成。

## 執行方式

請在 Repository 根目錄啟動 HTTP Server：

```bash
python -m http.server 8000
```

瀏覽器開啟：

```text
http://localhost:8000/NEXUS/nexus.html
```

也可以先切換到 `NEXUS/` 目錄，再執行相同指令並開啟 `http://localhost:8000/nexus.html`。

不要直接使用 `file://` 開啟。Three.js 使用 ES Modules 與 Import Map，瀏覽器需要透過 HTTP 載入模組。

## 外部依賴

- Three.js `0.160.0`：由 Import Map 固定版本，使用 unpkg CDN。
- Three.js Addons：EffectComposer、RenderPass、UnrealBloomPass、ShaderPass。
- Google Fonts：Chakra Petch、JetBrains Mono、Noto Sans TC。

第一次載入需要網路連線。若 CDN 或字型服務不可用，字型會退回系統字型；Three.js 模組不可用時，3D 場景無法啟動。

## 場景與互動

| 章節 | 已有內容 |
|---|---|
| 00 銀河核心 | NEXUS 主視覺、啟動載入、HUD、相機起始路徑 |
| 01 螺旋星系 | 最多 130,000 個程序生成星系粒子、游標引力擾動 |
| 02 曲速航道 | 曲速線段、速度讀數、滾動速度驅動的視覺變化 |
| 03 事件視界 | 黑洞、吸積盤、光子環、重力透鏡與時空網格 |
| 04 系統模組 | 三張模組卡片、游標傾斜與光暈互動 |
| 05 未知星域 | 磁吸式啟動按鈕、躍遷閃光與回到頁首 |

全域互動包含自訂游標、游標視差、點擊時空漣漪、文字解碼、滾動章節導覽與 LOW / AUTO / ULTRA 品質選擇。品質設定儲存在瀏覽器 localStorage。

## 手動驗收清單

- [ ] HTTP Server 可正常提供 `nexus.html`。
- [ ] 瀏覽器 Network 面板中的 `nexus.css`、`nexus-ui.js`、`nexus-scene.js` 與 Three.js 模組載入成功。
- [ ] 星空、星系核心與黑洞場景可見，HUD FPS 有更新。
- [ ] 滾動六個章節時，相機與曲速效果連續變化。
- [ ] 游標移動可影響星系；點擊背景可產生時空漣漪。
- [ ] 左側章節導覽可跳轉，卡片可傾斜，品質選擇有效。
- [ ] 最終躍遷按鈕會觸發閃光與回到頁首。
- [ ] 窄螢幕及觸控裝置版面可用；無 WebGL 時顯示 CSS 背景備援。
- [ ] Console 無未處理例外或重複載入錯誤。

## 維護原則

- 不把 Three.js 場景改寫成靜態背景或一般企業頁面。
- 不移除原有六個章節及繁體中文內容。
- 修改互動前先確認 HTML 的 ID / data-* selector 與 JS 查詢一致。
- 新增外部依賴時固定版本並更新本文件。
- 所有調整先在功能分支完成，測試與審核通過後才合併。
