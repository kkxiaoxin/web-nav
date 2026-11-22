import { useEffect, useRef, useState } from 'react'
import type { NavCategory } from '../types'

interface HomeCategoryNavProps {
  categories: NavCategory[]
  onSelect: (id: string) => void
}

export function HomeCategoryNav({ categories, onSelect }: HomeCategoryNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const sections = categories.map((_, index) => document.getElementById('nav-category-' + index))
    let frame: number | undefined

    const updateActiveCategory = () => {
      frame = undefined
      const marker = nav.getBoundingClientRect().bottom + 20
      let current = 0
      for (let index = 1; index < sections.length; index++) {
        if ((sections[index]?.getBoundingClientRect().top ?? Infinity) > marker) break
        current = index
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = sections.length - 1
      }
      setActiveIndex(current)
    }

    function queueUpdate() {
      frame ??= window.requestAnimationFrame(updateActiveCategory)
    }

    updateActiveCategory()
    window.addEventListener('scroll', queueUpdate, { passive: true })
    window.addEventListener('resize', queueUpdate)
    return () => {
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', queueUpdate)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [categories])

  useEffect(() => {
    const scroller = scrollerRef.current
    const current = scroller?.querySelector('[aria-current="location"]')
    if (!scroller || !current) return
    const rail = scroller.getBoundingClientRect()
    const chip = current.getBoundingClientRect()
    const left = chip.left < rail.left ? chip.left - rail.left : Math.max(0, chip.right - rail.right)
    if (left) scroller.scrollBy({ left, behavior: 'instant' })
  }, [activeIndex, categories])

  if (!categories.length) return null

  return (
    <nav ref={navRef} className="category-nav glass-surface" aria-label="按分类浏览">
      <div ref={scrollerRef} className="category-nav__scroller">
        {categories.map((category, index) => {
          const id = 'nav-category-' + index
          const count = category.menu?.length ?? 0
          return (
            <button
              key={category.title}
              type="button"
              className="category-nav__chip"
              aria-current={activeIndex === index ? 'location' : undefined}
              aria-controls={id}
              onClick={() => onSelect(id)}
            >
              <span className="category-nav__label">{category.title}</span>
              <span className="category-nav__count">{count}<span className="category-nav__sr-only"> 个站点</span></span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
