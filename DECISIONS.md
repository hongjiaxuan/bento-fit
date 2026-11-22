# DECISIONS — 健康餐 App 架構定案

> 已定案的事不重新翻案，除非使用者主動提出。新決策往下加，標日期（民國年）。

---

## D-001　雲端同步＝獨立 GAS，上傳 no-cors / 還原 GET　（115/10 之前既有）
- 同步後端是使用者自己的一支 GAS web app，網址填在 App 設定頁（`syncUrl`）。
- **上傳**用 `fetch(POST, mode:'no-cors')`：送得出去但**讀不到回應**（opaque）。
- **還原**用 `fetch(GET)` → `res.json()`：**讀得到**回應（GAS web app 的 GET 會帶 CORS 標頭）。
- 影響：任何「送參數＋要拿回應」的功能都必須走 GET（見 D-002）。

## D-002　IG 食譜萃取打「管家 GAS」、走 GET endpoint　（115/10/18）
- **背景**：使用者想在健康餐 App 貼 IG 美食連結自動建食譜。純前端 PWA 不能自己抓 IG（CORS＋Apify token 不能外露），必須走後端。
- **定案**：
  - 打**「管家」GAS**（另一支，已有 Apify token/actor、`geminiGenerate_`、`fetchInstagramDataWithFallback_`），**不**混進同步 GAS（避免複製程式與重設三把金鑰）。
  - 健康餐 App 設定頁多存一個「IG 端點網址」(`user.igApiUrl`)；備份同步維持原樣不動。
  - 端點走 **GET**（`?action=igRecipe&url=...`），因上傳 no-cors 讀不到回應（D-001）。
  - 後端加 `handleIgRecipeApi_` + `extractRecipeInfoWithGemini_`；`fetchInstagramDataViaApify_` 回傳多帶 `firstComment`/`latestComments`。
  - 選配 token 閘門（仿 `homeApi` 的 `HOME_API_TOKEN`，未設不強制）。
- **狀態（115/10/21）**：✅ 已實作並合併進 main（PR #10~#12）。後端 `igRecipe` 已部署且前端串接；管家 GAS 網址改**不寫死**（commit e608263，安全）。階段 1 的 GAS 片段＝ `gas-manager-ig-recipe.gs`（參考留底）。

## D-003　萃取分層策略；影片辨識延後　（115/10/18）
- **產品**：IG → 萃取 → 卡片讓使用者選「加入想吃清單」或「AI 生成食譜」（兩者都要）。
- **本波範圍（第 1～3 層＋兜底）**，全在現有架構：
  1. 內文 caption
  2. 作者留言（食譜常置頂在作者本人留言）
  3. 封面圖 `displayUrl`（給卡片顯示）
  5. 兜底：只有菜名時，用健康餐**既有** `createSinglePrompt` AI 生成食譜
- 關鍵旗標 **`hasFullRecipe`**：Gemini 判斷內文/留言是否同時含「食材＋步驟」。有→直接帶回完整食譜；沒有→只回菜名/特色。
- **第 4 層「影片辨識」延後**：GAS 無法可靠下載/轉送影片（50MB／6 分鐘限制、前端 GET 會逾時）。要做需 **Cloud Run（ffmpeg 抽影格）或 Vertex AI**，可用 **GCP 9000 元免費額度（到 2026/12/02）**。做法二選一（抽關鍵影格→Gemini Vision／整支影片給 Gemini）之後再定。
- 待驗證：Apify 這支 actor 在 posts 模式是否回留言欄位（階段 1 用真連結實測；沒回則自動退回內文＋封面圖）。
- 實作分三階段：① 後端 API ② 前端卡片＋想吃清單 ③ 生成食譜接線。
- **狀態（115/10/21）**：✅ 第 1～3 層＋兜底已實作並合併（存 `bento_ig_recipes`／`bento_drinks`，可「加入本週菜單」；IG 判斷為飲品時進飲品庫）。第 4 層影片辨識仍未做。

## D-004　SW 版本遞增改用 pre-commit hook　（115/06）
- 原 pre-push hook 用 `git commit --amend` 遞增 SW 版本，但 push 的 SHA 已先鎖定 → 造成 push 後本機/遠端分叉（ahead/behind）。
- 定案：改由 **pre-commit hook**，`index.html` 有變更時自動把 `sw.js` 版本 +1 並一起進該 commit；pre-push 清空。push 後遠端＝本機、不分叉。（hook 在 `.git/hooks/`，不隨 repo，換電腦需重裝。）

## D-005　移除成就與挑戰（gamification）　（115/06）
- 連續登入、徽章、`bento_game` 全數移除；不再加回。

## D-006　AI 生成菜單改由「同步 GAS」代呼叫 Gemini　（115/11/21）
- **背景**：換新 Gemini Key 時發現兩套設定——飲品解析（`parseDrink`）用同步 GAS 指令碼屬性的 Key；AI 生成菜單卻用前端設定頁自填的 `user.apiKey`。
- **定案**：Key 統一放同步 GAS 指令碼屬性。前端 `ai.generate()` 有 `syncUrl` 就 POST（text/plain）`{action:'aiGenerate', prompt}`，GAS 回 `{success, text}`，前端沿用原 JSON 清洗邏輯（`parseAiJson`）。
- （115/11/21 更新）**前端 Gemini Key 欄位與直連 Gemini 的 liveClient 已移除**，AI 一律走同步 GAS；載入時會刪除 localStorage 殘留的 `apiKey`。入口檢查統一用 `ai.isReady(user)`（開發模式或已設 `syncUrl`）。
- GAS 端＝ `gas-sync-ai-generate.gs`（同步 GAS 完整版：備份＋parseDrink＋aiGenerate，整份覆蓋貼上後重新部署）。共用指令碼屬性 `GEMINI_API_KEY`／`GEMINI_MODEL`（未設模型時 aiGenerate 退回 gemini-3.8-flash）。

## D-007　彈性化改版：先排初稿 → 市場現場調整 → 買完再對齊　（115/11/22）
- **背景**：蔬菜不一定買得到、臨時想吃別的難改、10 道一次生成太慢。
- **定案**：保留整週生成架構，加功能：一句話換菜、採買「買不到→替代」、買完依冰箱對齊菜單（③）、一般模式 5 組×2 道平行生成。
- 不做聊天框（使用者選「單道菜快速換」）；**④ 半週規劃（改生成道數）不做**。
- 冰箱分「冷凍庫／冷藏室」（`zone`），可放備好的料理（`prepped`），欄位存在既有 `bento_fridge`。
- 食材圖示改用**固定圖片目錄** `img/food/<id>.png`（AI 繪製後放入即生效，未放入退回 emoji），對應表見 `img/food/README.md`，與 `index.html` 的 `foodCatalog` 同步維護。
- 採買清單改場景式：上＝菜市場攤販／超市冷藏櫃，下＝茄芷袋／購物籃，場景偏好存在 `bento_user.shopScene`（不新增 key）。

## D-008　整體改為「食材插圖風」　（115/11/23）
- **背景**：使用者上傳 AI 繪製的扁平食材插圖，要求整體風格（不只色票）一致。
- **定案**：圓體字 Chiron GoRound TC（Google Fonts，依字元分子集）；暖奶油點點紙背景；卡片＝暖米描邊＋底部實色陰影（貼紙感）；主要按鈕＝扁平立體（按下下沉）；各區標題加圓形插圖徽章；底部導覽目前頁籤加膠囊底；採買場景改柔和粉彩。
- 色票：主色清新鼠尾草綠 `#7aa356`、灰階改暖灰（覆寫 Tailwind gray）、`paper` 奶油白。
- 插圖兩個目錄：`img/food/`（食材，`foodCatalog`）、`img/ui/`（介面，`uiIcon`），**缺圖一律退回 emoji**；圖片入庫前壓縮為 256×256 量化 PNG（原 512px 約 180KB → 約 10KB）。
- 只作用於淺色模式（`body:not(.dark)`），深色模式另有對應色。
