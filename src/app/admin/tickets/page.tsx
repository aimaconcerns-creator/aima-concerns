import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

async function addTicket(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const ticketType = formData.get('ticket_type') as string
  const airlineId = formData.get('airline_id') as string
  const origin = formData.get('origin') as string
  const destination = formData.get('destination') as string
  const departureDatetime = formData.get('departure_datetime') as string
  const arrivalDatetime = formData.get('arrival_datetime') as string
  const flightNumber = formData.get('flight_number') as string
  const returnDepartureDatetime = formData.get('return_departure_datetime') as string
  const returnArrivalDatetime = formData.get('return_arrival_datetime') as string
  const returnFlightNumber = formData.get('return_flight_number') as string
  const baggageAllowance = formData.get('baggage_allowance') as string
  const price = Number(formData.get('price'))
  const childPrice = Number(formData.get('child_price') || 0)
  const infantPrice = Number(formData.get('infant_price') || 0)
  const availableSeats = Number(formData.get('available_seats'))
  const notes = formData.get('notes') as string

  const { error } = await supabase.from('tickets').insert({
    ticket_type: ticketType,
    airline_id: airlineId || null,
    origin,
    destination,
    departure_datetime: departureDatetime,
    arrival_datetime: arrivalDatetime,
    flight_number: flightNumber,
    return_departure_datetime: ticketType === 'Return' ? returnDepartureDatetime || null : null,
    return_arrival_datetime: ticketType === 'Return' ? returnArrivalDatetime || null : null,
    return_flight_number: ticketType === 'Return' ? returnFlightNumber || null : null,
    baggage_allowance: baggageAllowance,
    price,
    child_price: childPrice,
    infant_price: infantPrice,
    available_seats: availableSeats,
    status: 'Booking Open',
    is_hidden: false,
    notes,
  })

  if (error) {
    console.error('ADD TICKET ERROR:', error)
    throw new Error('Add ticket failed: ' + error.message)
  }

  revalidatePath('/admin/tickets')
}

async function toggleHidden(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const isHidden = formData.get('is_hidden') === 'true'
  const supabase = await createClient()
  await supabase.from('tickets').update({ is_hidden: !isHidden }).eq('id', id)
  revalidatePath('/admin/tickets')
}

async function updateStatus(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const supabase = await createClient()
  await supabase.from('tickets').update({ status }).eq('id', id)
  revalidatePath('/admin/tickets')
}

export default async function AdminTicketsPage() {
  const supabase = await createClient()

  const { data: airlines } = await supabase.from('airlines').select('id, name').order('name')
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, airlines(name)')
    .order('departure_datetime', { ascending: true })

  const inputStyle = {
    width: '100%',
    padding: '9px',
    marginTop: '4px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    fontSize: '13px',
  }
  const labelStyle = { color: '#155263', fontWeight: 'bold' as const, fontSize: '12px' }
  const fieldWrap = { flex: '1 1 180px', marginBottom: '12px' }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#155263', marginBottom: '20px' }}>Manage Tickets</h1>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ color: '#155263', marginTop: 0 }}>Add New Ticket</h3>
        <form action={addTicket}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Ticket Type</label>
              <select name="ticket_type" required style={inputStyle}>
                <option value="One Way">One Way</option>
                <option value="Return">Return</option>
              </select>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Airline</label>
              <select name="airline_id" required style={inputStyle}>
                <option value="">Select airline</option>
                {airlines?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Origin</label>
              <input type="text" name="origin" required style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Destination</label>
              <input type="text" name="destination" required style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Flight Number</label>
              <input type="text" name="flight_number" required style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Departure Date/Time</label>
              <input type="datetime-local" name="departure_datetime" required style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Arrival Date/Time</label>
              <input type="datetime-local" name="arrival_datetime" required style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Return Flight Number (if Return)</label>
              <input type="text" name="return_flight_number" style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Return Departure (if Return)</label>
              <input type="datetime-local" name="return_departure_datetime" style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Return Arrival (if Return)</label>
              <input type="datetime-local" name="return_arrival_datetime" style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Baggage Allowance</label>
              <input type="text" name="baggage_allowance" placeholder="e.g. 30kg" style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Adult Price</label>
              <input type="number" name="price" required style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Child Price</label>
              <input type="number" name="child_price" style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Infant Price</label>
              <input type="number" name="infant_price" style={inputStyle} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Available Seats</label>
              <input type="number" name="available_seats" required style={inputStyle} />
            </div>

            <div style={{ flex: '1 1 100%', marginBottom: '12px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea name="notes" rows={2} style={inputStyle} />
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 24px',
              backgroundColor: '#5FAE8C',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '5px',
            }}
          >
            Add Ticket
          </button>
        </form>
      </div>

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          overflow: 'auto',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f3f4', textAlign: 'left' }}>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Route</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Airline</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Departure</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Price</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Seats</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Status</th>
              <th style={{ padding: '12px 15px', color: '#155263' }}>Visibility</th>
            </tr>
          </thead>
          <tbody>
            {tickets?.map((t: any) => (
              <tr key={t.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#155263' }}>
                  {t.origin} → {t.destination}
                  <div style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>{t.flight_number}</div>
                </td>
                <td style={{ padding: '12px 15px' }}>{t.airlines?.name || '—'}</td>
                <td style={{ padding: '12px 15px' }}>
                  {new Date(t.departure_datetime).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td style={{ padding: '12px 15px' }}>PKR {Number(t.price).toLocaleString()}</td>
                <td style={{ padding: '12px 15px' }}>{t.available_seats}</td>
                <td style={{ padding: '12px 15px' }}>
                  <form action={updateStatus} style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                    <input type="hidden" name="id" value={t.id} />
                    <select
                      name="status"
                      defaultValue={t.status}
                      style={{ padding: '5px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '12px' }}
                    >
                      <option value="Booking Open">Booking Open</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Booking Closed">Booking Closed</option>
                      <option value="Departed">Departed</option>
                    </select>
                    <button
                      type="submit"
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#155263',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td style={{ padding: '12px 15px' }}>
                  <form action={toggleHidden}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="is_hidden" value={String(t.is_hidden)} />
                    <button
                      type="submit"
                      style={{
                        padding: '5px 12px',
                        backgroundColor: t.is_hidden ? '#d9534f' : '#5FAE8C',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {t.is_hidden ? 'Hidden' : 'Visible'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}