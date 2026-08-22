import { loadIcons } from '@iconify/react'
import { FAB_ICONS } from './fabIcons'

export function preloadFabIcons() {
  loadIcons([...new Set(Object.values(FAB_ICONS))])
}
