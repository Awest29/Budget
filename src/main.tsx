import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './design-system.css'
// import './theme.css' // Disabled dark theme
import './light-theme-fixed.css' // Enable fixed light theme

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)