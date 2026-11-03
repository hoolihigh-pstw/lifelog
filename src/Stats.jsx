import { useMemo } from 'react'
import { todayKey, addDays, formatShort } from './dates'

// 回顧頁：連續天數、各類型總量、最近 12 週熱力圖、每個標題（例如「吊單槓」）的趨勢
export default function Stats({ entries, typeOf, categories }) {
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
      if (e.value != null && !e.flow) { b.sum += Number(e.value); b.unit = b.unit || e.unit }
    }
    return m
  }, [entries])

  // 同標題、有數值的紀錄 → 趨勢（例如每天吊單槓幾下）
  const trends = useMemo(() => {
    const m = {}
    for (const e of entries) {
      if (e.value == null || !e.title || e.flow) continue
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

  // 記帳：本月收支 + 子分類佔比
  const money = useMemo(() => {
    const ym = today.slice(0, 7)
    const list = entries.filter(e => e.flow && e.value != null)
    const month = list.filter(e => e.date.startsWith(ym))
    const out = month.filter(e => e.flow === 'out').reduce((s, e) => s + Number(e.value), 0)
    const inc = month.filter(e => e.flow === 'in').reduce((s, e) => s + Number(e.value), 0)
    const byTag = {}
    for (const e of month) if (e.flow === 'out') byTag[e.tag || '未分類'] = (byTag[e.tag || '未分類'] || 0) + Number(e.value)
    const tags = Object.entries(byTag).sort((a, b) => b[1] - a[1])
    // 最近 6 個月支出
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ k, label: `${d.getMonth() + 1}月`, v: list.filter(e => e.flow === 'out' && e.date.startsWith(k)).reduce((s, e) => s + Number(e.value), 0) })
    }
    return { has: list.length > 0, out, inc, tags, months }
  }, [entries, today])

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
        {categories.map(t => {
          const b = byType[t.key]
          if (!b) return null
          return (
            <div key={t.key} className="ts" style={{ '--accent': t.color }}>
              <span className="ts-label">{t.emoji} {t.label}</span>
              <span className="ts-n">{b.n} 則 · {b.days.size} 天{b.sum > 0 && <> · 累計 {b.sum}{b.unit}</>}</span>
            </div>
          )
        })}
      </div>

      {money.has && (
        <>
          <h3>本月收支</h3>
          <div className="money-card">
            <div className="money-top">
              <div><span>支出</span><b className="out">{money.out.toLocaleString()}</b></div>
              <div><span>收入</span><b className="in">{money.inc.toLocaleString()}</b></div>
              <div><span>結餘</span><b>{(money.inc - money.out).toLocaleString()}</b></div>
            </div>
            {money.tags.length > 0 && (
              <div className="tag-bars">
                {money.tags.map(([tag, v]) => (
                  <div key={tag} className="tag-bar">
                    <span className="tag-name">{tag}</span>
                    <i style={{ width: `${(v / money.tags[0][1]) * 100}%` }} />
                    <span className="tag-v">{v.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="trend-head" style={{ marginTop: '.75rem' }}><b>最近 6 個月支出</b></div>
            <div className="bars" style={{ height: 70 }}>
              {money.months.map(m => {
                const max = Math.max(...money.months.map(x => x.v)) || 1
                return (
                  <div key={m.k} className="bar" title={`${m.label}：${m.v.toLocaleString()} 元`}>
                    <i style={{ height: `${(m.v / max) * 100}%`, background: '#1f8a8a' }} />
                    <span>{m.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

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
