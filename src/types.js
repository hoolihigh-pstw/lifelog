// 分類現在存在資料庫（categories 表），每個使用者可以自由增刪改。
// 這裡只保留「預設分類」（第一次登入時自動建立）以及共用的工具函式。

// mode：none = 純文字 / count = 有數值（次數、頁數…）/ money = 記帳（金額、收支）
export const DEFAULT_CATEGORIES = [
  { key: 'exercise',   label: '運動', emoji: '🏋️', color: '#d9573b', mode: 'count', unit: '下', hint: '例如：吊單槓 8 下' },
  { key: 'food',       label: '飲食', emoji: '🍚', color: '#c9941c', mode: 'none',  unit: '',   hint: '吃了什麼？之後身體感覺如何？', has_feeling: true },
  { key: 'reading',    label: '閱讀', emoji: '📖', color: '#2f5d9e', mode: 'count', unit: '頁', hint: '書名、重點、心得' },
  { key: 'reflection', label: '感悟', emoji: '✨', color: '#7a4d9b', mode: 'none',  unit: '',   hint: '今天想到了什麼？' },
  { key: 'habit',      label: '習慣', emoji: '✅', color: '#3a7d5c', mode: 'count', unit: '次', hint: '任何你想每天持續的事' },
  { key: 'expense',    label: '記帳', emoji: '💰', color: '#1f8a8a', mode: 'money', unit: '元', hint: '買了什麼？' },
  { key: 'other',      label: '其他', emoji: '📌', color: '#5f6b7a', mode: 'none',  unit: '',   hint: '任何值得記下的事' },
]

export const FALLBACK = { key: 'other', label: '其他', emoji: '📌', color: '#5f6b7a', mode: 'none', unit: '', hint: '' }

// 顏色挑選盤（設定頁用）
export const PALETTE = ['#d9573b', '#c9941c', '#2f5d9e', '#7a4d9b', '#3a7d5c', '#1f8a8a', '#b5476b', '#8a6b2f', '#5f6b7a', '#2b2a26']

// 記帳的子分類（可以在設定頁改）
export const DEFAULT_MONEY_TAGS = ['飲食', '交通', '購物', '娛樂', '居家', '醫療', '學習', '其他']

export function makeTypeOf(categories) {
  const map = Object.fromEntries((categories || []).map(c => [c.key, c]))
  return key => map[key] || { ...FALLBACK, key }
}

export function slugKey(label) {
  // 新分類的 key：自訂的就用時間戳，不跟顯示文字綁死，之後改名不影響既有紀錄
  return 'c_' + Date.now().toString(36)
}
