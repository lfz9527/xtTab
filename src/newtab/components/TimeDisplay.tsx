import { useState, useEffect } from 'react'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function getNow() {
  const d = new Date()
  return {
    hour: String(d.getHours()).padStart(2, '0'),
    minute: String(d.getMinutes()).padStart(2, '0'),
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    weekday: WEEKDAYS[d.getDay()]
  }
}

export default function TimeDisplay() {
  const [now, setNow] = useState(getNow)

  useEffect(() => {
    const id = setInterval(() => setNow(getNow()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className='time-display'>
      <div className='time-clock'>
        {now.hour}<span className='time-colon'>:</span>{now.minute}
      </div>
      <div className='time-date'>
        {now.year}年{now.month}月{now.day}日 &middot; 周{now.weekday}
      </div>
    </div>
  )
}
