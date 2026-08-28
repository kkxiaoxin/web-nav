
import { useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from '@iconify/react'

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'

import { createPortal } from 'react-dom'

import type { NavCard } from '../types'

import { APP_CONFIG } from '../config/app'

import { copyText } from '../utils/clipboard'

import { getPublicFilePath } from '../utils/prefix'

import { getLatencyTier, measureLinkLatency, resolvePingUrl } from '../utils/siteLatency'



interface CardItemProps {

  card: NavCard

  onClick: (card: NavCard) => void

}



function CloseIcon() {

  return (

    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">

      <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

    </svg>

  )

}



function ArrowIcon() {

  return (

    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">

      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

    </svg>

  )

}



function CopyIcon() {

  return (

    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">

      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />

      <path d="M5 11H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.4" />

    </svg>

  )

}



function CheckIcon() {

  return (

    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">

      <path d="M3.25 8.2l3 3 6.5-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

    </svg>

  )

}



function TitleIcon() {

  return (

    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">

      <path d="M3 4.5h10M3 8h7M3 11.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />

    </svg>

  )

}



function getLatencyStatusClass(tier: string, state: 'pending' | 'ok' | 'error') {

  if (state === 'pending') return 'friend-status-tag--pending'

  if (state === 'error') return 'friend-status-tag--down'

  if (tier === 'fast') return 'friend-status-tag--fast'

  if (tier === 'moderate') return 'friend-status-tag--ok'

  if (tier === 'slow') return 'friend-status-tag--slow'

  return 'friend-status-tag--down'

}



function getLatencyStatusLabel(tier: string, state: 'pending' | 'ok' | 'error', latencyMs: number | null) {

  if (state === 'pending') return '检测中'

  if (state === 'error') return '不可达'

  if (tier === 'fast') return latencyMs != null ? `${latencyMs}ms` : '快速'

  if (tier === 'moderate') return latencyMs != null ? `${latencyMs}ms` : '正常'

  if (tier === 'slow') return latencyMs != null ? `${latencyMs}ms` : '较慢'

  return '不可达'

}



export function CardItem({ card, onClick }: CardItemProps) {

  const rootRef = useRef<HTMLDivElement>(null)

  const titleRef = useRef<HTMLDivElement>(null)

  const [logoLoadFailed, setLogoLoadFailed] = useState(false)

  const [linkCopied, setLinkCopied] = useState(false)

  const [detailsOpen, setDetailsOpen] = useState(false)

  const [titleDialogOpen, setTitleDialogOpen] = useState(false)

  const [isTitleTruncated, setIsTitleTruncated] = useState(false)

  const [latencyState, setLatencyState] = useState<'pending' | 'ok' | 'error'>('pending')

  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  const isDialogOpen = detailsOpen || titleDialogOpen

  const cardId = useMemo(() => {

    const raw = `${card.name}|${card.link}`

    let hash = 0

    for (let i = 0; i < raw.length; i += 1) {

      hash = (hash << 5) - hash + raw.charCodeAt(i)

      hash |= 0

    }

    return `card-${Math.abs(hash).toString(36)}`

  }, [card.link, card.name])



  const useImageLogo = typeof card.logo === 'string' && card.logo.trim().length > 0 && !logoLoadFailed

  const latencyTier = latencyState === 'pending' ? 'pending' : latencyState === 'error' ? 'unreachable' : getLatencyTier(latencyMs)

  const displayLink = card.link.replace(/^https?:\/\//i, '').replace(/^\.\/?/, '')

  const cardDesc = String(card.desc ?? '').trim() || '前方一个神秘的网站等待您的探索🚀'

  const latencyStatusClass = getLatencyStatusClass(latencyTier, latencyState)

  const latencyStatusLabel = getLatencyStatusLabel(latencyTier, latencyState, latencyMs)

  const latencyTitle = latencyState === 'pending' ? '正在检测响应延迟' : latencyState === 'error' ? '站点不可访问' : `${latencyMs}ms`



  const letterLogoStyle = useMemo(() => {

    const seed = `${card.name}|${card.link}`

    let h = 2166136261

    for (let i = 0; i < seed.length; i += 1) {

      h ^= seed.charCodeAt(i)

      h = Math.imul(h, 16777619)

    }

    return {

      backgroundColor: `hsl(${Math.abs(h) % 360}, 55%, 48%)`,

      color: '#ffffff',

      textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'

    }

  }, [card.link, card.name])



  const logoLetter = useMemo(() => {

    const plain = String(card.name ?? '').replace(/<[^>]*>/g, '').replace(/^\s+/, '')

    const ch = Array.from(plain)[0]

    if (!ch) return '?'

    return /[a-z]/.test(ch) ? ch.toUpperCase() : ch

  }, [card.name])



  useEffect(() => {

    if (!detailsOpen && !titleDialogOpen) return

    const onKeyDown = (event: KeyboardEvent) => {

      if (event.key !== 'Escape') return

      if (titleDialogOpen) {

        setTitleDialogOpen(false)

        return

      }

      setDetailsOpen(false)

    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)

  }, [detailsOpen, titleDialogOpen])



  useEffect(() => {

    if (!isDialogOpen) return

    const previous = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    document.body.classList.add('card-dialog-open')

    return () => {

      document.body.style.overflow = previous

      document.body.classList.remove('card-dialog-open')

    }

  }, [isDialogOpen])



  useEffect(() => {

    const check = () => {

      const el = titleRef.current

      setIsTitleTruncated(Boolean(el && el.scrollWidth > el.clientWidth + 1))

    }

    check()

    const observer = new ResizeObserver(check)

    if (titleRef.current) observer.observe(titleRef.current)

    return () => observer.disconnect()

  }, [card.name])



  useEffect(() => {

    if (APP_CONFIG.SITE_LATENCY !== 1) return

    let cancelled = false

    let observer: IntersectionObserver | null = null

    setLatencyState('pending')

    setLatencyMs(null)



    const checkLatency = async () => {

      const url = resolvePingUrl(card.link)

      if (!url) {

        if (!cancelled) setLatencyState('error')

        return

      }

      const result = await measureLinkLatency(url)

      if (cancelled) return

      if (result.ok) {

        setLatencyState('ok')

        setLatencyMs(result.ms)

      } else {

        setLatencyState('error')

      }

    }



    if ('IntersectionObserver' in window && rootRef.current) {

      observer = new IntersectionObserver(

        (entries) => {

          if (!entries.some((entry) => entry.isIntersecting)) return

          observer?.disconnect()

          checkLatency()

        },

        { root: null, rootMargin: '120px 0px', threshold: 0 }

      )

      observer.observe(rootRef.current)

    } else {

      checkLatency()

    }



    return () => {

      cancelled = true

      observer?.disconnect()

    }

  }, [card.link])



  function getImageSrc(logoPath: string) {

    if (!logoPath) return ''

    if (/^(https?:)?\/\//i.test(logoPath)) return logoPath

    return getPublicFilePath(logoPath)

  }



  function getCopyLink() {

    const link = card.link

    if (!link) return ''

    if (/^(https?:)?\/\//i.test(link)) return link

    if (link.startsWith('./') || link.startsWith('/')) return getPublicFilePath(link.replace(/^\.\//, '/'))

    return link

  }



  function handleCardGlow(event: ReactMouseEvent<HTMLDivElement>) {

    const rect = event.currentTarget.getBoundingClientRect()

    const x = event.clientX - rect.left

    const y = event.clientY - rect.top

    event.currentTarget.style.setProperty('--mouse-x', `${x}px`)

    event.currentTarget.style.setProperty('--mouse-y', `${y}px`)

  }



  async function handleCopyLink(event?: ReactMouseEvent) {

    event?.stopPropagation()

    const copied = await copyText(getCopyLink())

    if (!copied) return

    setLinkCopied(true)

    window.setTimeout(() => setLinkCopied(false), 1000)

  }



  function closeDetailsDialog(event?: ReactMouseEvent) {

    event?.stopPropagation()

    setDetailsOpen(false)

  }



  function closeTitleDialog(event?: ReactMouseEvent) {

    event?.stopPropagation()

    setTitleDialogOpen(false)

  }



  function openTitleDialog(event: ReactMouseEvent) {

    event.stopPropagation()

    setTitleDialogOpen(true)

  }



  function handleJump(event?: ReactMouseEvent) {

    event?.stopPropagation()

    onClick(card)

    setDetailsOpen(false)

    setTitleDialogOpen(false)

  }



  function openDetailsDialog() {

    setDetailsOpen(true)

  }



  function handleCardKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {

    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()

    openDetailsDialog()

  }



  const stopDialogClose = (event: ReactMouseEvent) => event.stopPropagation()

  const detailsDialog = detailsOpen ? (

    <div className="card-details-mask is-open" role="presentation" onMouseDown={closeDetailsDialog} onClick={(event) => event.stopPropagation()}>

      <div

        className="card-details-dialog"

        role="dialog"

        aria-modal={titleDialogOpen ? undefined : true}

        aria-hidden={titleDialogOpen ? true : undefined}

        aria-labelledby={`${cardId}-details-title`}

        onMouseDown={stopDialogClose}

      >

        <div className="card-details-dialog__header">

          <h2 id={`${cardId}-details-title`} className="card-details-dialog__title" title={card.name}>

            {card.name}

          </h2>

          <button type="button" className="card-details-dialog__close" aria-label="关闭弹窗" title="关闭弹窗" onClick={closeDetailsDialog}>

            <CloseIcon />

          </button>

        </div>

        <div className="card-details-dialog__body">

          <p className="card-details-dialog__desc">{cardDesc}</p>

        </div>

        <div className="card-details-dialog__actions" style={{ '--action-columns': isTitleTruncated ? 3 : 2 } as CSSProperties}>

          <button type="button" className="card-details-dialog__action card-details-dialog__action--primary" onClick={handleJump}>

            <ArrowIcon />

            <span>访问网站</span>

          </button>

          {isTitleTruncated && (

            <button type="button" className="card-details-dialog__action" onClick={openTitleDialog}>

              <TitleIcon />

              <span>完整标题</span>

            </button>

          )}

          <button type="button" className={`card-details-dialog__action${linkCopied ? ' is-copied' : ''}`} onClick={handleCopyLink}>

            {linkCopied ? <CheckIcon /> : <CopyIcon />}

            <span>{linkCopied ? '已复制' : '复制链接'}</span>

          </button>

        </div>

      </div>

    </div>

  ) : null



  const titleDialog = titleDialogOpen ? (

    <div className="card-title-dialog-mask is-open" role="presentation" onMouseDown={closeTitleDialog} onClick={(event) => event.stopPropagation()}>

      <div className="card-title-dialog" role="dialog" aria-modal="true" aria-labelledby={`${cardId}-title-title`} onMouseDown={stopDialogClose}>

        <div className="card-title-dialog__header">

          <h2 id={`${cardId}-title-title`} className="card-title-dialog__title" title={card.name}>

            完整标题

          </h2>

          <button type="button" className="card-title-dialog__close" aria-label="关闭标题弹窗" title="关闭标题弹窗" onClick={closeTitleDialog}>

            <CloseIcon />

          </button>

        </div>

        <div className="card-title-dialog__body">

          <p className="card-title-dialog__text">{card.name}</p>

        </div>

      </div>

    </div>

  ) : null



  return (

    <div

      ref={rootRef}

      className={`card-item friend-card app-card${detailsOpen ? ' is-details-open' : ''}${titleDialogOpen ? ' is-title-dialog-open' : ''}`}

      role="button"

      tabIndex={0}

      aria-label={card.name}

      onClick={openDetailsDialog}

      onKeyDown={handleCardKeyDown}

      onMouseMove={handleCardGlow}

    >

      <div className="friend-card-glow" aria-hidden="true" />

      {card.star === 1 ? (
        <span className="card-recommendation-badge" aria-label="推荐" title="推荐">
          <Icon icon="solar:star-bold" aria-hidden="true" />
          <span>推荐</span>
        </span>
      ) : null}

      {APP_CONFIG.SITE_LATENCY === 1 ? (
        <span className={`friend-status-tag ${latencyStatusClass}${latencyState === 'pending' ? ' friend-status-tag--pulse' : ''}`} role="status" aria-label={latencyTitle} title={latencyTitle}>

          {latencyStatusLabel}

        </span>
      ) : null}

      <div className="friend-body">

        <div className="friend-main">

          <div className="friend-avatar-wrap">

            {useImageLogo ? (

              <img src={getImageSrc(card.logo)} alt="" className="friend-avatar" loading="lazy" decoding="async" onError={() => setLogoLoadFailed(true)} />

            ) : (

              <div className="friend-avatar friend-avatar--letter" style={letterLogoStyle} aria-hidden="true">

                {logoLetter}

              </div>

            )}

          </div>

          <div className="friend-meta">

            <div ref={titleRef} className="friend-name" title={card.name}>

              {card.name}

            </div>

            <div className="friend-host" title={card.link}>

              {displayLink}

            </div>

          </div>

        </div>

        <p className="friend-desc">{cardDesc}</p>

      </div>



      {createPortal(detailsDialog, document.body)}

      {createPortal(titleDialog, document.body)}

    </div>

  )

}


