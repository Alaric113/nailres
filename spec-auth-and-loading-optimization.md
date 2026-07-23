# 規格：LIFF 登入流程與頁面載入速度優化

## Problem Statement

目前在 LINE LIFF 環境下開啟網站的流程過長且緩慢。使用者從點擊 LIFF 連結到看到預約頁面需要 10-15 秒，且經歷 2-3 次頁面跳轉。此外，一般網頁載入時，整個應用程式會等待 Firebase Auth 初始化完成才顯示內容，造成每次造訪都有明顯的載入延遲。

具體問題：
1. **LIFF 登入流程太多跳轉**：從 LIFF 連結打開 → 經過 `useAuth()` 初始化 → `ProtectedRoute` 導到 `/login` → `Login` 導到 `/liff?redirect=` → `LiffEntry` 才開始真正的 LIFF 驗證流程
2. **整頁封鎖 auth 初始化**：`RootLayout` 在 `authIsLoading` 為 `true` 時只顯示 loading spinner，不渲染任何頁面內容
3. **多餘的 `getRedirectResult()` 呼叫**：每次頁面重整都呼叫，即使不是在 redirect 登入流程中
4. **前端與後端重複建立使用者**：`useAuth.ts` 和 `line-liff-auth.ts` 都包含建立使用者文件的邏輯

## Solution

### 方案 A：減少 LIFF 登入流程的跳轉次數

將 LIFF 登入流程的路由簡化，讓 `LiffEntry` 可以直接處理登入，不經過 `/login` 頁面。

**改動方向：**
- 讓 LIFF 連結可以直接對應到 `LiffEntry` 組件，不經過 `ProtectedRoute` 的保護
- 當 `LiffEntry` 偵測到使用者已登入時，直接導向目標頁面而非 `/login`
- 移除 `Login.tsx` 中針對 LIFF 瀏覽器的 `navigate('/liff')` 邏輯（因為 LIFF 用戶不該看到 Login 頁面）

### 方案 D：不要等 auth 完成才顯示頁面

讓 `RootLayout` 在 auth 初始化期間就先顯示基本的 UI 骨架，而不是全頁 loading。

**改動方向：**
- 將 `authIsLoading` 的檢查從 `RootLayout` 的阻擋條件改為非阻擋條件
- `RootLayout` 立即渲染 `Outlet`，但可以傳遞一個「auth 尚未準備好」的狀態
- 需要 auth 的子頁面（如 `ProtectedRoute`）自行處理 loading 狀態
- 不需要 auth 的頁面（如首頁、作品集）可以直接渲染

## User Stories

1. 作為一個 LINE 使用者，當我點擊 LIFF 連結時，我希望在 5 秒內看到頁面內容，而不是等待 10-15 秒的跳轉流程
2. 作為一個 LINE 使用者，當我打開網站時，我希望立刻看到頁面骨架或背景，而不是全白 loading 畫面
3. 作為一個首次使用的 LINE 使用者，我希望登入流程順暢且不要有多次頁面跳轉
4. 作為一個已登入的 LINE 使用者，當我再次點擊 LIFF 連結時，我希望自動登入而不需要重新認證
5. 作為一個訪客，當我瀏覽首頁或作品集時，我不需要等待登入狀態確認就能看到內容

## Implementation Decisions

### 1. 路由結構調整（方案 A）

**修改 `App.tsx` 的路由定義：**
- 將 `/liff` 路由從 `UserLayout` 的 ProtectedRoute 保護中移出，放到與 `UserLayout` 同層級的直接路徑
- LIFF 連結的目標路徑可以直接透過 URL parameter 傳遞到 `LiffEntry`

```tsx
// 現狀：/liff 被包在 UserLayout > ProtectedRoute 內
// 修改為：/liff 與 UserLayout 同層級，不經過 ProtectedRoute
{
  path: 'liff',
  element: <LiffEntry />, // 不受 ProtectedRoute 保護
}
```

**修改 `Login.tsx`：**
- 移除 `isLiffBrowser()` 判斷中的 `navigate('/liff?redirect=...')` 邏輯
- LIFF 瀏覽器中的登入按鈕應直接觸發 LIFF 登入流程，而非導向另一個頁面

### 2. 解除 RootLayout 的 auth 封鎖（方案 D）

**修改 `App.tsx` 的 `RootLayout`：**
- 移除 `if (authIsLoading || isCheckingRedirect)` 阻擋條件
- 改成 `useEffect` 監聽狀態變化，但不阻擋渲染

```tsx
function RootLayout() {
  const { isCheckingRedirect } = useAuth();
  const { authIsLoading } = useAuthStore();
  useNotification();

  // 不再阻擋渲染，直接顯示 Outlet
  return (
    <ToastProvider>
      <PwaUpdatePrompt />
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner size='lg' fullScreen />}>
        <Outlet />
      </Suspense>
    </ToastProvider>
  );
}
```

**修改 `RootRedirect`：**
- 處理 auth 尚未載入完成的情況（currentUser 為 null，但 authIsLoading 為 true）
- 在 auth 載入完成前，顯示 LandingPage 或輕量 loading

```tsx
const RootRedirect = () => {
  const { currentUser, userProfile, authIsLoading } = useAuthStore();

  // Auth 還沒準備好時，先顯示 LandingPage（不需要登入的頁面）
  if (!currentUser) {
    if (authIsLoading) {
      return <LandingPage />; // 或輕量 skeleton
    }
    return <LandingPage />;
  }
  // ... 登入後的導向邏輯
};
```

### 3. 移除多餘的 getRedirectResult 調用

**修改 `useAuth.ts`：**
- `getRedirectResult(auth)` 僅在確認為 redirect 登入流程時才需要調用
- 可以透過檢查 URL query parameters 或 localStorage flag 來決定是否需要呼叫
- 或者將 `getRedirectResult` 移到 `Login.tsx` 中處理，只在 login 頁面呼叫

### 4. 統一使用者建立邏輯

**目前狀態：**
- `useAuth.ts`（前端 hook）和 `line-liff-auth.ts`（後端 function）都包含建立使用者的邏輯

**改動方向：**
- 以後端（`line-liff-auth.ts`）作為使用者建立的主要來源
- 前端 `useAuth.ts` 僅負責監聽 auth 狀態和 profile 的 onSnapshot，不再執行 `createUserProfile`

### 5. 快取 Firebase auth 狀態

**說明：** Firebase Auth 已設定 `browserLocalPersistence`，理論上應能跨頁面保留登入狀態。但在 LIFF 環境中，每次開啟 LIFF 連結可能是新的瀏覽器上下文，導致 persistence 無法作用。

**方案：** 在 `LiffEntry.tsx` 中，於 `signInWithCustomToken` 成功後，將自訂 token 或使用者的 UID 存入 `sessionStorage`。當 LIFF 連結在短時間內再次開啟時，可直接使用快取的 token 跳過完整的 LINE 驗證流程。

## Testing Decisions

### 測試策略

- **手動測試為主**：由於涉及 LINE LIFF 環境和 OAuth 流程，自動化測試難以模擬真實情境
- **測試場景**：
  1. LINE LIFF 環境中開啟連結 → 驗證登入流程是否順暢且跳轉次數減少
  2. 一般瀏覽器中造訪網站 → 驗證首頁是否立即顯示而非等待 auth
  3. 已登入狀態下再次開啟 LIFF → 驗證是否自動登入
  4. 首次使用的使用者 → 驗證是否正確建立使用者文件
  5. 網路慢的環境 → 驗證 UI 是否正確顯示 skeleton 而非空白頁面

### 現有測試縫隙

- TypeScript 編譯檢查（`tsc -b`）：確保修改後無型別錯誤
- ESLint（`eslint .`）：確保遵循程式碼規範
- Vite build（`vite build`）：確保構建成功

## Out of Scope

- 圖片載入優化（WebP、lazy loading 等）
- 程式碼分割與 bundle 大小優化
- 預約流程的進度條恢復
- 安全漏洞修復
- 優惠券/集點功能的前台整合
- Firebase Firestore 查詢優化（如避免 N+1 query）

## Further Notes

- 方案 A 和 D 可獨立實作，建議先做方案 D（解除 auth 封鎖），效果立即且風險低
- 方案 A 需要較謹慎的路由調整，建議在方案 D 之後進行
- LIFF 模擬模式（`?liff_mock=true`）可用於開發環境測試，不需實際在 LINE 中測試
- Firebase `browserLocalPersistence` 在現代瀏覽器中的行為可能因 ITP（Intelligent Tracking Prevention）而異，需要實際在 iOS Safari/LINE 瀏覽器中驗證
