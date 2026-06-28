import { Icon } from '@iconify/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { NavCard } from '../types'
import { copyText } from '../utils/clipboard'
import { getPublicFilePath } from '../utils/prefix'
import { getLatencyTier, measureLinkLatency, resolvePingUrl } from '../utils/siteLatency'

interface CardItemProps {
  card: NavCard
  onClick: (card: NavCard) => void
}

export function CardItem({ card, onClick }: CardItemProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [actionsVisible, setActionsVisible] = useState(false)
  const [titlePreviewVisible, setTitlePreviewVisible] = useState(false)
  const [isTitleTruncated, setIsTitleTruncated] = useState(false)
  const [latencyState, setLatencyState] = useState<'pending' | 'ok' | 'error'>('pending')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  const useImageLogo = typeof card.logo === 'string' && card.logo.trim().length > 0 && !imageLoadFailed
  const latencyTier = latencyState === 'pending' ? 'pending' : latencyState === 'error' ? 'unreachable' : getLatencyTier(latencyMs)
  const isMarkdownCard = /\.md(?:[?#].*)?$/i.test(card.link.trim())
  const linkType = isMarkdownCard ? '文档' : '外链'
  const linkTypeIcon = isMarkdownCard ? 'mdi:file-document-outline' : 'mdi:open-in-new'
  const displayLink = card.link.replace(/^https?:\/\//i, '')
  const latencyIcon =
    latencyState === 'pending'
      ? 'streamline-ultimate:loading-bold'
      : latencyState === 'error'
        ? 'mdi:close-network'
        : ({ fast: 'mdi:signal-cellular-3', moderate: 'mdi:signal-cellular-2', slow: 'mdi:signal-cellular-1', unreachable: 'mdi:signal-cellular-0' } as Record<string, string>)[latencyTier] || 'mdi:signal-cellular-0'

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
      textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
      borderColor: 'transparent'
    }
  }, [card.link, card.name])

  const logoLetter = useMemo(() => {
    const plain = String(card.name ?? '').replace(/<[^>]*>/g, '').replace(/^\s+/, '')
    const ch = Array.from(plain)[0]
    if (!ch) return '?'
    return /[a-z]/.test(ch) ? ch.toUpperCase() : ch
  }, [card.name])

  useEffect(() => {
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!actionsVisible && !titlePreviewVisible) return
      if (rootRef.current?.contains(event.target as Node)) return
      setActionsVisible(false)
      setTitlePreviewVisible(false)
    }
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }, [actionsVisible, titlePreviewVisible])

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

  function isTouchLikeDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches
  }

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

  async function handleCopyLink() {
    const copied = await copyText(getCopyLink())
    if (!copied) return
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 1000)
  }

  function handleJump() {
    onClick(card)
    setActionsVisible(false)
    setTitlePreviewVisible(false)
  }

  const latencyTitle = latencyState === 'pending' ? '正在检测响应延迟' : latencyState === 'error' ? '站点不可访问' : `${latencyMs}ms`

  return (
    <div
      ref={rootRef}
      className={`card-item ${actionsVisible ? 'is-actions-visible' : ''} ${titlePreviewVisible ? 'is-title-preview-visible' : ''} card-item--latency-${latencyTier} ${latencyState === 'pending' ? 'card-item--latency-pulse' : ''}`}
      aria-label={card.name}
      onClick={() => {
        if (isTouchLikeDevice()) {
          setActionsVisible(true)
          return
        }
        onClick(card)
      }}
    >
      <div className="card-shine" aria-hidden="true"></div>
      <span className="card-latency-status" role="status" aria-label={latencyTitle} title={latencyTitle}>
        <Icon icon={latencyIcon} className={`latency-icon${latencyState === 'pending' ? ' latency-icon--spin' : ''}`} />
      </span>
      <div className="card-content">
        <div className="card-logo-slot">
          {useImageLogo ? (
            <img src={getImageSrc(card.logo)} alt={card.name} className="card-logo" onError={() => setImageLoadFailed(true)} />
          ) : (
            <div className="card-logo card-logo--letter" style={letterLogoStyle} aria-hidden="true">
              {logoLetter}
            </div>
          )}
        </div>
        <div className="card-info">
          <div ref={titleRef} className="card-title" title={card.name}>
            {card.name}
          </div>
          <div className="card-link">
            <span className={`card-link-type${isMarkdownCard ? ' card-link-type--doc' : ' card-link-type--external'}`} aria-label={linkType}>
              <Icon icon={linkTypeIcon} className="card-link-type__icon" />
            </span>
            <span className="link-text" title={card.link}>
              {displayLink}
            </span>
          </div>
        </div>
      </div>
      <div
        className="card-hover-mask"
        onClick={(event) => {
          event.stopPropagation()
          if (titlePreviewVisible) setTitlePreviewVisible(false)
          else if (isTouchLikeDevice()) setActionsVisible(false)
        }}
      >
        {titlePreviewVisible ? (
          <div className="card-title-preview" onClick={(event) => event.stopPropagation()}>
            <div className="card-title-preview__body">
              <p className="card-title-preview__text">{card.name}</p>
            </div>
            <div className="card-title-preview__aside">
              <button type="button" className="card-title-preview__close" aria-label="关闭标题预览" onClick={() => setTitlePreviewVisible(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="card-hover-actions">
            <button type="button" className="card-action-btn card-action-btn--primary" title="跳转" aria-label="跳转" onClick={(event) => {
              event.stopPropagation()
              handleJump()
            }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="card-action-label">跳转</span>
            </button>
            <button type="button" className={`card-action-btn${linkCopied ? ' is-copied' : ''}`} title={linkCopied ? '已复制' : '复制链接'} aria-label={linkCopied ? '已复制' : '复制链接'} onClick={(event) => {
              event.stopPropagation()
              handleCopyLink()
            }}>
              {linkCopied ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 8.5l2.5 2.5L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 11H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              )}
              <span className="card-action-label">{linkCopied ? '已复制' : '复制链接'}</span>
            </button>
            {isTitleTruncated && (
              <button type="button" className="card-action-btn" title="显示完整标题" aria-label="显示完整标题" onClick={(event) => {
                event.stopPropagation()
                setTitlePreviewVisible(true)
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 4.5h10M3 8h7M3 11.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className="card-action-label">完整标题</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
