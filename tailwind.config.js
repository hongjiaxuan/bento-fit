// 用於重新產生 tailwind.css（無需常駐建置流程，改動 index.html 的樣式後執行一次即可）：
//   npx tailwindcss@3 -c tailwind.config.js -i tailwind.src.css -o tailwind.css --minify
// tailwind.src.css 內容只需三行：@tailwind base; @tailwind components; @tailwind utilities;
//
// 🎨 配色依食材插圖風格（115/11/23）：溫暖奶油底＋清新鼠尾草綠＋暖灰，搭配柔和暖色陰影
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        // 主色：插圖中青花菜／毛豆的清新鼠尾草綠
        brand: {
          50: '#f3f8ec',  // 極淡綠背景
          100: '#e2eed2', // 邊框與次要背景
          200: '#cbe0b1',
          300: '#b0cf8d', // 輸入框聚焦邊框（原本缺這階）
          400: '#94bd6d', // 輔助色
          500: '#7aa356', // 主視覺綠
          600: '#618742', // 點擊狀態／強調文字
          700: '#4d6c35',
          800: '#3c542a',
          900: '#2e4021', // 深色文字
        },
        // 灰階改暖灰（stone 系），呼應插圖的米白與暖棕陰影
        gray: {
          50: '#faf7f2',
          100: '#f2ede4',
          200: '#e6dfd3',
          300: '#d4cbbd',
          400: '#a89e90',
          500: '#7d7468',
          600: '#5f574d',
          700: '#4a433b',
          800: '#332e28',
          900: '#221e1a',
        },
        paper: '#fffaf2', // 奶油紙白
        dark: '#2c3e50',
      },
      fontFamily: {
        sans: ['Chiron GoRound TC', 'Noto Sans TC', 'sans-serif'],
      },
      boxShadow: {
        // 暖色柔和陰影，像插圖底下的淡影
        'soft': '0 4px 18px -6px rgba(120, 88, 50, 0.14)',
        'float': '0 10px 24px -8px rgba(97, 135, 66, 0.40)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
}
