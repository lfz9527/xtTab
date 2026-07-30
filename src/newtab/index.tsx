import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SearchBar from './components/SearchBar'

const style = document.createElement('style')
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .search-bar {
    display: flex;
    gap: 8px;
    width: 560px;
  }
  .search-bar select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
    outline: none;
    cursor: pointer;
  }
  .search-bar input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-bar input:focus {
    border-color: #666;
  }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SearchBar />
  </StrictMode>
)
