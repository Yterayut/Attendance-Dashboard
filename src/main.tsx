import React from 'react'
import ReactDOM from 'react-dom/client'

// 1) Tailwind directives (@tailwind base/components/utilities)
import './index.css'

// 2) สไตล์จาก Figma ที่ใช้ @layer
import './figma/styles/globals.css'

import AttendanceDashboard from './components/AttendanceDashboard'
import ThemeLab from './ThemeLab'
import { ThemeProvider } from './contexts/ThemeContext'

const url = new URL(window.location.href)
const isThemeLab = url.hash.includes('theme-lab') || url.searchParams.get('lab') === '1'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      {isThemeLab ? <ThemeLab /> : <AttendanceDashboard />}
    </ThemeProvider>
  </React.StrictMode>
)
