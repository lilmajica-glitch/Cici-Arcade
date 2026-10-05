import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ArcadeApp from './ArcadeApp'
import './arcade.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><ArcadeApp /></StrictMode>,
)
