export function screenPunch(element: HTMLElement, intensity: number) {
  const force = 1.5 + intensity * 2
  return element.animate([
    { transform: 'translate(0, 0) scale(1)', offset: 0 },
    { transform: `translate(${-force}px, -1px) scale(.994)`, offset: 0.12 },
    { transform: `translate(${force}px, 1px) scale(1.003)`, offset: 0.3 },
    { transform: 'translate(-1px, 0) scale(1.004)', offset: 0.55 },
    { transform: 'translate(0, 0) scale(1)', offset: 1 },
  ], { duration: 280, easing: 'ease-out' })
}

export function softShake(element: HTMLElement) {
  return element.animate([
    { transform: 'translateX(0)' }, { transform: 'translateX(-3px)' },
    { transform: 'translateX(3px)' }, { transform: 'translateX(-1px)' },
    { transform: 'translateX(0)' },
  ], { duration: 240, easing: 'ease-out' })
}
