'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookingSearchBar() {
  const router = useRouter()
  const [ref, setRef] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = ref.trim().toUpperCase()
    if (!trimmed) return
    router.push(`/admin/verify/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="booking-search">
      <input
        type="text"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="Enter Booking Reference / PNR (e.g. MY78732)"
        className="booking-search-input"
      />
      <button type="submit" className="booking-search-btn">
        Search
      </button>
    </form>
  )
}