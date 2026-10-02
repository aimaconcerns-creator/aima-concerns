import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const STATUSES = ['Booking Open', 'Sold Out', 'Booking Closed', 'Departed']

async function updateTicket(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const id = formData.get('id') as string
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
  const status = formData.get('status') as string
  const isHidden = formData.get('is_hidden') === 'on'
  const notes = formData.get('notes') as string

  const { error } = await supabase
    .from('tickets')
    .update({
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
      status,
      is_hidden: isHidden,
      notes,
    })
    .eq('id', id)

  if (error) {
    redirect(`/admin/tickets/${id}/edit?error=` + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/tickets')
  redirect('/admin/tickets')
}

function toLocalInput(value: string | null) {
  if (!value) return ''
  return value.slice(0, 16)
}

export default async function EditTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).single()
  if (!ticket) notFound()

  const { data: airlines } = await supabase.from('airlines').select('id, name').order('name')

  return (
    <div style={{ padding: '34px', maxWidth: '900px' }}>
      <style>{`
        .field-wrap { flex: 1 1 220px; margin-bottom: 12px; }
        .field-label { color: #7d93a3; font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; }
        .field-input {
          width: 100%; padding: 10px; margin-top: 5px; border-radius: 7px; font-size: 13px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); color: #fff;
          box-sizing: border-box; font-family: inherit;
        }
        .field-input::placeholder { color: #5a7184; }
        .section-title { color: #d9a441; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin: 26px 0 14px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .form-card {
          border-radius: 14px; padding: 28px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .btn-submit {
          padding: 13px 30px; background: #4a9c7a; color: #fff; border: none; border-radius: 8px;
          cursor: pointer; font-weight: 700; margin-top: 20px; font-size: 15px;
        }
        .hide-row { display: flex; align-items: center; gap: 10px; color: #cfe0ea; font-size: 14px; cursor: pointer; margin-top: 8px; }
      `}</style>

      <Link href="/admin/tickets" style={{ color: '#7d93a3', fontSize: '14px', textDecoration: 'none' }}>
        ← Back to Manage Tickets
      </Link>
      <h1 style={{ color: '#fff', margin: '12px 0 24px', fontSize: '22px', fontWeight: 800 }}>
        Edit Ticket: {ticket.origin} → {ticket.destination}
      </h1>

      <div className="form-card">
        <form action={updateTicket}>
          <input type="hidden" name="id" value={ticket.id} />

          <div className="section-title">Flight Details</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="field-wrap">
              <label className="field-label">Ticket Type</label>
              <select name="ticket_type" required defaultValue={ticket.ticket_type} className="field-input">
                <option value="One Way">One Way</option>
                <option value="Return">Return</option>
              </select>
            </div>

            <div className="field-wrap">
              <label className="field-label">Airline</label>
              <select name="airline_id" required defaultValue={ticket.airline_id ?? ''} className="field-input">
                <option value="">Select airline</option>
                {airlines?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="field-wrap">
              <label className="field-label">Origin</label>
              <input type="text" name="origin" required defaultValue={ticket.origin} className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Destination</label>
              <input type="text" name="destination" required defaultValue={ticket.destination} className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Flight Number</label>
              <input type="text" name="flight_number" required defaultValue={ticket.flight_number} className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Departure Date/Time</label>
              <input
                type="datetime-local"
                name="departure_datetime"
                required
                defaultValue={toLocalInput(ticket.departure_datetime)}
                className="field-input"
              />
            </div>

            <div className="field-wrap">
              <label className="field-label">Arrival Date/Time</label>
              <input
                type="datetime-local"
                name="arrival_datetime"
                required
                defaultValue={toLocalInput(ticket.arrival_datetime)}
                className="field-input"
              />
            </div>

            <div className="field-wrap">
              <label className="field-label">Baggage Allowance</label>
              <input type="text" name="baggage_allowance" placeholder="e.g. 30kg" defaultValue={ticket.baggage_allowance ?? ''} className="field-input" />
            </div>
          </div>

          <div className="section-title">Return Flight (only if Ticket Type is Return)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="field-wrap">
              <label className="field-label">Return Flight Number</label>
              <input type="text" name="return_flight_number" defaultValue={ticket.return_flight_number ?? ''} className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Return Departure</label>
              <input
                type="datetime-local"
                name="return_departure_datetime"
                defaultValue={toLocalInput(ticket.return_departure_datetime)}
                className="field-input"
              />
            </div>
            <div className="field-wrap">
              <label className="field-label">Return Arrival</label>
              <input
                type="datetime-local"
                name="return_arrival_datetime"
                defaultValue={toLocalInput(ticket.return_arrival_datetime)}
                className="field-input"
              />
            </div>
          </div>

          <div className="section-title">Pricing &amp; Seats</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="field-wrap">
              <label className="field-label">Adult Price</label>
              <input type="number" name="price" required defaultValue={ticket.price} className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Child Price</label>
              <input type="number" name="child_price" defaultValue={ticket.child_price ?? 0} className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Infant Price</label>
              <input type="number" name="infant_price" defaultValue={ticket.infant_price ?? 0} className="field-input" />
            </div>
            <div className="field-wrap">
              <label className="field-label">Available Seats</label>
              <input type="number" name="available_seats" required defaultValue={ticket.available_seats} className="field-input" />
            </div>
          </div>
          <p style={{ color: '#5a7184', fontSize: '12.5px', margin: '0 0 10px' }}>
            Adjust seats here if some were sold offline, or to release/remove seats manually.
          </p>

          <div className="section-title">Status &amp; Visibility</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
            <div className="field-wrap">
              <label className="field-label">Status</label>
              <select name="status" defaultValue={ticket.status} className="field-input">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="hide-row">
            <input type="checkbox" name="is_hidden" defaultChecked={ticket.is_hidden} style={{ width: '16px', height: '16px' }} />
            Hide this ticket from customers
          </label>

          <div className="section-title">Notes</div>
          <textarea name="notes" rows={3} defaultValue={ticket.notes ?? ''} className="field-input" />

          {error && (
            <p style={{ marginTop: '16px', color: '#ff8f8a', fontSize: '14px' }}>Error: {error}</p>
          )}

          <button type="submit" className="btn-submit">Save Changes</button>
        </form>
      </div>
    </div>
  )
}