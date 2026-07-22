import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext.jsx'

const RootHomepage = lazy(() => import('./pages/RootHomepage.jsx'))
const Privacy = lazy(() => import('./pages/Privacy.jsx'))
const Terms = lazy(() => import('./pages/Terms.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Install = lazy(() => import('./pages/Install.jsx'))
const MarketingLanding = lazy(() => import('./pages/MarketingLanding.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <Router>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-slate-700" role="status">正在准备页面…</div>}>
          <Routes>
            <Route path="/" element={<RootHomepage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/install" element={<Install />} />
            <Route path="/global/zh-cn" element={<MarketingLanding locale="zh-cn" />} />
            <Route path="/global/zh-tw" element={<MarketingLanding locale="zh-tw" />} />
          </Routes>
        </Suspense>
      </Router>
    </LanguageProvider>
  </StrictMode>,
)
