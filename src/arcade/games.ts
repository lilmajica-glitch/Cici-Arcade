export const games = [
  {
    id: 'math',
    name: 'Cici 小博士',
    subtitle: '疯狂博士大作战',
    category: '数学 · 音乐街机',
    description: '把答案喂给大舌头出题机，让失控机器反击疯狂博士。',
    detail: '20 道加减法 · 不限时 · 答错可以再试',
    controls: '点击数字或使用数字键；两位数先输入十位，再输入个位。',
    path: '/games/math',
    source: '/play/math/',
  },
  {
    id: 'neon',
    name: 'Neon Word Runner',
    subtitle: '霓虹单词跑酷',
    category: '英语 · 城市跑酷',
    description: '穿过霓虹城市，在单词闸门前选择答案，跑出你的连击。',
    detail: '12 道单词题 · 85 秒一局 · 三选一',
    controls: '用 A / S / D、方向键或 1 / 2 / 3 选择答案，也可以点击闸门。',
    path: '/games/neon',
    source: '/play/neon/',
  },
] as const

export type ArcadeGame = typeof games[number]
