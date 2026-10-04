type Particle = {
  x: number; y: number; vx: number; vy: number; rotation: number; spin: number
  age: number; life: number; size: number; color: string;
  type: 'confetti' | 'star' | 'bubble' | 'spark'
}

const COLORS = ['#ed9b87', '#efc26e', '#86bfb4', '#90bad9', '#b7a3d4', '#fffdf2']
const LAB_COLORS = ['#38BDF8', '#6EE7B7', '#3B6DFF', '#E9A568']
const MAX_PARTICLES = 96

/** A bounded, on-demand canvas loop. It is idle between feedback bursts. */
export class ParticleSystem {
  private context: CanvasRenderingContext2D | null
  private particles: Particle[] = []
  private frame = 0
  private lastTime = 0
  private width = 0
  private height = 0
  private dpr = 1
  private observer: ResizeObserver

  constructor(private canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d')
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.resize()
  }

  private resize() {
    const bounds = this.canvas.getBoundingClientRect()
    this.width = bounds.width
    this.height = bounds.height
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
  }

  burst(combo: number, victory = false) {
    if (!this.context) return
    const stage = victory ? 6 : Math.min(6, 1 + Math.floor(combo / 3))
    const count = victory ? 120 : Math.min(72, 24 + combo * 3)

    // Determine particle types based on stage
    const useLabParticles = stage >= 3
    const colors = useLabParticles ? [...COLORS, ...LAB_COLORS] : COLORS

    for (let i = 0; i < count; i++) {
      const angle = victory ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4
      const speed = (victory ? 330 : 220) * (0.55 + Math.random() * 0.6)

      let particleType: Particle['type'] = 'confetti'
      if (stage >= 5 && Math.random() < 0.3) {
        particleType = Math.random() < 0.5 ? 'spark' : 'bubble'
      } else if (stage >= 3 && Math.random() < 0.2) {
        particleType = 'bubble'
      } else if (i % 4 === 0) {
        particleType = 'star'
      }

      this.particles.push({
        x: this.width * 0.5, y: this.height * (victory ? 0.29 : 0.22),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 45,
        rotation: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 9,
        age: 0, life: victory ? 2.5 : 0.8 + Math.random() * 0.5,
        size: 3 + Math.random() * 3, color: colors[Math.floor(Math.random() * colors.length)],
        type: particleType
      })
    }
    if (this.particles.length > MAX_PARTICLES) this.particles.splice(0, this.particles.length - MAX_PARTICLES)
    if (!this.frame) { this.lastTime = performance.now(); this.frame = requestAnimationFrame(this.update) }
  }

  private update = (time: number) => {
    const context = this.context
    if (!context) return
    const dt = Math.min(0.04, Math.max(0, (time - this.lastTime) / 1000))
    this.lastTime = time
    context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    context.clearRect(0, 0, this.width, this.height)
    let alive = 0
    for (const particle of this.particles) {
      particle.age += dt
      if (particle.age >= particle.life) continue
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt

      // Different gravity for different particle types
      if (particle.type === 'bubble') {
        particle.vy -= 180 * dt // Bubbles float up
      } else if (particle.type === 'spark') {
        particle.vy += 50 * dt // Sparks have minimal gravity
      } else {
        particle.vy += 340 * dt // Normal gravity
      }

      particle.rotation += particle.spin * dt
      context.save()
      context.translate(particle.x, particle.y)
      context.rotate(particle.rotation)
      context.globalAlpha = Math.min(1, (particle.life - particle.age) / 0.25)
      context.fillStyle = particle.color

      if (particle.type === 'star') {
        context.beginPath()
        for (let point = 0; point < 10; point++) {
          const radius = (point % 2 ? 0.45 : 1.2) * particle.size
          const angle = point * Math.PI / 5 - Math.PI / 2
          context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
        }
        context.closePath()
        context.fill()
      } else if (particle.type === 'bubble') {
        context.beginPath()
        context.arc(0, 0, particle.size, 0, Math.PI * 2)
        context.globalAlpha *= 0.6
        context.fill()
        context.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        context.lineWidth = 1
        context.stroke()
      } else if (particle.type === 'spark') {
        // Electric spark - line with glow
        context.shadowBlur = 8
        context.shadowColor = particle.color
        context.lineWidth = particle.size * 0.5
        context.strokeStyle = particle.color
        context.beginPath()
        context.moveTo(-particle.size, 0)
        context.lineTo(particle.size, 0)
        context.stroke()
        context.shadowBlur = 0
      } else {
        // Confetti rectangle
        context.fillRect(-particle.size, -particle.size / 2, particle.size * 2, particle.size)
      }

      context.restore()
      this.particles[alive++] = particle
    }
    this.particles.length = alive
    this.frame = alive ? requestAnimationFrame(this.update) : 0
    if (!alive) context.clearRect(0, 0, this.width, this.height)
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.frame = 0
    this.particles = []
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.observer.disconnect()
  }
}
