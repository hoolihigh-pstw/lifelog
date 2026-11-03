import { useState } from 'react'
import { typeOf } from './types'
import { photoUrl } from './photos'
import { formatShort } from './dates'

// 明信片：照片不論尺寸，一律以固定比例裁切成主圖；多張照片會排成小相冊
export default function Postcard({ entry, onEdit, onDelete }) {
  const t = typeOf(entry.type)
  const photos = entry.photos || []
  const [cover, setCover] = useState(0)
  // 依 id 產生固定的微小旋轉角度，讓每張明信片像是隨手放在桌上
  const seed = (entry.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const tilt = ((seed % 7) - 3) * 0.4

  return (
    <article className="postcard" style={{ '--accent': t.color, '--tilt': `${tilt}deg` }}>
      {photos.length > 0 && (
        <div className="pc-photo">
          <img src={photoUrl(photos[cover])} alt="" loading="lazy" />
          <div className="pc-stamp">{formatShort(entry.date)}</div>
          {photos.length > 1 && (
            <div className="pc-thumbs">
              {photos.map((p, i) => (
                <button key={p} className={i === cover ? 'on' : ''} onClick={() => setCover(i)}>
                  <img src={photoUrl(p)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pc-body">
        <div className="pc-meta">
          <span className="pc-type">{t.emoji} {t.label}</span>
          {entry.value != null && entry.value !== '' && (
            <span className="pc-value">{entry.value}<small>{entry.unit || ''}</small></span>
          )}
        </div>
        {entry.title && <h3>{entry.title}</h3>}
        {entry.content && <p className="pc-text">{entry.content}</p>}
        {entry.feeling && <p className="pc-feeling">身體感覺：{entry.feeling}</p>}
        <div className="pc-actions">
          <button onClick={() => onEdit(entry)}>編輯</button>
          <button className="danger" onClick={() => onDelete(entry)}>刪除</button>
        </div>
      </div>
    </article>
  )
}
