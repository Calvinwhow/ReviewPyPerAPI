import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadConfig } from './hooks/useConfig'
import type { AppConfig } from './hooks/useConfig'

loadConfig().then((config: AppConfig) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App config={config} />
    </StrictMode>,
  )
}).catch((err) => {
  document.getElementById('root')!.innerHTML =
    `<div style="padding:2rem;color:red;font-family:monospace">
      <h2>Failed to load config.json</h2>
      <pre>${err.message}</pre>
    </div>`
})
