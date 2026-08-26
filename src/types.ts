export interface NavCard {
  name: string
  logo: string
  link: string
  desc?: string
  star?: number
}

export interface NavCategory {
  title: string
  menu: NavCard[]
}

export interface HeadingItem {
  id: string
  text: string
  level: number
  parentId: string | null
  hasChildren: boolean
  element?: HTMLElement
}
