import { useRef } from 'react'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import { gsap, useGSAP } from './motion'
import type { ReactNode } from 'react'

type Props = {
  href: string
  children: ReactNode
  variant?: 'blue' | 'white' | 'quiet'
  className?: string
  diagonal?: boolean
  onClick?: () => void
}

export function MotionLink({ href, children, variant = 'blue', className = '', diagonal = false, onClick }: Props) {
  const link = useRef<HTMLAnchorElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const element = link.current
      const content = element?.querySelector('.button-content')
      if (!element || !content) return
      const x = gsap.quickTo(content, 'x', { duration: 0.35, ease: 'power3.out' })
      const y = gsap.quickTo(content, 'y', { duration: 0.35, ease: 'power3.out' })
      const move = (event: PointerEvent) => {
        const box = element.getBoundingClientRect()
        x((event.clientX - box.left - box.width / 2) * 0.09)
        y((event.clientY - box.top - box.height / 2) * 0.12)
      }
      const leave = () => { x(0); y(0) }
      element.addEventListener('pointermove', move)
      element.addEventListener('pointerleave', leave)
      return () => {
        element.removeEventListener('pointermove', move)
        element.removeEventListener('pointerleave', leave)
      }
    })
    return () => media.revert()
  }, { scope: link })

  const Arrow = diagonal ? ArrowUpRight : ArrowRight
  return <a ref={link} href={href} onClick={onClick} className={'arcade-button button-' + variant + ' ' + className}>
    <span className="button-content"><span>{children}</span><Arrow size={20} weight="bold" aria-hidden="true" /></span>
  </a>
}
