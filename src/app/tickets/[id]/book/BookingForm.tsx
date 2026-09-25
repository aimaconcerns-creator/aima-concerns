'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'
import SiteHeader from '@/components/SiteHeader'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Mstr', 'CHD', 'INF']

const NATIONALITIES = [
  'Pakistani', 'Iraqi', 'Iranian', 'Saudi Arabian', 'Emirati', 'British',
  'American', 'Canadian', 'Australian', 'Turkish', 'Other',
]

type Passenger = {
  title: string
  given_name: string
  surname: string
  date_of_birth: string
  nationality: string
  passport_number: string
  passport_issue_date: string
  passport_expiry_date: string
  remarks: string
}

type Ticket = {
  id: string
  origin: string
  destination: string
  flight_number: string
  airline: string
  ticket_type: string
  departure_datetime: string
  price: number
  child_price: number
  infant_price: number
  available_seats: number
}

const emptyPassenger = (given = '', surname = ''): Passenger => ({
  title: '',
  given_name: given,
  surname,
  date_of_birth: '',
  nationality: 'Pakistani',
  passport_number: '',
  passport_issue_date: '',
  passport_expiry_date: '',
  remarks: '',
})

const label = (t: string) => (t === 'INF' ? 'INF (Infant)' : t === 'CHD' ? 'CHD (Child)' : t)

export default function BookingForm({
  ticket,
  defaultGiven,
  defaultSurname,
}: {
  ticket: Ticket
  defaultGiven: string
  defaultSurname: string
}) {
  const [passengers, setPassengers] = useState<Passenger[]>([emptyPassenger(defaultGiven, defaultSurname)])
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ total: number; until: string } | null>(null)

  const infants = passengers.filter((p) => p.title === 'INF').length
  const children = passengers.filter((p) => p.title === 'CHD').length
  const adults = passengers.length - infants - children
  const seatsNeeded = adults + children
  const total = adults * ticket.price + children * ticket.child_price + infants * ticket.infant_price

  const depDate = ticket.departure_datetime.slice(0, 10)
  const minExpiry = (() => {
    const d = new Date(depDate + 'T00:00:00Z')
    d.setUTCMonth(d.getUTCMonth() + 6)
    return d.toISOString().slice(0, 10)
  })()
  const minExpiryText = new Date(minExpiry + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
  const today = new Date().toISOString().slice(0, 10)

  let ruleProblem = ''
  if (adults < 1) ruleProblem = 'Each booking needs at least one adult passenger.'
  else if (infants > adults) ruleProblem = 'There cannot be more infants than adults in one booking.'
  else if (seatsNeeded > ticket.available_seats) ruleProblem = `Only ${ticket.available_seats} seat(s) are left on this flight.`

  const update = (i: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
  }

  const addPerson = () => {
    if (passengers.length >= 4) return
    setPassengers((prev) => [...prev, emptyPassenger()])
  }

  const removePerson = (i: number) => {
    setPassengers((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (ruleProblem) {
      setMessage(ruleProblem)
      return
    }
    if (!phone.trim()) {
      setMessage('Please enter a contact phone number.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('create_ticket_booking', {
      p_ticket_id: ticket.id,
      p_passengers: passengers,
      p_phone_number: phone.trim(),
    })
    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    const until = new Date(Date.now() + 12 * 60 * 60 * 1000).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    setDone({ total, until })
  }

  const departure = new Date(depDate + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })

  return (
    <div className={montserrat.className} style={{ background: '#eef2f7', minHeight: '100vh' }}>
      <style>{`
        .bk-hero {
          background: linear-gradient(135deg, #0d1b2a 0%, #12335f 100%);
          border-bottom: 4px solid #d9a441; color: #fff; padding: 34px 5% 40px;
        }
        .bk-hero-in { max-width: 1100px; margin: 0 auto; }
        .bk-back { color: #d9a441; text-decoration: none; font-size: 14px; font-weight: 600; }
        .bk-hero h1 { margin: 14px 0 0; font-size: clamp(24px, 4vw, 36px); font-weight: 800; }
        .bk-hero p { margin: 8px 0 0; color: #c9d8e8; }

        .bk-wrap { max-width: 1100px; margin: 28px auto 0; padding: 0 20px 50px; display: grid; grid-template-columns: 1fr 320px; gap: 26px; align-items: start; }
        .bk-box { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 6px 20px rgba(13,27,42,0.10); border-top: 4px solid #d9a441; margin-bottom: 20px; }
        .bk-ph { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .bk-ph h2 { margin: 0; color: #12335f; font-size: 18px; font-weight: 800; }
        .bk-rm { background: none; border: none; color: #d9534f; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .bk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
        .bk-full { grid-column: 1 / -1; }
        .bk-box label { display: block; color: #12335f; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .bk-in {
          width: 100%; height: 46px; padding: 0 12px; border: 1px solid #d5dde8; border-radius: 8px;
          font-size: 15px; color: #12335f; background: #fff; font-family: inherit; outline: none; box-sizing: border-box;
        }
        .bk-in:focus { border-color: #d9a441; }
        .bk-hint { color: #7a8699; font-size: 12px; margin: 5px 0 0; }
        .bk-add {
          width: 100%; padding: 14px; border: 2px dashed #d9a441; background: #fffaf0; color: #12335f;
          border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; font-family: inherit;
        }
        .bk-add:disabled { opacity: 0.5; cursor: default; }

        .bk-side { position: sticky; top: 90px; }
        .bk-line { display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #eef2f5; color: #3c4a5c; font-size: 14px; }
        .bk-line b { color: #12335f; }
        .bk-total { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 2px solid #12335f; margin-top: 6px; }
        .bk-total span { color: #12335f; font-weight: 700; }
        .bk-total b { color: #12335f; font-size: 24px; font-weight: 800; }
        .bk-btn {
          width: 100%; height: 52px; margin-top: 18px; border: none; border-radius: 8px; background: #12335f;
          color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit;
        }
        .bk-btn:hover { background: #d9a441; color: #12335f; }
        .bk-btn:disabled { opacity: 0.6; cursor: default; }
        .bk-warn { background: #fff4f2; color: #c0392b; border: 1px solid #f3c9c3; border-radius: 8px; padding: 12px 14px; font-size: 14px; line-height: 1.5; margin-top: 14px; }
        .bk-note { color: #7a8699; font-size: 12px; text-align: center; margin: 12px 0 0; line-height: 1.5; }

        .bk-done { max-width: 560px; margin: 50px auto 0; padding: 0 20px; }
        .bk-done .bk-box { text-align: center; padding: 40px 30px; }
        .bk-tick { width: 70px; height: 70px; border-radius: 50%; background: #fdf1dc; color: #b9791a; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
        .bk-link { display: inline-block; margin-top: 10px; padding: 13px 26px; border-radius: 8px; background: #12335f; color: #fff; text-decoration: none; font-weight: 700; }

        @media (max-width: 860px) {
          .bk-wrap { grid-template-columns: 1fr; }
          .bk-side { position: static; order: -1; }
        }
      `}</style>

      <SiteHeader />

      {done ? (
        <div className="bk-done">
          <div className="bk-box">
            <div className="bk-tick">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
            </div>
            <h2 style={{ color: '#12335f', margin: 0 }}>Seats Reserved</h2>
            <p style={{ color: '#7a8699', lineHeight: 1.7, margin: '14px 0 6px' }}>
              Your booking for <b style={{ color: '#12335f' }}>{ticket.origin} → {ticket.destination}</b> is on hold.
            </p>
            <p style={{ color: '#12335f', fontSize: 30, fontWeight: 800, margin: '6px 0' }}>
              PKR {done.total.toLocaleString()}
            </p>
            <p style={{ color: '#c0392b', fontWeight: 700, margin: '4px 0 18px' }}>
              Pay before {done.until} or the seats are released.
            </p>
            <Link href="/dashboard" className="bk-link">Go to Dashboard</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bk-hero">
            <div className="bk-hero-in">
              <Link href={`/tickets/${ticket.id}`} className="bk-back">← Back to flight</Link>
              <h1>Book: {ticket.origin} → {ticket.destination}</h1>
              <p>
                {ticket.airline}{ticket.flight_number ? ` · ${ticket.flight_number}` : ''} · {ticket.ticket_type} · Departs {departure}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bk-wrap">
            <div>
              <div className="bk-box">
                <div className="bk-ph"><h2>Contact</h2></div>
                <label>Contact Phone Number</label>
                <input
                  className="bk-in"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  required
                />
              </div>

              {passengers.map((p, i) => (
                <div key={i} className="bk-box">
                  <div className="bk-ph">
                    <h2>Passenger {i + 1}</h2>
                    {i > 0 && (
                      <button type="button" className="bk-rm" onClick={() => removePerson(i)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="bk-grid">
                    <div>
                      <label>Title</label>
                      <select className="bk-in" value={p.title} onChange={(e) => update(i, 'title', e.target.value)} required>
                        <option value="">Select</option>
                        {TITLES.map((t) => (
                          <option key={t} value={t}>{label(t)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Given Name</label>
                      <input className="bk-in" type="text" value={p.given_name} onChange={(e) => update(i, 'given_name', e.target.value)} required />
                    </div>
                    <div>
                      <label>Surname</label>
                      <input className="bk-in" type="text" value={p.surname} onChange={(e) => update(i, 'surname', e.target.value)} required />
                    </div>
                    <div>
                      <label>Date of Birth</label>
                      <input className="bk-in" type="date" max={today} value={p.date_of_birth} onChange={(e) => update(i, 'date_of_birth', e.target.value)} required />
                    </div>
                    <div>
                      <label>Nationality</label>
                      <select className="bk-in" value={p.nationality} onChange={(e) => update(i, 'nationality', e.target.value)} required>
                        {NATIONALITIES.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Passport Number</label>
                      <input className="bk-in" type="text" value={p.passport_number} onChange={(e) => update(i, 'passport_number', e.target.value)} required />
                    </div>
                    <div>
                      <label>Passport Issue Date</label>
                      <input className="bk-in" type="date" max={today} value={p.passport_issue_date} onChange={(e) => update(i, 'passport_issue_date', e.target.value)} required />
                    </div>
                    <div>
                      <label>Passport Expiry Date</label>
                      <input className="bk-in" type="date" min={minExpiry} value={p.passport_expiry_date} onChange={(e) => update(i, 'passport_expiry_date', e.target.value)} required />
                      <p className="bk-hint">Must be valid until at least {minExpiryText}.</p>
                    </div>
                    <div className="bk-full">
                      <label>Remarks (optional)</label>
                      <input className="bk-in" type="text" value={p.remarks} onChange={(e) => update(i, 'remarks', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" className="bk-add" onClick={addPerson} disabled={passengers.length >= 4}>
                {passengers.length >= 4 ? 'Maximum 4 passengers per booking' : '+ Add another person'}
              </button>
            </div>

            <div className="bk-side">
              <div className="bk-box" style={{ marginBottom: 0 }}>
                <h2 style={{ margin: '0 0 12px', color: '#12335f', fontSize: 19, fontWeight: 800 }}>Booking Summary</h2>

                <div className="bk-line">
                  <span>{adults} × Adult</span>
                  <b>PKR {(adults * ticket.price).toLocaleString()}</b>
                </div>
                {children > 0 && (
                  <div className="bk-line">
                    <span>{children} × Child</span>
                    <b>PKR {(children * ticket.child_price).toLocaleString()}</b>
                  </div>
                )}
                {infants > 0 && (
                  <div className="bk-line">
                    <span>{infants} × Infant</span>
                    <b>PKR {(infants * ticket.infant_price).toLocaleString()}</b>
                  </div>
                )}
                <div className="bk-line">
                  <span>Seats needed</span>
                  <b>{seatsNeeded}</b>
                </div>

                <div className="bk-total">
                  <span>Total</span>
                  <b>PKR {total.toLocaleString()}</b>
                </div>

                {ruleProblem && <div className="bk-warn">{ruleProblem}</div>}
                {message && !ruleProblem && <div className="bk-warn">{message}</div>}

                <button type="submit" className="bk-btn" disabled={loading || !!ruleProblem}>
                  {loading ? 'Reserving...' : 'Reserve Seats'}
                </button>
                <p className="bk-note">
                  Your seats are held for 12 hours. You must pay from your wallet within that time.
                  Payments are final and cannot be cancelled.
                </p>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
