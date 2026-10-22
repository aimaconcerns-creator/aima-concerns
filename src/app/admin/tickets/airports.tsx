import type { ChangeEvent } from 'react'

export const AIRPORTS = [
  'Lahore (LHE)',
  'Karachi (KHI)',
  'Quetta (UET)',
  'Islamabad (ISB)',
  'Sialkot (SKT)',
  'Faisalabad (LYP)',
  'Mashhad (MHD)',
  'Tehran (IKA)',
  'Zahedan (ZAH)',
  'Baghdad (BGW)',
  'Najaf (NJF)',
]

export function AirportSelect({
  name,
  value,
  defaultValue,
  onChange,
}: {
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
}) {
  const current = value ?? defaultValue ?? ''
  const isOldValue = current !== '' && !AIRPORTS.includes(current)
  const controlled = value !== undefined
    ? { value, onChange }
    : { defaultValue: defaultValue ?? '' }

  return (
    <select name={name} required className="field-input" {...controlled}>
      <option value="">Select city</option>
      {isOldValue && <option value={current}>{current} (old value)</option>}
      {AIRPORTS.map((a) => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  )
}
