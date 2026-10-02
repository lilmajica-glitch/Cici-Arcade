export type Operator = '+' | '-'

export type Question = Readonly<{
  left: number
  right: number
  operator: Operator
  answer: number
}>

export type RandomSource = () => number
