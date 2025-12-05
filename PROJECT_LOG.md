# 美甲店預約管理系統 - 專案儀表板

**文件版本:** 2.1
**最後更新:** 2025-12-05
**主要貢獻者:** Gemini Code Assist

---

## 1. 專案狀態總覽 (Project Status Overview)

### **當前狀態 (Current Status)**
系統已完成全面的 UI/UX 重構，採用 **Fresh/Origin Natural** 設計風格 (Primary: #9F9586)。前台 (首頁、預約) 與後台 (管理員儀表板及所有子頁面) 皆已統一視覺語言，並優化了 RWD 響應式體驗。目前正準備深化行銷功能的邏輯整合。

### **下一步行動 (Next Immediate Action)**
**整合「優惠券發送與使用」功能至前端預約流程：** 讓客戶在預約時能選擇並使用已持有的優惠券。

### **核心功能速覽 (Key Feature Quickview)**
- **[✔️] 使用者系統:** 整合 LINE/Google 登入、註冊、角色權限管理。
- **[✔️] 預約系統:** 
    - 全新設計的預約流程，包含服務選擇、日曆與時段選擇。
    - 支援服務分類、多選服務、價格根據會員等級變化。
- **[✔️] 管理員後台:**
    - **全站重構:** 所有管理頁面皆已套用新版設計系統，提升操作體驗與視覺舒適度。
    - **完整功能:** 涵蓋儀表板、訂單、行事曆、客戶、服務、營業時間、優惠與設定等全方位管理。
- **[✔️] UI/UX 設計:** 確立 'Fresh/Origin Natural' 風格，使用 Noto Sans TC 與 Playfair Display 字體，搭配 Earth Tone 色系。

---

## 2. 主要功能模組詳述 (Completed Feature Modules)

### **2.8. UI/UX 全面重構 (Design System Overhaul)**
- **設計系統確立:**
    - 定義了 `tailwind.config.js` 中的核心色票 (Primary: #9F9586, Secondary: #EFECE5) 與字體系統。
    - 透過 `index.html` 直接注入 Tailwind 配置，解決 CDN 環境下的樣式客製化問題。
    - 全面採用 **Noto Sans TC** (內文) 與 **Playfair Display** (標題) 字體。
- **首頁重構 (`Home.tsx`):**
    - 將單一巨型元件拆分為模組化元件 (`HeroSection`, `ServiceHighlights`, `PortfolioSection`, `Footer`)。
    - 實作了視差滾動 (Parallax) 與卡片式佈局，提升視覺質感。
- **預約流程優化 (`BookingPage.tsx`):**
    - 重構服務選擇器 (`ServiceSelector`) 為手風琴式設計，資訊呈現更清晰。
    - 客製化日曆元件 (`CalendarSelector`) 與時段選擇器 (`TimeSlotSelector`)，使其與整體風格一致。
    - 優化了行動裝置上的預約體驗，並修正了 Sticky Header 的定位問題。
- **管理後台升級:**
    - **儀表板 (`AdminDashboard`):** 重新設計數據卡片 (`SummaryCard`)，移除過時陰影，採用更現代的平面化與微互動設計。
    - **子頁面統整:** 全面翻新 `OrderManagement`, `ServiceManagement`, `CustomerList`, `HoursSettings`, `Calendar`, `Settings`, `Promotions` 等頁面，確保一致的 Header、表格與按鈕樣式。
- **架構優化:**
    - 重構 `App.tsx` 路由結構，解決 `useLocation` 在 Router context 外使用的錯誤。
    - 實作了 `AnnouncementBanner` 的條件式渲染 (在預約頁面隱藏)。

### **2.1. 核心架構與設定**
- **技術棧:** React, TypeScript, Vite, Tailwind CSS, Zustand。
- **後端與部署:** Firebase (Auth, Firestore), Netlify (Serverless Functions, Hosting)。
- **版本控制:** 專案由 Git 管理，並遵循以本文件為中心的 Log-Driven Development 模式。

### **2.2. 使用者認證系統 (Authentication)**
- **登入/註冊:**
    - 實現了 LINE 登入/註冊，並自動偵測 LINE 內建瀏覽器以採用 `Redirect` 模式。
    - 整合 Google 快速登入/註冊。
    - 登入/註冊成功後，根據使用者角色自動導向對應的儀表板。
- **路由保護:**
    - 建立了 `ProtectedRoute` (使用者需登入) 和 `AdminRoute` (使用者需為管理員) 來保護特定頁面。

### **2.3. 預約流程 (Booking Flow)**
- **服務選擇:**
    - 首頁以三大分類導引至預約頁面。
    - 預約頁面以可收合的分類方式呈現服務，支援一次選擇多個服務項目。
    - 服務價格會根據「白金會員」角色自動顯示優惠價。
- **時間選擇:**
    - 日曆會自動禁用過去日期並標示「公休日」。
    - 可選時段根據管理員設定的「營業時間」及當天「已預約時段」進行動態計算。
- **預約提交與狀態:**
    - 預約成功後，會根據使用者角色設定不同的初始狀態。
    - 預約資訊正確寫入 Firestore 並觸發 LINE 通知。

### **2.4. 管理員後台 (Admin Panel)**
- **核心功能:** 儀表板、行事曆檢視、訂單管理、客戶管理、服務管理、營業時間設定、優惠管理、作品集管理皆已具備完整功能並完成 UI 重構。

### **2.5. 後端與自動化 (Backend & Automation)**
- **Serverless Functions:** `send-line-message.ts` 負責發送 LINE 訊息。
- **API 路由:** 透過 Netlify Redirects 確保 API 呼叫順暢。

### **2.6. 行銷與推廣功能 (Marketing & Promotions)**
- **優惠券系統 (後台):** 建立後台管理與發送介面。
- **集點卡系統 (後台):** 提供規則設定介面。

### **2.7. 作品集與案例展示 (Portfolio & Showcase)**
- **作品集管理:** 支援後台新增/編輯/刪除作品，並於前台展示。

---

## 3. 當前任務與未來藍圖 (Current Tasks & Future Blueprint)

### **3.1. 進行中任務 (In Progress)**
*此處留空，待開始執行新任務時填入。*

### **3.2. 待辦任務 (To-Do)**
- **[ ] 優惠券發送與使用 (前端整合):**
    - **目標:** 讓客戶能在預約時選擇並使用已持有的優惠券。
    - **前台:** 在預約流程中加入使用優惠券的介面 (`CouponSelectorModal.tsx`)，並驗證其有效性。
- **[ ] 集點卡功能 (前端與自動化):**
    - **目標:** 讓集點功能完整落地。
    - **自動化:** 建立 Cloud Function，在訂單完成後自動為使用者增加點數。
    - **前台:** 讓使用者能查看自己的點數，並在未來用於兌換。
- **[ ] 首頁 Banner 管理:**
    - **後台:** 建立上傳 Banner 圖片、設定連結的管理介面。
    - **前台:** 在首頁使用輪播元件動態顯示後台設定的 Banner。

### **3.3. 待討論事項 (Pending Discussion)**
- 金流串接細節 (如：綠界 ECPay 的 API Key)。
- LINE Bot 的完整憑證 (Channel Secret, Access Token)。

### **3.4. 未來功能規劃 (Future Feature Roadmap)**
- **[ ] ⭐️ 客戶評價與回饋系統 (Customer Reviews)**
- **[ ] 📅 增強版預約提醒 (Enhanced Reminders)**
- **[ ] ❓ 常見問題頁面 (FAQ Page)**
- **[ ] 🚀 架構與效能優化 (Architecture & Performance)**

---

## 4. 系統架構與協作協議 (Architecture & Protocol)

*(架構圖與協議保持不變，參見舊版日誌)*

---

## 5. 開發歷史封存 (Archived Development Log)

<details>
<summary>點此展開詳細開發歷史紀錄</summary>

*(保留原有歷史紀錄)*
- **[完成]** 審閱初始架構書... (略)
- **[完成]** 重構 LINE 通知設定頁面 (`SettingsPage.tsx`)。
- **[完成]** UI/UX 全面重構：
    - 定義並套用 'Fresh/Origin Natural' 設計系統 (#9F9586)。
    - 重構首頁 (`Home.tsx`) 為模組化元件。
    - 重構預約流程 (`BookingPage.tsx`) 與相關元件。
    - 重構所有管理員後台頁面 (`AdminDashboard`, `OrderManagement`, etc.)。
    - 修復路由結構與 Tailwind 設定問題。

</details>

---
**日誌結束**