'use client'

import { useEffect, useRef, useState } from 'react'
import { flightDuration, formatDuration } from '@/lib/flightTime'

export default function DurationPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  const [bad, setBad] = useState(false)

  useEffect(() => {
    const form = ref.current?.closest('form')
    if (!form) return

    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''

    const calc = () => {
      const d = flightDuration(
        get('origin'),
        get('departure_datetime'),
        get('destination'),
        get('arrival_datetime')
      )
      if (d === null) {
        setText('')
        setBad(false)
      } else if (d <= 0) {
        setText('Arrival is before departure. Times are local to each city, please check them.')
        setBad(true)
      } else {
        setText('Flight duration: ' + formatDuration(d) + ' (times are local to each city)')
        setBad(false)
      }
    }

    calc()
    form.addEventListener('input', calc)
    form.addEventListener('change', calc)
    return () => {
      form.removeEventListener('input', calc)
      form.removeEventListener('change', calc)
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        minHeight: '20px',
        margin: '4px 0 10px',
        fontSize: '13px',
        fontWeight: 600,
        color: bad ? '#ff8f8a' : '#6fd0c8',
      }}
    >
      {text}
    </div>
  )
}
