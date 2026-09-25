import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/server'
import PrintButton from './PrintButton'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

// EDIT THESE: your real contact details
const COMPANY = {
  name: 'Aima Concerns Travel & Tours',
  phone: '+92 322 4631622  |  +92 332 7869765',
  email: 'sales@aimaconcerns.com',
  address: 'Office 102 & 103, Eden Heights, Jail Road, Lahore',
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function VoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/bookings/${id}/voucher`)}`)

  const { data: b } = await supabase
    .from('bookings')
    .select(
      'id, reference, status, total_amount, paid_at, packages(name, package_type, days, departure_date, includes, airlines(name, logo_url)), booking_passengers(id, title, given_name, surname, date_of_birth, nationality, passport_number, price, created_at)'
    )
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!b) notFound()
  if (b.status !== 'Paid' || !b.reference) redirect('/dashboard/bookings')

  const pkg: any = Array.isArray(b.packages) ? b.packages[0] : b.packages
  const airline: any = pkg ? (Array.isArray(pkg.airlines) ? pkg.airlines[0] : pkg.airlines) : null
  const includes: string[] = pkg?.includes ?? []
  const passengers: any[] = [...(b.booking_passengers ?? [])].sort(
    (a, c) => new Date(a.created_at).getTime() - new Date(c.created_at).getTime()
  )

  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const verifyUrl = `${proto}://${host}/admin/verify/${b.reference}`
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 })

  return (
    <div className={montserrat.className} style={{ minHeight: '100vh', backgroundColor: '#eef2f5' }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .v-bar { max-width: 820px; margin: 0 auto; padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .v-back { color: #12335f; text-decoration: none; font-weight: 600; font-size: 14px; }
        .v-sheet { max-width: 820px; margin: 0 auto 40px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(18,51,95,0.12); overflow: hidden; }
        .v-head { background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 45%, #5FAE8C 75%, #f0a860 100%); border-bottom: 4px solid #d9a441; color: #fff; padding: 28px 34px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .v-brand { display: flex; align-items: center; gap: 14px; }
        .v-brand b { display: block; font-size: 22px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        .v-brand small { letter-spacing: 4px; font-size: 11px; color: #f3d9a4; font-weight: 600; }
        .v-tag { text-align: right; }
        .v-tag span { display: block; font-size: 12px; letter-spacing: 0.3em; font-weight: 700; }
        .v-tag em { font-style: normal; display: inline-block; margin-top: 8px; background: #fff; color: #2f7f4a; padding: 5px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; }
        .v-body { padding: 30px 34px; }
        .v-ref { text-align: center; padding: 20px; background: #f3faf6; border: 2px dashed #4a9c7a; border-radius: 10px; }
        .v-ref p { margin: 0; color: #7a8699; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; }
        .v-ref h1 { margin: 6px 0 0; color: #12335f; font-size: 46px; letter-spacing: 8px; font-weight: 800; }
        .v-ref small { color: #7a8699; font-size: 13px; }
        .v-sec { margin: 28px 0 12px; color: #4a9c7a; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid #e6edf3; }
        .v-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
        .v-k { color: #7a8699; font-size: 12px; margin: 0; }
        .v-v { color: #12335f; font-size: 16px; font-weight: 700; margin: 3px 0 0; }
        .v-air { display: flex; align-items: center; gap: 12px; }
        .v-air img { width: 44px; height: 44px; object-fit: contain; }
        .v-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .v-table th { text-align: left; background: #f0f5f8; color: #12335f; padding: 10px; font-size: 12px; }
        .v-table td { padding: 10px; border-top: 1px solid #eef2f5; color: #3c4a5c; }
        .v-scroll { overflow-x: auto; }
        .v-inc { display: flex; flex-wrap: wrap; gap: 10px; }
        .v-inc span { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid #d5e6dd; background: #f3faf6; color: #12335f; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .v-inc svg { color: #4a9c7a; }
        .v-total { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding: 16px 18px; background: #12335f; color: #fff; border-radius: 8px; }
        .v-total b { font-size: 24px; font-weight: 800; }
        .v-foot { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; margin-top: 28px; padding-top: 22px; border-top: 1px solid #e6edf3; }
        .v-foot p { margin: 3px 0; color: #3c4a5c; font-size: 13px; }
        .v-qr { text-align: center; }
        .v-qr img { width: 120px; height: 120px; display: block; }
        .v-qr small { color: #7a8699; font-size: 11px; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .v-sheet { box-shadow: none; border-radius: 0; margin: 0; max-width: none; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="v-bar no-print">
        <Link href="/dashboard/bookings" className="v-back">← Back to My Bookings</Link>
        <PrintButton />
      </div>

      <div className="v-sheet">
        <div className="v-head">
          <div className="v-brand">
            <Image src="/logo.png" alt="Aima Concerns" width={56} height={56} style={{ objectFit: 'contain' }} />
            <div>
              <b>Aima Concerns</b>
              <small>EST. 1999</small>
            </div>
          </div>
          <div className="v-tag">
            <span>E-VOUCHER</span>
            <em>PAID</em>
          </div>
        </div>

        <div className="v-body">
          <div className="v-ref">
            <p>Booking Reference</p>
            <h1>{b.reference}</h1>
            <small>Booked on {b.paid_at ? fmt(b.paid_at) : ''}</small>
          </div>

          <div className="v-sec">Package</div>
          <div className="v-grid">
            <div><p className="v-k">Package</p><p className="v-v">{pkg?.name}</p></div>
            <div><p className="v-k">Type</p><p className="v-v">{pkg?.package_type}</p></div>
            <div><p className="v-k">Duration</p><p className="v-v">{pkg?.days} days</p></div>
            <div><p className="v-k">Departure</p><p className="v-v">{pkg?.departure_date ? fmt(pkg.departure_date) : ''}</p></div>
          </div>

          {airline && (
            <>
              <div className="v-sec">Airline</div>
              <div className="v-air">
                {airline.logo_url && <img src={airline.logo_url} alt={airline.name} />}
                <p className="v-v" style={{ margin: 0 }}>{airline.name}</p>
              </div>
            </>
          )}

          <div className="v-sec">Passengers</div>
          <div className="v-scroll">
            <table className="v-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>Nationality</th>
                  <th>Passport No.</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td><b style={{ color: '#12335f' }}>{p.title} {p.given_name} {p.surname}</b></td>
                    <td>{fmt(p.date_of_birth)}</td>
                    <td>{p.nationality}</td>
                    <td>{p.passport_number}</td>
                    <td style={{ textAlign: 'right' }}>PKR {Number(p.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {includes.length > 0 && (
            <>
              <div className="v-sec">Package Includes</div>
              <div className="v-inc">
                {includes.map((item) => (
                  <span key={item}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="v-total">
            <span>Total Paid</span>
            <b>PKR {Number(b.total_amount).toLocaleString()}</b>
          </div>

          <div className="v-foot">
            <div>
              <p><b style={{ color: '#12335f' }}>{COMPANY.name}</b></p>
              <p>{COMPANY.phone}</p>
              <p>{COMPANY.email}</p>
              <p>{COMPANY.address}</p>
            </div>
            <div className="v-qr">
              <img src={qr} alt="Booking QR code" />
              <small>Scan to verify</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}