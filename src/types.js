// 紀錄類型：每一種有自己的顏色、圖示、以及「數值」欄位的說明
export const TYPES = {
  exercise:   { label: '運動',  emoji: '🏋️', color: '#d9573b', metric: '次數 / 分鐘', hint: '例如：吊單槓 8 下' },
  food:       { label: '飲食',  emoji: '🍚', color: '#c9941c', metric: '',           hint: '吃了什麼？之後身體感覺如何？' },
  reading:    { label: '閱讀',  emoji: '📖', color: '#2f5d9e', metric: '頁數',       hint: '書名、重點、心得' },
  reflection: { label: '感悟',  emoji: '✨', color: '#7a4d9b', metric: '',           hint: '今天想到了什麼？' },
  habit:      { label: '習慣',  emoji: '✅', color: '#3a7d5c', metric: '數量',       hint: '任何你想每天持續的事' },
  other:      { label: '其他',  emoji: '📌', color: '#5f6b7a', metric: '',           hint: '任何值得記下的事' },
}

export const TYPE_KEYS = Object.keys(TYPES)

export function typeOf(key) {
  return TYPES[key] || TYPES.other
}
