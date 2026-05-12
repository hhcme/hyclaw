import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/main.css'

// Set initial theme before render to prevent flash
const stored = localStorage.getItem('theme') || 'dark'
const isDark =
  stored === 'dark' ||
  (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.classList.toggle('dark', isDark)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
