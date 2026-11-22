import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
import type { NavCategory } from '../types'

interface HomeCategoryNavProps {
  categories: (NavCategory & { order: number; accent: string })[]
  onSelect: (id: string) => void
}

const DRAG_THRESHOLD = 6

export function HomeCategoryNav({ categories, onSelect }: HomeCategoryNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canDrag, setCanDrag] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ pointerId: number; startX: number; scrollLeft: number } | null>(null)
  const suppressClickRef = useRef(false)

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

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const updateOverflow = () => setCanDrag(scroller.scrollWidth > scroller.clientWidth)
    const observer = new ResizeObserver(updateOverflow)
    observer.observe(scroller)
    for (const chip of scroller.children) observer.observe(chip)
    updateOverflow()
    return () => observer.disconnect()
  }, [categories])

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClickRef.current = false
    const scroller = event.currentTarget
    if (event.pointerType !== 'mouse' || event.button !== 0 || scroller.scrollWidth <= scroller.clientWidth) return
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: scroller.scrollLeft }
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || !(event.buttons & 1)) return
    const delta = event.clientX - drag.startX
    if (!suppressClickRef.current) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return
      event.currentTarget.setPointerCapture(event.pointerId)
      suppressClickRef.current = true
      setDragging(true)
    }
    event.currentTarget.scrollLeft = drag.scrollLeft - delta
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  function preventDragClick(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current || event.detail === 0) return
    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  if (!categories.length) return null

  return (
    <nav ref={navRef} className="category-nav glass-surface" aria-label="按分类浏览">
      <div
        ref={scrollerRef}
        className="category-nav__scroller"
        data-scrollable={canDrag || undefined}
        data-dragging={dragging || undefined}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onClickCapture={preventDragClick}
      >
        {categories.map((category, index) => {
          const id = 'nav-category-' + index
          const count = category.menu?.length ?? 0
          return (
            <button
              key={category.order}
              type="button"
              className="category-nav__chip"
              style={{ '--category-accent': category.accent } as CSSProperties}
              aria-current={activeIndex === index ? 'location' : undefined}
              aria-controls={id}
              onClick={() => onSelect(id)}
            >
              <span className="category-nav__index" aria-hidden="true">{String(category.order + 1).padStart(2, '0')}</span>
              <span className="category-nav__label">{category.title}</span>
              <span className="category-nav__count">{count}<span className="category-nav__sr-only"> 个站点</span></span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
