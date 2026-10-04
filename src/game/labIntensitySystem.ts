import { musicProgression } from '../audio/progression'

export interface LabIntensity {
  stage: number
  bubbleCount: number
  lightIntensity: number
  chemicalActivity: number
  electricEffect: boolean
  chaosLevel: 'calm' | 'active' | 'festival'
}

export function getLabIntensity(questionIndex: number, combo: number): LabIntensity {
  const stage = musicProgression(questionIndex).stage

  return {
    stage,
    bubbleCount: Math.min(8, 2 + stage),
    lightIntensity: stage / 6,
    chemicalActivity: combo > 0 ? 0.3 + combo * 0.1 : 0,
    electricEffect: stage >= 4,
    chaosLevel: stage >= 5 ? 'festival' : stage >= 3 ? 'active' : 'calm'
  }
}
