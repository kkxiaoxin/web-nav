import type { ReactNode } from 'react'
import { APP_CONFIG } from '../config/app'
import { getAppPath, getPublicFilePath } from '../utils/prefix'

interface PageHeroProps {
  description?: string
  linkToHome?: boolean
  children?: ReactNode
}

export function PageHero({ description, linkToHome = false, children }: PageHeroProps) {
  const logo = APP_CONFIG.SITE_LOGO && (
    <img className="page-hero__logo" src={getPublicFilePath(APP_CONFIG.SITE_LOGO)} alt="" width={36} height={36} />
  )

  return (
    <header className="page-hero">
      {linkToHome ? (
        <a className="page-hero__brand" href={getAppPath('/')} aria-label={APP_CONFIG.SITE_NAME + ' · 返回首页'}>
          <span className="page-hero__title">{APP_CONFIG.SITE_NAME}</span>
          {logo}
        </a>
      ) : (
        <div className="page-hero__brand">
          <h1 className="page-hero__title">{APP_CONFIG.SITE_NAME}</h1>
          {logo}
        </div>
      )}
      {description && <p className="page-hero__desc">{description}</p>}
      {children}
    </header>
  )
}
