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

## L-007　index.html 是 CRLF，用腳本改檔會整檔變 LF
- 症狀：只改幾行，`git diff --stat` 卻顯示上萬行變動。
- 根因：Python 預設讀寫會把 `\r\n` 轉成 `\n`；Edit 工具則會保留原格式。
- 規則：腳本一律 `open(..., newline='')`，插入字串也轉 CRLF；改完跑 `grep -c -v $'\r$' index.html` 必須為 0。

## L-008　Tailwind 是本機預編譯：class 不在 tailwind.css 就等於沒寫
- 症狀：`focus:border-brand-300` 寫了好幾處卻從未生效（色票根本沒有 300 階，115/11/22 已補）。
- 規則：新增／修改 class 後一定重編 `tailwind.css`，並 `grep -F` 確認新 class 真的有產出；色票只能用 config 有定義的階。

## L-009　檔案上傳到「已合併 PR 的分支」
- 症狀：使用者用 GitHub「Add files via upload」把圖傳到已合併的分支，想從 main 重建分支需 force push，被安全機制擋下。
- 解法：不覆蓋歷史，改 `git merge origin/main` 進該分支再接著改，內容與重建相同。
- 規則：提醒使用者上傳到 **main 或新分支**；收工前分支已合併就別再往上放東西。

## L-010　雲端（Claude Code on the web）環境與本機的差異
- 沒有本機 `.git/hooks/` → SW 版本**不會自動遞增**，改 index.html 要手動改 `sw.js`。
- cdnjs.cloudflare.com 被擋 → 截圖裡 Font Awesome 圖示全是空白，**不是 bug**；Google Fonts 可連。

## L-011　提示框 pointer-events-none 讓「點此更新」點了沒反應
- 症狀：「新版本可用！點此更新」怎麼點都沒反應。
- 根因：`#toast` 為了不擋畫面設了 `pointer-events-none`，裡面的連結也一起被穿透，點擊落到底下的頁面。
- 規則：要讓使用者點的提示（如 `showUpdateToast`）必須拿掉 `pointer-events-none`；一般 `showToast` 再加回來。驗證要用真的滑鼠點擊或 `elementFromPoint`，不能只呼叫 onclick。

## L-012　上傳插圖的檔名多了後綴 → App 讀不到
- 症狀：UI 插圖上傳成 `fridge_512.png` 等，程式找的是 `fridge.png`，畫面全是 emoji（L-009 也再發生一次：又傳到已合併的分支）。
- 處理：`git mv` 改回 `<id>.png`（保留歷史）再壓縮；用腳本比對「程式用到的 id」與「實際檔名」，缺／多都要是 0。
- 規則：收到上傳一律先跑這個比對，別只看檔案有沒有傳上來。

## L-013　Gemini 會回 503「high demand」，平行生成更容易撞到
- 症狀：生成失敗「Gemini API 錯誤 (503): This model is currently experiencing high demand」（115/11/24 實機）。
- 根因：Google 端暫時過載，非設定問題；一次平行送 5 組請求，尖峰時更容易碰到，且原本完全不重試。
- 規則：所有 AI 呼叫都走 `gasClient`，遇 429/500/503/504 自動重試（約 1.5s→3s→6s＋隨機錯開），其他錯誤（如 400 金鑰錯）不重試直接顯示。
