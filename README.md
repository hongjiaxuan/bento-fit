# 🍱 Bento Fit - AI 智能便當規劃師

Bento Fit 是一款專為忙碌現代人設計的 **AI 智能備餐 (Meal Prep) 應用程式**。透過整合 Google Gemini AI，一鍵生成符合您 TDEE 與飲食目標的週菜單，並自動產出採買清單。

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Tech](https://img.shields.io/badge/AI-Google%20Gemini-blue)

## ✨ 核心功能

* **🤖 AI 智能生成**：根據您的 TDEE、飲食目標（增肌/減脂）與清冰箱需求，自動規劃一週午餐。
* **🥘 懶人備餐模式**：支援 Batch Cooking 邏輯，自動規劃「少樣多餐」的菜單，大幅降低烹飪負擔。
* **🛒 智慧採買清單**：自動彙整所需食材，並依據「生鮮、蔬果、雜貨」自動分區，支援一鍵分享至 Line。
* **🍳 沉浸式烹飪模式**：全螢幕烹飪教學，支援步驟勾選與螢幕恆亮 (Wake Lock)，手濕濕也能輕鬆煮。
* **📊 健康數據追蹤**：內建 TDEE 計算機、體態趨勢圖表 (SVG) 與每日飲水追蹤。
* **🏆 遊戲化成就**：連續備餐挑戰與成就徽章系統，讓堅持變得更有趣。

## 🚀 如何使用

1.  **設定個人資料**：首次進入請填寫身高、體重與活動量，系統將自動計算您的 TDEE。
2.  **填寫 API Key**：至「個人設定」貼上您的 Google Gemini API Key（免費申請）。
3.  **生成菜單**：
    * 到「規劃」頁面點擊 AI 生成。
    * 可選擇「料理風格」（如：日式、韓式）。
    * 勾選「懶人模式」可生成適合批量備餐的食譜。
4.  **開始採買與烹飪**：使用採買清單購齊食材，並開啟烹飪模式跟著做！

## 🛠️ 技術棧

* **Frontend**: HTML5, Vanilla JavaScript (ES6+)
* **Styling**: Tailwind CSS (via CDN)
* **Icons**: FontAwesome
* **AI Model**: Google Gemini Pro / Flash
* **Storage**: LocalStorage (資料僅儲存於瀏覽器端，隱私安全)

## 📱 安裝 (PWA)

本網頁支援 PWA，您可以將其「加入主畫面」，獲得如同原生 App 的全螢幕體驗。

---
Developed with ❤️ by Bento Fit Team