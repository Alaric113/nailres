# 專案日誌 (Project Log) - 美甲店預約管理系統 (AI輔助開發版)

**文件版本:** 1.1
**最後更新:** 2024-05-21
**主要貢獻者:** Gemini Code Assist

## 1. 專案概述

collections/
├── users/                         # 用戶資料
│   ├── uid: {
│   │   email: string,
│   │   profile: object,
│   │   createdAt: timestamp,
│   │   lastLogin: timestamp
│   └── }
├── bookings/                      # 預約記錄
│   ├── bookingId: {
│   │   userId: string,
│   │   serviceId: string,
│   │   dateTime: timestamp,
│   │   status: string,
│   │   amount: number,
│   │   paymentStatus: string
│   └── }
├── services/                      # 服務項目
│   ├── serviceId: {
│   │   name: string,
│   │   price: number,
│   │   duration: number,
│   │   category: string,
│   │   available: boolean
│   └── }
├── members/                       # 會員資料
│   ├── userId: {
│   │   points: number,
│   │   level: string,
│   │   totalSpent: number,
│   │   joinDate: timestamp
│   └── }
├── payments/                      # 支付記錄
│   └── paymentId: {
│       bookingId: string,
│       amount: number,
│       method: string,
│       status: string,
│       createdAt: timestamp
│   }
└── schedules/                     # 排程管理
    └── date: {
        availableSlots: array,
        bookedSlots: array,
        staffSchedule: object
    }


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
- **[完成]** 優化了 `useAvailableSlots.ts`，使其能根據現有預約的實際服務時長進行精確的時段計算。

## 6. 下一步行動 (Action Items for Next Engineer)

歡迎加入！以下是您可以立即開始的任務：

1.  **建立預約歷史頁面:**
    - 建立 `BookingHistoryPage.tsx` 頁面，用於顯示當前登入使用者的所有預約記錄。
    - 建立一個 `useBookings.ts` Hook，負責從 Firestore 讀取 `userId` 為當前使用者的預約列表。
    - 在 `App.tsx` 中新增 `/history` 路由，並在 `Dashboard.tsx` 中加入一個連結到該頁面的按鈕。

## 7. 待討論事項

- **金流串接細節:** 需要獲取綠界 (ECPay) 的測試商店 ID 與 API Key。
- **LINE Bot 憑證:** 需要申請 LINE Channel Secret 和 Channel Access Token 以進行後續整合。
- **UI/UX 設計稿:** 目前只有架構，尚無具體的 UI 設計稿，這會是下一步規劃的重點。

---
**日誌結束**
