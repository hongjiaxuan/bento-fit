# LESSONS — 健康餐 App 踩過的雷

> 重複踩過或花時間才搞懂的事記這裡，開工前掃一遍。

---

## L-001　GAS web app 跨網域：GET 讀得到、POST 要 no-cors（讀不到）
- 從瀏覽器 `fetch` 一支 GAS `/exec`：**GET** 的最終回應（轉址到 googleusercontent）帶 `Access-Control-Allow-Origin`，**讀得到 JSON**。
- **POST** 會觸發 CORS preflight，GAS 不處理 → 失敗；所以只能用 `mode:'no-cors'`（opaque，**讀不到回應**，純寫入）。
- 結論：要「送參數＋拿回應」一律走 GET（IG 食譜端點就是這樣定的）。

## L-002　通用確認框 modal-general 的 z-index 要最高
- `modal-general`（showModal 的確認/警告框）原本 z-80，比其他 modal（冰箱 z-90、onboarding z-120）低 → 會被蓋住、按鈕點不到。
- 已改 **z-130**（最高）。之後新增 modal 都要低於它。

## L-003　pre-push 裡 amend 不會改變本次 push 的內容
- `git push` 在跑 pre-push hook 前就鎖定要推的 commit SHA；hook 裡 `git commit --amend` 只改本機 HEAD，推上去的仍是舊 SHA → 本機/遠端分叉（ahead 1, behind 1），下次 push 被拒。
- 自動遞增版本號這類「要跟著 commit 進去」的事，放 **pre-commit** 不是 pre-push（見 DECISIONS D-004）。

## L-004　IG 美食貼文內文常沒有完整食譜
- 旅遊存點只要地點名，caption 幾乎都有；但食譜（食材＋步驟）IG 內文常常沒有。
- 食譜多半在：作者**置頂留言**、或**影片內容**裡。所以萃取要分層（內文→留言→影片），抓不到就退回「只有菜名＋AI 生成」。

## L-005　新增 localStorage key 要在 5 處登記
照 `bento_meal_log` 的樣板，漏一處就會同步/匯出不一致：
1. `init()` 載入區（`safeParse`）
2. `init()` 的 `_lastSyncSnap` 快照
3. `cloudSync.upload()` 的 `dataSnap`
4. `cloudSync.applyRestore()`
5. `exportData()` 與 `importData()`

## L-006　開工前一定先跟 origin/main 對帳
- 主線開發走 **feature 分支 ＋ PR 合併**到 `origin/main`；本機 checkout 很容易落後。
- 實例（115/10）：本機沒 fetch 就接著規劃「IG 前端」，結果 `origin/main` 早已**領先 34 筆**、IG 功能（含飲品/食譜庫/加入本週菜單）全做完了——差點重做一遍。
- 規矩：**每次開工先 `git fetch` → `git status -sb` 看 ahead/behind**，分岔就先同步再動工。
- 本機 `.git/hooks/` 的 hook 不隨 repo（見 D-004），換機/重拉要注意。
