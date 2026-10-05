import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ArcadeApp from './ArcadeApp'
import './arcade.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/noto-sans-sc'
import './site.css'
import './home.css'
import './activity.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><ArcadeApp /></StrictMode>,
)
