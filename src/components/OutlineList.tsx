import { useMemo, useState } from 'react'
import type { HeadingItem, NavCategory } from '../types'

interface MarkdownOutlineProps {
  headings: HeadingItem[]
  activeHeadingId?: string
  open?: boolean
  onClose: () => void
  onSelect: (headingId: string) => void
}

export function MarkdownOutline({ headings, activeHeadingId = '', open = false, onClose, onSelect }: MarkdownOutlineProps) {
  const [collapsedHeadingIds, setCollapsedHeadingIds] = useState<string[]>([])

  const visibleHeadings = useMemo(() => {
    const collapsedIds = new Set(collapsedHeadingIds)
    const hiddenParentIds = new Set<string>()
    return headings.filter((heading) => {
      if (heading.parentId && hiddenParentIds.has(heading.parentId)) {
        hiddenParentIds.add(heading.id)
        return false
      }
      if (heading.parentId && collapsedIds.has(heading.parentId)) {
        hiddenParentIds.add(heading.id)
        return false
      }
      return true
    })
  }, [collapsedHeadingIds, headings])

  const hasExpandableHeadings = headings.some((heading) => heading.hasChildren)
  const isAnyHeadingExpanded = headings.some((heading) => heading.hasChildren && !collapsedHeadingIds.includes(heading.id))
  const visibleIds = new Set(visibleHeadings.map((heading) => heading.id))
  let activeOutlineHeadingId = activeHeadingId
  if (activeHeadingId && !visibleIds.has(activeHeadingId)) {
    let heading = headings.find((item) => item.id === activeHeadingId)
    while (heading?.parentId) {
      if (visibleIds.has(heading.parentId)) {
        activeOutlineHeadingId = heading.parentId
        break
      }
      heading = headings.find((item) => item.id === heading?.parentId)
    }
  }

  function toggleHeading(headingId: string) {
    setCollapsedHeadingIds((ids) => (ids.includes(headingId) ? ids.filter((id) => id !== headingId) : [...ids, headingId]))
  }

  function toggleAllHeadings() {
    if (isAnyHeadingExpanded) {
      setCollapsedHeadingIds(headings.filter((heading) => heading.hasChildren).map((heading) => heading.id))
    } else {
      setCollapsedHeadingIds([])
    }
  }

  return (
    <aside className={`vitepress-sidebar-outline${open ? ' open' : ''}`}>
      <nav className="outline-nav">
        <div className="outline-header">
          <div className="outline-title">目录</div>
          {hasExpandableHeadings && (
            <button className="outline-toggle-all" type="button" onClick={toggleAllHeadings}>
              {isAnyHeadingExpanded ? '折叠' : '展开'}
            </button>
          )}
          <button className="mobile-outline-close" type="button" aria-label="关闭目录" title="关闭目录" onClick={onClose}></button>
        </div>
        {headings.length ? (
          <ul className="outline-list">
            {visibleHeadings.map((heading) => {
              const collapsed = collapsedHeadingIds.includes(heading.id)
              return (
                <li
                  key={heading.id}
                  className={`outline-item level-${heading.level}${activeOutlineHeadingId === heading.id ? ' active' : ''}`}
                >
                  <div className="outline-row">
                    {heading.hasChildren ? (
                      <button
                        className="outline-toggle"
                        type="button"
                        aria-label={collapsed ? '展开子标题' : '折叠子标题'}
                        title={collapsed ? '展开子标题' : '折叠子标题'}
                        onClick={() => toggleHeading(heading.id)}
                      >
                        <span className={`outline-toggle-icon${collapsed ? ' collapsed' : ''}`}></span>
                      </button>
                    ) : (
                      <span className="outline-toggle-spacer"></span>
                    )}
                    <a href={`#${heading.id}`} className="outline-link" title={heading.text} onClick={(event) => {
                      event.preventDefault()
                      onSelect(heading.id)
                    }}>
                      {heading.text}
                    </a>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="outline-empty">无标题</div>
        )}
      </nav>
    </aside>
  )
}

interface HomeNavOutlineProps {
  categories: NavCategory[]
  open?: boolean
  isDark?: boolean
  onClose: () => void
  onSelect: (navId: string) => void
}

export function HomeNavOutline({ categories, open = false, isDark = false, onClose, onSelect }: HomeNavOutlineProps) {
  const [collapsedCategoryIndexes, setCollapsedCategoryIndexes] = useState<number[]>([])
  const hasExpandableCategories = categories.some((category) => category.menu?.length)
  const isAnyCategoryExpanded = categories.some((category, index) => category.menu?.length && !collapsedCategoryIndexes.includes(index))

  function toggleCategory(index: number) {
    setCollapsedCategoryIndexes((ids) => (ids.includes(index) ? ids.filter((id) => id !== index) : [...ids, index]))
  }

  function toggleAllCategories() {
    if (isAnyCategoryExpanded) {
      setCollapsedCategoryIndexes(categories.map((category, index) => (category.menu?.length ? index : -1)).filter((index) => index >= 0))
    } else {
      setCollapsedCategoryIndexes([])
    }
  }

  return (
    <aside className={`home-nav-outline${open ? ' open' : ''}${isDark ? ' is-dark' : ''}`}>
      <nav className="outline-nav">
        <div className="outline-header">
          <div className="outline-title">目录</div>
          {hasExpandableCategories && (
            <button className="outline-toggle-all" type="button" onClick={toggleAllCategories}>
              {isAnyCategoryExpanded ? '折叠' : '展开'}
            </button>
          )}
          <button className="mobile-outline-close" type="button" aria-label="关闭目录" title="关闭目录" onClick={onClose}></button>
        </div>
        {categories.length ? (
          <ul className="outline-list">
            {categories.map((category, categoryIndex) => {
              const collapsed = collapsedCategoryIndexes.includes(categoryIndex)
              return (
                <li className="outline-item level-1" key={category.title}>
                  <div className="outline-row">
                    {category.menu?.length ? (
                      <button
                        className="outline-toggle"
                        type="button"
                        aria-label={collapsed ? '展开子项' : '折叠子项'}
                        title={collapsed ? '展开子项' : '折叠子项'}
                        onClick={() => toggleCategory(categoryIndex)}
                      >
                        <span className={`outline-toggle-icon${collapsed ? ' collapsed' : ''}`}></span>
                      </button>
                    ) : (
                      <span className="outline-toggle-spacer"></span>
                    )}
                    <a href="#" className="outline-link" title={category.title} onClick={(event) => {
                      event.preventDefault()
                      onSelect(`nav-category-${categoryIndex}`)
                    }}>
                      {category.title}
                    </a>
                  </div>
                  {!collapsed &&
                    (category.menu || []).map((item, itemIndex) => (
                      <div className="outline-item level-2" key={`${category.title}-${item.name}`}>
                        <div className="outline-row">
                          <span className="outline-toggle-spacer"></span>
                          <a href="#" className="outline-link" title={item.name} onClick={(event) => {
                            event.preventDefault()
                            onSelect(`nav-item-${categoryIndex}-${itemIndex}`)
                          }}>
                            {item.name}
                          </a>
                        </div>
                      </div>
                    ))}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="outline-empty">暂无导航</div>
        )}
      </nav>
    </aside>
  )
}
