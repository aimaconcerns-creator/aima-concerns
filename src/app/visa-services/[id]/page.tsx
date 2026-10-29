import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function VisaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: p } = await supabase
    .from('visa_products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!p || p.is_hidden) notFound()

  const roe = p.currency === 'PKR' ? 1 : Number(p.roe || 0)
  const visaFee = Number(p.visa_fee) * roe
  const serviceFee = Number(p.service_fee) * roe
  const total = visaFee + serviceFee
  const fmt = (n: number) => 'PKR ' + Math.round(n).toLocaleString()

  const applyHref = user
    ? `/visa-services/${p.id}/apply`
    : `/login?next=${encodeURIComponent(`/visa-services/${p.id}/apply`)}`

  return (
    <div>
      <style>{`
        .vd-hero {
          text-align: center; color: #fff; padding: 72px 5% 64px;
          background: linear-gradient(135deg, #1b5560 0%, #2f7a6d 40%, #55a67c 70%, #e39b4e 100%);
          border-bottom: 4px solid #d9a441;
        }
        .vd-type { font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; opacity: .9; }
        .vd-hero h1 { margin: 10px 0 0; font-size: 42px; font-weight: 800; }
        .vd-wrap { max-width: 520px; margin: 0 auto; padding: 48px 20px 0; }
        .vd-back { color: #64748b; font-size: 13px; text-decoration: none; font-weight: 600; }
        .vd-card {
          background: #fff; border-radius: 18px; padding: 26px 24px; margin-top: 16px;
          border-top: 5px solid #c8922b; box-shadow: 0 4px 18px rgba(13,27,42,0.08);
        }
        .vd-row { display: flex; justify-content: space-between; padding: 14px 0; color: #334155; font-size: 15px; }
        .vd-row + .vd-row { border-top: 1px solid #eef2f6; }
        .vd-row.total { color: #12255a; font-weight: 800; font-size: 22px; }
        .vd-note { color: #94a3b8; font-size: 12px; margin: 6px 0 0; }
        .vd-btn {
          display: block; text-align: center; margin-top: 22px; padding: 15px; background: #3f8f68;
          color: #fff; border-radius: 9px; font-weight: 800; font-size: 15px; text-decoration: none;
        }
        .vd-btn:hover { background: #357a58; }
        @media (max-width: 600px) { .vd-hero h1 { font-size: 30px; } }
      `}</style>

      <div className="vd-hero">
        <div className="vd-type">{p.visa_type}</div>
        <h1>{p.name}</h1>
      </div>

      <div className="vd-wrap">
        <Link href="/visa-services" className="vd-back">← All Visas</Link>

        <div className="vd-card">
          <div className="vd-row"><span>Visa Fee</span><span>{fmt(visaFee)}</span></div>
          <div className="vd-row"><span>Service Fee</span><span>{fmt(serviceFee)}</span></div>
          <div className="vd-row total"><span>Total</span><span>{fmt(total)}</span></div>
          <p className="vd-note">Price per person.</p>

          <Link href={applyHref} className="vd-btn">
            {user ? 'Apply Now' : 'Log in to Apply'}
          </Link>
        </div>
      </div>
    </div>
  )
}
