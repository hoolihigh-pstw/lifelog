import { useMemo } from 'react'
import { TYPES, typeOf } from './types'
import { todayKey, addDays, formatShort } from './dates'

// 回顧頁：連續天數、各類型總量、最近 12 週熱力圖、每個標題（例如「吊單槓」）的趨勢
export default function Stats({ entries }) {
  const today = todayKey()
  const dates = useMemo(() => new Set(entries.map(e => e.date)), [entries])

  // 連續紀錄天數（今天或昨天開始往回算）
  const streak = useMemo(() => {
    let d = dates.has(today) ? today : addDays(today, -1)
    let n = 0
    while (dates.has(d)) { n++; d = addDays(d, -1) }
    return n
  }, [dates, today])

  // 最近 12 週 (84 天) 熱力格
  const heat = useMemo(() => {
    const counts = {}
    for (const e of entries) counts[e.date] = (counts[e.date] || 0) + 1
    const cells = []
    for (let i = 83; i >= 0; i--) {
      const k = addDays(today, -i)
      cells.push({ key: k, n: counts[k] || 0 })
    }
    return cells
  }, [entries, today])

  // 各類型統計
  const byType = useMemo(() => {
    const m = {}
    for (const e of entries) {
      const b = (m[e.type] ||= { n: 0, days: new Set(), sum: 0, unit: null })
      b.n++; b.days.add(e.date)
      if (e.value != null) { b.sum += Number(e.value); b.unit = b.unit || e.unit }
    }
    return m
  }, [entries])

  // 同標題、有數值的紀錄 → 趨勢（例如每天吊單槓幾下）
  const trends = useMemo(() => {
    const m = {}
    for (const e of entries) {
      if (e.value == null || !e.title) continue
      ;(m[e.title] ||= []).push(e)
    }
    return Object.entries(m)
      .filter(([, list]) => list.length >= 2)
      .map(([title, list]) => ({
        title,
        type: list[0].type,
        unit: list[0].unit,
        points: [...list].sort((a, b) => a.date.localeCompare(b.date)).slice(-30),
      }))
  }, [entries])

  const totalDays = dates.size

  return (
    <section className="stats">
      <div className="big-numbers">
        <div><b>{streak}</b><span>連續天數</span></div>
        <div><b>{totalDays}</b><span>有紀錄的天</span></div>
        <div><b>{entries.length}</b><span>總紀錄數</span></div>
      </div>

      <h3>最近 12 週</h3>
      <div className="heat">
        {heat.map(c => (
          <i key={c.key} title={`${formatShort(c.key)}：${c.n} 則`} data-n={Math.min(c.n, 4)} />
        ))}
      </div>

      <h3>各類型</h3>
      <div className="type-stats">
        {Object.entries(TYPES).map(([k, t]) => {
          const b = byType[k]
          if (!b) return null
          return (
            <div key={k} className="ts" style={{ '--accent': t.color }}>
              <span className="ts-label">{t.emoji} {t.label}</span>
              <span className="ts-n">{b.n} 則 · {b.days.size} 天{b.sum > 0 && <> · 累計 {b.sum}{b.unit}</>}</span>
            </div>
          )
        })}
      </div>

      {trends.length > 0 && <h3>趨勢</h3>}
      {trends.map(tr => {
        const max = Math.max(...tr.points.map(p => Number(p.value))) || 1
        const t = typeOf(tr.type)
        return (
          <div key={tr.title} className="trend" style={{ '--accent': t.color }}>
            <div className="trend-head">
              <b>{tr.title}</b>
              <span className="muted">最近 {tr.points.length} 次 · 最高 {max}{tr.unit}</span>
            </div>
            <div className="bars">
              {tr.points.map(p => (
                <div key={p.id} className="bar" title={`${formatShort(p.date)}：${p.value}${tr.unit || ''}`}>
                  <i style={{ height: `${(Number(p.value) / max) * 100}%` }} />
                  <span>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {entries.length === 0 && <p className="muted">開始記錄後，這裡會慢慢長出你的軌跡。</p>}
    </section>
  )
}
