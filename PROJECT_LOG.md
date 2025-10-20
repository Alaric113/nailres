# 專案日誌 (Project Log) - 美甲店預約管理系統 (AI輔助開發版)

**文件版本:** 1.1
**最後更新:** 2024-05-21
**主要貢獻者:** Gemini Code Assist

## 1. 專案概述

本文件是「美甲店預約管理系統」的核心開發日誌與協作指南。它的目的不僅是記錄進度，更是確保所有參與者（包括人類與 AI）遵循一致的開發流程與標準。

專案目標是建立一個現代化、高效率且安全的美甲店預約管理平台。全程採用 AI 輔助開發模式，以加速開發流程並提升程式碼品質。

**當前階段:** **核心功能開發 - 使用者認證完成**

## 2. AI 協作協議 (AI Collaboration Protocol)

為確保開發流程順暢，所有 AI 協作者必須嚴格遵守以下協議：

1.  **以日誌為中心 (Log-Driven Development):**
    - **每次回應都必須更新本文件 (`PROJECT_LOG.md`)。**
    - **更新內容包含：**
        - **完成進度:** 在 `3. 當前進度與 AI 貢獻摘要` 中，將已完成的任務標記為 `[完成]` 或 `[進行中]`。
        - **定義下一步:** 在 `4. 下一步行動` 中，清晰地定義出下一個具體的、可執行的開發任務。

2.  **遵循指令 (Follow the Plan):**
    - 嚴格按照 `4. 下一步行動` 中定義的任務進行開發，不偏離主題，不進行額外未經請求的修改。

3.  **高品質交付 (High-Quality Delivery):**
    - 所有程式碼需遵循專案已建立的架構與風格。
    - 程式碼必須清晰、可讀性高，並在適當之處加上註解。
    - 優先使用 `diff` 格式提供程式碼變更，以便於審閱。

## 3. 系統架構與資料流 (System Architecture & Data Flow)

為了提供一個清晰的全局視圖，以下是本系統的主要組件及其交互方式。

```

  [ User Browser ]
        |
        v
  +--------------------------------+
  |      React App (Frontend)      |
  |--------------------------------|
  |  - Pages (Dashboard, Booking)  |
  |  - Components (BookingForm)    |
  |  - Hooks (useAuth, useServices)|
  |  - Store (Zustand)             |
  +--------------------------------+
        |         ^
        | (1)     | (2)
        v         |
  +--------------------------------+
  |      Firebase (Backend)        |
  |--------------------------------|
  |  - Authentication (使用者驗證) |
  |  - Firestore DB (資料庫)       |
  |    - /users                    |
  |    - /services                 |
  |    - /bookings                 |
  +--------------------------------+

```

**資料流說明 (Data Flow Explanation):**
1.  **(讀取/寫入請求):** 前端 React 元件透過自定義 Hooks (例如 `useServices`) 向 Firebase 發起資料請求（例如，讀取服務列表、寫入一筆新的預約紀錄）。
2.  **(狀態同步):** Firebase 的 `onAuthStateChanged` 或 Firestore 的即時監聽器會將後端資料的變更即時推送回前端，前端的 `useAuth` Hook 或其他 Hooks 接收到變更後，更新 Zustand 全域狀態，從而觸發 UI 的重新渲染。

## 4. 已確立的架構決策與理由

根據初始的架構書，並經過 Gemini Code Assist 的審閱與強化，我們已確立以下核心架構：

### 2.1. 技術棧 (Tech Stack)
- **前端:** React + TypeScript
- **後端:** Netlify Functions (Serverless)
- **資料庫:** Firebase Firestore
- **部署:** Netlify
- **AI 工具組:** Claude/Cursor, GitHub Copilot, Firebase Genkit

**理由:** 這套組合兼具開發者體驗、高擴展性與成本效益。TypeScript 提供端到端的型別安全，Firebase 簡化了後端基礎設施的管理，而 Serverless 架構能應對流量波動。

### 2.2. 關鍵架構增強建議
在原始架構基礎上，我們加入了以下具體建議以提升專案的健壯性：

1.  **全域狀態管理:**
    - **決策:** 引入 **Zustand**。
    - **理由:** 輕量、API 簡潔，與 React Hooks 完美整合，適合管理如使用者認證狀態、購物車等跨元件共享的狀態。

2.  **樣式方案:**
    - **建議:** 採用 **Tailwind CSS**。
    - **理由:** Utility-first 的方法能大幅提升開發速度，並保持 UI 的一致性。

3.  **前後端型別一致性:**
    - **決策:** 後端 Netlify Functions 也應使用 **TypeScript** (`.ts`)。
    - **理由:** 建立一個共享的 `types` 目錄，讓前後端共用資料模型（如 `Booking`, `User`），從根本上杜絕因型別不匹配導致的錯誤。

4.  **資料庫安全與索引:**
    - **決策:** 必須撰寫詳盡的 **Firestore 安全規則 (`firestore.rules`)**。
    - **理由:** 這是保護使用者資料的第一道、也是最重要的一道防線。規則應確保使用者只能存取自身資料，而管理員擁有更高權限。

5.  **AI 功能具體化:**
    - **決策:** 利用 **Firebase Genkit** 開發「智慧排程建議」功能。
    - **理由:** 將 AI 從單純的「開發輔助」提升為「產品核心功能」，透過 Genkit Flow 整合業務邏輯（查詢服務時長）與 AI 模型（推薦最佳時段），創造獨特的用戶價值。

## 5. 當前進度與 AI 貢獻摘要

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
- **[完成]** 確立使用 Netlify 進行專案部署，並新增 `netlify.toml` 設定檔以支援 SPA 路由。

## 6. 下一步行動 (Action Items for Next Engineer)
## 6. 下一步行動 (Action Items for Next Engineer)

歡迎加入！以下是您可以立即開始的任務：

1.  **建構管理員後台基礎:**
    - **目標:** 建立一個只有管理員才能訪問的後台頁面。
    - **任務:**
        - **擴充狀態管理:** 修改 `useAuth` 和 `authStore`，使其在使用者登入後，能從 Firestore 的 `/users/{uid}` 文件中讀取 `role` 欄位，並存儲到全域狀態中。
        - **建立管理員路由:** 在 `App.tsx` 中新增一個 `/admin` 的受保護路由，該路由只允許 `role` 為 `admin` 的使用者訪問。
        - **建立儀表板骨架:** 建立一個基本的 `AdminDashboard.tsx` 頁面作為後台的進入點。

1.  **完善管理員後台功能:**
    - **目標:** 讓管理員後台能真正顯示所有用戶的預約資料。
    - **任務:**
        - **[完成]** 建立 `useAllBookings.ts` Hook。
        - **[完成]** 實作 Hook 邏輯，從 Firestore 的 `bookings` 集合中讀取所有預約記錄，並按 `dateTime` 降序排列。
        - **[完成]** 將 `useAllBookings` Hook 整合到 `AdminDashboard.tsx` 中，以獲取並顯示所有預約資料。
        - **[完成]** 修復 `useAllBookings.ts` 中的型別匯入路徑錯誤。
        - **[完成]** 修正 `useAllBookings.ts` 中因 `import` 而非 `import type` 造成的執行階段錯誤。
        - **[完成]** 移除 `useAllBookings.ts` 中對 `DocumentData` 的不必要匯入，解決執行階段錯誤。

1.  **優化首頁預約流程:**
    - **目標:** 確保使用者登入後才能進行預約。
    - **任務:**
        - **[完成]** 簡化 `Home.tsx` 的按鈕邏輯，合併為單一行動呼籲按鈕，根據登入狀態顯示不同文字與連結。

1.  **豐富化管理員後台資訊:**
    - **目標:** 讓管理員後台的預約列表更具可讀性。
    - **任務:**
        - **[完成]** 建立 `src/types/user.ts` 以提供使用者文件的型別定義。
        - **[完成]** 增強 `useAllBookings.ts` Hook，使其能額外讀取 `users` 和 `services` 集合，並將 `userId` 和 `serviceId` 轉換為對應的名稱。
        - **[完成]** 更新 `AdminDashboard.tsx`，在表格中顯示使用者名稱與服務項目名稱，取代原本的 ID。

1.  **基礎樣式設定:**
    - **目標:** 讓 Tailwind CSS 樣式在整個應用程式中生效。
    - **任務:**
        - **[完成]** 建立 `tailwind.config.js` 並設定 `content` 路徑以掃描專案檔案。
        - **[完成]** 建立 `src/index.css` 並引入 Tailwind 的基礎、元件和工具樣式。
        - **[完成]** 建立應用程式進入點 `src/main.tsx`，並在其中匯入 `index.css`。
        - **[完成]** 建立 `postcss.config.js`，讓 Vite 能夠正確載入 Tailwind CSS 和 Autoprefixer 外掛。
        - **[已延後]** 本地樣式設定失敗，暫時切換回 Tailwind Play CDN 以確保開發順暢。**待開發者指示後再處理。**

1.  **擴充使用者認證功能:**
    - **目標:** 提供 Google 第三方登入選項，簡化使用者註冊與登入流程。
    - **任務:**
        - **[完成]** 在 `Login.tsx` 和 `Register.tsx` 頁面新增「使用 Google 登入/註冊」按鈕。
        - **[完成]** 在 `Register.tsx` 中實作 `handleGoogleSignIn` 函式，處理 `signInWithPopup` 流程，並在使用者首次登入時自動於 Firestore 建立使用者資料。
        - **[完成]** 在 `Login.tsx` 中實作 `handleGoogleSignIn` 函式，處理 Google 登入並更新 `lastLogin` 時間戳。
        - **[進行中]** 規劃 LINE 登入流程，採用 Firebase Functions 建立 Custom Token 的標準作法。
        - **[已暫停]** 暫時隱藏 LINE 登入按鈕，待後端 Cloud Function 部署完成後再重新啟用。

1.  **修復 Google 登入後 Firestore 連線錯誤:**
    - **目標:** 解決 Google 登入成功後，無法讀取 Firestore 使用者資料的問題。
    - **問題描述:** 瀏覽器控制台顯示 `GET https://firestore.googleapis.com/... 400 (Bad Request)` 以及 `WebChannelConnection RPC 'Listen' stream ... transport errored` 錯誤。
    - **根本原因:** 經分析，此問題是因為專案在 Google Cloud Console 中尚未啟用 **Firestore API**。
    - **解決方案:**
        - **[完成]** 前往 Google Cloud API 庫。
        - **[完成]** 確認選擇了正確的專案 (`nail-62ea4`)。
        - **[完成]** 點擊「啟用」按鈕以啟用 `firestore.googleapis.com` API。

1.  **[技術債] 解決 Tailwind CSS 本地設定問題:**
    - **目標:** 移除對 CDN 的依賴，使專案能獨立運作。
    - **問題描述:** 嘗試設定本地 Tailwind CSS + PostCSS 失敗，導致樣式無法載入。
    - **任務:** 重新審查 `vite.config.ts`, `postcss.config.js`, `tailwind.config.js` 及相關依賴，找出設定失敗的根本原因並修復。

1.  **新增使用者登出功能:**
    - **目標:** 讓已登入的使用者可以從主畫面登出。
    - **任務:**
        - **[完成]** 在 `src/store/authStore.ts` 中新增 `logout` 函式，封裝 Firebase 的 `signOut` 邏輯。
        - **[完成]** 在 `src/pages/Dashboard.tsx` 中加入「登出」按鈕。
        - **[完成]** 將登出按鈕與 `authStore` 中的 `logout` 函式綁定，並在登出後自動導向登入頁面。
        - **[完成]** 修正登出邏輯，使其導向首頁 (`/`) 而非登入頁。
        - **[完成]** 修正 `useAuth.ts` 中的狀態更新邏輯，解決登入後無法自動跳轉的問題。
        - **[完成]** 在登入/註冊頁面加入已登入狀態檢查，自動導向至對應的儀表板。
        - **[完成]** 在使用者儀表板為管理員新增前往管理後台的按鈕。
        - **[完成]** 修正登入邏輯，讓管理員登入後直接導向管理後台。

1.  **[核心修正] 解決 React 嚴格模式下的登入跳轉問題:**
    - **目標:** 徹底解決 Google 登入成功後，頁面卡在載入畫面無法自動跳轉的問題。
    - **問題描述:** `useAuth.ts` 中的 `useEffect` 因依賴了 Zustand 的 `set` 函式，在 `React.StrictMode` 下會執行兩次，導致 `onAuthStateChanged` 監聽器被重複設定與清理，造成 `authIsLoading` 狀態鎖死在 `true`。
    - **任務:**
        - **[完成]** 重構 `src/hooks/useAuth.ts`，改用 `useAuthStore.getState()` 來獲取 store 的方法，並移除 `useEffect` 的依賴陣列。這確保了 Firebase 監聽器在應用程式生命週期中只會被設定一次，從而穩定認證流程。
        - **[完成]** 更新本 `PROJECT_LOG.md`，記錄此問題的根本原因與解決方案。
        - **[完成]** 修正 `src/store/authStore.ts` 中的 `_setCurrentUser` 函式，移除對 `authIsLoading` 狀態的錯誤操作，解決狀態競爭 (Race Condition) 問題，確保登入後能正確跳轉。
        - **[完成]** 在 `useAuth.ts` 中使用 `Promise.resolve().then()` 將 `_setLoading(false)` 的呼叫延遲到微任務中，解決因 Zustand 批次更新導致 `useEffect` 依賴未觸發跳轉的問題。

1.  **專案結構清理與修正:**
    - **目標:** 解決因檔案重複與路徑錯誤導致的功能不一致問題。
    - **任務:**
        - **[完成]** 刪除位於 `src/` 根目錄下的舊版 `Login.tsx` 和 `Dashboard.tsx`。
        - **[完成]** 修正 `App.tsx` 中的 `import` 路徑，確保路由指向 `src/pages/` 目錄下的最新元件。
        - **[完成]** 恢復 `Dashboard.tsx` 中意外遺失的「我的預約」區塊。

1.  **UI/UX 優化與功能完善:**
    - **目標:** 提升使用者介面的美觀與易用性。
    - **任務:**
        - **[完成]** 優化 `Dashboard.tsx` 的 UI/UX，採用雙欄式佈局與卡片式設計。
        - **[完成]** 優化 `Login.tsx` 的 UI/UX，使其風格與應用程式整體保持一致。
        - **[完成]** 修正首頁按鈕邏輯，登入後顯示「前往儀表板」。
        - **[完成]** 修正 `Dashboard.tsx` 中的登出邏輯，使其導向首頁。
        - **[完成]** 刪除專案中重複、錯誤的檔案，統一程式碼來源。
        - **[完成]** 修正 `useAllBookings.ts` 中的型別匯出問題。

## 7. 待討論事項
1.  **[已解決] 啟動錯誤：路徑別名解析失敗**
    - **目標:** 解決 `npm run dev` 時出現的 `Failed to resolve import "@/App"` 錯誤。
    - **問題描述:** 專案缺少 `vite.config.ts` 檔案，導致 Vite 無法識別 `@` 路徑別名。
    - **解決方案:**
        - **[完成]** 建立 `vite.config.ts` 檔案。
        - **[完成]** 在設定檔中新增 `resolve.alias` 選項，將 `@` 指向 `src` 目錄。

1.  **[已解決] 啟動錯誤：Firebase 模組解析失敗**
    - **目標:** 解決 `npm run dev` 時出現的 `Failed to resolve import "@/firebase"` 錯誤。
    - **問題描述:** 專案中所有對 Firebase 模組的引用路徑不正確，應為 `src/lib/firebase.ts`。
    - **修正:** 經過進一步除錯，發現 `firebase.ts` 實際位於 `src/` 目錄下，而非 `src/lib/`。
    - **解決方案:**
        - **[完成]** 全域搜尋並取代所有 `from '@/lib/firebase'` 的引用為 `from '@/firebase'`，確保所有相關檔案路徑一致。

1.  **[已解決] 啟動錯誤：專案結構混亂導致的路徑解析問題**
    - **目標:** 徹底解決 `npm run dev` 啟動時所有 `Failed to resolve import` 相關的錯誤。
    - **問題描述:** 專案中存在多個重複的 `firebase.ts` 及其他 hooks/types 檔案，導致 `import` 路徑混亂，Vite 無法正確解析模組。
    - **下一步:**
        - **[完成]** 建立 `src/lib` 目錄，並將 `firebase.ts` 統一移動至 `src/lib/firebase.ts`。
        - **[完成]** 刪除所有在 `src/pages`, `src/hooks`, `src/types` 等目錄下的重複檔案。
        - **[完成]** 全域修正所有 `import` 路徑，使其指向 `src/lib/firebase.ts` 或其他正確的模組位置。

## 8. 待討論事項

- **金流串接細節:** 需要獲取綠界 (ECPay) 的測試商店 ID 與 API Key。
- **LINE Bot 憑證:** 需要申請 LINE Channel Secret 和 Channel Access Token 以進行後續整合。
- **UI/UX 設計稿:** 目前只有架構，尚無具體的 UI 設計稿，這會是下一步規劃的重點。

---
**日誌結束**
