/**
 * 健康餐同步 GAS — 新增 action: aiGenerate（AI 生成菜單代呼叫 Gemini）
 *
 * 用途：前端 App 不再自帶 Gemini Key，改把 prompt 送到這支 GAS，
 *       由 GAS 用「指令碼屬性」裡的 Key 呼叫 Gemini，回傳原始文字給前端解析。
 * 前端契約：
 *   請求 POST（Content-Type: text/plain）body = {"action":"aiGenerate","prompt":"..."}
 *   成功回 {"success":true,"text":"<Gemini 回傳的 JSON 文字>"}
 *   失敗回 {"success":false,"error":"錯誤訊息"}
 *
 * 安裝步驟：
 *   1. 把本檔的 handleAiGenerate_ 貼進同步 GAS 專案。
 *   2. 在既有 doPost(e) 裡、解析出 body 之後，加入分流（放在 parseDrink 判斷旁邊）：
 *        if (body.action === 'aiGenerate') return handleAiGenerate_(body);
 *   3. ⚠️ 確認下方 GEMINI_KEY_PROP 與 parseDrink 使用的屬性名稱一致（未查證，請對照你的程式）。
 *   4. 部署 → 管理部署作業 → 編輯 → 版本選「新版本」→ 部署（網址不變）。
 */

// ⚠️ 未查證：請改成 parseDrink 實際讀取的指令碼屬性名稱
const GEMINI_KEY_PROP = 'GEMINI_API_KEY';

function handleAiGenerate_(body) {
  const out = (obj) => ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  try {
    const prompt = body && body.prompt;
    if (!prompt) return out({ success: false, error: '缺少 prompt' });

    const key = PropertiesService.getScriptProperties().getProperty(GEMINI_KEY_PROP);
    if (!key) return out({ success: false, error: 'GAS 指令碼屬性未設定 ' + GEMINI_KEY_PROP });

    // 與前端原本 liveClient 相同的模型與參數
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: 'application/json' },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    const data = JSON.parse(res.getContentText() || '{}');
    if (code !== 200) {
      return out({ success: false, error: 'Gemini API 錯誤 (' + code + '): ' + ((data.error && data.error.message) || '未知錯誤') });
    }
    const text = data.candidates && data.candidates[0] && data.candidates[0].content &&
                 data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
                 data.candidates[0].content.parts[0].text;
    if (!text) return out({ success: false, error: 'Gemini 回傳內容為空' });
    return out({ success: true, text: text });
  } catch (err) {
    return out({ success: false, error: String(err && err.message || err) });
  }
}
