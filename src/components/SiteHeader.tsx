import { Icon } from '@iconify/react'
import { FAB_ICONS } from '../config/fabIcons'
import { APP_CONFIG } from '../config/app'
import { getAppPath, getPublicFilePath } from '../utils/prefix'

interface SiteHeaderProps {
  isDark: boolean
  navEnabled?: boolean
  onOpenSearch: () => void
  onToggleTheme: () => void
  onOpenNav?: () => void
}

export function SiteHeader({ isDark, navEnabled = true, onOpenSearch, onToggleTheme, onOpenNav }: SiteHeaderProps) {
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
    <header id="main-header" className="main-header">
      <div className="header-scrolled-filter">
        <div className="app-layout">
          <div className="top-nav-wrap">
            <div className="header-floating-left">
              <a className="header-brand-link" href={getAppPath('/')} aria-label={APP_CONFIG.SITE_NAME}>
                <img className="header-brand-logo" src={getPublicFilePath(APP_CONFIG.SITE_LOGO)} alt="" width="32" height="32" />
                <span className="header-brand-name">{APP_CONFIG.SITE_NAME}</span>
              </a>
            </div>

            <nav className="header-floating-right" aria-label="站点操作">
              <button
                type="button"
                className="nav-icon-btn"
                aria-label="搜索"
                title="搜索"
                onClick={handleNavClick(onOpenSearch)}
                onPointerUp={releaseNavButtonFocus}
              >
                <Icon icon={FAB_ICONS.search} className="nav-icon-btn__icon" />
              </button>
              {navEnabled && onOpenNav && (
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
                onClick={handleNavClick(onToggleTheme)}
                onPointerUp={releaseNavButtonFocus}
              >
                <Icon icon={isDark ? FAB_ICONS.themeLight : FAB_ICONS.themeDark} className="nav-icon-btn__icon" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
