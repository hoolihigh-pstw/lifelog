export function pad(n) { return String(n).padStart(2, '0') }

// 以「本地時間」產生 YYYY-MM-DD，避免時區跨日
export function toKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() { return toKey(new Date()) }

export function addDays(key, n) {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function formatLong(key) {
  const d = fromKey(key)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 週${WEEKDAYS[d.getDay()]}`
}

export function formatShort(key) {
  const d = fromKey(key)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// 回傳某月日曆格子（含前後補齊的空格）
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first.getDay(); i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toKey(new Date(year, month, d)))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
