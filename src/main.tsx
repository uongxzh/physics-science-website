import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Sentry 错误监控（替换 YOUR_SENTRY_DSN）
// import * as Sentry from '@sentry/browser'
// Sentry.init({
//   dsn: 'YOUR_SENTRY_DSN',
//   tracesSampleRate: 0.1,
//   beforeSend(event) {
//     if (event.exception?.values?.[0]?.stacktrace?.frames?.some(f =>
//       f.filename?.includes('chrome-extension') ||
//       f.filename?.includes('safari-extension')
//     )) {
//       return null
//     }
//     return event
//   },
// })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
