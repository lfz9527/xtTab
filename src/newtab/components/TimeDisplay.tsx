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
    <div className='flex flex-col items-center gap-2 animate-[fadeIn_0.6s_ease-out]'>
      <div className='text-[88px] font-light tracking-[4px] text-[#1a1a2e] leading-none select-none'>
        {now.hour}<span className='animate-[blink_1s_step-end_infinite]'>:</span>{now.minute}
      </div>
      <div className='text-sm font-normal text-[#8e9199] tracking-[1px] select-none'>
        {now.year}年{now.month}月{now.day}日 · 周{now.weekday}
      </div>
    </div>
  )
}
