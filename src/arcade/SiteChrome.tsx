import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, List, X } from '@phosphor-icons/react'
import { MotionLink } from './MotionLink'

export function Brand({ light = false }: { light?: boolean }) {
  return <a className={'site-brand' + (light ? ' brand-light' : '')} href="/" aria-label="CiciArcade 首页">
    <img src="/assets/arcade/cici-mascot.png" alt="" width="48" height="48" />
    <span>Cici<span>Arcade</span></span>
  </a>
}

export function SiteHeader({ home, playing }: { home: boolean; playing: boolean }) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 48)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() }
    }
    const onPointer = (event: PointerEvent) => {
      if (header.current && !header.current.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  const solid = !home || scrolled || menuOpen
  const light = playing || !solid
  const close = () => setMenuOpen(false)
  return <header ref={header} className={'site-header' + (solid ? ' header-solid' : '') + (playing ? ' header-playing' : '')}>
    <div className="page-width header-inner">
      <Brand light={light} />
      <nav className="desktop-nav" aria-label="主导航">
        <a href="/games" aria-current={!home ? 'page' : undefined}>游戏大厅</a>
        <a href="/#learning">学习方式</a>
        <a href="/#daily-checkin">每日打卡</a>
      </nav>
      <div className="header-actions">
        <MotionLink href={home ? '#games' : '/games'} variant={light ? 'white' : 'blue'} className="header-cta">进入游戏大厅</MotionLink>
        <button ref={menuButton} className="menu-toggle" type="button" aria-label={menuOpen ? '关闭导航' : '打开导航'}
          aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>
    </div>
    {menuOpen && <nav id="mobile-navigation" className="mobile-nav page-width" aria-label="手机导航">
      <a href="/" onClick={close}>首页 <ArrowUpRight size={18} /></a>
      <a href="/games" onClick={close}>游戏大厅 <ArrowUpRight size={18} /></a>
      <a href="/#learning" onClick={close}>学习方式 <ArrowUpRight size={18} /></a>
      <a href="/#daily-checkin" onClick={close}>每日打卡 <ArrowUpRight size={18} /></a>
    </nav>}
  </header>
}

export function SiteFooter() {
  return <footer className="site-footer page-width">
    <Brand />
    <p>保持好奇，继续开玩。</p>
    <nav aria-label="页尾导航"><a href="/games">游戏大厅</a><a href="/#daily-checkin">每日打卡</a><a href="/#learning">学习方式</a></nav>
  </footer>
}
