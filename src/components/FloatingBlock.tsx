import { Icon } from '@iconify/react'
import { AnimatePresence, motion } from 'framer-motion'
import { CSSProperties, PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FAB_ICONS } from '../config/fabIcons'

const savedPositions: Record<string, { xRatio: number; yRatio: number }> = {}
const FAB_SIZE = 48
const ACTION_SIZE = 38
const ACTION_GAP = 10
const ACTION_RADIUS = FAB_SIZE / 2 + ACTION_SIZE / 2 + ACTION_GAP
const EXPAND_PADDING = ACTION_RADIUS + ACTION_SIZE / 2 - FAB_SIZE / 2 + 6
const VIEWPORT_EDGE = 16
const DEFAULT_CORNER_INSET = 24
const DRAG_THRESHOLD = 8
const KEEP_OPEN_ACTION_IDS = new Set(['theme', 'search', 'nav'])
const ACTION_CARDINAL = [
  { x: 0, y: -ACTION_RADIUS },
  { x: ACTION_RADIUS, y: 0 },
  { x: 0, y: ACTION_RADIUS },
  { x: -ACTION_RADIUS, y: 0 }
]

interface FloatingBlockProps {
  isDark: boolean
  navEnabled?: boolean
  positionKey?: string
  onToggleTheme: () => void
  onOpenSearch: () => void
  onOpenNav: () => void
}

function getExpandedSize() {
  return FAB_SIZE + EXPAND_PADDING * 2
}

function getCollapsedDragBounds() {
  return {
    minX: VIEWPORT_EDGE,
    minY: VIEWPORT_EDGE,
    maxX: Math.max(VIEWPORT_EDGE, window.innerWidth - FAB_SIZE - VIEWPORT_EDGE),
    maxY: Math.max(VIEWPORT_EDGE, window.innerHeight - FAB_SIZE - VIEWPORT_EDGE)
  }
}

function normalizePosition(pixelPos: { x: number; y: number }, bounds: ReturnType<typeof getCollapsedDragBounds>) {
  const rangeX = bounds.maxX - bounds.minX
  const rangeY = bounds.maxY - bounds.minY
  return {
    xRatio: rangeX > 0 ? (pixelPos.x - bounds.minX) / rangeX : 1,
    yRatio: rangeY > 0 ? (pixelPos.y - bounds.minY) / rangeY : 1
  }
}

function denormalizePosition(ratio: { xRatio: number; yRatio: number }, bounds: ReturnType<typeof getCollapsedDragBounds>) {
  return {
    x: bounds.minX + ratio.xRatio * (bounds.maxX - bounds.minX),
    y: bounds.minY + ratio.yRatio * (bounds.maxY - bounds.minY)
  }
}

export function FloatingBlock({ isDark, navEnabled = true, positionKey = 'home-floating-br2', onToggleTheme, onOpenSearch, onOpenNav }: FloatingBlockProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const blockClickRef = useRef(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [actionsReady, setActionsReady] = useState(false)
  const [positionRatio, setPositionRatio] = useState(() => savedPositions[positionKey] || null)
  const [expandPositionOverride, setExpandPositionOverride] = useState<{ xRatio: number; yRatio: number } | null>(null)
  const [dragPixelPosition, setDragPixelPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragSnapshot, setDragSnapshot] = useState<{ pointerId: number; startX: number; startY: number; pendingRatio: { xRatio: number; yRatio: number } | null; startedDragging: boolean } | null>(null)

  const resolvedRatio = positionRatio || getDefaultPositionRatio()
  const pixelPosition = dragPixelPosition || denormalizePosition(expandPositionOverride || resolvedRatio, getCollapsedDragBounds())
  const size = getExpandedSize()
  const anchorStyle: CSSProperties = {
    left: 0,
    top: 0,
    width: size,
    height: size,
    right: 'auto',
    bottom: 'auto',
    transform: `translate3d(${Math.round(pixelPosition.x - EXPAND_PADDING)}px, ${Math.round(pixelPosition.y - EXPAND_PADDING)}px, 0)`
  }

  function getDefaultPositionRatio() {
    const bounds = getCollapsedDragBounds()
    return normalizePosition({ x: bounds.maxX - DEFAULT_CORNER_INSET, y: bounds.maxY - DEFAULT_CORNER_INSET }, bounds)
  }

  function getItemPosition(index: number, total: number) {
    if (total === 4) return ACTION_CARDINAL[index]
    if (total === 3) return [ACTION_CARDINAL[0], ACTION_CARDINAL[1], ACTION_CARDINAL[2]][index]
    if (total === 2) return [ACTION_CARDINAL[0], ACTION_CARDINAL[2]][index]
    if (total === 1) return ACTION_CARDINAL[0]
    const angle = (index * 360) / total - 90
    return { x: Math.cos((angle * Math.PI) / 180) * ACTION_RADIUS, y: Math.sin((angle * Math.PI) / 180) * ACTION_RADIUS }
  }

  const actionButtons = useMemo(() => {
    const items = [
      { id: 'theme', icon: isDark ? FAB_ICONS.themeLight : FAB_ICONS.themeDark, label: isDark ? '切换到亮色模式' : '切换到暗色模式', handler: onToggleTheme },
      { id: 'search', icon: FAB_ICONS.search, label: '搜索', handler: onOpenSearch }
    ]
    if (navEnabled) items.push({ id: 'nav', icon: FAB_ICONS.nav, label: '目录导航', handler: onOpenNav })
    items.push({ id: 'top', icon: FAB_ICONS.top, label: '返回顶部', handler: () => window.scrollTo({ top: 0, behavior: 'smooth' }) })
    return items.map((item, index) => ({ ...item, ...getItemPosition(index, items.length) }))
  }, [isDark, navEnabled, onOpenNav, onOpenSearch, onToggleTheme])

  function ensureActionsVisible(pixelPos: { x: number; y: number }) {
    const center = { x: pixelPos.x + FAB_SIZE / 2, y: pixelPos.y + FAB_SIZE / 2 }
    const offsets = actionButtons.map((_, index) => getItemPosition(index, actionButtons.length))
    const half = ACTION_SIZE / 2
    const maxRight = window.innerWidth - VIEWPORT_EDGE
    const maxBottom = window.innerHeight - VIEWPORT_EDGE
    let minCenterX = -Infinity
    let maxCenterX = Infinity
    let minCenterY = -Infinity
    let maxCenterY = Infinity

    offsets.forEach(({ x, y }) => {
      minCenterX = Math.max(minCenterX, VIEWPORT_EDGE + half - x)
      maxCenterX = Math.min(maxCenterX, maxRight - half - x)
      minCenterY = Math.max(minCenterY, VIEWPORT_EDGE + half - y)
      maxCenterY = Math.min(maxCenterY, maxBottom - half - y)
    })

    const clampedCenter = {
      x: Math.min(maxCenterX, Math.max(minCenterX, center.x)),
      y: Math.min(maxCenterY, Math.max(minCenterY, center.y))
    }
    return { x: clampedCenter.x - FAB_SIZE / 2, y: clampedCenter.y - FAB_SIZE / 2 }
  }

  useEffect(() => {
    if (!positionRatio) {
      const next = getDefaultPositionRatio()
      savedPositions[positionKey] = next
      setPositionRatio(next)
    }
  }, [positionKey, positionRatio])

  useEffect(() => {
    if (!isExpanded) {
      setExpandPositionOverride(null)
      setActionsReady(false)
      return
    }
    const bounds = getCollapsedDragBounds()
    const current = denormalizePosition(positionRatio || getDefaultPositionRatio(), bounds)
    const adjusted = ensureActionsVisible(current)
    setExpandPositionOverride(Math.round(adjusted.x) !== Math.round(current.x) || Math.round(adjusted.y) !== Math.round(current.y) ? normalizePosition(adjusted, bounds) : null)
    setActionsReady(false)
    const timer = window.setTimeout(() => setActionsReady(true), 440)
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (anchorRef.current?.contains(event.target as Node)) return
      setIsExpanded(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [actionButtons.length, isExpanded, positionRatio])

  useEffect(() => {
    const onResize = () => {
      const bounds = getCollapsedDragBounds()
      const current = denormalizePosition(positionRatio || getDefaultPositionRatio(), bounds)
      const clamped = {
        x: Math.min(Math.max(bounds.minX, current.x), bounds.maxX),
        y: Math.min(Math.max(bounds.minY, current.y), bounds.maxY)
      }
      const next = normalizePosition(clamped, bounds)
      savedPositions[positionKey] = next
      setPositionRatio(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [positionKey, positionRatio])

  function onMainPress(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== undefined && event.button !== 0) return
    setIsInteracting(true)
    const start: { pointerId: number; startX: number; startY: number; pendingRatio: { xRatio: number; yRatio: number } | null; startedDragging: boolean } = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      pendingRatio: null,
      startedDragging: false
    }
    setDragSnapshot(start)
    event.currentTarget.setPointerCapture?.(event.pointerId)

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      if (moveEvent.pointerId !== start.pointerId) return
      const deltaX = moveEvent.clientX - start.startX
      const deltaY = moveEvent.clientY - start.startY
      if (!start.startedDragging && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return
      if (!start.startedDragging) {
        start.startedDragging = true
        blockClickRef.current = true
        setIsDragging(true)
        if (!positionRatio) {
          const next = getDefaultPositionRatio()
          savedPositions[positionKey] = next
          setPositionRatio(next)
        }
      }
      moveEvent.preventDefault()
      const bounds = getCollapsedDragBounds()
      const pixelPos = {
        x: Math.min(Math.max(bounds.minX, moveEvent.clientX - FAB_SIZE / 2), bounds.maxX),
        y: Math.min(Math.max(bounds.minY, moveEvent.clientY - FAB_SIZE / 2), bounds.maxY)
      }
      setDragPixelPosition(pixelPos)
      start.pendingRatio = normalizePosition(pixelPos, bounds)
    }

    const onEnd = (upEvent: globalThis.PointerEvent) => {
      if (upEvent.pointerId !== start.pointerId) return
      const moved = Math.hypot(upEvent.clientX - start.startX, upEvent.clientY - start.startY) >= DRAG_THRESHOLD
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
      setIsInteracting(false)
      setDragSnapshot(null)
      if (start.startedDragging && start.pendingRatio) {
        savedPositions[positionKey] = start.pendingRatio
        setPositionRatio(start.pendingRatio)
        setIsExpanded(false)
      } else if (!moved) {
        setIsExpanded((value) => !value)
      }
      setDragPixelPosition(null)
      setIsDragging(false)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
  }

  const body = (
    <div
      ref={anchorRef}
      className={`floating-block-anchor${isExpanded ? ' is-expanded' : ''}${isDragging ? ' is-dragging' : ''}${isInteracting || dragSnapshot ? ' is-interacting' : ''}${isDark ? ' is-dark' : ''}${actionsReady ? ' is-actions-ready' : ''}`}
      style={anchorStyle}
    >
      <div className="floating-block-actions">
        <AnimatePresence>
          {isExpanded &&
            actionButtons.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                className="floating-block-action"
                style={{ '--fab-x': `${item.x}px`, '--fab-y': `${item.y}px` } as CSSProperties}
                title={item.label}
                aria-label={item.label}
                initial={{ opacity: 0, x: '-50%', y: '-50%', scale: 0.72 }}
                animate={{ opacity: 1, x: `calc(-50% + ${item.x}px)`, y: `calc(-50% + ${item.y}px)`, scale: 1 }}
                exit={{ opacity: 0, x: '-50%', y: '-50%', scale: 0.72 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                onClick={(event) => {
                  event.stopPropagation()
                  if (!KEEP_OPEN_ACTION_IDS.has(item.id)) setIsExpanded(false)
                  item.handler()
                }}
              >
                <Icon icon={item.icon} className="floating-block-action-icon" />
              </motion.button>
            ))}
        </AnimatePresence>
      </div>
      <div className="floating-block-main-wrap">
        <button
          type="button"
          className="floating-block-main"
          aria-label={isExpanded ? '收起功能菜单' : '展开功能菜单'}
          title={isExpanded ? '收起功能菜单' : '展开功能菜单'}
          onPointerDown={onMainPress}
          onClick={(event) => {
            event.stopPropagation()
            if (blockClickRef.current) {
              event.preventDefault()
              blockClickRef.current = false
            }
          }}
        >
          <span className={`floating-block-main-icon-wrap${isExpanded ? ' is-expanded' : ''}`}>
            <span className="floating-block-main-icon-face floating-block-main-icon-face--front" aria-hidden="true">
              <Icon icon={FAB_ICONS.mainCollapsed} className="floating-block-main-icon" />
            </span>
            <span className="floating-block-main-icon-face floating-block-main-icon-face--back" aria-hidden="true">
              <Icon icon={FAB_ICONS.mainExpanded} className="floating-block-main-icon" />
            </span>
          </span>
        </button>
      </div>
    </div>
  )

  return createPortal(body, document.body)
}
