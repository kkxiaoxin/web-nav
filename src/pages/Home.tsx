import { useEffect, useMemo, useState } from 'react'
import { APP_CONFIG } from '../config/app'
import { CardItem } from '../components/CardItem'
import { FloatingBlock } from '../components/FloatingBlock'
import { HangCatScroll } from '../components/HangCatScroll'
import { HomeNavOutline } from '../components/OutlineList'
import { SearchDialog } from '../components/SearchDialog'
import type { NavCard, NavCategory } from '../types'
import { getAppPath, getPublicFilePath } from '../utils/prefix'
import { countCardsInCategories, filterCardsByKeyword } from '../utils/siteSearch'

const categoryBadgeColors = [
  '#5b8def', '#e07c4a', '#4ecdc4', '#c77dff', '#f4a261', '#2ec4b6', '#e76f8a', '#7b9acc', '#84cc16', '#f59e0b',
  '#06b6d4', '#a78bfa', '#fb7185', '#34d399', '#60a5fa', '#f472b6', '#38bdf8', '#fbbf24', '#818cf8', '#2dd4bf'
]

interface HomeProps {
  isDark: boolean
  onToggleTheme: () => void
}

export function Home({ isDark, onToggleTheme }: HomeProps) {
  const [cardData, setCardData] = useState<NavCategory[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const [navOutlineOpen, setNavOutlineOpen] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [siteSearchKeyword, setSiteSearchKeyword] = useState('')

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetch(getPublicFilePath('/datas/data.json'))
      .then((response) => response.json())
      .then((data) => setCardData(data))
      .catch((error) => console.error('加载卡片数据失败:', error))
  }, [])

  const displayCardData = useMemo(() => filterCardsByKeyword(cardData, siteSearchKeyword), [cardData, siteSearchKeyword])
  const totalCardCount = countCardsInCategories(displayCardData)
  const isSiteSearchActive = siteSearchKeyword.trim().length > 0 && displayCardData.length > 0
  const isSiteSearchEmpty = siteSearchKeyword.trim().length > 0 && displayCardData.length === 0

  function scrollToNav(navId: string) {
    const element = document.getElementById(navId)
    if (!element) return
    const targetTop = element.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: targetTop, behavior: 'smooth' })
    setNavOutlineOpen(false)
  }

  function handleCardClick(card: NavCard) {
    if (card.link.endsWith('.md')) {
      const path = card.link.replace(/^\.?\//, '').replace(/^datas\//, '').replace(/\.md$/i, '')
      window.open(getAppPath(`/datas/${path}`), '_blank', 'noopener,noreferrer')
      return
    }
    window.open(card.link, '_blank', 'noopener,noreferrer')
  }

  function getCategoryBadgeStyle(index: number) {
    return { '--category-accent': categoryBadgeColors[index % categoryBadgeColors.length] } as React.CSSProperties
  }

  return (
    <div className="home-container">
      <header className={`site-header${isScrolled ? ' site-header--scrolled' : ''}`}>
        <div className="site-header__glass">
          <div className="site-header__brand">
            <img className="site-header__logo" src={getPublicFilePath(APP_CONFIG.SITE_LOGO)} alt={APP_CONFIG.SITE_NAME} width="32" height="32" />
            <h1 className="site-name">{APP_CONFIG.SITE_NAME}</h1>
          </div>
        </div>
      </header>

      <div className="home-layout">
        {displayCardData.length > 0 && (
          <div className="category-rail-anchor">
            <aside className="category-rail" aria-label="分类导航">
              <nav className="category-rail__nav">
                {displayCardData.map((category, index) => (
                  <button
                    key={category.title}
                    type="button"
                    className="category-rail__item"
                    style={getCategoryBadgeStyle(index)}
                    title={category.title}
                    onClick={() => scrollToNav(`nav-category-${index}`)}
                  >
                    <span className="category-rail__index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="category-rail__label">{category.title}</span>
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <div className="home-main">
          {(APP_CONFIG.SITE_DESCRIPTION || totalCardCount > 0) && (
            <div className="site-meta-hero" role="group" aria-label="站点概览">
              <span className="site-meta-hero__accent" aria-hidden="true"></span>
              {APP_CONFIG.SITE_DESCRIPTION && <p className="site-meta-hero__desc">{APP_CONFIG.SITE_DESCRIPTION}</p>}
              {totalCardCount > 0 && (
                <div className="site-meta-hero__metrics" aria-label="站点统计">
                  <span className="site-meta-hero__metric">
                    <span className="site-meta-hero__metric-num">{displayCardData.length}</span>
                    <span className="site-meta-hero__metric-label">分类</span>
                  </span>
                  <span className="site-meta-hero__metric">
                    <span className="site-meta-hero__metric-num">{totalCardCount}</span>
                    <span className="site-meta-hero__metric-label">站点</span>
                  </span>
                </div>
              )}
            </div>
          )}

          <main className="main-content">
            {isSiteSearchActive && (
              <p className="site-search-summary glass-surface">
                站内搜索「<span className="site-search-keyword">{siteSearchKeyword}</span>」， 共找到 <strong>{totalCardCount}</strong> 个卡片
                <button type="button" className="site-search-clear" onClick={() => setSiteSearchKeyword('')}>
                  清除
                </button>
              </p>
            )}
            {isSiteSearchEmpty && (
              <p className="site-search-empty glass-surface">
                未找到标题包含「{siteSearchKeyword}」的卡片
                <button type="button" className="site-search-clear" onClick={() => setSiteSearchKeyword('')}>
                  清除搜索
                </button>
              </p>
            )}

            <div className="card-grid">
              {displayCardData.map((category, index) => (
                <section key={category.title} id={`nav-category-${index}`} className="category-section glass-surface" style={getCategoryBadgeStyle(index)}>
                  <header className="category-header">
                    <div className="category-header__left">
                      <span className="category-index">{String(index + 1).padStart(2, '0')}</span>
                      <h3 className="category-title-text">{category.title}</h3>
                    </div>
                    <span className="category-count">{category.menu?.length || 0} 项</span>
                  </header>
                  <div className="card-row">
                    {(category.menu || []).map((item, itemIndex) => (
                      <div key={item.name} id={`nav-item-${index}-${itemIndex}`} className="card-nav-anchor" style={{ '--stagger': itemIndex } as React.CSSProperties}>
                        <CardItem card={item} onClick={handleCardClick} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <HangCatScroll />
          </main>
        </div>
      </div>

      <FloatingBlock isDark={isDark} navEnabled={displayCardData.length > 0} onToggleTheme={onToggleTheme} onOpenSearch={() => setSearchDialogOpen(true)} onOpenNav={() => setNavOutlineOpen(true)} />
      <SearchDialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} onSiteSearch={(keyword) => {
        setSiteSearchKeyword(keyword)
        if (keyword) window.scrollTo({ top: 0, behavior: 'smooth' })
      }} />
      {navOutlineOpen && <div className={`home-nav-mask${isDark ? ' is-dark' : ''}`} onClick={() => setNavOutlineOpen(false)}></div>}
      <HomeNavOutline categories={displayCardData} open={navOutlineOpen} isDark={isDark} onClose={() => setNavOutlineOpen(false)} onSelect={scrollToNav} />
    </div>
  )
}
