import { supabase } from './supabase'
import { DEFAULT_CATEGORIES, DEFAULT_MONEY_TAGS } from './types'

// 讀取使用者的分類；第一次使用時自動建立預設分類
export async function loadCategories(userId) {
  let { data, error } = await supabase
    .from('categories').select('*').order('sort').order('created_at')
  if (error) throw error
  if (!data || data.length === 0) {
    const rows = DEFAULT_CATEGORIES.map((c, i) => ({
      ...c, has_feeling: !!c.has_feeling, unit: c.unit || '', hint: c.hint || '', user_id: userId, sort: i,
    }))
    const ins = await supabase.from('categories').insert(rows).select()
    if (ins.error) throw ins.error
    data = ins.data
  }
  return data
}

export async function saveCategory(userId, cat) {
  const row = {
    user_id: userId, key: cat.key, label: cat.label, emoji: cat.emoji || '📌',
    color: cat.color, mode: cat.mode || 'none', unit: cat.unit || '', hint: cat.hint || '',
    has_feeling: !!cat.has_feeling, sort: cat.sort ?? 999,
  }
  if (cat.id) {
    const { error } = await supabase.from('categories').update(row).eq('id', cat.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('categories').insert(row)
    if (error) throw error
  }
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function reorderCategories(list) {
  await Promise.all(list.map((c, i) => supabase.from('categories').update({ sort: i }).eq('id', c.id)))
}

// 記帳子分類存在 settings 表（一人一列）
export async function loadMoneyTags(userId) {
  const { data } = await supabase.from('settings').select('money_tags').eq('user_id', userId).maybeSingle()
  return data?.money_tags?.length ? data.money_tags : DEFAULT_MONEY_TAGS
}

export async function saveMoneyTags(userId, tags) {
  const { error } = await supabase.from('settings').upsert({ user_id: userId, money_tags: tags })
  if (error) throw error
}
