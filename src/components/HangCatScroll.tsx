import { useEffect, useMemo, useRef, useState } from 'react'
import scrollGif from '../assets/img/scroll.gif'

export function HangCatScroll() {
  const [isActive, setIsActive] = useState(false)
  const [isPc, setIsPc] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [isRetracting, setIsRetracting] = useState(false)
  const isVisibleRef = useRef(false)
  const isReturningTopRef = useRef(false)
  const returnTimerRef = useRef(0)

  useEffect(() => {
    let enterTimer = 0
    let retractTimer = 0
    let settleTimer = 0
    const threshold = 1

    const clearTimers = () => {
      window.clearTimeout(enterTimer)
      window.clearTimeout(retractTimer)
      window.clearTimeout(settleTimer)
      window.clearTimeout(returnTimerRef.current)
    }

    const update = () => {
      const pc = window.matchMedia('(min-width: 56rem)').matches
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 1
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0
      setIsPc(pc)
      setCanScroll(scrollable)
      if (!pc || !scrollable) {
        clearTimers()
        isVisibleRef.current = false
        setIsActive(false)
        setIsEntering(false)
        setIsSettling(false)
        setIsRetracting(false)
        return
      }
      if (isReturningTopRef.current) {
        if (scrollTop <= threshold) {
          isReturningTopRef.current = false
          window.clearTimeout(returnTimerRef.current)
          isVisibleRef.current = false
          setIsActive(false)
          setIsEntering(false)
          setIsSettling(false)
          setIsRetracting(false)
        }
        return
      }
      const shouldShow = scrollTop > threshold
      if (shouldShow) {
        if (isVisibleRef.current) return
        isVisibleRef.current = true
        setIsActive(true)
        setIsEntering(true)
        setIsRetracting(false)
        window.clearTimeout(retractTimer)
        window.clearTimeout(enterTimer)
        window.clearTimeout(settleTimer)
        enterTimer = window.setTimeout(() => {
          setIsEntering(false)
          setIsSettling(true)
          settleTimer = window.setTimeout(() => setIsSettling(false), 50)
        }, 680)
      } else {
        if (!isVisibleRef.current) return
        isVisibleRef.current = false
        setIsEntering(false)
        setIsSettling(false)
        setIsRetracting(true)
        retractTimer = window.setTimeout(() => {
          setIsActive(false)
          setIsRetracting(false)
        }, 380)
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      clearTimers()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const style = useMemo(() => {
    if (!isPc || !canScroll) return { display: 'none' }
    const imageWidth = 80
    const imageHeight = 700
    return {
      '--cat-final-top': `calc(50vh - ${imageHeight}px)`,
      '--cat-height': `${imageHeight}px`,
      position: 'fixed',
      right: '36px',
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      background: `url(${scrollGif}) no-repeat bottom center`,
      backgroundSize: 'contain',
      cursor: 'pointer',
      zIndex: 80,
      pointerEvents: isActive ? 'auto' : 'none',
      overflow: 'hidden'
    } as React.CSSProperties
  }, [canScroll, isActive, isPc])

  return (
    <div
      className={`back-to-top${isActive ? ' active' : ''}${isEntering ? ' entering' : ''}${isSettling ? ' settling' : ''}${isRetracting ? ' retracting' : ''}`}
      style={style}
      role="button"
      aria-label="返回顶部"
      onClick={() => {
        isReturningTopRef.current = true
        window.clearTimeout(returnTimerRef.current)
        setIsEntering(false)
        setIsSettling(false)
        setIsRetracting(true)
        returnTimerRef.current = window.setTimeout(() => {
          isReturningTopRef.current = false
          isVisibleRef.current = false
          setIsActive(false)
          setIsRetracting(false)
        }, 900)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    />
  )
}
