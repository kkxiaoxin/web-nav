import type { NavCategory } from '../types'

export function filterCardsByKeyword(categories: NavCategory[], keyword: string) {
  const query = keyword.trim().toLowerCase()
  if (!query || !Array.isArray(categories)) return categories

  return categories
    .map((category) => ({
      ...category,
      menu: (category.menu || []).filter((item) => String(item.name || '').toLowerCase().includes(query))
    }))
    .filter((category) => category.menu.length > 0)
}

export function countCardsInCategories(categories: NavCategory[]) {
  if (!Array.isArray(categories)) return 0
  return categories.reduce((sum, category) => sum + (category.menu?.length || 0), 0)
}
