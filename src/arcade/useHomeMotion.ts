import { gsap, ScrollTrigger, useGSAP } from './motion'
import type { RefObject } from 'react'

export function useHomeMotion(root: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add({
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 1000px)',
      pointer: '(hover: hover) and (pointer: fine)',
    }, (context) => {
      if (!context.conditions?.motion || !root.current) return
      const scope = root.current
      const hero = scope.querySelector<HTMLElement>('.home-hero')
      const reactor = scope.querySelector<HTMLElement>('.mascot-reactor')
      const float = scope.querySelector<HTMLElement>('.mascot-float')
      const cleanup: (() => void)[] = []

      gsap.from('.hero-copy > *', { y: 30, opacity: 0, duration: 0.9, stagger: 0.11, ease: 'power3.out' })
      gsap.from('.mascot-entrance', { y: 36, scale: 0.82, opacity: 0, duration: 1.2, delay: 0.22, ease: 'back.out(1.3)' })
      if (float && hero) {
        const floating = gsap.to(float, { y: -12, rotation: 1.8, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (trigger) => { if (trigger.isActive) floating.resume(); else floating.pause() } })
        gsap.to('.mascot-scroll', { y: 40, scale: 0.86, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.7 } })
      }

      if (context.conditions.pointer && hero && reactor) {
        const x = gsap.quickTo(reactor, 'x', { duration: 0.65, ease: 'power3.out' })
        const rotate = gsap.quickTo(reactor, 'rotation', { duration: 0.65, ease: 'power3.out' })
        const move = (event: PointerEvent) => {
          const bounds = hero.getBoundingClientRect()
          const ratio = (event.clientX - bounds.left) / bounds.width - 0.5
          x(ratio * 25)
          rotate(ratio * 7)
        }
        const leave = () => { x(0); rotate(0) }
        hero.addEventListener('pointermove', move)
        hero.addEventListener('pointerleave', leave)
        cleanup.push(() => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave) })
      }

      scope.querySelectorAll<HTMLElement>('.game-media').forEach((image) => {
        gsap.timeline({ scrollTrigger: { trigger: image, start: 'top 98%', end: 'bottom top', scrub: 0.5 } })
          .fromTo(image, { scale: 0.8, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power1.out' })
          .to(image, { opacity: 1, duration: 0.45 })
          .to(image, { opacity: 0.2, duration: 0.2 })
      })
      scope.querySelectorAll<HTMLElement>('[data-reveal]').forEach((section) => {
        gsap.from(section, { y: 32, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 92%', once: true } })
      })

      if (context.conditions.desktop) {
        const learning = scope.querySelector<HTMLElement>('.learning-section')
        const intro = scope.querySelector<HTMLElement>('.learning-pin')
        if (learning && intro) {
          ScrollTrigger.create({
            trigger: learning,
            start: 'top 128px',
            end: () => '+=' + Math.max(0, learning.offsetHeight - intro.offsetHeight - 20),
            pin: intro,
            pinSpacing: false,
            invalidateOnRefresh: true,
          })
        }
      }

      gsap.to('.reading-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: scope, start: 'top top', end: 'bottom bottom', scrub: 0.2 } })
      let alive = true
      document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh() })
      return () => { alive = false; cleanup.forEach((dispose) => dispose()) }
    })
    return () => media.revert()
  }, { scope: root })
}
