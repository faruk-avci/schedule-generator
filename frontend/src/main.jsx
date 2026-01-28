import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './analytics';
import App from './App.jsx'

// Apply 90% zoom for Windows users to fix display scaling differences
if (navigator.userAgent.includes('Windows')) {
  document.body.style.zoom = '0.9';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
