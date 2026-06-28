import React from 'react'
import ReactDOM from 'react-dom/client'
import { APP_CONFIG } from './config/app'
import { App } from './App'
import 'lxgw-wenkai-webfont/style.css'
import './styles/main.css'

document.title = APP_CONFIG.TITLE

const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || document.createElement('link')
favicon.rel = 'icon'
favicon.href = `${import.meta.env.BASE_URL}favicon.ico`
document.head.appendChild(favicon)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
