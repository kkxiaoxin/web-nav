import { useEffect, useMemo, useState } from 'react'
import animalsSrc from './assets/img/animals.png'
import { Home } from './pages/Home'
import { MarkdownViewer } from './pages/MarkdownViewer'
import { getAppPath, isWithinBasePath, stripBasePath } from './utils/prefix'

function withThemeTransition(callback: () => void) {
  const doc = document.documentElement
  const startViewTransition = (document as Document & { startViewTransition?: (callback: () => void) => void }).startViewTransition?.bind(document)
  if (!startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    callback()
    return
  }
  doc.classList.add('theme-switching')
  startViewTransition(() => {
    callback()
    window.setTimeout(() => doc.classList.remove('theme-switching'), 60)
  })
}

export function App() {
  const [isDark, setIsDark] = useState(() => window.localStorage.getItem('theme') === 'dark')
  const route = useMemo(() => {
    const currentPathname = decodeURIComponent(window.location.pathname)
    if (!isWithinBasePath(currentPathname)) return { name: 'notFound', path: currentPathname }
    const pathname = stripBasePath(currentPathname)
    if (pathname === '/') return { name: 'home', path: '' }
    if (pathname.startsWith('/datas/')) return { name: 'markdown', path: pathname.replace(/^\/datas\//, '') }
    return { name: 'notFound', path: pathname }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', isDark)
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  function toggleTheme() {
    withThemeTransition(() => setIsDark((value) => !value))
  }

  return (
    <div id="app" className={isDark ? 'app--dark' : ''}>
      {route.name === 'markdown' ? (
        <MarkdownViewer path={route.path} />
      ) : route.name === 'home' ? (
        <Home isDark={isDark} onToggleTheme={toggleTheme} />
      ) : (
        <main className="not-found-page">
          <div className="not-found-panel glass-panel">
            <p className="not-found-code">404</p>
            <h1 className="not-found-title">页面不存在</h1>
            <p className="not-found-desc">💥请检查页面路径是否正确</p>
            <a className="not-found-link" href={getAppPath('/')}>返回首页</a>
          </div>
        </main>
      )}
      <div className="animals-footer-wrapper" aria-hidden="true">
        <div className="animals-footer-inner">
          <img src={animalsSrc} alt="底部动物装饰" className="animals-footer-image" />
        </div>
      </div>
    </div>
  )
}
