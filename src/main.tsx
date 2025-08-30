import React from 'react'
import ReactDOM from 'react-dom/client'

// 1) Tailwind directives (@tailwind base/components/utilities)
import './index.css'

// 2) สไตล์จาก Figma ที่ใช้ @layer
import './figma/styles/globals.css'

import AttendanceDashboard from './components/AttendanceDashboard'
import { ThemeProvider } from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AttendanceDashboard />
    </ThemeProvider>
  </React.StrictMode>
)
