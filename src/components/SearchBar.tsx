import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react'

const SEARCH_ENGINE_STORAGE_KEY = 'search-engine'

const searchEngines = [
  { key: 'site', name: '站内搜索', url: '' },
  { key: 'baidu', name: '百度搜索', url: 'https://www.baidu.com/s?wd=' },
  { key: 'google', name: '谷歌搜索', url: 'https://www.google.com/search?q=' },
  { key: 'bing', name: '必应搜索', url: 'https://www.bing.com/search?q=' }
]

interface SearchBarProps {
  variant?: 'inline' | 'dialog'
  onSearched?: () => void
  onSiteSearch?: (keyword: string) => void
  autoFocus?: boolean
}

export function SearchBar({ variant = 'inline', onSearched, onSiteSearch, autoFocus }: SearchBarProps) {
  const [selectedEngine, setSelectedEngine] = useState('site')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isEngineMenuOpen, setIsEngineMenuOpen] = useState(false)
  const [activeEngineIndex, setActiveEngineIndex] = useState(0)
  const engineListboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const engineToggleRef = useRef<HTMLButtonElement>(null)
  const engineSelectRef = useRef<HTMLDivElement>(null)
  const previousEngine = useRef(selectedEngine)

  const isSiteSearch = selectedEngine === 'site'
  const searchPlaceholder = isSiteSearch ? '搜索站内卡片标题...' : '输入想搜索的内容...'

  useEffect(() => {
    const savedEngine = window.localStorage.getItem(SEARCH_ENGINE_STORAGE_KEY)
    if (searchEngines.some((engine) => engine.key === savedEngine)) {
      setSelectedEngine(savedEngine || 'site')
    }
  }, [])

  useEffect(() => {
    if (autoFocus) {
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [autoFocus])

  useEffect(() => {
    if (!isEngineMenuOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (!engineSelectRef.current?.contains(event.target as Node)) {
        setIsEngineMenuOpen(false)
      }
    }
    window.addEventListener('pointerdown', handlePointerDown, true)
    return () => window.removeEventListener('pointerdown', handlePointerDown, true)
  }, [isEngineMenuOpen])

  useEffect(() => {
    window.localStorage.setItem(SEARCH_ENGINE_STORAGE_KEY, selectedEngine)
    if (previousEngine.current === 'site' && selectedEngine !== 'site') {
      onSiteSearch?.('')
    }
    previousEngine.current = selectedEngine
  }, [onSiteSearch, selectedEngine])

  useEffect(() => {
    if (!isSiteSearch) return
    const keyword = searchKeyword.trim()
    if (!keyword) {
      onSiteSearch?.('')
      return
    }
    const timer = window.setTimeout(() => onSiteSearch?.(keyword), 250)
    return () => window.clearTimeout(timer)
  }, [isSiteSearch, onSiteSearch, searchKeyword])

  const engine = useMemo(
    () => searchEngines.find((item) => item.key === selectedEngine) || searchEngines[0],
    [selectedEngine]
  )
  const selectedEngineIndex = searchEngines.findIndex((item) => item.key === selectedEngine)

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const keyword = searchKeyword.trim()
    if (!keyword) return
    if (isSiteSearch) {
      onSiteSearch?.(keyword)
      onSearched?.()
      return
    }
    window.open(`${engine.url}${encodeURIComponent(keyword)}`, '_blank', 'noopener,noreferrer')
    onSearched?.()
  }

  function chooseEngine(engineKey: string) {
    setSelectedEngine(engineKey)
    setIsEngineMenuOpen(false)
    engineToggleRef.current?.focus()
  }

  function openEngineMenu(nextIndex = selectedEngineIndex >= 0 ? selectedEngineIndex : 0) {
    setActiveEngineIndex(nextIndex)
    setIsEngineMenuOpen(true)
  }

  function moveActiveEngine(step: number) {
    setActiveEngineIndex((currentIndex) => (currentIndex + step + searchEngines.length) % searchEngines.length)
  }

  return (
    <form className={`search-panel${variant === 'dialog' ? ' search-panel--dialog' : ''}`} onSubmit={handleSearch}>
      <div
        ref={engineSelectRef}
        className={`search-engine-select${isEngineMenuOpen ? ' search-engine-select--open' : ''}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsEngineMenuOpen(false)
          }
        }}
      >
        <button
          ref={engineToggleRef}
          className="search-engine-toggle"
          type="button"
          aria-label="选择搜索引擎"
          aria-haspopup="listbox"
          aria-expanded={isEngineMenuOpen}
          aria-controls={engineListboxId}
          onClick={() => {
            if (isEngineMenuOpen) {
              setIsEngineMenuOpen(false)
              return
            }
            openEngineMenu()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsEngineMenuOpen(false)
              return
            }
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              if (!isEngineMenuOpen) {
                openEngineMenu()
                return
              }
              if (event.key === 'Enter' || event.key === ' ') {
                chooseEngine(searchEngines[activeEngineIndex].key)
                return
              }
              moveActiveEngine(event.key === 'ArrowDown' ? 1 : -1)
            }
            if (isEngineMenuOpen && (event.key === 'Home' || event.key === 'End')) {
              event.preventDefault()
              setActiveEngineIndex(event.key === 'Home' ? 0 : searchEngines.length - 1)
            }
          }}
        >
          {engine.name}
        </button>
        {isEngineMenuOpen && (
          <div id={engineListboxId} className="search-engine-menu" role="listbox" aria-label="搜索引擎">
            {searchEngines.map((engineItem, index) => (
              <button
                key={engineItem.key}
                className={`search-engine-option${engineItem.key === selectedEngine ? ' search-engine-option--selected' : ''}${index === activeEngineIndex ? ' search-engine-option--active' : ''}`}
                type="button"
                role="option"
                aria-selected={engineItem.key === selectedEngine}
                onClick={() => chooseEngine(engineItem.key)}
              >
                {engineItem.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="search-input">
        <input
          ref={inputRef}
          value={searchKeyword}
          placeholder={searchPlaceholder}
          aria-label="搜索内容"
          onChange={(event) => setSearchKeyword(event.target.value)}
        />
        {searchKeyword && (
          <button className="search-input-clear" type="button" aria-label="清空搜索" onClick={() => setSearchKeyword('')}>
            ×
          </button>
        )}
      </div>
      <button className="search-button" type="submit" aria-label="搜索">
        <svg className="search-button-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M10.5 4a6.5 6.5 0 0 1 5.18 10.43l3.45 3.44a.9.9 0 1 1-1.27 1.27l-3.45-3.45A6.5 6.5 0 1 1 10.5 4Zm0 1.8a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Z"
          />
        </svg>
      </button>
    </form>
  )
}
