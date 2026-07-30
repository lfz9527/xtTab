import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TimeDisplay from './components/TimeDisplay'
import SearchBar from './components/SearchBar'

const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body { height: 100%; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
      'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
    background: #f5f6f8;
    display: flex;
    justify-content: center;
    align-items: center;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 48px;
    width: 100%;
    max-width: 640px;
    padding: 24px;
    animation: fadeIn 0.6s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 56px;
    background: #ffffff;
    border: 1px solid #e2e4e8;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
    overflow: hidden;
  }

  .search-wrapper:focus-within {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.20), 0 4px 16px rgba(0, 0, 0, 0.04);
    background: #ffffff;
  }

  .search-icon {
    flex-shrink: 0;
    padding: 0 8px 0 20px;
    font-size: 18px;
    line-height: 1;
    color: #9ca0a8;
    user-select: none;
  }

  .search-engine-select {
    flex-shrink: 0;
    appearance: none;
    -webkit-appearance: none;
    border: none;
    background: transparent;
    color: #6b6f78;
    font-size: 14px;
    font-family: inherit;
    padding: 0 20px 0 4px;
    outline: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(0,0,0,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 4px center;
    transition: color 0.2s;
  }

  .search-engine-select:hover {
    color: #1a1a2e;
  }

  .search-engine-select option {
    color: #1a1a2e;
    background: #fff;
  }

  .search-divider {
    flex-shrink: 0;
    width: 1px;
    height: 24px;
    background: #e2e4e8;
    margin: 0 4px;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    color: #1a1a2e;
    font-size: 16px;
    font-family: inherit;
    padding: 0 20px 0 12px;
    outline: none;
    min-width: 0;
  }

  .search-input::placeholder {
    color: #b0b3b9;
  }

  .time-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.6s ease-out;
  }

  .time-clock {
    font-size: 88px;
    font-weight: 300;
    letter-spacing: 4px;
    color: #1a1a2e;
    line-height: 1;
    user-select: none;
  }

  .time-colon {
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    50% { opacity: 0.3; }
  }

  .time-date {
    font-size: 15px;
    font-weight: 400;
    color: #8e9199;
    letter-spacing: 1px;
    user-select: none;
  }
`
document.head.appendChild(style)

function App() {
  return (
    <div className='app'>
      <TimeDisplay />
      <div className='search-wrapper'>
        <span className='search-icon'>&#x1F50D;</span>
        <SearchBar />
      </div>
      <p className='search-hint'>按 Enter 搜索 &middot; 切换引擎直接搜索</p>
    </div>
  )
}

const hintStyle = document.createElement('style')
hintStyle.textContent = `
  .search-hint {
    color: #b0b3b9;
    font-size: 13px;
    letter-spacing: 0.3px;
    animation: fadeIn 0.8s ease-out 0.3s both;
  }
`
document.head.appendChild(hintStyle)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
