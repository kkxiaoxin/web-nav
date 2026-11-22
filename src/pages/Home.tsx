import { useEffect, useMemo, useState } from 'react'

import { CardItem } from '../components/CardItem'

import { FloatingBlock } from '../components/FloatingBlock'

import { HangCatScroll } from '../components/HangCatScroll'

import { HomeNavOutline } from '../components/OutlineList'

import { SearchDialog } from '../components/SearchDialog'

import { HomeHeader } from '../components/HomeHeader'

import { HomeCategoryNav } from '../components/HomeCategoryNav'

import type { NavCard, NavCategory } from '../types'

import { getAppPath, getPublicFilePath } from '../utils/prefix'

import { countCardsInCategories, filterCardsByKeyword } from '../utils/siteSearch'



const categoryAccents = [
  { light: '#2368d8', dark: '#4a9aef' },
  { light: '#7550c7', dark: '#9b7bf0' },
  { light: '#b85718', dark: '#f18a3d' },
  { light: '#987000', dark: '#d9ad32' },
  { light: '#137d85', dark: '#34b9bf' },
  { light: '#557b22', dark: '#8abb49' },
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



  const indexedCategories = useMemo(() => cardData.map((category, order) => ({
    ...category,
    order,
    accent: categoryAccents[order % categoryAccents.length][isDark ? 'dark' : 'light'],
  })), [cardData, isDark])

  const displayCardData = useMemo(() => filterCardsByKeyword(indexedCategories, siteSearchKeyword), [indexedCategories, siteSearchKeyword])

  const totalCardCount = countCardsInCategories(displayCardData)

  const isSiteSearchActive = siteSearchKeyword.trim().length > 0 && displayCardData.length > 0

  const isSiteSearchEmpty = siteSearchKeyword.trim().length > 0 && displayCardData.length === 0



  function scrollToNav(navId: string, behavior: ScrollBehavior = 'smooth') {

    const element = document.getElementById(navId)

    if (!element) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    element.scrollIntoView({ behavior: reduceMotion ? 'instant' : behavior, block: 'start' })

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



  return (

    <div className="home-container">

      <div className="app-layout home-layout">
        <div className="home-main">
          <HomeHeader categoryCount={displayCardData.length} siteCount={totalCardCount} onOpenSearch={() => setSearchDialogOpen(true)} />

          <main className="main-content">
            <HomeCategoryNav categories={displayCardData} onSelect={(navId) => scrollToNav(navId, 'instant')} />

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

              {displayCardData.map((category, index) => {
                const { order, accent } = category

                return (

                  <section key={order} id={`nav-category-${index}`} className="friend-group" aria-labelledby={`nav-category-title-${index}`} style={{ '--category-accent': accent } as React.CSSProperties}>

                    <div className="friend-group-header">
                      <h2 id={`nav-category-title-${index}`} className="friend-group-title">
                        <span className="friend-group-index" aria-hidden="true">{String(order + 1).padStart(2, '0')}</span>
                        <span>{category.title}</span>
                      </h2>
                      <div className="friend-group-meta">
                        <p className="friend-group-desc">这里有 {category.menu?.length || 0} 个神秘的网站等待探索</p>
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

                )
              })}

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


