'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const PRESET_AMOUNTS = [10000, 25000, 50000]
const WHATSAPP_NUMBER = '923001234567'

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

  const pageBg = { minHeight: '100vh', backgroundColor: '#eef2f3', fontFamily: 'sans-serif' }

  if (submitted) {
    return (
      <div style={pageBg}>
        <div style={{ maxWidth: '460px', margin: '0 auto', padding: '30px 20px' }}>
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '35px 25px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(21,82,99,0.12)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#eafaf3',
                color: '#5FAE8C',
                fontSize: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
              }}
            >
              ✓
            </div>
            <h2 style={{ color: '#155263', marginBottom: '5px' }}>Request Submitted</h2>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
              Pending Verification
            </p>
            <div
              style={{
                backgroundColor: '#f5f7f8',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '20px',
              }}
            >
              <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Amount</p>
              <p style={{ margin: '2px 0 0', color: '#155263', fontSize: '26px', fontWeight: 'bold' }}>
                PKR {amount.toLocaleString()}
              </p>
              <p style={{ margin: '8px 0 0', color: '#888', fontSize: '13px' }}>via {paymentMethod}</p>
            </div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Please send your payment receipt on WhatsApp so our team can verify it quickly.
            </p>
            
             <a href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '14px',
                backgroundColor: '#25D366',
                color: '#fff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 'bold',
                marginBottom: '15px',
              }}
            >
              Send Receipt on WhatsApp
            </a>
            <a href="/dashboard" style={{ color: '#155263', fontSize: '14px' }}>
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageBg}>
      <div style={{ maxWidth: '460px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ color: '#155263', marginBottom: '20px' }}>Add Money</h1>

        <div
          style={{
            backgroundColor: '#155263',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '20px',
            color: '#fff',
          }}
        >
          <p style={{ margin: 0, color: '#a8c5cc', fontSize: '13px' }}>Amount to add</p>
          <p style={{ margin: '4px 0 0', fontSize: '32px', fontWeight: 'bold' }}>
            PKR {amount.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '15px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ color: '#155263', fontWeight: 'bold', marginTop: 0, marginBottom: '12px' }}>
              Select Amount
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt)
                    setCustomAmount('')
                  }}
                  style={{
                    padding: '14px 8px',
                    borderRadius: '10px',
                    border: selectedAmount === amt ? '2px solid #5FAE8C' : '1px solid #e0e0e0',
                    backgroundColor: selectedAmount === amt ? '#eafaf3' : '#fafafa',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#155263',
                    fontSize: '13px',
                  }}
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value)
                setSelectedAmount(null)
              }}
              placeholder="Or enter custom amount"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
                color: '#000',
                fontSize: '15px',
              }}
            />
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '15px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ color: '#155263', fontWeight: 'bold', marginTop: 0, marginBottom: '12px' }}>
              Payment Method
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Bank Transfer', 'Easypaisa/JazzCash'].map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: paymentMethod === method ? '2px solid #5FAE8C' : '1px solid #e0e0e0',
                    backgroundColor: paymentMethod === method ? '#eafaf3' : '#fafafa',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#155263',
                    textAlign: 'left',
                    fontSize: '14px',
                  }}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'Bank Transfer' && (
              <div
                style={{
                  backgroundColor: '#f5f7f8',
                  borderRadius: '10px',
                  padding: '15px',
                  marginTop: '15px',
                  fontSize: '14px',
                  color: '#333',
                }}
              >
                <strong style={{ color: '#155263' }}>Aima Concerns Bank Details</strong>
                <p style={{ margin: '8px 0 0', lineHeight: '1.6' }}>
                  Bank: [Bank Name]<br />
                  Account Title: Aima Concerns Pvt. Ltd.<br />
                  Account Number: [Account Number]<br />
                  IBAN: [IBAN]
                </p>
              </div>
            )}

            {paymentMethod === 'Easypaisa/JazzCash' && (
              <div
                style={{
                  backgroundColor: '#f5f7f8',
                  borderRadius: '10px',
                  padding: '15px',
                  marginTop: '15px',
                  fontSize: '14px',
                  color: '#333',
                }}
              >
                <strong style={{ color: '#155263' }}>JazzCash</strong>
                <p style={{ margin: '6px 0 12px', lineHeight: '1.6' }}>
                  Number: 0322-4631622<br />
                  Name: Mohib Ali Butt
                </p>
                <strong style={{ color: '#155263' }}>Easypaisa</strong>
                <p style={{ margin: '6px 0 0', lineHeight: '1.6' }}>
                  Number: 0322-4631622<br />
                  Name: Mohib Ali Butt
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ color: '#155263', fontWeight: 'bold', marginTop: 0, marginBottom: '10px' }}>
              Transaction / Reference Number (optional)
            </p>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
                color: '#000',
                fontSize: '15px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#5FAE8C',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
        {message && <p style={{ marginTop: '15px', color: 'red' }}>{message}</p>}
      </div>
    </div>
  )
}