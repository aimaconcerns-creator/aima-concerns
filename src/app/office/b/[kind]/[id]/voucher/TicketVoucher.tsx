'use client'

import { useState } from 'react'
import Link from 'next/link'
import PrintButton from '@/app/office/PrintButton'

type Leg = {
  label: string
  flight: string
  origin: string
  destination: string
  depDate: string
  depTime: string
  arrDate: string
  arrTime: string
  duration: string
}

type Pax = {
  n: number
  name: string
  type: string
  dob: string
  passport: string
  fare: number
}

type Props = {
  id: string
  reference: string
  airlineName: string
  airlineLogo: string | null
  qr: string
  statusTitle: string
  statusColor: string
  statusBg: string
  statusTextFull: string
  statusTextHidden: string
  waFull: string
  waHidden: string
  isFoc: boolean
  passengers: Pax[]
  legs: Leg[]
  baggage: string
  cabin: string
  ticketType: string
  bookedFor: string
  remarks: string
  total: number
  paid: number
  balance: number
}

const money = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-US')

const css = `
.tv-wrap, .tv-wrap * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.tv-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 18px; }
.tv-hide { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid #d5dde8; border-radius: 9px; background: #fff; font-size: 13.5px; font-weight: 700; color: #12335f; cursor: pointer; }
.tv-hide.on { background: #fff4de; border-color: #f0dca8; color: #8a6414; }
.tv-hide input { width: 17px; height: 17px; accent-color: #d9a441; }
.tv-wrap { max-width: 820px; margin: 0 auto; background: #fff; border: 1px solid #e3e9f1; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 22px rgba(18,51,95,.08); color: #12335f; }
.tv-head { background: linear-gradient(135deg, #0d3b47, #2f7f7a); color: #fff; padding: 20px 26px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; border-bottom: 4px solid #d9a441; }
.tv-air { display: flex; align-items: center; gap: 14px; }
.tv-logo { width: 62px; height: 62px; border-radius: 12px; background: #fff; display: flex; align-items: center; justify-content: center; padding: 6px; flex-shrink: 0; }
.tv-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.tv-air b { display: block; font-size: 19px; font-weight: 800; }
.tv-air span { display: block; font-size: 10.5px; letter-spacing: .22em; color: #f3d9a4; font-weight: 700; margin-top: 4px; }
.tv-ref { display: flex; align-items: center; gap: 14px; text-align: right; }
.tv-ref small { display: block; font-size: 10px; letter-spacing: .2em; color: #f3d9a4; font-weight: 700; }
.tv-ref b { display: block; font-size: 30px; letter-spacing: .1em; margin-top: 3px; }
.tv-qr { background: #fff; padding: 4px; border-radius: 8px; line-height: 0; }
.tv-qr img { width: 84px; height: 84px; }
.tv-body { padding: 6px 26px 22px; }
.tv-status { margin: 18px 0 6px; padding: 12px 16px; border-radius: 10px; font-weight: 700; }
.tv-status div { font-size: 12px; letter-spacing: .08em; }
.tv-status p { margin: 4px 0 0; font-size: 13.5px; font-weight: 600; }
.tv-sec { margin: 20px 0 10px; color: #b9791a; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding-bottom: 6px; border-bottom: 1px solid #e6edf3; }
.tv-scroll { overflow-x: auto; }
table.tv-t { width: 100%; border-collapse: collapse; font-size: 13px; }
table.tv-t th { text-align: left; background: #f0f5f8; color: #12335f; padding: 9px 10px; font-size: 11px; letter-spacing: .05em; text-transform: uppercase; }
table.tv-t td { padding: 9px 10px; border-top: 1px solid #eef2f5; color: #3c4a5c; }
table.tv-t tr { break-inside: avoid; }
table.tv-t .r { text-align: right; white-space: nowrap; }
.tv-leg { border: 1px solid #e3e9f1; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; break-inside: avoid; }
.tv-legtop { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.tv-lab { font-size: 11.5px; font-weight: 800; color: #2f7f7a; letter-spacing: .1em; }
.tv-date { font-size: 12.5px; font-weight: 700; color: #12335f; }
.tv-legrow { display: flex; align-items: center; gap: 16px; }
.tv-time { margin: 0; font-size: 28px; font-weight: 800; color: #12335f; line-height: 1.1; }
.tv-city { margin: 3px 0 0; font-size: 13.5px; font-weight: 700; color: #12335f; text-transform: uppercase; }
.tv-sub { margin: 3px 0 0; font-size: 11.5px; color: #6b7c93; font-weight: 600; }
.tv-mid { flex: 1; text-align: center; font-size: 12px; color: #6b7c93; font-weight: 600; }
.tv-line { height: 2px; background: #c9d3dc; margin: 0 0 6px; position: relative; }
.tv-line i { position: absolute; right: 0; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: #d9a441; }
.tv-kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
.tv-kv small { display: block; font-size: 10.5px; font-weight: 700; color: #6b7c93; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 3px; }
.tv-kv b { font-size: 14px; color: #12335f; overflow-wrap: anywhere; }
.tv-tot { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.tv-tot div { flex: 1; min-width: 150px; background: #f0f5f8; border-radius: 10px; padding: 11px 14px; }
.tv-tot small { display: block; font-size: 10.5px; font-weight: 700; color: #6b7c93; letter-spacing: .06em; text-transform: uppercase; }
.tv-tot b { font-size: 16px; }
.tv-foot { border-top: 1px solid #e3e9f1; background: #fbfcfe; padding: 14px 26px; font-size: 11.5px; color: #6b7c93; line-height: 1.7; text-align: center; }
.tv-foot b { color: #12335f; }
@page { size: A4 portrait; margin: 0; }
@media print {
  .tv-page { padding: 8mm; }
  .tv-wrap { box-shadow: none; border: 1px solid #999; border-radius: 0; }
}
@media (max-width: 560px) {
  .tv-legrow { gap: 8px; }
  .tv-time { font-size: 22px; }
}
`

export default function TicketVoucher(p: Props) {
  const [hide, setHide] = useState(false)

  const statusText = hide ? p.statusTextHidden : p.statusTextFull
  const wa = 'https://wa.me/?text=' + encodeURIComponent(hide ? p.waHidden : p.waFull)
  const fareCell = (n: number) => (p.isFoc ? 'FOC' : money(n))

  return (
    <div className="tv-page">
      <style>{css}</style>

      <div className="tv-bar no-print">
        <Link href={`/office/b/ticket/${p.id}`} className="btn ghost">← Back to booking</Link>
        <label className={'tv-hide' + (hide ? ' on' : '')}>
          <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} />
          Hide fare
        </label>
        <PrintButton label="Print / Save as PDF" />
        <a href={wa} target="_blank" rel="noreferrer" className="btn">Send on WhatsApp</a>
      </div>
      {hide && (
        <p className="note no-print" style={{ marginTop: -6, marginBottom: 14 }}>
          The fare is hidden on this printout and in the WhatsApp message. This is not saved, so the voucher shows the
          fare again the next time you open it.
        </p>
      )}

      <div className="tv-wrap">
        <div className="tv-head">
          <div className="tv-air">
            {p.airlineLogo ? (
              <div className="tv-logo"><img src={p.airlineLogo} alt="" /></div>
            ) : null}
            <div>
              <b>{p.airlineName}</b>
              <span>E-TICKET ITINERARY</span>
            </div>
          </div>
          <div className="tv-ref">
            <div>
              <small>BOOKING REFERENCE</small>
              <b>{p.reference}</b>
            </div>
            <div className="tv-qr"><img src={p.qr} alt="QR" /></div>
          </div>
        </div>

        <div className="tv-body">
          <div className="tv-status" style={{ background: p.statusBg, color: p.statusColor }}>
            <div>{p.statusTitle}</div>
            <p>{statusText}</p>
          </div>

          <div className="tv-sec">Passengers</div>
          <div className="tv-scroll">
            <table className="tv-t">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Date of birth</th>
                  <th>Passport</th>
                  {!hide && <th className="r">Fare (PKR)</th>}
                </tr>
              </thead>
              <tbody>
                {p.passengers.map((x) => (
                  <tr key={x.n}>
                    <td>{x.n}</td>
                    <td><b style={{ color: '#12335f', textTransform: 'uppercase' }}>{x.name}</b></td>
                    <td>{x.type}</td>
                    <td>{x.dob}</td>
                    <td>{x.passport}</td>
                    {!hide && <td className="r">{p.isFoc ? 'FOC' : Number(x.fare || 0).toLocaleString('en-US')}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tv-sec">Flights</div>
          {p.legs.length === 0 && <p className="note">No flight details are available.</p>}
          {p.legs.map((l, i) => (
            <div className="tv-leg" key={i}>
              <div className="tv-legtop">
                <span className="tv-lab">✈ {l.label}{l.flight ? ` · ${l.flight}` : ''}</span>
                <span className="tv-date">{l.depDate}</span>
              </div>
              <div className="tv-legrow">
                <div>
                  <p className="tv-time">{l.depTime}</p>
                  <p className="tv-city">{l.origin}</p>
                </div>
                <div className="tv-mid">
                  <div className="tv-line"><i /></div>
                  <span>{l.duration}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="tv-time">{l.arrTime}</p>
                  <p className="tv-city">{l.destination}</p>
                  {l.arrDate && l.arrDate !== l.depDate ? <p className="tv-sub">{l.arrDate}</p> : null}
                </div>
              </div>
            </div>
          ))}

          <div className="tv-sec">Travel details</div>
          <div className="tv-kv">
            <div><small>Baggage</small><b>{p.baggage || '—'}</b></div>
            <div><small>Cabin</small><b>{p.cabin}</b></div>
            <div><small>Ticket type</small><b>{p.ticketType || '—'}</b></div>
            <div><small>Booked for</small><b>{p.bookedFor}</b></div>
            {p.remarks ? <div><small>Remarks</small><b>{p.remarks}</b></div> : null}
          </div>

          {!hide && (
            <div className="tv-tot">
              <div><small>Total</small><b>{p.isFoc ? 'FOC' : money(p.total)}</b></div>
              <div><small>Paid</small><b>{p.isFoc ? 'FOC' : money(p.paid)}</b></div>
              <div><small>Balance</small><b>{p.isFoc ? 'FOC' : money(p.balance)}</b></div>
            </div>
          )}
        </div>

        <div className="tv-foot">
          <b>AIMA CONCERNS</b> Travel &amp; Tours · Est. 1999<br />
          Office 102 &amp; 103, Eden Heights, Jail Road, Lahore<br />
          +92 322 4631622 · +92 332 7869765 · aimaconcerns@gmail.com · aimaconcerns.com<br />
          Please carry this ticket and your passport. Passports must be valid as required for the destination.
        </div>
      </div>
    </div>
  )
}
