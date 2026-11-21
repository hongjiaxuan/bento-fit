// --- 雲端備份腳本 ---
// 健康餐同步 GAS 完整版（含：雲端備份／社群影片食譜解析 parseDrink／AI 生成菜單代呼叫 aiGenerate）
// 使用方式：整份覆蓋貼進 GAS 專案 → 部署 → 管理部署作業 → 編輯 → 版本選「新版本」→ 部署（網址不變）
const FILE_NAME = "bento_fit_db.json"; // 雲端存檔的檔名

// 🧋🍱 社群影片食譜解析用設定：部署前請到「專案設定 → 指令碼屬性」新增 GEMINI_API_KEY
// （AI 生成菜單 aiGenerate 也共用這兩個屬性，換 Key 只要改這裡的指令碼屬性）
const GEMINI_MODEL = PropertiesService.getScriptProperties().getProperty("GEMINI_MODEL");
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");

function doPost(e) {
  // 先嘗試解析成 JSON 看有沒有 action 欄位，命中 parseDrink / aiGenerate 就分流，
  // 其餘情況（包含舊版備份、JSON.parse 失敗等）一律維持原本的備份行為，完全不受影響
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload && payload.action === "parseDrink") {
      return handleParseDrink(payload);
    }
    // 🔑 新增：AI 生成菜單改由 GAS 代呼叫 Gemini（前端不再持有 Key）
    if (payload && payload.action === "aiGenerate") {
      return handleAiGenerate_(payload);
    }
  } catch (parseErr) {
    // 不是合法 JSON 就不是分享解析請求，往下走原本的備份邏輯（跟原本行為一致）
  }

  // 接收 App 傳來的資料並存檔（原本的備份邏輯，完全沒改動）
  try {
    const data = e.postData.contents;
    const files = DriveApp.getFilesByName(FILE_NAME);

    if (files.hasNext()) {
      // 如果檔案存在，直接更新內容
      files.next().setContent(data);
    } else {
      // 如果檔案不存在，建立新檔案
      DriveApp.createFile(FILE_NAME, data);
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success", time: new Date()})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", msg: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // App 開啟時，讀取雲端資料（原本的邏輯，完全沒改動）
  try {
    const files = DriveApp.getFilesByName(FILE_NAME);
    if (files.hasNext()) {
      const content = files.next().getBlob().getDataAsString();
      return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
    } else {
      // 沒存檔過，回傳空物件
      return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}


// ============================================================
// 🧋🍱 以下全部是新增的：社群影片食譜解析（飲品 / 料理 自動判斷）
// 流程：TikWM 取得影片資訊 → 下載無浮水印影片(或退回封面圖) → Gemini 2.5 Flash 視覺解析
//      → AI 自行判斷是「飲品」還是「料理」，回傳對應結構 → 前端依 type 分別存進
//        飲品庫(bento_drinks) 或直接併入便當食譜庫(app.state.recipes)
// ============================================================

function handleParseDrink(payload) {
  const tiktokUrl = payload.url;
  if (!tiktokUrl) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "缺少 TikTok 網址"})).setMimeType(ContentService.MimeType.JSON);
  }
  if (!GEMINI_API_KEY) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "尚未設定 GEMINI_API_KEY（指令碼屬性）"})).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // 1. 呼叫 TikWM 取得影片資訊
    const info = fetchTikTokInfo(tiktokUrl);

    // 2. 優先抓「無浮水印影片」做視覺解析；抓不到就退回只用封面圖 + 標題文字
    let videoBlob = null;
    if (info.play) {
      try {
        videoBlob = UrlFetchApp.fetch(info.play, { muteHttpExceptions: true }).getBlob();
        // Gemini inline data 建議控制在 ~20MB 以內，超過就放棄影片改用圖片
        if (videoBlob.getBytes().length > 18 * 1024 * 1024) videoBlob = null;
      } catch (e) {
        videoBlob = null; // 下載失敗就退回圖片模式，不整個失敗
      }
    }

    // 3. 呼叫 Gemini 2.5 Flash 做結構化解析（AI 自行判斷 type: drink 或 dish）
    const parsed = analyzeMediaWithGemini(videoBlob, info.cover, info.title);
    const type = parsed.type === "dish" ? "dish" : "drink"; // 非 dish 一律視為 drink，不會有未知型別
    delete parsed.type; // type 已經拉到外層的 type 欄位，item 內部不需要重複

    if (!parsed.coverImageUrl) parsed.coverImageUrl = info.cover || "";

    return ContentService.createTextOutput(JSON.stringify({success: true, type: type, item: parsed})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

/** 呼叫 TikWM 公開 API，取得影片資訊（欄位名稱已實測確認：play/cover/title 正確） */
function fetchTikTokInfo(tiktokUrl) {
  const api = "https://www.tikwm.com/api/?url=" + encodeURIComponent(tiktokUrl);
  const res = UrlFetchApp.fetch(api, { muteHttpExceptions: true });
  const json = JSON.parse(res.getContentText());

  if (!json || json.code !== 0 || !json.data) {
    throw new Error("TikWM 解析失敗，請確認連結是否為有效的 TikTok 影片網址");
  }
  const d = json.data;
  return {
    play: d.play || d.hdplay || "",       // 無浮水印影片網址（hdplay 為高畫質版本，部分影片才有）
    cover: d.cover || d.origin_cover || "", // 封面圖網址
    title: d.title || ""                   // 影片標題/字幕文字
  };
}

/** 呼叫 Gemini 2.5 Flash，輸入影片(或封面圖)+標題文字，由 AI 自行判斷飲品/料理並輸出對應結構 */
function analyzeMediaWithGemini(videoBlob, coverUrl, captionText) {
  const prompt = [
    "你是一位同時精通「飲品調製」與「料理烹飪」的專家。請先判斷這支影片介紹的內容是",
    "「飲品」（手搖飲/咖啡/調酒/果汁等可直接喝的飲料）還是「料理」（便當/主食/配菜/小吃等",
    "需要正式烹調步驟的食物），再依照對應格式整理成繁體中文食譜。",
    "",
    captionText ? ("影片標題/文字：" + captionText) : "",
    "",
    "【嚴格 JSON 格式要求】只回傳一個 JSON 物件，不含 Markdown、不含註解。",
    "先判斷 \"type\" 欄位為 \"drink\" 或 \"dish\"，並依照對應的欄位組合回傳：",
    "",
    "若為飲品 (type: \"drink\")：",
    "{",
    '  "type": "drink",',
    '  "name": "飲品完整名稱",',
    '  "ingredients": ["食材1 份量", "食材2 份量", ...],',
    '  "steps": ["步驟1", "步驟2", ...]',
    "}",
    "",
    "若為料理 (type: \"dish\")：",
    "{",
    '  "type": "dish",',
    '  "name": "料理完整名稱",',
    '  "emoji": "1個最能代表這道菜的食物 emoji，例如 🍗🐟🥩🦐🥬🍝，不可用 🍱",',
    '  "main_tag": "主要食材種類，例如「雞肉」「海鮮」「素食」",',
    '  "cal": 熱量(數字), "p": 蛋白質克數(數字), "c": 碳水克數(數字), "f": 脂肪克數(數字),',
    '  "sides": ["配菜名稱1", "配菜名稱2", ...]（若本身就是一份完整餐點可為空陣列）,',
    '  "ingredients": [{"name":"食材名稱","qty":"重量或數量","type":"生鮮/蔬果/澱粉/雜貨 其中之一"}, ...],',
    '  "instructions": "完整做法，\\n 分隔每個步驟",',
    '  "prep_minutes": 整數，從備料到盛盤的總預估時間，必須填入 10、20 或 30 其中之一,',
    '  "prep_guide": "用 \\" | \\" 分隔各類別的備料指南。格式規則：',
    "     ① 肉類/海鮮段：食材名稱、重量、具體切法（如「逆紋切片」「切丁」）、醃漬調料及用量",
    "     ② 蔬菜段：每種蔬菜逐一列出具體切法（切片/切絲/切丁/切小朵等），不可只寫「洗淨切好」",
    "     ③ 澱粉段：是否需預煮",
    "     ④ 若無某類食材則省略該段",
    '     範例：\\"肉類：雞胸肉200g逆紋切薄片，醬油1大匙醃10分鐘 | 蔬菜：青花菜切小朵 | 澱粉：白飯備用\\""',
    "}",
    "",
    "若畫面中食材或份量不明確，依常見配方與合理推估補齊，不要留空陣列或空字串。"
  ].join("\n");

  const parts = [{ text: prompt }];

  if (videoBlob) {
    parts.push({
      inlineData: {
        mimeType: videoBlob.getContentType() || "video/mp4",
        data: Utilities.base64Encode(videoBlob.getBytes())
      }
    });
  } else if (coverUrl) {
    // 退回方案：只給封面圖（仍然是「視覺解析」，只是從影片降級成單張畫面）
    try {
      const imgBlob = UrlFetchApp.fetch(coverUrl, { muteHttpExceptions: true }).getBlob();
      parts.push({
        inlineData: {
          mimeType: imgBlob.getContentType() || "image/jpeg",
          data: Utilities.base64Encode(imgBlob.getBytes())
        }
      });
    } catch (e) {
      // 連封面圖都抓不到，就只靠文字標題讓 Gemini 盡力推斷
    }
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + GEMINI_API_KEY;
  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: parts }],
      generationConfig: { response_mime_type: "application/json" },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    })
  });

  const body = JSON.parse(res.getContentText());
  const text = body && body.candidates && body.candidates[0] && body.candidates[0].content
    && body.candidates[0].content.parts && body.candidates[0].content.parts[0]
    && body.candidates[0].content.parts[0].text;
  if (!text) throw new Error("Gemini 回傳內容為空：" + res.getContentText().slice(0, 300));

  const parsed = extractJsonObject(text);
  if (!parsed.name) throw new Error("Gemini 回傳格式不完整（缺少 name）");

  if (parsed.type === "dish") {
    // 料理：補齊必要欄位的型別防呆，避免前端併入 app.state.recipes 時格式不符
    if (!Array.isArray(parsed.sides)) parsed.sides = [];
    if (!Array.isArray(parsed.ingredients)) parsed.ingredients = [];
    if (![10, 20, 30].includes(parsed.prep_minutes)) parsed.prep_minutes = 20;
    parsed.cal = Number(parsed.cal) || 0;
    parsed.p = Number(parsed.p) || 0;
    parsed.c = Number(parsed.c) || 0;
    parsed.f = Number(parsed.f) || 0;
    parsed.instructions = parsed.instructions || "";
    parsed.prep_guide = parsed.prep_guide || "";
  } else {
    // 飲品：維持原本較簡單的結構
    if (!Array.isArray(parsed.ingredients)) parsed.ingredients = [];
    if (!Array.isArray(parsed.steps)) parsed.steps = [];
  }
  return parsed;
}

/** 從 Gemini 回傳文字中穩健擷取 JSON 物件（與前端 liveClient 相同的括號深度計數邏輯，
 *  避免 Gemini 偶爾夾帶 Markdown 圍欄或多餘文字時解析失敗） */
function extractJsonObject(raw) {
  let s = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const startIdx = s.search(/[\[{]/);
  if (startIdx === -1) throw new Error("AI 回傳內容非 JSON 格式");

  let depth = 0, inStr = false, escape = false, endIdx = -1;
  for (let i = startIdx; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  if (endIdx === -1) throw new Error("AI 回傳的 JSON 格式不完整");
  return JSON.parse(s.substring(startIdx, endIdx + 1));
}


// ============================================================
// 🔑 以下是新增的：AI 生成菜單代呼叫 Gemini（action: aiGenerate）
// 前端契約：
//   請求 POST（Content-Type: text/plain）body = {"action":"aiGenerate","prompt":"..."}
//   成功回 {"success":true,"text":"<Gemini 回傳的原始文字>"}（JSON 清洗由前端 parseAiJson 處理）
//   失敗回 {"success":false,"error":"錯誤訊息"}
// 與 parseDrink 共用 GEMINI_API_KEY / GEMINI_MODEL 指令碼屬性
// ============================================================

function handleAiGenerate_(payload) {
  const out = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  try {
    const prompt = payload && payload.prompt;
    if (!prompt) return out({ success: false, error: "缺少 prompt" });
    if (!GEMINI_API_KEY) return out({ success: false, error: "尚未設定 GEMINI_API_KEY（指令碼屬性）" });

    // GEMINI_MODEL 沒設定時，退回 gemini-3.8-flash（2.5 已限縮新用戶存取）；有設定就先正規化格式
    const model = normalizeModelName_(GEMINI_MODEL) || "gemini-3.8-flash";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + GEMINI_API_KEY;
    const res = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const code = res.getResponseCode();
    const body = JSON.parse(res.getContentText() || "{}");
    if (code !== 200) {
      // 附上實際使用的模型名稱，方便判斷是 Key 還是模型設定的問題
      return out({ success: false, error: "Gemini API 錯誤 (" + code + "): " + ((body.error && body.error.message) || "未知錯誤") + "（使用模型：" + model + "）" });
    }
    const text = body && body.candidates && body.candidates[0] && body.candidates[0].content
      && body.candidates[0].content.parts && body.candidates[0].content.parts[0]
      && body.candidates[0].content.parts[0].text;
    if (!text) return out({ success: false, error: "Gemini 回傳內容為空" });
    return out({ success: true, text: text });
  } catch (err) {
    return out({ success: false, error: err.toString() });
  }
}


/** 模型名稱正規化：去頭尾空白/換行與引號、去掉 "models/" 前綴、
 *  把「Gemini 2.5 Flash」這類顯示名稱轉成 API 用的「gemini-2.5-flash」 */
function normalizeModelName_(raw) {
  if (!raw) return "";
  return String(raw).trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^models\//i, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

// ============================================================
// 測試用輔助函式（部署前自行跑過，確認沒問題後可以留著也可以刪掉，不影響正式運作）
// ============================================================
function testFetchTikTokInfo() {
  const info = fetchTikTokInfo("你的測試連結");
  Logger.log(JSON.stringify(info));
}

function testHandleParseDrink() {
  const result = handleParseDrink({ url: "你的測試連結" });
  Logger.log(result.getContent());
}

// 🔑 新增：測試 AI 生成菜單代呼叫（在 GAS 編輯器選這個函式按「執行」，看執行紀錄）
function testHandleAiGenerate() {
  // 先印出指令碼屬性裡的原始模型值（用 JSON 顯示，看得到隱藏的空白/換行/引號）
  Logger.log("GEMINI_MODEL 原始值：" + JSON.stringify(GEMINI_MODEL) + " → 正規化後：" + normalizeModelName_(GEMINI_MODEL));
  const result = handleAiGenerate_({ prompt: '請回傳 JSON 陣列：[{"name":"測試便當","cal":500}]' });
  Logger.log(result.getContent());
}
