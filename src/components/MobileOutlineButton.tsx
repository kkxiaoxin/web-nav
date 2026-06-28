import { CSSProperties, PointerEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const savedPositions: Record<string, { x: number; y: number }> = {}

interface MobileOutlineButtonProps {
  positionKey?: string
  onOpen: () => void
}

export function MobileOutlineButton({ positionKey = 'default', onOpen }: MobileOutlineButtonProps) {
  const [position, setPosition] = useState(savedPositions[positionKey] || null)
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: 0,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0
  })
  const clickSuppressTimerRef = useRef(0)

  useEffect(() => {
    const clampPosition = () => {
      if (!position) return
      const buttonSize = 44
      const edgePadding = 8
      const next = {
        x: Math.min(Math.max(edgePadding, position.x), window.innerWidth - buttonSize - edgePadding),
        y: Math.min(Math.max(edgePadding, position.y), window.innerHeight - buttonSize - edgePadding)
      }
      savedPositions[positionKey] = next
      if (next.x !== position.x || next.y !== position.y) setPosition(next)
    }
    clampPosition()
    window.addEventListener('resize', clampPosition)
    return () => {
      window.clearTimeout(clickSuppressTimerRef.current)
      window.removeEventListener('resize', clampPosition)
    }
  }, [position, positionKey])

  const buttonStyle: CSSProperties = position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : {}

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== undefined && event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY
    }
    const next = { x: rect.left, y: rect.top }
    savedPositions[positionKey] = next
    setPosition(next)
    event.currentTarget.setPointerCapture?.(event.pointerId)

    const dragButton = (moveEvent: globalThis.PointerEvent) => {
      const drag = dragRef.current
      if (!drag.active || moveEvent.pointerId !== drag.pointerId) return
      moveEvent.preventDefault()
      const deltaX = moveEvent.clientX - drag.startX
      const deltaY = moveEvent.clientY - drag.startY
      if (Math.hypot(deltaX, deltaY) > 6) drag.moved = true
      const buttonSize = 44
      const edgePadding = 8
      const nextPosition = {
        x: Math.min(Math.max(edgePadding, moveEvent.clientX - drag.offsetX), window.innerWidth - buttonSize - edgePadding),
        y: Math.min(Math.max(edgePadding, moveEvent.clientY - drag.offsetY), window.innerHeight - buttonSize - edgePadding)
      }
      savedPositions[positionKey] = nextPosition
      setPosition(nextPosition)
    }

    const stopDrag = (upEvent: globalThis.PointerEvent) => {
      if (upEvent.pointerId !== dragRef.current.pointerId) return
      const moved = dragRef.current.moved
      dragRef.current.active = false
      if (moved) {
        window.clearTimeout(clickSuppressTimerRef.current)
        clickSuppressTimerRef.current = window.setTimeout(() => {
          dragRef.current.moved = false
        }, 180)
      }
      window.removeEventListener('pointermove', dragButton)
      window.removeEventListener('pointerup', stopDrag)
      window.removeEventListener('pointercancel', stopDrag)
    }

    window.addEventListener('pointermove', dragButton, { passive: false })
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)
  }

  const button = (
    <button
      className="mobile-outline-button"
      type="button"
      aria-label="打开目录"
      title="目录"
      style={buttonStyle}
      onPointerDown={startDrag}
      onClick={(event) => {
        if (dragRef.current.moved) {
          event.preventDefault()
          event.stopPropagation()
          window.clearTimeout(clickSuppressTimerRef.current)
          dragRef.current.moved = false
          return
        }
        onOpen()
        event.currentTarget.blur()
      }}
    >
      <span className="mobile-outline-button-line"></span>
      <span className="mobile-outline-button-line"></span>
      <span className="mobile-outline-button-line"></span>
    </button>
  )

  return createPortal(button, document.body)
}
