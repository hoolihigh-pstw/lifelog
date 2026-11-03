import { useMemo, useState } from 'react'
import { monthGrid, todayKey, WEEKDAYS, fromKey } from './dates'
import { photoUrl } from './photos'

export default function Calendar({ entries, typeOf, categories, selected, onSelect, loading }) {
  const today = todayKey()
  const init = fromKey(selected || today)
  const [year, setYear] = useState(init.getFullYear())
  const [month, setMonth] = useState(init.getMonth())

  const byDate = useMemo(() => {
    const m = {}
    for (const e of entries) (m[e.date] ||= []).push(e)
    return m
  }, [entries])

  const cells = monthGrid(year, month)
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthEntries = entries.filter(e => e.date.startsWith(prefix))
  const activeDays = new Set(monthEntries.map(e => e.date)).size
  const photoCount = monthEntries.reduce((n, e) => n + (e.photos?.length || 0), 0)
  const spent = monthEntries.filter(e => e.flow === 'out').reduce((s, e) => s + Number(e.value || 0), 0)

  function shift(n) {
    const d = new Date(year, month + n, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth())
  }

  return (
    <section className="calendar">
      <div className="cal-head">
        <button onClick={() => shift(-1)} aria-label="上個月">‹</button>
        <h2>{year} 年 {month + 1} 月</h2>
        <button onClick={() => shift(1)} aria-label="下個月">›</button>
      </div>

      <p className="cal-summary">
        {loading ? '載入中…' : monthEntries.length === 0
          ? '這個月還是空白的，按右下角 ＋ 開始記錄。'
          : <>這個月有 <b>{activeDays}</b> 天留下紀錄，共 <b>{monthEntries.length}</b> 件事{photoCount > 0 && <>、<b>{photoCount}</b> 張照片</>}{spent > 0 && <>；支出 <b>{spent.toLocaleString()}</b> 元</>}。</>}
      </p>

      <div className="cal-grid">
        {WEEKDAYS.map(w => <div key={w} className="cal-wd">{w}</div>)}
        {cells.map((key, i) => {
          if (!key) return <div key={`e${i}`} className="cal-cell empty" />
          const list = byDate[key] || []
          const types = [...new Set(list.map(e => e.type))]
          const photo = list.find(e => e.photos?.length)?.photos?.[0]
          const isToday = key === today
          const isSel = key === selected
          return (
            <button
              key={key}
              className={`cal-cell ${list.length ? 'has' : ''} ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''} ${photo ? 'photo' : ''}`}
              style={photo ? { backgroundImage: `url(${photoUrl(photo)})` } : undefined}
              onClick={() => onSelect(key)}
            >
              <span className="num">{Number(key.slice(-2))}</span>
              {types.length > 0 && (
                <span className="dots">
                  {types.slice(0, 5).map(t => (
                    <i key={t} style={{ background: typeOf(t).color }} />
                  ))}
                </span>
              )}
              {list.length > 1 && <span className="count">{list.length}</span>}
            </button>
          )
        })}
      </div>

      <div className="legend">
        {categories.map(t => (
          <span key={t.key}><i style={{ background: t.color }} />{t.label}</span>
        ))}
      </div>
    </section>
  )
}
