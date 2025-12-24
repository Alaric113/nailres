# 美甲店預約管理系統 - 專案儀表板

**文件版本:** 2.3
**最後更新:** 2025-12-24
**主要貢獻者:** Gemini Code Assist

---

## 1. 專案狀態總覽 (Project Status Overview)

### **當前狀態 (Current Status)**
系統進一步增強了客戶互動與後台管理功能。修復了 LINE LIFF 連結跳轉錯誤，並解決了 LINE 通知發送時的 500 錯誤 (Firebase 憑證問題)。新增了訂單完成後的「填寫評價」功能，並在後台恢復了因 UI 重構而遺失的「首頁圖片設定」。

### **下一步行動 (Next Immediate Action)**
**整合「優惠券發送與使用」功能至前端預約流程：** 讓客戶在預約時能選擇並使用已持有的優惠券。

### **核心功能速覽 (Key Feature Quickview)**
- **[✔️] 使用者系統:** 整合 LINE/Google 登入、註冊、角色權限管理。
- **[✔️] 預約系統:** 
    - 全新設計的預約流程，包含服務選擇、日曆與時段選擇。
    - 支援服務分類、多選服務、價格根據會員等級變化。
- **[✔️] 顧客回饋系統:**
    - 新增訂單評價頁面，支援評分、評論與上傳圖片。
    - LINE 通知整合「給予評價」按鈕，自動帶入訂單資訊。
    - 管理員後台可檢視、回覆及管理評價狀態。
- **[✔️] 管理員後台:**
    - **全站重構:** 所有管理頁面皆已套用新版設計系統。
    - **功能修復:** 恢復首頁輪播圖與封面圖片的設定介面。

---

## 2. 主要功能模組詳述 (Completed Feature Modules)

### **2.10. LINE 整合與除錯 (LINE Integration Debugging)**
- **[✔️] LIFF 網址重導向修復:** 
    - 修正了 `send-line-message.ts` 中 LIFF URL 的參數傳遞方式，將目標路徑編碼為 `redirect` 參數。
    - 在前端 `LiffEntry.tsx` 新增邏輯，若 `redirect` 參數遺失，自動解析 `liff.state` 作為備援，確保「給予評價」按鈕能正確導向至 `OrderFeedbackPage`。
- **[✔️] LINE 通知發送修復:**
    - 修正了 `send-line-message` Function 因環境變數讀取錯誤導致的 500 錯誤。
    - 支援 Split Credential 模式 (同時兼容 `FIREBASE_SERVICE_ACCOUNT` JSON 字串與 `FIREBASE_PRIVATE_KEY`/`CLIENT_EMAIL` 分離設定)。
- **[✔️] UI 優化:** 增加 LINE Flex Message 底部按鈕的間距，提升視覺舒適度。

### **2.11. 顧客回饋系統 (Customer Feedback System)**
- **前端頁面:** 
    - 建立 `OrderFeedbackPage`，讓消費者在此對已完成的訂單進行評分與留言。
    - 在「預約紀錄」列表與卡片中新增「給予評價」按鈕。
- **後台管理:**
    - 優化 `FeedbackItem` 元件，確保評論數量總是可見。
    - 修正 Firestore 權限規則，允許用戶寫入自己的評價資料。

### **2.12. 後台設定修復 (Admin Settings Restoration)**
- **[✔️] 首頁圖片設定:**
    - 在 `SettingsPage` (設定頁面) 重新加入「首頁圖片」卡片。
    - 連結至 orphan 的 `ImageManagementModal`，讓管理員能重新編輯首頁輪播圖與封面圖片。

### **2.8. UI/UX 全面重構 (Design System Overhaul)**
*(以下保持原樣...)*
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
    - **[✔️] LINE LIFF 登入整合:** 替換舊有 LINE 登入流程，導入 LIFF SDK (`src/lib/liff.ts`)，使用 LIFF ID `2008325180-Zlzp27vq`。
    - **[✔️] Firebase Auth 整合:** 實現了 LINE/Google 登入/註冊，並自動偵測 LINE 內建瀏覽器以採用 `Redirect` 模式。
    - 登入/註冊成功後，根據使用者角色自動導向對應的儀表板。
- **路由保護:**
    - 建立了 `ProtectedRoute` (使用者需登入) 和 `AdminRoute` (使用者需為管理員) 來保護特定頁面。

### **2.3. 預約流程 (Booking Flow)**
- **[✔️] 行動端 UX 全面優化:**
    - **多步驟進度條:** 導入 `BookingProgressBar` 實現三步驟預約流程 (選擇服務 -> 日期時間 -> 確認)。
    - **進度條導航:** 點擊進度條數字可返回上一步驟。
    - **互動式日期時間選擇:**
        - 日曆與時段選擇器實現收合/展開動畫。
        - 點擊日期後，日曆會自動收合，並展開時段選擇。
        - 解決了日曆日期無法點擊的問題 (通過調整禁用日期邏輯及優化動畫實作方式)。
    - **介面簡潔化:** 移除預約頁面頂部標題與返回按鈕，使注意力集中在流程本身。
    - 支援服務分類、多選服務、價格根據會員等級變化。
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

### **2.9. 會員儀表板 (Dashboard) 與會員中心 (Member Page) 優化**
- **[✔️] 會員儀表板 (`/dashboard`):**
    - **會員卡 (`LoyaltyCard`):** 整合使用者頭像、名稱、會員等級與點數資訊，精簡版面並增強設計感。
    - **即將到來的預約 (`UpcomingBookingWidget`):** 新增提醒卡片，顯示最近一筆預約資訊。
    - **促銷輪播圖 (`PromoSlider`):** 新增 placeholder 輪播圖區域，用於展示最新活動。
    - **版面結構:** 調整為簡潔的垂直資訊流 (Feed) 佈局，為未來擴充預留空間。
- **[✔️] 會員中心 (`/member`):**
    - **全新頁面:** 創建專屬頁面 `/member`。
    - **多頁籤管理 (`MemberTabs`):** 整合 `歷史紀錄`、`點數兌換` (待實作邏輯) 和 `購買季卡` (待實作邏輯) 三個分頁。
- **[✔️] 行動端底部導覽列 (`BottomNav`):**
    - **導覽項目:** 包含「預約」、「首頁」、「會員」三個核心功能。
    - **視覺與互動:** 採用毛玻璃效果，活躍狀態以藥丸狀背景與動畫呈現。
    - **頂部導覽列簡化:** 在行動端隱藏 `Sidebar` 開關和搜尋按鈕，使畫面更簡潔。

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
- **[ ] 會員中心 - 點數兌換與季卡方案邏輯實作:**
    - **點數兌換:** 實作點數兌換的實際邏輯與後端介面。
    - **季卡方案:** 實作季卡購買的實際邏輯與金流整合。

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