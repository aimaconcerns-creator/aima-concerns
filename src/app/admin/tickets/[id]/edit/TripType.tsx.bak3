'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { AirportSelect } from '../../airports'

type Segment = {
  origin: string
  destination: string
  flight_number: string
  departure_datetime: string
  arrival_datetime: string
}

const TicketTypeContext = createContext<{ type: string; setType: (v: string) => void }>({
  type: 'One Way',
  setType: () => {},
})

export function TicketTypeProvider({
  defaultType,
  children,
}: {
  defaultType: string
  children: ReactNode
}) {
  const [type, setType] = useState(defaultType)
  return (
    <TicketTypeContext.Provider value={{ type, setType }}>
      {children}
    </TicketTypeContext.Provider>
  )
}

export function TicketTypeSelect() {
  const { type, setType } = useContext(TicketTypeContext)
  return (
    <select
      name="ticket_type"
      required
      value={type}
      onChange={(e) => setType(e.target.value)}
      className="field-input"
    >
      <option value="One Way">One Way</option>
      <option value="Return">Return</option>
      <option value="Multi City">Multi City</option>
    </select>
  )
}

export function ReturnSection({
  flightNumber,
  departure,
  arrival,
}: {
  flightNumber: string
  departure: string
  arrival: string
}) {
  const { type } = useContext(TicketTypeContext)
  if (type !== 'Return') return null

  return (
    <>
      <div className="section-title">Return Flight</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        <div className="field-wrap">
          <label className="field-label">Return Flight Number</label>
          <input type="text" name="return_flight_number" required defaultValue={flightNumber} className="field-input" />
        </div>
        <div className="field-wrap">
          <label className="field-label">Return Departure</label>
          <input type="datetime-local" name="return_departure_datetime" required defaultValue={departure} className="field-input" />
        </div>
        <div className="field-wrap">
          <label className="field-label">Return Arrival</label>
          <input type="datetime-local" name="return_arrival_datetime" required defaultValue={arrival} className="field-input" />
        </div>
      </div>
    </>
  )
}

const emptySegment: Segment = {
  origin: '',
  destination: '',
  flight_number: '',
  departure_datetime: '',
  arrival_datetime: '',
}

export function MultiCitySection({ defaultSegments }: { defaultSegments: Segment[] }) {
  const { type } = useContext(TicketTypeContext)
  const [segments, setSegments] = useState<Segment[]>(
    defaultSegments.length ? defaultSegments : [{ ...emptySegment }]
  )

  if (type !== 'Multi City') return null

  const update = (i: number, key: keyof Segment, value: string) =>
    setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)))

  const remove = (i: number) => setSegments((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <>
      <div className="section-title">Additional Legs (Leg 1 is the Flight Details above)</div>
      <input type="hidden" name="segments" value={JSON.stringify(segments)} />

      {segments.map((seg, i) => (
        <div
          key={i}
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#d9a441', fontWeight: 700, fontSize: '13px' }}>Leg {i + 2}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ background: 'none', border: 'none', color: '#ff8f8a', cursor: 'pointer', fontSize: '13px' }}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="field-wrap">
              <label className="field-label">Origin</label>
              <AirportSelect value={seg.origin} onChange={(e) => update(i, 'origin', e.target.value)} />
            </div>
            <div className="field-wrap">
              <label className="field-label">Destination</label>
              <AirportSelect value={seg.destination} onChange={(e) => update(i, 'destination', e.target.value)} />
            </div>
            <div className="field-wrap">
              <label className="field-label">Flight Number</label>
              <input type="text" required value={seg.flight_number} onChange={(e) => update(i, 'flight_number', e.target.value)} className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Departure</label>
              <input type="datetime-local" required value={seg.departure_datetime} onChange={(e) => update(i, 'departure_datetime', e.target.value)} className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Arrival</label>
              <input type="datetime-local" required value={seg.arrival_datetime} onChange={(e) => update(i, 'arrival_datetime', e.target.value)} className="field-input" />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setSegments((prev) => [...prev, { ...emptySegment }])}
        style={{
          padding: '10px 18px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        + Add Leg
      </button>
    </>
  )
}
