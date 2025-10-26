# TreeRing 美學工作室 - 設計系統指南

## 📐 設計理念 (Design Philosophy)

### 核心原則
1. **優雅而現代** - 柔和的曲線、圓角設計，展現美學工作室的專業與溫暖
2. **清晰易讀** - 重視資訊層次，確保所有文字內容易於閱讀
3. **移動優先** - 從手機端體驗出發，逐步增強桌面端功能
4. **互動回饋** - 所有可點擊元素都有明確的視覺反饋
5. **無障礙設計** - 考慮色盲、觸控友好、鍵盤導航

---

## 🎨 色彩系統 (Color Palette)

### 主色調 (Primary Colors)
```css
/* 粉紅色系 - 品牌主色 */
--pink-50: #fdf2f8
--pink-100: #fce7f3
--pink-300: #f9a8d4
--pink-400: #f472b6
--pink-500: #ec4899  /* 主要粉紅 */
--pink-600: #db2777
--pink-700: #be185d

/* 紫色系 - 輔助色 */
--purple-50: #faf5ff
--purple-100: #f3e8ff
--purple-500: #a855f7
--purple-600: #9333ea
--purple-700: #7e22ce
```

### 中性色 (Neutral Colors)
```css
/* 灰階 - 文字與背景 */
--gray-50: #f9fafb    /* 淺背景 */
--gray-100: #f3f4f6   /* 卡片背景 */
--gray-200: #e5e7eb   /* 邊框 */
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280   /* 次要文字 */
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937   /* 主要文字 */
--gray-900: #111827   /* 深黑文字 */
```

### 狀態色 (Status Colors)
```css
/* 成功 - 綠色 */
--green-100: #d1fae5
--green-500: #10b981
--green-600: #059669

/* 警告 - 黃色 */
--yellow-100: #fef3c7
--yellow-500: #f59e0b
--yellow-600: #d97706

/* 錯誤 - 紅色 */
--red-100: #fee2e2
--red-500: #ef4444
--red-600: #dc2626

/* 資訊 - 藍色 */
--blue-100: #dbeafe
--blue-500: #3b82f6
--blue-600: #2563eb

/* 管理員 - 靛藍 */
--indigo-50: #eef2ff
--indigo-500: #6366f1
--indigo-600: #4f46e5
```

### 色彩應用規則
- **主要 CTA 按鈕**: 粉紅漸層 `from-pink-500 to-purple-600`
- **次要按鈕**: 白底灰框 `bg-white border-gray-300`
- **危險操作**: 紅色 `bg-red-500`
- **管理功能**: 靛藍色 `bg-indigo-500`
- **文字顏色**: 深灰/黑 `text-gray-800` 或 `text-gray-900`
- **次要文字**: 中灰 `text-gray-600`

---

## 📏 間距系統 (Spacing Scale)

### Tailwind 間距對照
```
0.25rem = 1    → 4px
0.5rem  = 2    → 8px
0.75rem = 3    → 12px
1rem    = 4    → 16px
1.25rem = 5    → 20px
1.5rem  = 6    → 24px
2rem    = 8    → 32px
2.5rem  = 10   → 40px
3rem    = 12   → 48px
4rem    = 16   → 64px
```

### 常用間距組合
- **卡片內邊距**: `p-5 sm:p-6` (手機 20px, 桌面 24px)
- **Section 間距**: `py-12 sm:py-16 lg:py-20`
- **元素間距**: `gap-3 sm:gap-4`
- **按鈕內邊距**: `py-3 px-8` (小), `py-4 px-10` (大)

---

## 🔤 字體系統 (Typography)

### 字體大小階層
```css
/* 標題 */
text-4xl  (2.25rem / 36px)  - 手機主標
text-5xl  (3rem / 48px)     - 平板主標
text-6xl  (3.75rem / 60px)  - 桌面主標
text-7xl  (4.5rem / 72px)   - Hero 標題

/* 次標題 */
text-3xl  (1.875rem / 30px) - Section 標題
text-2xl  (1.5rem / 24px)   - 卡片標題
text-xl   (1.25rem / 20px)  - 小標題

/* 正文 */
text-base (1rem / 16px)     - 標準正文
text-sm   (0.875rem / 14px) - 小字正文
text-xs   (0.75rem / 12px)  - 標籤/註解
```

### 字重 (Font Weight)
- `font-bold` (700) - 標題、強調
- `font-semibold` (600) - 次標題、按鈕
- `font-medium` (500) - 重點文字
- `font-normal` (400) - 正文

### 行高 (Line Height)
- 標題: `leading-tight` (1.25)
- 正文: `leading-relaxed` (1.625)
- 密集文字: `leading-normal` (1.5)

---

## 🔘 組件樣式 (Component Styles)

### 按鈕 (Buttons)

#### 主要按鈕 (Primary)
```jsx
className="bg-gradient-to-r from-pink-500 to-purple-600 
           text-white font-semibold rounded-xl 
           py-3 px-8 
           hover:from-pink-600 hover:to-purple-700 
           shadow-md hover:shadow-lg 
           transform hover:scale-[1.02] active:scale-[0.98] 
           transition-all"
```

#### 次要按鈕 (Secondary)
```jsx
className="bg-white border-2 border-gray-300 
           text-gray-700 font-medium rounded-lg 
           py-2.5 px-4 
           hover:bg-gray-50 hover:border-gray-400 
           transition-all"
```

#### 管理員按鈕
```jsx
className="bg-gradient-to-r from-indigo-500 to-purple-600 
           text-white font-medium rounded-lg 
           py-2.5 px-4 
           hover:from-indigo-600 hover:to-purple-700 
           shadow-md hover:shadow-lg"
```

### 卡片 (Cards)

#### 標準卡片
```jsx
className="bg-white rounded-2xl shadow-md 
           border-2 border-gray-100 
           p-6 
           hover:shadow-2xl hover:-translate-y-2 
           transition-all duration-300"
```

#### 統計卡片
```jsx
className="p-4 rounded-xl border-2 
           bg-white border-gray-200 
           hover:border-pink-300 hover:shadow-md 
           transform hover:scale-105 
           transition-all"
```

### 輸入框 (Input Fields)
```jsx
className="w-full px-4 py-3 
           border-2 border-gray-300 rounded-lg 
           focus:border-pink-500 focus:ring-2 focus:ring-pink-200 
           outline-none transition-all"
```

### Modal 對話框
```jsx
// Overlay
className="fixed inset-0 bg-black bg-opacity-50 z-40"

// Modal Container
className="fixed inset-0 z-50 flex items-center justify-center p-4"

// Modal Content
className="bg-white rounded-2xl shadow-2xl 
           max-w-2xl w-full max-h-[90vh] overflow-y-auto"
```

---

## 📱 響應式斷點 (Breakpoints)

### Tailwind 預設斷點
```css
/* 手機 (預設) */
< 640px   → 無前綴

/* 平板 */
640px+    → sm:
768px+    → md:

/* 桌面 */
1024px+   → lg:
1280px+   → xl:
1536px+   → 2xl:
```

### 常用響應式模式

#### 網格系統
```jsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

#### 文字大小
```jsx
className="text-base sm:text-lg md:text-xl"
```

#### 間距
```jsx
className="py-12 sm:py-16 lg:py-20"
```

#### 顯示/隱藏
```jsx
className="hidden md:block"  // 手機隱藏，桌面顯示
className="block md:hidden"  // 手機顯示，桌面隱藏
```

---

## 🎭 動畫效果 (Animations)

### Hover 效果
```css
/* 按鈕 */
hover:scale-105 active:scale-95

/* 卡片 */
hover:-translate-y-2 hover:shadow-2xl

/* 圖片 */
hover:scale-110 (在 overflow-hidden 容器內)
```

### Transition 時長
```css
transition-all          → 150ms
transition-colors       → 150ms
duration-300           → 300ms (標準動畫)
duration-500           → 500ms (較慢動畫)
```

### 淡入動畫
```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

### Loading 動畫
```jsx
<div className="animate-spin rounded-full h-16 w-16 
                border-t-2 border-b-2 border-pink-500" />
```

---

## 🔲 圓角系統 (Border Radius)

```css
rounded-none   → 0px
rounded-sm     → 0.125rem (2px)
rounded        → 0.25rem (4px)
rounded-md     → 0.375rem (6px)
rounded-lg     → 0.5rem (8px)   ← 標準按鈕
rounded-xl     → 0.75rem (12px)  ← 卡片
rounded-2xl    → 1rem (16px)     ← 大卡片/Modal
rounded-full   → 9999px          ← 圓形按鈕/頭像
```

### 應用規則
- **按鈕**: `rounded-lg` 或 `rounded-full` (CTA)
- **卡片**: `rounded-xl` 或 `rounded-2xl`
- **輸入框**: `rounded-lg`
- **圖片**: `rounded-lg` 或 `rounded-2xl`
- **標籤/徽章**: `rounded-full`

---

## 💫 陰影系統 (Shadows)

```css
shadow-sm   → 小陰影 (邊框效果)
shadow      → 標準陰影
shadow-md   → 中等陰影 (卡片)
shadow-lg   → 大陰影 (浮動元素)
shadow-xl   → 特大陰影 (Modal)
shadow-2xl  → 最大陰影 (Hero CTA)
```

### Hover 陰影變化
```jsx
className="shadow-md hover:shadow-lg"
className="shadow-lg hover:shadow-2xl"
```

### 彩色陰影
```jsx
className="shadow-2xl hover:shadow-pink-500/50"
```

---

## 📊 圖示系統 (Icons)

### 使用 Heroicons
```bash
npm install @heroicons/react
```

### 常用尺寸
```jsx
className="h-4 w-4"  // 小 (16px) - 按鈕內
className="h-5 w-5"  // 中 (20px) - 選單
className="h-6 w-6"  // 大 (24px) - 標題
className="h-7 w-7"  // 特大 (28px) - 強調
```

### 圖示顏色
- 主要: `text-pink-500` 或 `text-pink-600`
- 次要: `text-gray-400` 或 `text-gray-600`
- Hover: `group-hover:text-pink-500`

---

## 🎯 狀態樣式 (Status Styles)

### 預約狀態顏色

```jsx
const statusColors = {
  pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  pending_confirmation: 'bg-blue-100 text-blue-800 border-blue-300',
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};
```

### 徽章 (Badge)
```jsx
className="px-3 py-1 
           bg-pink-100 text-pink-600 
           border border-pink-200 
           rounded-full 
           text-xs font-medium"
```

---

## 🌐 特殊頁面樣式

### Hero Section
```jsx
// 容器
className="relative min-h-screen flex items-center justify-center"

// 背景圖
className="absolute inset-0 bg-cover bg-center lg:bg-fixed"

// 遮罩
className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/60"

// 內容
className="relative z-10 max-w-4xl px-6"
```

### 分段滾動 (Snap Scroll)
```jsx
// 外層容器
className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"

// 每個 Section
className="min-h-screen snap-start snap-always"
```

### Footer
```jsx
className="bg-gradient-to-b from-gray-900 to-gray-950 text-white"
```

---

## 📋 最佳實踐 (Best Practices)

### 1. 移動優先
- 先設計手機版，再增強桌面版
- 使用 `sm:` `md:` `lg:` 漸進式增強

### 2. 可訪問性
- 所有圖片添加 `alt` 描述
- 按鈕/連結有明確的 `aria-label`
- 顏色對比度符合 WCAG AA 標準
- 觸控目標至少 44x44px

### 3. 性能優化
- 圖片使用 `loading="lazy"`
- 長列表使用虛擬滾動
- 避免過多動畫影響效能

### 4. 一致性
- 相同功能使用相同樣式
- 保持間距、圓角、陰影的一致性
- 按鈕狀態要明確（normal/hover/active/disabled）

### 5. 語義化 HTML
```jsx
<header>  // 頁首
<nav>     // 導航
<main>    // 主內容
<section> // 區塊
<article> // 文章
<footer>  // 頁尾
```

---

## 🛠️ 常用工具類組合

### 置中容器
```jsx
className="container mx-auto px-4 sm:px-6 lg:px-8"
```

### Flexbox 置中
```jsx
className="flex items-center justify-center"
```

### Grid 響應式
```jsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
```

### 文字截斷
```jsx
className="truncate"              // 單行
className="line-clamp-2"          // 兩行
className="overflow-hidden"       // 隱藏溢出
```

### 全寬按鈕
```jsx
className="w-full flex items-center justify-center"
```

---

## 📝 命名規範

### CSS Class 命名
- 使用 Tailwind utility classes
- 避免自定義 class 名稱（除非必要）
- 組件特定樣式使用 `<style>` 標籤

### 組件命名
- PascalCase: `BookingCard`, `UserProfile`
- 檔案名與組件名一致

### 變數命名
- camelCase: `userName`, `bookingDate`
- 常數大寫: `MAX_BOOKINGS`
- Boolean 前綴: `isLoading`, `hasError`

---

## 🎨 設計檢查清單

在提交設計前檢查：

- [ ] 所有文字顏色對比度 ≥ 4.5:1
- [ ] 按鈕有 hover/active 狀態
- [ ] 手機端測試過 (< 375px)
- [ ] 平板端測試過 (768px)
- [ ] 桌面端測試過 (1920px)
- [ ] Loading 狀態已處理
- [ ] Error 狀態已處理
- [ ] 空狀態已處理
- [ ] 所有圖片有 alt
- [ ] 所有互動元素可鍵盤操作

---

## 📚 參考資源

- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Heroicons 圖示庫](https://heroicons.com/)
- [WCAG 無障礙標準](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color Tool](https://material.io/resources/color/)

---

**最後更新**: 2025-10-27
**版本**: 1.0
**維護者**: TreeRing 開發團隊
