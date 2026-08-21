import { useEffect, useMemo, useState } from 'react'

import { APP_CONFIG } from '../config/app'

import { CardItem } from '../components/CardItem'

import { FloatingBlock } from '../components/FloatingBlock'

import { HangCatScroll } from '../components/HangCatScroll'

import { HomeNavOutline } from '../components/OutlineList'

import { SearchDialog } from '../components/SearchDialog'

import { SiteHeader } from '../components/SiteHeader'

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

  const [navOutlineOpen, setNavOutlineOpen] = useState(false)

  const [searchDialogOpen, setSearchDialogOpen] = useState(false)

  const [siteSearchKeyword, setSiteSearchKeyword] = useState('')



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

    const targetTop = element.getBoundingClientRect().top + window.scrollY - 120

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

      <SiteHeader

        isDark={isDark}

        navEnabled={displayCardData.length > 0}

        onOpenSearch={() => setSearchDialogOpen(true)}

        onToggleTheme={onToggleTheme}

        onOpenNav={() => setNavOutlineOpen(true)}

      />



      <div className="app-layout home-layout">
        <div className="home-main">
          {(APP_CONFIG.SITE_DESCRIPTION || totalCardCount > 0) && (
            <section className="page-hero" aria-label="站点概览">
              <div className="page-hero__lead">
                <span className="page-hero__accent" aria-hidden="true" />
                {APP_CONFIG.SITE_DESCRIPTION && <p className="page-hero__desc">{APP_CONFIG.SITE_DESCRIPTION}</p>}
              </div>
              {totalCardCount > 0 && (
                <div className="page-hero__badges">
                  <span className="hero-badge">{displayCardData.length} 分类</span>
                  <span className="hero-badge">{totalCardCount} 站点</span>
                </div>
              )}
            </section>
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

                <section key={category.title} id={`nav-category-${index}`} className="friend-group" style={getCategoryBadgeStyle(index)}>

                  <div className="friend-group-header">
                    <h2 className="friend-group-title">{category.title}</h2>
                    <div className="friend-group-meta">
                      <p className="friend-group-desc">这里有 {category.menu?.length || 0} 个正在发光的站点</p>
                      <span className="friend-group-badge">{category.menu?.length || 0} sites</span>
                    </div>
                  </div>

                  <div className="friend-grid">

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



      <FloatingBlock
        isDark={isDark}
        navEnabled={displayCardData.length > 0}
        onToggleTheme={onToggleTheme}
        onOpenSearch={() => setSearchDialogOpen(true)}
        onOpenNav={() => setNavOutlineOpen(true)}
      />

      <SearchDialog

        open={searchDialogOpen}

        onClose={() => setSearchDialogOpen(false)}

        onSiteSearch={(keyword) => {

          setSiteSearchKeyword(keyword)

          if (keyword) window.scrollTo({ top: 0, behavior: 'smooth' })

        }}

      />

      {navOutlineOpen && <div className={`home-nav-mask${isDark ? ' is-dark' : ''}`} onClick={() => setNavOutlineOpen(false)} />}

      <HomeNavOutline categories={displayCardData} open={navOutlineOpen} isDark={isDark} onClose={() => setNavOutlineOpen(false)} onSelect={scrollToNav} />

    </div>

  )

}


