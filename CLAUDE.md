# 健康餐 App（Bento Fit）專案說明

> 本檔＝專案最高層說明。跨 session 開工前先讀本檔 → DECISIONS.md → LESSONS.md。
> **開工第一步**：`git fetch` 並與 `origin/main` 對帳（見 LESSONS L-006，本機曾落後 34 筆）。

## 一句話
個人用的每週便當健康餐規劃 PWA：AI 生成菜單、採買清單、冰箱庫存、體態追蹤、IG/社群美食與飲品食譜收藏，資料靠使用者自己的 Google Apps Script 做雲端備份同步。

## 基本資訊
- **型態**：單檔 PWA（`index.html`）＋ `sw.js`（Service Worker）
- **位置**：`D:/佳萱/08PYTHON/健康餐 App/`
- **技術**：Vanilla JS ＋ Tailwind CSS（**本機 `tailwind.css`**，非 CDN；SW 對本機資源走「網路優先」避免卡舊版樣式），無建置流程、無框架
- **AI**：Google Gemini（`generativelanguage` 免費端點，使用者自備 API Key）
- **部署**：靜態檔；SW 快取版本 `bento-fit-vX.Y`（目前 v2.16，由 git pre-commit hook 於 index.html 變更時自動遞增，見 DECISIONS D-004）

## 開發流程（重要）
- **主線在 `origin/main`**；功能走 **feature 分支 ＋ Pull Request** 合併（例：`feat/social-dish-recipes`、`feat/tiktok-drink-recipes`、`refactor/mealprep-merge-into-ai-flow`）。
- 本機 checkout 容易落後；**動工前一定先 fetch 對帳**，否則會在過時基底上重做已完成的功能。

## 架構（分層，全掛在全域 `app` 物件）
- `app.infrastructure` — storage（localStorage 讀寫）、ai（Gemini client）、device
- `app.domain` — 健康計算、AI promptFactory、shopping/recipe services（純邏輯）
- `app.state` — 執行期狀態（user, plan, recipes, drinks, igRecipes, shopping, history, fridge…）
- 應用層 — 所有 `render*`／UI 函式直接掛在 `app`

## 後端（兩支獨立的 GAS，不同專案）
1. **健康餐同步 GAS**（使用者在 App 設定頁填 `syncUrl`）：只做資料備份。
   - 上傳＝`fetch(POST, mode:'no-cors')`（**讀不到回應**，純寫入）
   - 還原＝`fetch(GET)` → `res.json()`（**讀得到**）
2. **「管家」GAS**（美食公道伯 V2，LINE bot：點餐／物資／旅遊）：含 Apify＋Gemini＋抓 IG 全套。
   - IG 食譜萃取端點 `?action=igRecipe&url=...`（已上線、前端串接；定案見 DECISIONS D-002/D-003）。
   - ⚠️ 管家 GAS 網址**不寫死在原始碼**（安全修正，commit e608263）。

## 主要 localStorage key
`bento_user / bento_plan / bento_recipes / bento_drinks / bento_ig_recipes / bento_shopping / bento_history / bento_prep / bento_ratings / bento_body_log / bento_custom_staples / bento_custom_shopping / bento_custom_library / bento_meal_log / bento_fridge / bento_plan_week / bento_weekend_prompt / bento_quick_log / bento_last_cuisine / bento_dark_mode / bento_timestamp / bento_last_date / bento_notified_date`
（新增 key 要在 5 處登記，見 LESSONS L-005；實際以 index.html 為準）

## 慣例
- 繁體中文、台灣用語；程式碼註解繁中。
- 改檔後要讀回實際內容才算完成（verify-done）。
- 新增 localStorage key 必在 5 處登記。
- 通用確認框 `modal-general` z-index 須最高（見 LESSONS L-002）。

## 目前狀態（115/10/21）
- **已完成並合併進 main**：冰箱庫存、首頁冰箱卡片、規劃時自動帶入清冰箱、週末菜單提示、移除成就挑戰（v2.12）；4 項 UX 改善（v2.13）；**IG 社群美食/飲品貼文解析 → 食譜庫**（存 `bento_ig_recipes`／`bento_drinks`，可「加入本週菜單」，PR #10~#12）。
- 後端 `igRecipe` API 已部署於管家 GAS 並由前端串接。
- 待辦方向（未排程）：IG **影片內容辨識**（第 4 層，需 Cloud Run／Vertex＋GCP 額度，見 DECISIONS D-003）。
