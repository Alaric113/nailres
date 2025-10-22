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
    - **AI 協作者在開始新任務前，必須確認已閱讀並理解本文件的最新版本。**
    - **更新內容包含：**
        - **完成進度:** 在 `3. 當前進度與 AI 貢獻摘要` 中，將已完成的任務標記為 `[完成]` 或 `[進行中]`。
        - **定義下一步:** 在 `4. 下一步行動` 中，清晰地定義出下一個具體的、可執行的開發任務。

2.  **遵循指令 (Follow the Plan):**
    - 嚴格按照 `4. 下一步行動` 中定義的任務進行開發，不偏離主題，不進行額外未經請求的修改。

3.  **高品質交付 (High-Quality Delivery):**
    - 所有程式碼需遵循專案已建立的架構與風格。
    - 程式碼必須清晰、可讀性高，並在適當之處加上註解。
    - 優先使用 `diff` 格式提供程式碼變更，以便於審閱。

4.  **路徑一致性 (Consistent Pathing):**
    - **優先使用相對路徑 (`../`)** 進行模組匯入，以避免路徑別名 (`@/`) 設定不一致導致的解析錯誤。
    - 保持專案內部引用路徑的一致性。

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
- **[完成]** 確立使用 Netlify 進行專案部署，並新增 `netlify.toml` 設定檔以支援 SPA 路由，同時設定 `SECRETS_SCAN_OMIT_KEYS` 以通過安全掃描。

## 8. 下一步行動 (Action Items for Next Engineer)

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
        - **[完成]** **實作 LINE 登入:** 採用 Firebase 原生的 OpenID Connect (OIDC) 支援，並將登入邏輯抽象化至 `src/lib/socialAuth.ts`。
        - **[完成]** **優化 LINE 登入體驗:**
            - **[完成]** 在 `socialAuth.ts` 中新增偵測邏輯，判斷使用者是否正在使用 LINE 內建瀏覽器。
            - **[完成]** 若為 LINE 內建瀏覽器，則強制使用 `signInWithRedirect` 模式，避免因彈出視窗被阻擋而導致的登入失敗。
        - **[完成]** **為 LINE 訊息發送做準備:** 在使用者透過 LINE 登入/註冊時，將其 LINE User ID (`lineUserId`) 儲存至 Firestore，為後續的訊息推播功能打下基礎。

1.  **修復 Google 登入後 Firestore 連線錯誤:**
    - **目標:** 解決 Google 登入成功後，無法讀取 Firestore 使用者資料的問題。
    - **問題描述:** 瀏覽器控制台顯示 `GET https://firestore.googleapis.com/... 400 (Bad Request)` 以及 `WebChannelConnection RPC 'Listen' stream ... transport errored` 錯誤。
    - **根本原因:** 經分析，此問題是因為專案在 Google Cloud Console 中尚未啟用 **Firestore API**。
    - **解決方案:**
        - **[完成]** 前往 Google Cloud API 庫，為專案啟用 `firestore.googleapis.com` API。

1.  **[核心修正] 解決 iOS Safari 儲存分區導致的登入失敗問題:**
    - **目標:** 採用「Firebase OIDC + 同網域 handler 代理」方案，徹底解決因 iOS Safari 儲存分區策略導致 `signInWithRedirect` 流程中狀態遺失而登入失敗的問題。
    - **根本原因:** iOS Safari 的 eTLD+1 儲存分區策略，會將 Firebase 認證網域 (`*.firebaseapp.com`) 視為第三方，導致在 `redirect` 流程中無法存取 `sessionStorage` 或 `localStorage` 中的初始狀態。
    - **解決方案:** 將 Firebase 認證回調路徑 (`/__/auth/handler`) 代理到應用程式主網域下，讓登入發起與回調保持在同一網域，從而規避此限制。
    - **任務:**
        - **[完成]** **設定網域代理:** 修改 `netlify.toml`，新增代理規則，將 `/__/auth/*` 的請求轉發至 Firebase 的認證端點 (`https://<YOUR-PROJECT-ID>.firebaseapp.com/__/auth/:splat`)。**備註:** `netlify.toml` 中已存在此規則，請確認 `to` 欄位中的 Firebase Project ID (`nail-62ea4`) 是否與您的專案實際 ID 一致。
        - **[完成]** **更新 Firebase 設定:** 在 `src/lib/firebase.ts` 中，將 `authDomain` 明確設定為您的 Netlify 主機域名（例如 `treering83.netlify.app`）。**備註:** 這需要您在 `.env` 檔案中設定 `VITE_FIREBASE_AUTH_DOMAIN` 為您的 Netlify 域名。`src/lib/firebase.ts` 中的 `persistence` 和 `popupRedirectResolver` 設定已符合要求。
        - **[進行中]** **更新認證提供商設定:** 前往 LINE Developers Console、Google Cloud Console，將授權的回調 URL 更新為新的同網域路徑（例如 `https://treering83.netlify.app/__/auth/handler`）。
        - **[進行中]** **更新認證提供商設定:** 前往 LINE Developers Console、Google Cloud Console，將授權的回調 URL 更新為新的同網域路徑（例如 `https://treering83.netlify.app/__/auth/handler`）。
            - **[已解決]** **LINE 登入 400 錯誤 (redirect_uri 不符):** 錯誤日誌顯示 `redirect_uri` 為 Firebase 預設域名。**根本原因:** `.env` 檔案中的環境變數值被錯誤地用引號 (`"`) 包裹。**解決方案:** 移除 `.env` 檔案中所有變數值的引號，並重新啟動開發伺服器。
            - **[已解決]** **LINE 登入失敗並顯示 `auth/unauthorized-domain` 錯誤:** 雖然 `redirect_uri` 已正確導向 Netlify 域名，但登入流程未完成。
                - **根本原因:** `netlify.toml` 中的重新導向規則順序錯誤。通用的 SPA 規則 (`from = "/*"`) 被放置在 Firebase 代理規則 (`from = "/__/auth/*"`) 之前，導致代理規則從未被觸發。
                - **解決方案:** 調整 `netlify.toml`，將 Firebase 代理規則移至 SPA 規則之前，確保 `/__/auth/*` 的請求能被正確代理。
        - **[完成]** **AI 協作者已審閱專案日誌:** Gemini Code Assist 已閱讀並理解所有專案文件與當前任務。
        - **[進行中]** **更新 Firebase 控制台設定:** 在 Firebase Console 的「Authentication > Settings > Authorized domains」中，確保已加入您的 Netlify 主機域名。
        - **[進行中]** **驗證 Netlify 代理與環境變數設定:**
            - **[ ]** **確認 `netlify.toml` 中的 Firebase Project ID:** 檢查 `[[redirects]]` 規則中 `to = "https://<YOUR-PROJECT-ID>.firebaseapp.com/__/auth/:splat"` 的 `<YOUR-PROJECT-ID>` 是否與您的實際 Firebase 專案 ID 完全一致。目前設定為 `nail-62ea4`。
            - **[ ]** **確認 Netlify 環境變數 `VITE_FIREBASE_AUTH_DOMAIN`:** 檢查 Netlify 部署設定中的環境變數，確保 `VITE_FIREBASE_AUTH_DOMAIN` 已正確設定為 `treering83.netlify.app`。
        - **[完成]** **調整前端登入邏輯:**
            - 在 `src/lib/firebase.ts` 初始化時，使用 `initializeAuth` 並設定 `persistence` 為 `browserLocalPersistence`。 (此部分已在 `src/lib/firebase.ts` 中完成)
            - 在 `src/lib/socialAuth.ts` 中，調整登入策略：優先嘗試 `signInWithPopup`，若被瀏覽器攔截 (catch block)，則降級為 `signInWithRedirect`。 (已完成)

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

1.  **[核心修正] 解決 Google 登入時的 API 金鑰格式錯誤:**
    - **目標:** 解決因環境變數設定不當，導致 Google 登入請求失敗的問題。
    - **問題描述:** 瀏覽器控制台顯示 `GET https://identitytoolkit.googleapis.com/... 400 (Bad Request)` 錯誤。
    - **根本原因:** `.env` 檔案中的 `VITE_FIREBASE_API_KEY` 值包含了不應有的引號 (`"`) 和逗號 (`,`)，導致 Firebase SDK 發送了格式錯誤的 API 金鑰。
    - **解決方案:**
        - **[完成]** 修正 `.env` 檔案，移除所有環境變數值周圍的引號與結尾的逗號，確保其為純字串值。

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

## 9. 待辦事項與修復紀錄

1.  **建構客戶管理功能:**
    - **目標:** 建立一個管理員專用的客戶名單，並能為客戶新增備註。
    - **任務:**
        - **建立客戶列表頁面:**
            - **[完成]** 建立 `useAllUsers.ts` Hook，用於從 Firestore 的 `users` 集合中讀取所有使用者資料。
            - **[完成]** 建立 `src/pages/admin/CustomerListPage.tsx` 元件。
            - **[完成]** 在客戶列表頁面中，顯示所有客戶的名稱、Email、註冊時間等資訊。
        - **實作客戶備註功能:**
            - **[完成]** 修正 `CustomerListPage.tsx` 中因 `formatTimestamp` 工具函式不存在導致的匯入錯誤，已建立 `src/utils/formatTimestamp.ts`。
            - **[完成]** 更新 `src/types/user.ts` 以包含 `notes` 欄位。
            - **[完成]** 在客戶列表頁面 (`CustomerListPage.tsx`) 中，提供一個文字輸入框，讓管理員可以編輯並儲存客戶備註。
            - **[完成]** 在 Firestore 的 `users` 文件結構中新增一個 `notes` 欄位 (型別為 `string`)。
            - **[完成]** 在客戶管理頁面新增返回儀表板的導覽連結，並優化頁面佈局以符合後台整體風格。
            - **[完成]** 新增安全的權限變更功能，管理員可透過確認對話框提升或降級使用者權限。
        - **[完成]** **整合路由:** 在 `App.tsx` 中新增 `/admin/customers` 路由，並在管理員儀表板 (`AdminDashboard.tsx`) 中加入前往此頁面的連結。
        - **[完成]** **優化客戶管理頁面 RWD:** 引入卡片式佈局，使其在行動裝置上有更好的瀏覽體驗，並新增客戶搜尋功能。
    - **[已解決]** 根據使用者回報的錯誤訊息，`CustomerListPage.tsx` 目前位於 `src/pages/CustomerListPage.tsx`。請確保此檔案的實際位置與 `App.tsx` 中的路由設定 (`import CustomerListPage from './pages/CustomerListPage';`) 一致。若原意是放在 `src/pages/admin/` 下，則需調整 `App.tsx` 的匯入路徑。

1.  **開發營業時間設定功能:**
    - **目標:** 讓管理員能以日曆形式，彈性設定每一天的營業時間或公休日。 **[進行中]**
    - **任務:**
        - **[完成]** **設計資料模型:** 規劃一個新的 Firestore 集合 `businessHours`，並建立 `src/types/businessHours.ts` 型別定義。
        - **[完成]** **建立設定頁面:** 建立 `src/pages/admin/HoursSettingsPage.tsx` 頁面骨架。
        - **[完成]** **整合路由:** 在 `App.tsx` 與 `AdminDashboard.tsx` 中加入新頁面的路由與連結。
        - **[完成]** **整合日曆元件:** 引入 `react-day-picker`，並在 `HoursSettingsPage.tsx` 中實作日曆選擇、讀取及儲存每日營業時間至 Firestore 的功能。
        - **[完成]** **修正型別錯誤:** 調整 `businessHours.ts` 中的 `updatedAt` 型別，使其相容 `FieldValue`，解決 `serverTimestamp()` 造成的型別錯誤。
        - **[完成]** **解決 Firestore 400 錯誤 (權限問題):** 已指示使用者更新 Firestore 安全規則，允許管理員讀寫 `businessHours` 集合。
        - **[完成]** **修正 `businessHours` 讀取權限問題:** 調整 Firestore 安全規則，允許所有已登入使用者讀取 `businessHours` 集合，以解決非管理員使用者在預約頁面無法查看可預約時段的問題。
        - **[完成]** **修補 Firestore 安全漏洞:** 提供完整的 `firestore.rules` 檔案，修復了使用者可自我提升權限的漏洞，並修正了使用者無法查詢自身預約列表的錯誤。
        - **[完成]** **優化日曆顯示:** 在營業時間設定頁面的日曆上，以特殊樣式標示出所有「公休日」，提升視覺辨識度。
        - **[完成]** **更新預約邏輯:** 已根據使用者當前的程式碼版本，修改 `useAvailableSlots.ts` Hook，使其在計算可預約時段前，先讀取指定日期的 `businessHours` 設定，取代原有的固定營業時間。
        - **[完成]** **優化預約頁面:** 已根據使用者當前的程式碼版本，在 `BookingPage.tsx` 新增頁首與返回儀表板的導覽連結，提升使用者體驗。
        - **[完成]** **修正預約頁面語法錯誤:** 移除 `BookingPage.tsx` 中因複製貼上錯誤而產生的多餘程式碼，解決 `Unexpected token` 錯誤。
        - **[完成]** **優化預約日曆:** 在預約頁面的日曆 (`CalendarSelector.tsx`) 上標示出公休日，提升使用者體驗。
        - **[完成]** **解決權限變更 400 錯誤:** 更新 Firestore 安全規則，允許管理員修改其他使用者的 `role` 欄位，解決因權限不足導致的寫入失敗問題。

1.  **服務項目管理頁面優化:**
    - **目標:** 提升服務項目管理頁面的使用者體驗與響應式設計。
    - **任務:**
        - **[完成]** **優化服務列表 RWD:** 引入卡片式佈局，使其在行動裝置上有更好的瀏覽體驗。

1.  **建立預約行事曆檢視:**
    - **目標:** 在管理員後台以日曆形式呈現所有未來的預約，方便一覽行程。
    - **[完成]** **將行事曆設為主視覺:**
        - **整合 `react-big-calendar`:** 將行事曆元件直接整合到 `AdminDashboard.tsx` 中。
        - **取代列表視圖:** 使用行事曆取代了原有的預約列表，使其成為管理員儀表板的主要內容。
        - **移除冗餘頁面:** 刪除了原有的 `BookingCalendarPage.tsx` 及其路由，簡化了專案結構。
    - **[完成]** **增強行事曆功能:**
        - **啟用互動:** 為行事曆加入了狀態控制，使其導覽按鈕 (向前/向後/今天等) 可以正常運作。
        - **修正時長:** 確保行事曆上的預約事件能正確顯示其對應服務的時長。
        - **顯示公休日:** 在行事曆背景中標示出公休日，提升視覺辨識度。
        - **[完成]** **中文化 (i18n):** 修正 `react-big-calendar` 的設定，使其月份、星期等文字顯示為中文。
        - **[完成]** **禁用過去日期:** 在所有日期選擇器中（如營業時間設定、客戶預約），禁用今天之前的日期，防止誤操作。
        - **[完成]** **修正 TypeScript 型別錯誤:** 為 `dateFnsLocalizer` 的 `startOfWeek` 函式加上明確的型別，解決 `implicitly has an 'any' type` 的錯誤。
        - **[完成]** **修正行事曆視圖切換錯誤:** 為 `AdminDashboard.tsx` 中的 `view` 狀態提供明確的 `View` 型別，解決因型別推斷過於狹窄導致的 `onView` 屬性報錯問題。
        - **[完成]** **修正 `verbatimModuleSyntax` 型別匯入錯誤:** 將 `View` 型別的匯入方式改為 `import type`，以符合 TypeScript 的嚴格模組語法規則。
        - **[完成]** **優化儀表板頁首 UI/UX:** 調整 `AdminDashboard.tsx` 頁首佈局，使其在不同螢幕尺寸下（RWD）都有更好的視覺效果與操作體驗。
        - **[完成]** **優化行事曆 RWD:** 讓管理員儀表板的行事曆能根據螢幕寬度，自動切換為對行動裝置更友善的預設視圖（日視圖）。
        - **[完成]** **修正行事曆渲染錯誤:** 重構 `useAllBookings.ts` 的 `useEffect` 結構，確保 `onSnapshot` 監聽器能被正確清理，解決因非同步副作用導致的 `Cannot read properties of undefined (reading 'title')` 執行階段錯誤。
        - **[完成]** **修正預約時長顯示錯誤:** 已根據使用者當前的程式碼版本，更新 `useAllBookings.ts` Hook，使其在組合資料時能正確地將服務時長 (`serviceDuration`) 包含進來，解決了行事曆上所有預約都只顯示一小時的問題。

1.  **[已解決] 啟動錯誤：路徑別名解析失敗**
    - **目標:** 解決 `npm run dev` 時出現的 `Failed to resolve import "@/App"` 錯誤。
    - **問題描述:** 專案缺少 `vite.config.ts` 檔案，導致 Vite 無法識別 `@` 路徑別名。
    - **任務:**
        - **[完成]** 建立 `vite.config.ts` 檔案。
        - **[完成]** 在設定檔中新增 `resolve.alias` 選項，將 `@` 指向 `src` 目錄。

1.  **效能優化 (Performance Optimization):**
    - **目標:** 提升首頁載入體驗，避免背景圖片延遲出現。
    - **任務:**
        - **[完成]** **實作圖片預載入:** 在 `index.html` 中新增 `<link rel="preload" as="image" ...>` 標籤，指示瀏覽器在應用程式啟動初期就優先下載首頁的背景圖片（即使是外部 URL）。

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

1.  **服務項目管理功能擴充:**
    - **目標:** 讓管理員能夠刪除服務項目。
    - **任務:**
        - **[完成]** 在 `ServiceManagement.tsx` 中新增「刪除」按鈕。
        - **[完成]** 實作 `handleDeleteService` 函式，處理刪除確認提示並呼叫 Firebase `deleteDoc` 移除服務文件。
        - **[完成]** 確保刪除操作的載入狀態和錯誤處理。

1.  **擴充使用者角色系統:**
    - **目標:** 新增「白金會員」角色，並讓管理員可以自由設定使用者等級。
    - **任務:**
        - **[完成]** 更新 `src/types/user.ts`，在 `UserRole` 型別中加入 `platinum`。
        - **[完成]** 重構 `CustomerListPage.tsx`，將權限變更功能從彈出視窗改為更直覺的下拉選單，允許管理員將使用者設定為「管理員」、「一般會員」或「白金會員」。
        - **[完成]** **修正 `CustomerListPage.tsx` 執行階段錯誤:** 移除了舊版權限變更彈出視窗殘留的程式碼，解決了 `roleChangeTarget is not defined` 的錯誤。
        - **[完成]** **修正使用者角色 TypeScript 型別錯誤:** 更新 `src/types/user.ts` 中的 `UserDocument` 介面，使其 `role` 欄位正確使用 `UserRole` 聯合型別，解決了 `ts(2367)` 錯誤。
        - **[完成]** **優化客戶管理頁面 UI/UX:**
            - **[完成]** 在使用者列表的每一項左側新增了頭像顯示，並提供預設頭像。
            - **[完成]** 重新設計了行動裝置上的卡片視圖，使其包含更完整的客戶資訊（Email、註冊/登入時間等）。
            - **[完成]** 調整了行動版卡片的整體佈局與樣式，提升了視覺清晰度與專業感。

1.  **首頁服務項目優化:**
    - **目標:** 將首頁的服務項目改為三大分類，並移除圖片，使其連結至預約頁面。
    - **任務:**
        - **[完成]** 修改 `src/pages/Home.tsx` 中的 `services` 陣列為 `categories` 陣列，包含「美睫服務」、「霧眉服務」、「美甲服務」三大類。
        - **[完成]** 移除 `Home.tsx` 中服務項目的圖片顯示。
        - **[完成]** 更新分類連結，使其導向 `/booking?category=<分類名稱>`。

## 10. 待討論事項

- **金流串接細節:** 需要獲取綠界 (ECPay) 的測試商店 ID 與 API Key。
- **LINE Bot 憑證:** 需要申請 LINE Channel Secret 和 Channel Access Token 以進行後續整合。
- **UI/UX 設計稿:** 目前只有架構，尚無具體的 UI 設計稿，這會是下一步規劃的重點。

---
**日誌結束**
    - **目標:** 解決 `npm run dev` 時出現的 `Failed to resolve import "@/App"` 錯誤。
    - **問題描述:** 專案缺少 `vite.config.ts` 檔案，導致 Vite 無法識別 `@` 路徑別名。
    - **任務:**
        - **[完成]** 建立 `vite.config.ts` 檔案。
        - **[完成]** 在設定檔中新增 `resolve.alias` 選項，將 `@` 指向 `src` 目錄。

1.  **效能優化 (Performance Optimization):**
    - **目標:** 提升首頁載入體驗，避免背景圖片延遲出現。
    - **任務:**
        - **[完成]** **實作圖片預載入:** 在 `index.html` 中新增 `<link rel="preload" as="image" ...>` 標籤，指示瀏覽器在應用程式啟動初期就優先下載首頁的背景圖片（即使是外部 URL）。

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

1.  **服務項目管理功能擴充:**
    - **目標:** 讓管理員能夠刪除服務項目。
    - **任務:**
        - **[完成]** 在 `ServiceManagement.tsx` 中新增「刪除」按鈕。
        - **[完成]** 實作 `handleDeleteService` 函式，處理刪除確認提示並呼叫 Firebase `deleteDoc` 移除服務文件。
        - **[完成]** 確保刪除操作的載入狀態和錯誤處理。

## 10. 待討論事項

- **金流串接細節:** 需要獲取綠界 (ECPay) 的測試商店 ID 與 API Key。
- **LINE Bot 憑證:** 需要申請 LINE Channel Secret 和 Channel Access Token 以進行後續整合。
- **UI/UX 設計稿:** 目前只有架構，尚無具體的 UI 設計稿，這會是下一步規劃的重點。

---
**日誌結束**
    - **目標:** 解決 `npm run dev` 時出現的 `Failed to resolve import "@/App"` 錯誤。
    - **問題描述:** 專案缺少 `vite.config.ts` 檔案，導致 Vite 無法識別 `@` 路徑別名。
    - **解決方案:**
    - **任務:**
        - **[完成]** 建立 `vite.config.ts` 檔案。
        - **[完成]** 在設定檔中新增 `resolve.alias` 選項，將 `@` 指向 `src` 目錄。

1.  **效能優化 (Performance Optimization):**
    - **目標:** 提升首頁載入體驗，避免背景圖片延遲出現。
    - **任務:**
        - **[完成]** **實作圖片預載入:** 在 `index.html` 中新增 `<link rel="preload" as="image" ...>` 標籤，指示瀏覽器在應用程式啟動初期就優先下載首頁的背景圖片（即使是外部 URL）。

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

## 10. 待討論事項

- **金流串接細節:** 需要獲取綠界 (ECPay) 的測試商店 ID 與 API Key。
- **LINE Bot 憑證:** 需要申請 LINE Channel Secret 和 Channel Access Token 以進行後續整合。
- **UI/UX 設計稿:** 目前只有架構，尚無具體的 UI 設計稿，這會是下一步規劃的重點。

---
**日誌結束**
