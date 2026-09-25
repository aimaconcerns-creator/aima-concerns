'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Montserrat } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const PRESET_AMOUNTS = [10000, 25000, 50000]
const WHATSAPP_NUMBER = '923327869765'

export default function AddMoneyPage() {
  const router = useRouter()
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const getFinalAmount = () => {
    if (customAmount) return Number(customAmount)
    return selectedAmount || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const amount = getFinalAmount()

    if (!amount || amount <= 0) {
      setMessage('Error: Please enter a valid amount.')
      return
    }

    setSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('topup_requests').insert({
      customer_id: user.id,
      amount,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      status: 'Pending Verification',
    })

    setSubmitting(false)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setSubmitted(true)
    }
  }

  const amount = getFinalAmount()
  const whatsappMessage = encodeURIComponent(
    'Hi Aima Concerns, I have submitted a top-up request for PKR ' + amount.toLocaleString() + ' via ' + paymentMethod + '. Reference: ' + (referenceNumber || 'N/A') + '. I am attaching my payment receipt.'
  )
  const whatsappLink = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + whatsappMessage

  return (
    <div className={montserrat.className}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .wrap { min-height: 100vh; background: #f4f7f9; padding: 30px 20px; }
        .inner { max-width: 480px; margin: 0 auto; }
        .top { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .top a { color: #12335f; text-decoration: none; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        h1 { color: #12335f; font-size: 26px; font-weight: 800; margin: 0 0 20px; }

        .hero {
          border-radius: 18px; padding: 26px; margin-bottom: 18px; color: #fff;
          background: linear-gradient(135deg, #0d3b47 0%, #2f7f7a 45%, #5FAE8C 80%, #f0a860 120%);
          box-shadow: 0 10px 30px rgba(13, 59, 71, 0.25);
        }
        .hero p.label { margin: 0; color: rgba(255,255,255,0.8); font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; }
        .hero p.amount { margin: 6px 0 0; font-size: 34px; font-weight: 800; }

        .card {
          background: #fff; border-radius: 16px; padding: 22px; margin-bottom: 16px;
          box-shadow: 0 6px 20px rgba(18, 51, 95, 0.07);
        }
        .card h3 { color: #12335f; font-weight: 700; font-size: 15px; margin: 0 0 14px; }

        .amount-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .amount-btn {
          padding: 14px 8px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 14px;
          font-family: inherit; color: #12335f; border: 1.5px solid #dbe4ea; background: #fafcfd;
        }
        .amount-btn.active { border-color: #4a9c7a; background: #eafaf3; color: #2f7f5a; }

        .input {
          width: 100%; padding: 13px 14px; border-radius: 10px; border: 1.5px solid #dbe4ea;
          background: #fafcfd; color: #12335f; font-size: 15px; font-family: inherit;
        }
        .input:focus { outline: none; border-color: #4a9c7a; }

        .method-list { display: flex; flex-direction: column; gap: 10px; }
        .method-btn {
          padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 14px;
          font-family: inherit; color: #12335f; text-align: left; border: 1.5px solid #dbe4ea; background: #fafcfd;
        }
        .method-btn.active { border-color: #4a9c7a; background: #eafaf3; color: #2f7f5a; }

        .details-box {
          background: #f4f7f9; border-radius: 12px; padding: 16px; margin-top: 14px;
        }
        .details-box strong { color: #12335f; font-size: 14px; font-weight: 800; display: block; margin-bottom: 8px; }
        .details-box .row { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; font-size: 14px; color: #33475b; border-bottom: 1px solid #e3e9ee; }
        .details-box .row:last-child { border-bottom: none; }
        .details-box .row span:first-child { color: #7a8699; font-weight: 600; }
        .details-box .row span:last-child { font-weight: 700; color: #12335f; text-align: right; }

        .submit-btn {
          width: 100%; padding: 16px; border: none; border-radius: 12px; cursor: pointer;
          background: #4a9c7a; color: #fff; font-weight: 800; font-size: 16px; font-family: inherit;
        }
        .submit-btn:hover { background: #3f8b6c; }
        .submit-btn:disabled { opacity: 0.7; cursor: default; }
        .error-msg { margin-top: 14px; color: #c0392b; font-size: 14px; }

        /* Success screen */
        .success-card {
          background: #fff; border-radius: 18px; padding: 34px 26px; text-align: center;
          box-shadow: 0 10px 30px rgba(18, 51, 95, 0.1);
        }
        .check {
          width: 62px; height: 62px; border-radius: 50%; background: #eafaf3; color: #4a9c7a;
          font-size: 30px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
        }
        .success-card h2 { color: #12335f; margin: 0 0 4px; font-size: 22px; font-weight: 800; }
        .success-card .status { color: #7a8699; font-size: 14px; margin: 0 0 20px; }
        .amount-box { background: #f4f7f9; border-radius: 12px; padding: 16px; margin-bottom: 18px; }
        .amount-box p.label { margin: 0; color: #7a8699; font-size: 13px; }
        .amount-box p.value { margin: 2px 0 0; color: #12335f; font-size: 24px; font-weight: 800; }
        .amount-box p.via { margin: 6px 0 0; color: #7a8699; font-size: 13px; }
        .hint { color: #556, ; font-size: 14px; margin-bottom: 20px; }
        .wa-btn {
          display: block; padding: 14px; background: #25D366; color: #fff; border-radius: 10px;
          text-decoration: none; font-weight: 700; margin-bottom: 14px;
        }
        .back-link { color: #12335f; font-size: 14px; text-decoration: none; font-weight: 600; }
      `}</style>

      <div className="wrap">
        <div className="inner">
          {submitted ? (
            <div className="success-card">
              <div className="check">✓</div>
              <h2>Request Submitted</h2>
              <p className="status">Pending Verification</p>
              <div className="amount-box">
                <p className="label">Amount</p>
                <p className="value">PKR {amount.toLocaleString()}</p>
                <p className="via">via {paymentMethod}</p>
              </div>
              <p className="hint" style={{ color: '#556877' }}>
                Please send your payment receipt on WhatsApp so our team can verify it quickly.
              </p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="wa-btn">
                Send Receipt on WhatsApp
              </a>
              <Link href="/dashboard" className="back-link">Back to Dashboard</Link>
            </div>
          ) : (
            <>
              <div className="top">
                <Link href="/dashboard">← Back to Dashboard</Link>
              </div>
              <h1>Add Money</h1>

              <div className="hero">
                <p className="label">Amount to Add</p>
                <p className="amount">PKR {amount.toLocaleString()}</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="card">
                  <h3>Select Amount</h3>
                  <div className="amount-grid">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                        className={`amount-btn ${selectedAmount === amt ? 'active' : ''}`}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                    placeholder="Or enter custom amount"
                    className="input"
                  />
                </div>

                <div className="card">
                  <h3>Payment Method</h3>
                  <div className="method-list">
                    {['Bank Transfer', 'Easypaisa/JazzCash'].map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`method-btn ${paymentMethod === method ? 'active' : ''}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'Bank Transfer' && (
                    <div className="details-box">
                      <strong>Aima Concerns Bank Details</strong>
                      <div className="row"><span>Bank</span><span>Bank Al Habib (BAHL)</span></div>
                      <div className="row"><span>Account Title</span><span>Aima Concerns Travel &amp; Tourism (Pvt) Ltd.</span></div>
                      <div className="row"><span>Account Number</span><span>0021-0081-017452-01-3</span></div>
                      <div className="row"><span>IBAN</span><span>PK63BAHL0021008101745201</span></div>
                    </div>
                  )}

                  {paymentMethod === 'Easypaisa/JazzCash' && (
                    <div className="details-box">
                      <strong>JazzCash</strong>
                      <div className="row"><span>Number</span><span>0322-4631622</span></div>
                      <div className="row"><span>Name</span><span>Mohib Ali Butt</span></div>
                    </div>
                  )}

                  {paymentMethod === 'Easypaisa/JazzCash' && (
                    <div className="details-box" style={{ marginTop: '10px' }}>
                      <strong>Easypaisa</strong>
                      <div className="row"><span>Number</span><span>0322-4631622</span></div>
                      <div className="row"><span>Name</span><span>Mohib Ali Butt</span></div>
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3>Transaction / Reference Number (optional)</h3>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="input"
                  />
                </div>

                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
              {message && <p className="error-msg">{message}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}