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
