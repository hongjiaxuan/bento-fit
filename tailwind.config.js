// 用於重新產生 tailwind.css（無需常駐建置流程，改動 index.html 的樣式後執行一次即可）：
//   npx tailwindcss@3 -c tailwind.config.js -i tailwind.src.css -o tailwind.css --minify
// tailwind.src.css 內容只需三行：@tailwind base; @tailwind components; @tailwind utilities;
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        // 全新的「抹茶/鼠尾草綠」色階 (低飽和、沉穩)
        brand: {
          50: '#f5f7f4',  // 極淡灰綠背景
          100: '#e6ebe3', // 邊框與次要背景
          400: '#9ab08f', // 輔助色
          500: '#7a906f', // 主視覺抹茶綠
          600: '#637858', // 點擊狀態
          900: '#3a4734', // 深色文字
        },
        paper: '#fcfcfb', // 溫暖的紙張白背景
        dark: '#2c3e50',
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'],
      },
      boxShadow: {
        // 極致輕柔的陰影，製造空氣感
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.03)',
        'float': '0 8px 25px -5px rgba(122, 144, 111, 0.15)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
}
