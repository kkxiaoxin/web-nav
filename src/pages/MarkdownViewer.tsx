import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import dockerfile from 'react-syntax-highlighter/dist/esm/languages/hljs/dockerfile'
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java'
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown'
import nginx from 'react-syntax-highlighter/dist/esm/languages/hljs/nginx'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql'
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml'
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { APP_CONFIG } from '../config/app'
import { MobileOutlineButton } from '../components/MobileOutlineButton'
import { MarkdownOutline } from '../components/OutlineList'
import type { HeadingItem } from '../types'
import { copyText } from '../utils/clipboard'
import { getPublicFilePath, isExternalUrl } from '../utils/prefix'

interface MarkdownViewerProps {
  path: string
}

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('shell', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('docker', dockerfile)
SyntaxHighlighter.registerLanguage('dockerfile', dockerfile)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('jsx', javascript)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('md', markdown)
SyntaxHighlighter.registerLanguage('html', xml)
SyntaxHighlighter.registerLanguage('xml', xml)
SyntaxHighlighter.registerLanguage('nginx', nginx)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('py', python)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('tsx', typescript)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('yml', yaml)

function generateHeadingId(text: string, index: number) {
  const cleanText = text.trim().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-zA-Z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50)
  return `heading-${index}-${cleanText || 'untitled'}`
}

function resolveMarkdownPath(path: string) {
  const parts = String(path || '').split('/').filter(Boolean)
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) throw new Error('文档路径无效')
  return `/datas/${parts.join('/')}.md`
}

function normalizeMarkdownImage(src: string | undefined, markdownPath: string) {
  if (!src || isExternalUrl(src) || src.startsWith('data:')) return src
  if (src.startsWith('/')) return getPublicFilePath(src)
  const markdownDir = markdownPath.split('/').slice(0, -1).join('/')
  const resolvedPath = new URL(src, `https://local${markdownDir}/`).pathname
  return getPublicFilePath(resolvedPath)
}

function CodeCopyButton({ codeText }: { codeText: string }) {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
    }
  }, [])

  async function handleCopy() {
    try {
      const copySucceeded = await copyText(codeText)
      if (!copySucceeded) console.warn('复制可能未成功')
      setCopied(true)
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = window.setTimeout(() => {
        setCopied(false)
        resetTimerRef.current = null
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <button className={`copy-btn${copied ? ' copied' : ''}`} type="button" title="复制代码" onClick={handleCopy}>
      {copied ? '已复制' : '复制'}
    </button>
  )
}

export function MarkdownViewer({ path }: MarkdownViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markdownContent, setMarkdownContent] = useState('')
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [activeHeadingId, setActiveHeadingId] = useState('')
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  const markdownPath = useMemo(() => {
    try {
      return resolveMarkdownPath(path)
    } catch {
      return ''
    }
  }, [path])

  const docTitle = 'Documentation'

  useEffect(() => {
    async function loadMarkdown() {
      try {
        setLoading(true)
        setError(null)
        const resolvedPath = resolveMarkdownPath(path)
        const response = await fetch(getPublicFilePath(resolvedPath))
        if (!response.ok) throw new Error('文档不存在或加载失败')
        setMarkdownContent(await response.text())
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载Markdown文档失败')
      } finally {
        setLoading(false)
      }
    }
    loadMarkdown()
  }, [path])

  useEffect(() => {
    if (loading || error || !articleRef.current) {
      setHeadings([])
      setActiveHeadingId('')
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      if (!articleRef.current) return
      const stack: HeadingItem[] = []
      const nextHeadings: HeadingItem[] = []
      const headingElements = Array.from(articleRef.current.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))

      headingElements.forEach((element, index) => {
        const level = Number(element.tagName.slice(1))
        const text = element.textContent?.trim() || ''
        if (!text) return

        const id = generateHeadingId(text, index)
        element.id = id
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop()
        const parent = stack[stack.length - 1] || null
        const heading: HeadingItem = { id, text, level, parentId: parent ? parent.id : null, hasChildren: false }
        if (parent) parent.hasChildren = true
        stack.push(heading)
        nextHeadings.push(heading)
      })

      setHeadings(nextHeadings)
      setActiveHeadingId(nextHeadings[0]?.id || '')
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [error, loading, markdownContent])

  useEffect(() => {
    const onWindowScroll = () => {
      setIsScrolled(window.scrollY > 0)
      if (!headings.length) return
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50) {
        setActiveHeadingId(headings[headings.length - 1].id)
        return
      }
      let activeHeading = headings[0]
      for (const heading of headings) {
        const el = document.getElementById(heading.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 120) activeHeading = heading
        else break
      }
      setActiveHeadingId(activeHeading.id)
    }
    onWindowScroll()
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    return () => window.removeEventListener('scroll', onWindowScroll)
  }, [headings])

  function scrollToHeading(headingId: string) {
    const el = document.getElementById(headingId)
    if (!el) return
    const targetTop = el.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: targetTop, behavior: 'smooth' })
    setActiveHeadingId(headingId)
    setMobileOutlineOpen(false)
  }

  const components: ComponentProps<typeof ReactMarkdown>['components'] = {
    img({ src, alt }) {
      return <img src={normalizeMarkdownImage(src, markdownPath)} alt={alt || ''} />
    },
    pre({ children }) {
      return <>{children}</>
    },
    code(props) {
      const { className, children, node: _node, style: codeStyle, ...rest } = props
      const inline = !className
      if (inline) return <code className={className} {...rest}>{children}</code>
      const language = /language-(\w+)/.exec(className || '')?.[1] || ''
      const codeText = String(children).replace(/\n$/, '')
      const lineNumbers = codeText.split('\n').map((_, index) => index + 1)
      return (
        <div className="code-block-shell">
          <div className="code-block-header">
            <div className="mac-dots">
              <div className="mac-dot red"></div>
              <div className="mac-dot yellow"></div>
              <div className="mac-dot green"></div>
            </div>
            {language && <div className="lang-label">{language}</div>}
            <div className="code-toolbar">
              <CodeCopyButton codeText={codeText} />
            </div>
          </div>
          <div className="code-scroll-layout">
            <div className="code-line-numbers" aria-hidden="true">
              {lineNumbers.map((lineNumber) => <span key={lineNumber}>{lineNumber}</span>)}
            </div>
            <SyntaxHighlighter
              className="code-highlighter"
              language={language || 'text'}
              style={atomOneDark}
              customStyle={{ margin: 0, padding: '16px 16px 16px 14px', background: 'var(--doc-code-bg)', fontFamily: 'LXGW WenKai, sans-serif', textShadow: 'none' }}
              codeTagProps={{ ...rest, className, style: { ...codeStyle, fontFamily: 'LXGW WenKai, sans-serif', textShadow: 'none' } }}
            >
              {codeText}
            </SyntaxHighlighter>
          </div>
        </div>
      )
    }
  }

  return (
    <div className={`vitepress-container${mobileOutlineOpen ? ' is-outline-open' : ''}`}>
      <header className={`vitepress-header${isScrolled ? ' vitepress-header--scrolled' : ''}`}>
        <div className="header-glass">
          <div className="header-brand">
            <img className="header-logo" src={getPublicFilePath(APP_CONFIG.SITE_LOGO)} alt={docTitle} width="32" height="32" />
            <div className="logo">{docTitle}</div>
          </div>
        </div>
      </header>

      <div className="vitepress-main">
        <main className="vitepress-content">
          {loading ? (
            <div className="loading-state glass-panel">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          ) : error ? (
            <div className="error-state glass-panel">
              <p>{error}</p>
            </div>
          ) : (
            <div className="content-wrapper glass-panel">
              <article ref={articleRef} className="vitepress-doc markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={components}>
                  {markdownContent}
                </ReactMarkdown>
              </article>
              <div className="doc-footer">
                <div className="prev-next"></div>
              </div>
            </div>
          )}
        </main>

        {!loading && !error && headings.length > 0 && !mobileOutlineOpen && <MobileOutlineButton positionKey="markdown" onOpen={() => setMobileOutlineOpen(true)} />}
        {mobileOutlineOpen && <div className="mobile-outline-mask" onClick={() => setMobileOutlineOpen(false)}></div>}
        <div className="outline-anchor">
          <MarkdownOutline headings={headings} activeHeadingId={activeHeadingId} open={mobileOutlineOpen} onClose={() => setMobileOutlineOpen(false)} onSelect={scrollToHeading} />
        </div>
      </div>
    </div>
  )
}
