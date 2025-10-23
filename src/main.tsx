import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../index.css' // <-- 重新啟用本地 CSS 引入

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)