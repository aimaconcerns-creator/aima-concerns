import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function VisaServicesPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('visa_products')
    .select('*')
    .or('is_hidden.is.null,is_hidden.eq.false')
    .order('created_at', { ascending: false })

  const pkr = (p: any) => {
    const roe = p.currency === 'PKR' ? 1 : Number(p.roe || 0)
    return (Number(p.visa_fee) + Number(p.service_fee)) * roe
  }

  return (
    <div>
      <style>{`
        .vs-hero {
          text-align: center; color: #fff; padding: 84px 5% 76px;
          background: linear-gradient(135deg, #1b5560 0%, #2f7a6d 40%, #55a67c 70%, #e39b4e 100%);
          border-bottom: 4px solid #d9a441;
        }
        .vs-hero h1 { margin: 0; font-size: 46px; font-weight: 800; }
        .vs-hero p { margin: 18px 0 0; font-size: 17px; letter-spacing: 1px; opacity: .95; }

        .vs-wrap { max-width: 1120px; margin: 0 auto; padding: 56px 24px 0; }
        .vs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 320px)); gap: 28px; }

        .vs-card {
          background: #fff; border-radius: 18px; padding: 24px 22px 22px;
          border-top: 5px solid #c8922b; box-shadow: 0 4px 18px rgba(13,27,42,0.08);
          display: flex; flex-direction: column;
        }
        .vs-top { display: flex; justify-content: space-between; align-items: center; }
        .vs-type { color: #3f8a6b; font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .vs-pill { background: #3f8f68; color: #fff; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 999px; }
        .vs-name { color: #12255a; font-size: 21px; font-weight: 800; margin: 16px 0 4px; }
        .vs-sub { color: #94a3b8; font-size: 14px; margin: 0 0 18px; }
        .vs-info { background: #f1f5f9; border-radius: 12px; padding: 14px 16px; color: #12255a; font-weight: 700; font-size: 15px; margin-bottom: 20px; }
        .vs-price-label { color: #64748b; font-size: 13px; }
        .vs-price { color: #12255a; font-size: 28px; font-weight: 800; margin: 4px 0 18px; }
        .vs-btn {
          display: block; text-align: center; background: #3f8f68; color: #fff; padding: 14px;
          border-radius: 9px; font-weight: 800; font-size: 15px; text-decoration: none; margin-top: auto;
        }
        .vs-btn:hover { background: #357a58; }
        @media (max-width: 600px) { .vs-hero h1 { font-size: 34px; } }
      `}</style>

      <div className="vs-hero">
        <h1>Visa Services</h1>
        <p>Choose the visa you want to apply for.</p>
      </div>

      <div className="vs-wrap">
        {(!products || products.length === 0) && (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>
            No visas available right now. Please check back soon.
          </p>
        )}

        <div className="vs-grid">
          {products?.map((p: any) => (
            <div key={p.id} className="vs-card">
              <div className="vs-top">
                <span className="vs-type">{p.visa_type}</span>
                <span className="vs-pill">Applications Open</span>
              </div>
              <div className="vs-name">{p.name}</div>
              <p className="vs-sub">Individual &amp; family applications</p>
              <div className="vs-info">Visa fee + service fee included</div>
              <div className="vs-price-label">Price per person</div>
              <div className="vs-price">PKR {Math.round(pkr(p)).toLocaleString()}</div>
              <Link href={`/visa-services/${p.id}`} className="vs-btn">View Details</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
