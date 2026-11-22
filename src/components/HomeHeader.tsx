import { Icon } from '@iconify/react'
import { APP_CONFIG } from '../config/app'
import { FAB_ICONS } from '../config/fabIcons'
import { PageHero } from './PageHero'

interface HomeHeaderProps {
  categoryCount: number
  siteCount: number
  onOpenSearch: () => void
}

export function HomeHeader({ categoryCount, siteCount, onOpenSearch }: HomeHeaderProps) {
  return (
    <PageHero description={APP_CONFIG.SITE_DESCRIPTION}>
      <div className="page-hero__badges">
        <span className="hero-badge">{categoryCount} 分类</span>
        <span className="hero-badge">{siteCount} 站点</span>
        <button type="button" className="hero-badge hero-search-button" aria-label="搜索站点" title="搜索站点" onClick={onOpenSearch}>
          <Icon icon={FAB_ICONS.search} />
        </button>
      </div>
    </PageHero>
  )
}
