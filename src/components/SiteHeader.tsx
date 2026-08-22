import { Icon } from '@iconify/react'
import { FAB_ICONS } from '../config/fabIcons'
import { APP_CONFIG } from '../config/app'
import { getPublicFilePath } from '../utils/prefix'

interface SiteHeaderProps {
  title?: string
  isDark?: boolean
  showSearch?: boolean
  showNav?: boolean
  navEnabled?: boolean
  onOpenSearch?: () => void
  onToggleTheme?: () => void
  onOpenNav?: () => void
}

export function SiteHeader({
  title,
  isDark = false,
  showSearch = true,
  showNav = true,
  navEnabled = true,
  onOpenSearch,
  onToggleTheme,
  onOpenNav,
}: SiteHeaderProps) {
  function releaseNavButtonFocus(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.blur()
  }

  function handleNavClick(action: () => void) {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget
      action()
      button.blur()
      window.requestAnimationFrame(() => button.blur())
    }
  }

  return (
    <header id="main-header" className="site-top-header">
      <div className="header-glass top-nav-wrap">
        <div className="header-brand">
          <img className="header-logo" src={getPublicFilePath(APP_CONFIG.SITE_LOGO)} alt="" width="32" height="32" />
          <span className="logo">{title ?? APP_CONFIG.SITE_NAME}</span>
        </div>

        <div className="header-nav" role="group" aria-label="站点操作">
          {showSearch && (
            <button
              type="button"
              className="nav-icon-btn"
              aria-label="搜索"
              title="搜索"
              onClick={handleNavClick(onOpenSearch ?? (() => undefined))}
              onPointerUp={releaseNavButtonFocus}
            >
              <Icon icon={FAB_ICONS.search} className="nav-icon-btn__icon" />
            </button>
          )}
          {showNav && navEnabled && onOpenNav && (
            <button
              type="button"
              className="nav-icon-btn nav-icon-btn--nav"
              aria-label="目录导航"
              title="目录导航"
              onClick={handleNavClick(onOpenNav)}
              onPointerUp={releaseNavButtonFocus}
            >
              <Icon icon={FAB_ICONS.nav} className="nav-icon-btn__icon" />
            </button>
          )}
          <button
            type="button"
            className="nav-icon-btn"
            aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            onClick={handleNavClick(onToggleTheme ?? (() => undefined))}
            onPointerUp={releaseNavButtonFocus}
          >
            <Icon icon={isDark ? FAB_ICONS.themeLight : FAB_ICONS.themeDark} className="nav-icon-btn__icon" />
          </button>
        </div>
      </div>
    </header>
  )
}
