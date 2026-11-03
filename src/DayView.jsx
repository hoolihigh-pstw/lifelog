import { supabase } from './supabase'
import { deletePhotos } from './photos'
import { addDays, formatLong, todayKey } from './dates'
import Postcard from './Postcard'

export default function DayView({ dateKey, entries, onChangeDate, onEdit, onDeleted }) {
  async function remove(entry) {
    if (!confirm('確定要刪除這則紀錄嗎？')) return
    await deletePhotos(entry.photos)
    const { error } = await supabase.from('entries').delete().eq('id', entry.id)
    if (error) alert(error.message)
    onDeleted()
  }

  return (
    <section className="day">
      <div className="day-head">
        <button onClick={() => onChangeDate(addDays(dateKey, -1))} aria-label="前一天">‹</button>
        <div>
          <h2>{formatLong(dateKey)}</h2>
          {dateKey !== todayKey() && <button className="link small" onClick={() => onChangeDate(todayKey())}>回到今天</button>}
        </div>
        <button onClick={() => onChangeDate(addDays(dateKey, 1))} aria-label="後一天">›</button>
      </div>

      {entries.length === 0 ? (
        <div className="empty-day">
          <p>這一天還沒有任何紀錄。</p>
          <p className="muted">按右下角 ＋，哪怕只是一句話也好。</p>
        </div>
      ) : (
        <div className="postcards">
          {entries.map(e => <Postcard key={e.id} entry={e} onEdit={onEdit} onDelete={remove} />)}
        </div>
      )}
    </section>
  )
}
