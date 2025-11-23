# 美甲店預約管理系統 - 專案儀表板

**文件版本:** 2.0
**最後更新:** 2025-11-24
**主要貢獻者:** Gemini Code Assist

---

## 1. 專案狀態總覽 (Project Status Overview)

### **當前狀態 (Current Status)**
系統核心功能已趨於完善，管理後台與使用者預約流程皆已具備完整雛形。目前正著手開發行銷相關功能。

### **下一步行動 (Next Immediate Action)**
**實作「優惠券管理」功能：** 根據已定義的資料模型，在「優惠與集點」頁面中，建立優惠券列表的顯示，並製作新增優惠券的表單介面。

### **核心功能速覽 (Key Feature Quickview)**
- **[✔️] 使用者系統:** 整合 LINE/Google 登入、註冊、角色權限管理 (管理員, 白金會員, 一般會員)。
- **[✔️] 預約系統:** 支援服務分類、多選服務、動態時段計算、價格根據會員等級變化。
- **[✔️] 管理員後台:**
    - **儀表板:** 數據總覽與快捷導航。
    - **訂單管理:** 集中管理所有狀態的訂單。
    - **行事曆檢視:** 以月曆/週曆/日曆視覺化呈現所有預約。
    - **客戶管理:** 瀏覽客戶列表、編輯備註、管理權限。
    - **服務管理:** 新增、編輯、刪除服務項目，並設定一般及白金會員價格。
    - **營業時間設定:** 以日曆方式彈性設定公休日與每日營業時段。
    - **優惠與集點管理:** 功能頁面已建立。
- **[✔️] LINE 通知:** 預約成功後，自動發送 LINE 訊息通知客戶與管理員。

---

## 2. 主要功能模組詳述 (Completed Feature Modules)

本區塊詳述已完成的各項主要功能及其包含的子項目。

### **2.1. 核心架構與設定**
- **技術棧:** React, TypeScript, Vite, Tailwind CSS, Zustand。
- **後端與部署:** Firebase (Auth, Firestore), Netlify (Serverless Functions, Hosting)。
- **版本控制:** 專案由 Git 管理，並遵循以本文件為中心的 Log-Driven Development 模式。
- **路徑修正:** 已根據專案實際結構，全面修正日誌文件中的檔案路徑。

### **2.2. 使用者認證系統 (Authentication)**
- **登入/註冊:**
    - 實現了 LINE 登入/註冊，並自動偵測 LINE 內建瀏覽器以採用 `Redirect` 模式。
    - 整合 Google 快速登入/註冊。
    - 登入/註冊成功後，根據使用者角色自動導向對應的儀表板。
    - 登出功能可將使用者導向首頁。
- **路由保護:**
    - 建立了 `ProtectedRoute` (使用者需登入) 和 `AdminRoute` (使用者需為管理員) 來保護特定頁面。
- **核心問題修復:**
    - 解決了 iOS Safari 因儲存分區導致的 `Redirect` 登入失敗問題 (透過 Netlify 代理)。
    - 解決了 React 嚴格模式下，因 `useEffect` 重複執行導致的登入後卡頓問題。

### **2.3. 預約流程 (Booking Flow)**
- **服務選擇:**
    - 首頁以三大分類導引至預約頁面。
    - 預約頁面以可收合的分類方式呈現服務，支援一次選擇多個服務項目。
    - 服務價格會根據「白金會員」角色自動顯示優惠價。
- **時間選擇:**
    - 日曆會自動禁用過去日期並標示「公休日」。
    - 可選時段根據管理員設定的「營業時間」及當天「已預約時段」進行動態計算，精準過濾不可用時間。
- **預約提交與狀態:**
    - 預約成功後，會根據使用者角色（一般/白金）設定不同的初始狀態 (`pending_payment` / `pending_confirmation`)。
    - 預約資訊（含多個服務、總時長、總價格）會正確寫入 Firestore。
    - 預約成功後會觸發 LINE 通知。

### **2.4. 管理員後台 (Admin Panel)**
- **儀表板 (`AdminDashboard.tsx`):**
    - 轉型為數據總覽頁，包含「待處理訂單」、「營業日設定」等數據看板。
    - 提供前往各管理頁面的快捷連結。
- **行事曆 (`CalendarPage.tsx`):**
    - 以行事曆視覺化呈現所有預約，並以顏色區分預約狀態。
    - 支援月、週、日視圖切換，並針對行動裝置優化 RWD。
    - 點擊預約可查看詳情。
- **訂單管理 (`OrderManagementPage.tsx`):**
    - 可根據 `pending_confirmation`, `confirmed` 等狀態篩選並管理訂單。
- **客戶管理 (`CustomerListPage.tsx`):**
    - 列表顯示所有使用者，並提供搜尋功能。
    - 可透過下拉選單直接修改使用者角色（管理員, 白金會員, 一般會員）。
    - 支援新增客戶備註。
    - 行動裝置上以卡片視圖優化顯示。
- **服務管理 (`ServiceManagement.tsx`):**
    - 提供新增、編輯、刪除服務項目的完整功能。
    - 可設定服務的「一般價格」與「白金會員價」。
- **營業時間 (`HoursSettingsPage.tsx`):**
    - 透過日曆介面，讓管理員能方便地設定特定日期的營業時段或將其設為公休日。

### **2.5. 後端與自動化 (Backend & Automation)**
- **Serverless Functions:**
    - `send-line-message.ts`: 負責發送 LINE 訊息的通用函式。
- **API 路由:**
    - 透過 `netlify.toml` 和 `vite.config.ts` 設定代理，確保無論在本地開發或生產環境，前端都能用 `/api/*` 路徑順利呼叫後端函式。
- **環境變數:**
    - 修正了前後端環境變數讀取規則，確保 Firebase 與 LINE 的金鑰能被正確載入。

---

## 3. 當前任務與未來藍圖 (Current Tasks & Future Blueprint)

### **3.1. 進行中任務 (In Progress)**
- **[ ] 優惠券管理功能開發 (Coupon Management):**
    - **目標:** 實作優惠券的後台管理介面。
    - **具體任務:**
        1.  在 `PromotionsPage.tsx` 的「優惠券管理」頁籤中，建立 UI 以列表形式顯示所有已建立的優惠券。
        2.  製作一個表單元件，讓管理員可以根據 `coupons` 資料模型新增優惠券（包含折扣類型、代碼、適用範圍等）。
        3.  建立 `useCoupons.ts` Hook 來讀取 `coupons` 集合的資料。
        4.  實作將新優惠券寫入 Firestore 的邏輯。

### **3.2. 待辦任務 (To-Do)**
- **[ ] 優惠券發送與使用:**
    - **後台:** 實作發送優惠券給特定/全體會員的功能 (`CouponDistribution.tsx`)。
    - **前台:** 在預約流程中加入使用優惠券的介面 (`CouponSelectorModal.tsx`)，並驗證其有效性。
- **[ ] 集點卡功能 (Loyalty System):**
    - **後台:** 建立集點規則設定介面 (`LoyaltySettings.tsx`)。
    - **自動化:** 建立 Cloud Function，在訂單完成後自動為使用者增加點數。
    - **前台:** 讓使用者能查看自己的點數，並在未來用於兌換。
- **[ ] 首頁 Banner 管理:**
    - **後台:** 建立上傳 Banner 圖片、設定連結的管理介面。
    - **前台:** 在首頁使用輪播元件動態顯示後台設定的 Banner。

### **3.3. 待討論事項 (Pending Discussion)**
- 金流串接細節 (如：綠界 ECPay 的 API Key)。
- LINE Bot 的完整憑證 (Channel Secret, Access Token)。

---

## 4. 系統架構與協作協議 (Architecture & Protocol)

### **4.1. 系統架構圖**
```
  [ User Browser ]
        |
        v
  +--------------------------------+
  |      React App (Frontend)      |
  |--------------------------------|
  |  - Pages (Home, Booking, ...)  |
  |  - Components (Selectors,...)  |
  |  - Hooks (useAuth, useBookings)|
  |  - Store (Zustand for State)   |
  +--------------------------------+
        |         ^
        | (API)   | (Realtime)
        v         |
  +--------------------------------+   +-----------------------------+
  |  Netlify (Backend & Hosting)   |-->|   Firebase (BaaS)           |
  |--------------------------------|   |-----------------------------|
  |  - Functions (e.g. LINE Msg)   |   |  - Authentication (Auth)    |
  |  - Hosting (SPA Deployment)    |   |  - Firestore DB (Database)  |
  |  - Redirects (API Proxy)       |   +-----------------------------+
  +--------------------------------+
```

### **4.2. AI 協作協議**
為確保開發流程順暢，所有 AI 協作者必須嚴格遵守以下協議：
1.  **以儀表板為中心:** 在開始新任務前，必須完整閱讀並理解本文件 (`PROJECT_LOG.md`) 的最新版本，特別是「專案狀態總覽」與「當前任務」。
2.  **遵循單一任務:** 嚴格按照「下一步行動」或「進行中任務」所定義的目標進行開發，不隨意擴展範圍。
3.  **日誌驅動開發:**
    - **任務開始時:** 將「待辦任務」中的項目移至「進行中任務」。
    - **任務完成時:** 將「進行中任務」的內容，整理摘要後，歸檔至 `2. 主要功能模組詳述` 中對應的區塊，並從「進行中任務」移除。
    - **定義下一步:** 從「待辦任務」中選擇下一個優先級最高的任務，更新至文件最上方的「下一步行動」。
4.  **高品質交付:** 所有程式碼需遵循專案既有架構與風格，優先使用 TypeScript 與相對路徑。

---

## 5. 開發歷史封存 (Archived Development Log)

本區塊封存過去所有已完成的任務、修復紀錄與詳細的 AI 貢獻摘要，作為專案的歷史軌跡備查。

<details>
<summary>點此展開詳細開發歷史紀錄</summary>

- **[完成]** 審閱初始架構書，並提供強化建議（狀態管理、型別一致性、安全性等）。
- **[完成]** 建立了專案的初始檔案結構，包括共享型別、Firebase 設定與 Zustand store。
- **[完成]** 實作了 `Login.tsx` 元件，包含 UI (Tailwind CSS) 與 Firebase 登入邏輯。
- **[完成]** 建立了 `useAuth.ts` Hook，用於同步 Firebase 認證狀態至 Zustand store。
- **[完成]** 整合 `useAuth` Hook 至 `App.tsx`，並使用 `react-router-dom` 建立了完整的公有/受保護路由系統。
- **[完成]** 實作了 `Register.tsx` 元件，包含註冊驗證及在 Firestore 中建立使用者文件的邏輯。
- **[完成]** 完善了本 `PROJECT_LOG.md`，加入了詳細的協作協議。
- **[完成]** 生成並持續維護此 `PROJECT_LOG.md` 文件以供團隊交接。
- **[完成]** 新增了預約頁面路由 (`/booking`) 並在儀表板加入連結。
- **[完成]** 建立了 `BookingPage.tsx` 和 `BookingForm.tsx` 的基本骨架。
- **[完成]** 建立了 `useServices.ts` Hook 以從 Firestore 讀取服務項目。
- **[完成]** 實作了 `ServiceSelector.tsx` 元件並將其整合至 `BookingForm.tsx`。
- **[完成]** 在日誌中補充了系統架構圖，以增強交接清晰度。
- **[完成]** 實作了 `BookingForm.tsx` 的預約提交流程，可將新預約寫入 Firestore。
- **[完成]** 修正了 `useBookings.ts` Hook，使其使用正確的 `currentUser` 狀態，解決個人儀表板無法顯示預約記錄的問題。
- **[完成]** 優化了 `useAvailableSlots.ts`，使其能根據現有預約的實際服務時長進行精確的時段計算。
- **[完成]** 優化了 `useBookings.ts` Hook，使用 `onSnapshot` 實現了預約歷史頁面的即時更新。
- **[完成]** 完善了 `BookingHistoryPage.tsx` 的取消預約功能，並修正了部分 UI 文字使其與應用程式整體風格一致。
- **[完成]** 解決了 Tailwind CSS 本地設定問題，依使用者指示決定採用 CDN 方式載入樣式。
- **[完成]** 建構管理員後台基礎 (擴充 `useAuth` 讀取 `role`、建立管理員路由、建立 `AdminDashboard.tsx` 骨架)。
- **[完成]** 完善管理員後台功能 (建立 `useAllBookings.ts` 並整合)。
- **[完成]** 優化首頁預約流程 (根據登入狀態顯示不同按鈕)。
- **[完成]** 豐富化管理員後台資訊 (在預約列表中顯示使用者與服務名稱)。
- **[完成]** 基礎樣式設定 (建立 `tailwind.config.js`, `index.css`, `postcss.config.js`)。
- **[完成]** 擴充使用者認證功能 (Google 登入, LINE 登入, LINE 內建瀏覽器 `signInWithRedirect` 處理)。
- **[完成]** 修復 Google 登入後 Firestore 連線錯誤 (啟用 Firestore API)。
- **[核心修正]** 解決 iOS Safari 儲存分區導致的登入失敗問題 (透過 `netlify.toml` 代理 `/__/auth/handler`)。
- **[完成]** 新增使用者登出功能並優化導向邏輯。
- **[核心修正]** 解決 React 嚴格模式下的登入跳轉問題 (重構 `useAuth.ts` 解決 `useEffect` 重複執行)。
- **[核心修正]** 解決 Google 登入時的 API 金鑰格式錯誤 (修正 `.env` 檔案格式)。
- **[完成]** 專案結構清理與修正 (刪除重複檔案、修正 `import` 路徑)。
- **[完成]** UI/UX 優化與功能完善 (優化儀表板與登入頁面)。
- **[完成]** 建構客戶管理功能 (`CustomerListPage.tsx`, `useAllUsers.ts`, 備註與權限變更功能)。
- **[完成]** 開發營業時間設定功能 (`HoursSettingsPage.tsx`, `businessHours` 集合, `react-day-picker` 整合)。
- **[核心修正]** 同步預約時段與營業時間 (重構 `useAvailableSlots.ts` 以使用 `businessHours`)。
- **[核心修正]** 修正預約時段計算邏輯 (處理 `Timestamp` 物件轉換)。
- **[核心修正]** 解決 Firestore 索引不足錯誤 (用 `in` 查詢取代 `!=` 查詢)。
- **[完成]** 簡化登入/註冊選項 (暫時隱藏 Google 與帳號密碼登入)。
- **[完成]** 建立預約行事曆檢視 (整合 `react-big-calendar` 至儀表板)。
- **[完成]** 解決各類啟動與執行階段錯誤 (Vite 路徑別名, API 404, 環境變數, 型別錯誤)。
- **[完成]** 擴充服務項目管理功能 (新增刪除服務、白金會員價)。
- **[完成]** 擴充使用者角色系統 (新增「白金會員」角色、優化權限設定介面)。
- **[完成]** 首頁服務項目優化 (改為三大分類並連結至預約頁)。
- **[完成]** 優化預約流程 (支援多選服務、分類收合)。
- **[完成]** 預約狀態流程重構 (合併 `status` 與 `paymentStatus`)。
- **[完成]** 實施管理員後台綜合優化方案 (建立 `OrderManagementPage.tsx` 與 `CalendarPage.tsx`，重構儀表板)。
- **[完成]** 建立「優惠與集點」管理頁面骨架 (`PromotionsPage.tsx`)。
- **[完成]** 重構 LINE 通知設定頁面 (`SettingsPage.tsx`)。

</details>

---
**日誌結束**