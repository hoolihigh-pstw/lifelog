import { useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import { deletePhotos } from './photos'
import { formatShort } from './dates'
import Postcard from './Postcard'

// 分類回顧：從回顧頁點進某個分類，把這個分類的所有紀錄一次攤開（新的在上面，依月份分段）
export default function CategoryView({ category, entries, typeOf, onBack, onEdit, onDeleted }) {
  // 進來時回到頁首（回顧頁通常已經往下捲了）
  useEffect(() => { window.scrollTo(0, 0) }, [category.key])

  const summary = useMemo(() => {
    const days = new Set()
    let sum = 0, unit = null, spent = 0
    for (const e of entries) {
      days.add(e.date)
      if (e.value == null) continue
      if (e.flow === 'out') spent += Number(e.value)
      else if (!e.flow) { sum += Number(e.value); unit = unit || e.unit }
    }
    const first = entries.length ? entries[entries.length - 1].date : null
    return { days: days.size, sum, unit, spent, first }
  }, [entries])

  // entries 已經是新→舊，依月份切段
  const months = useMemo(() => {
    const groups = []
    for (const e of entries) {
      const ym = e.date.slice(0, 7)
      const last = groups[groups.length - 1]
      if (last && last.ym === ym) last.list.push(e)
      else groups.push({ ym, list: [e] })
    }
    return groups
  }, [entries])

  async function remove(entry) {
    if (!confirm('確定要刪除這則紀錄嗎？')) return
    await deletePhotos(entry.photos)
    const { error } = await supabase.from('entries').delete().eq('id', entry.id)
    if (error) alert(error.message)
    onDeleted()
  }

  let third
  if (summary.sum > 0) third = <div><b>{summary.sum.toLocaleString()}</b><span>累計{summary.unit || ''}</span></div>
  else if (summary.spent > 0) third = <div><b>{summary.spent.toLocaleString()}</b><span>累計支出</span></div>
  else third = <div><b>{summary.first ? formatShort(summary.first) : '—'}</b><span>第一則的日期</span></div>

  return (
    <section className="cat-view" style={{ '--accent': category.color }}>
      <div className="cat-view-head">
        <button className="cat-back" onClick={onBack}>‹ 回顧</button>
        <h2>{category.emoji} {category.label}</h2>
      </div>

      {entries.length === 0 ? (
        <div className="empty-day">
          <p>這個分類還沒有紀錄。</p>
          <p className="muted">按右下角 ＋ 寫下第一則。</p>
        </div>
      ) : (
        <>
          <div className="big-numbers">
            <div><b>{entries.length}</b><span>則紀錄</span></div>
            <div><b>{summary.days}</b><span>天</span></div>
            {third}
          </div>

          {months.map(g => {
            const [y, m] = g.ym.split('-').map(Number)
            return (
              <div key={g.ym} className="cat-month">
                <h3><span>{y} 年 {m} 月</span><small>{g.list.length} 則</small></h3>
                <div className="postcards">
                  {g.list.map(e => (
                    <Postcard key={e.id} entry={e} typeOf={typeOf} onEdit={onEdit} onDelete={remove} showDate />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </section>
  )
}
