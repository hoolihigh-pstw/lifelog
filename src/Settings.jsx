import { useState } from 'react'
import { PALETTE, slugKey } from './types'
import { saveCategory, deleteCategory, reorderCategories, saveMoneyTags } from './categories'
import { exportBackup, importBackup } from './backup'

export default function Settings({ user, categories, moneyTags, entries, onChanged }) {
  const [editing, setEditing] = useState(null)   // null | {} (新增) | category
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [tagsText, setTagsText] = useState(moneyTags.join('、'))
  const [progress, setProgress] = useState('')

  async function run(fn, okMsg) {
    setBusy(true); setMsg('')
    try { await fn(); if (okMsg) setMsg(okMsg); await onChanged() }
    catch (e) { setMsg('發生錯誤：' + (e.message || e)) }
    setBusy(false)
  }

  function move(i, dir) {
    const list = [...categories]
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    run(() => reorderCategories(list))
  }

  function countOf(key) { return entries.filter(e => e.type === key).length }

  async function remove(c) {
    const n = countOf(c.key)
    const warn = n > 0
      ? `「${c.label}」已有 ${n} 則紀錄。刪除分類後這些紀錄會保留，但會顯示為「其他」。確定刪除？`
      : `確定刪除「${c.label}」？`
    if (!confirm(warn)) return
    run(() => deleteCategory(c.id), '已刪除')
  }

  async function doExport() {
    setBusy(true); setMsg('')
    try {
      await exportBackup({ entries, categories, moneyTags }, setProgress)
      setMsg('備份已下載。')
    } catch (e) { setMsg('匯出失敗：' + (e.message || e)) }
    setProgress(''); setBusy(false)
  }

  async function doImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!confirm('匯入會把備份裡的紀錄「加入」目前的資料（不會刪除現有紀錄）。繼續？')) return
    setBusy(true); setMsg('')
    try {
      const r = await importBackup(user.id, file, setProgress)
      setMsg(`匯入完成：${r.entries} 則紀錄、${r.photos} 張照片、${r.categories} 個分類。`)
      await onChanged()
    } catch (err) { setMsg('匯入失敗：' + (err.message || err)) }
    setProgress(''); setBusy(false)
  }

  return (
    <section className="settings">
      <h2>分類</h2>
      <p className="muted small">點一下可以修改；箭頭調整順序。分類被刪除後，舊紀錄仍會保留。</p>
      <div className="cat-list">
        {categories.map((c, i) => (
          <div key={c.id} className="cat-row" style={{ '--accent': c.color }}>
            <button className="cat-main" onClick={() => setEditing(c)}>
              <span className="cat-emoji">{c.emoji}</span>
              <span className="cat-label">{c.label}</span>
              <span className="cat-meta">
                {c.mode === 'count' && `數值（${c.unit || '無單位'}）`}
                {c.mode === 'money' && '記帳'}
                {c.mode === 'none' && '文字'}
                {' · '}{countOf(c.key)} 則
              </span>
            </button>
            <div className="cat-tools">
              <button onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="上移">↑</button>
              <button onClick={() => move(i, 1)} disabled={busy || i === categories.length - 1} aria-label="下移">↓</button>
              <button className="danger" onClick={() => remove(c)} disabled={busy} aria-label="刪除">×</button>
            </div>
          </div>
        ))}
      </div>
      <button className="chip add" onClick={() => setEditing({})}>＋ 新增分類</button>

      <h2>記帳子分類</h2>
      <p className="muted small">用「、」或逗號分開，記帳時可以快速點選。</p>
      <div className="row-inline">
        <input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="飲食、交通、購物…" />
        <button className="primary small" disabled={busy}
          onClick={() => run(() => saveMoneyTags(user.id, tagsText.split(/[、,，\s]+/).map(s => s.trim()).filter(Boolean)), '已儲存')}>
          儲存
        </button>
      </div>

      <h2>資料備份</h2>
      <p className="muted small">
        匯出會下載一個 zip，裡面有所有紀錄（JSON）和全部照片，放到雲端硬碟或電腦就安心了。
        匯入可以把備份還原到任何帳號。
      </p>
      <div className="backup-actions">
        <button className="primary" disabled={busy} onClick={doExport}>⬇ 匯出備份（{entries.length} 則）</button>
        <label className="chip upload-chip">
          ⬆ 從備份匯入
          <input type="file" accept=".zip,.json" hidden onChange={doImport} disabled={busy} />
        </label>
      </div>
      {progress && <p className="muted small">{progress}</p>}
      {msg && <p className="msg ok">{msg}</p>}

      {editing && (
        <CategoryEditor
          cat={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={c => run(() => saveCategory(user.id, { ...c, sort: c.sort ?? categories.length }), '已儲存').then(() => setEditing(null))}
        />
      )}
    </section>
  )
}

function CategoryEditor({ cat, busy, onClose, onSave }) {
  const [label, setLabel] = useState(cat.label || '')
  const [emoji, setEmoji] = useState(cat.emoji || '📌')
  const [color, setColor] = useState(cat.color || PALETTE[0])
  const [mode, setMode] = useState(cat.mode || 'none')
  const [unit, setUnit] = useState(cat.unit || '')
  const [hint, setHint] = useState(cat.hint || '')
  const [hasFeeling, setHasFeeling] = useState(!!cat.has_feeling)

  function submit(e) {
    e.preventDefault()
    if (!label.trim()) return
    onSave({ ...cat, key: cat.key || slugKey(label), label: label.trim(), emoji: emoji.trim() || '📌', color, mode, unit: mode === 'money' ? '元' : unit, hint, has_feeling: hasFeeling })
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="sheet-handle" />
        <h2>{cat.id ? '編輯分類' : '新增分類'}</h2>
        <div className="row" style={{ gridTemplateColumns: '80px 1fr' }}>
          <label>圖示
            <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} style={{ textAlign: 'center', fontSize: '1.4rem' }} />
          </label>
          <label>名稱
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="例如：欲望" required autoFocus />
          </label>
        </div>
        <label>顏色
          <div className="swatches">
            {PALETTE.map(p => (
              <button type="button" key={p} className={p === color ? 'on' : ''} style={{ background: p }} onClick={() => setColor(p)} aria-label={p} />
            ))}
          </div>
        </label>
        <label>紀錄形式
          <div className="type-row">
            {[['none', '純文字'], ['count', '有數值'], ['money', '記帳']].map(([k, l]) => (
              <button type="button" key={k} className={`chip ${mode === k ? 'on' : ''}`} style={{ '--accent': color }} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
        </label>
        {mode === 'count' && (
          <label>預設單位
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="下 / 頁 / 分鐘" />
          </label>
        )}
        <label>輸入提示
          <input value={hint} onChange={e => setHint(e.target.value)} placeholder="會顯示在標題欄的灰字" />
        </label>
        <label className="check">
          <input type="checkbox" checked={hasFeeling} onChange={e => setHasFeeling(e.target.checked)} />
          多一欄「之後身體的感覺」（飲食用）
        </label>
        <div className="sheet-actions">
          <button type="button" className="ghost" onClick={onClose} disabled={busy}>取消</button>
          <button className="primary" disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
        </div>
      </form>
    </div>
  )
}
