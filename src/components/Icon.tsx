type IconName = 'sound' | 'mute' | 'motion' | 'arrow' | 'erase' | 'check' | 'star' | 'flask' | 'note' | 'bolt'

const paths: Record<IconName, React.ReactNode> = {
  sound: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 8q5 4 0 8m3-11q8 7 0 14" /></>,
  mute: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m16 9 5 6m0-6-5 6" /></>,
  motion: <><path d="M4 16C3 5 13 3 21 4c0 10-5 16-12 15m-5 2L16 9" /><path d="m10 15-1-5m5 1h5" /></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  erase: <><path d="M9 5h12v14H9l-7-7 7-7Z" /><path d="m12 9 6 6m0-6-6 6" /></>,
  check: <path d="m4 12 5 5L20 6" />,
  star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />,
  flask: <><path d="M9 3h6M10 3v7L5 18q-2 3 2 3h10q4 0 2-3l-5-8V3M8 15h8" /><circle cx="11" cy="18" r=".5" /></>,
  note: <><path d="M9 17V5l11-2v12M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></>,
  bolt: <path d="m13 2-8 12h6l-1 8 9-12h-7l1-8Z" />,
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
