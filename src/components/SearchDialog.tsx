import { SearchBar } from './SearchBar'

interface SearchDialogProps {
  open: boolean
  onClose: () => void
  onSiteSearch: (keyword: string) => void
}

export function SearchDialog({ open, onClose, onSiteSearch }: SearchDialogProps) {
  if (!open) return null

  return (
    <div className="search-dialog-mask" role="presentation" onMouseDown={onClose}>
      <div
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="search-dialog__header">
          <h2 id="search-dialog-title">搜索</h2>
          <button type="button" className="search-dialog__close" aria-label="关闭搜索" title="关闭搜索" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="search-dialog__body">
          <SearchBar variant="dialog" autoFocus onSearched={onClose} onSiteSearch={onSiteSearch} />
        </div>
      </div>
    </div>
  )
}
