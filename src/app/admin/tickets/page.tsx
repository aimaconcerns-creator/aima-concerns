import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import DeleteTicketButton from './DeleteTicketButton'

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

async function deleteTicket(formData: FormData) {
  'use server'

  const id = formData.get('id') as string
  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('status')
    .eq('id', id)
    .single()

  if (ticket?.status !== 'Departed') {
    return
  }

  await supabase.from('tickets').delete().eq('id', id)
  revalidatePath('/admin/tickets')
}

export default async function AdminTicketsPage() {
  const supabase = await createClient()

  const { data: airlines } = await supabase.from('airlines').select('id, name').order('name')
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, airlines(name)')
    .order('departure_datetime', { ascending: true })

  return (
    <div style={{ padding: '34px' }}>
      <style>{`
        .form-card {
          border-radius: 14px; padding: 24px; margin-bottom: 26px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .form-card h3 { color: #fff; margin: 0 0 18px; font-size: 16px; font-weight: 800; }
        .field-wrap { flex: 1 1 180px; margin-bottom: 12px; }
        .field-label { color: #7d93a3; font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; }
        .field-input {
          width: 100%; padding: 10px; margin-top: 5px; border-radius: 7px; font-size: 13px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); color: #fff;
          box-sizing: border-box;
        }
        .field-input::placeholder { color: #5a7184; }
        .btn-submit {
          padding: 11px 26px; background: #4a9c7a; color: #fff; border: none; border-radius: 7px;
          cursor: pointer; font-weight: 700; margin-top: 6px;
        }

        .tix-table-wrap {
          border-radius: 14px; overflow: auto; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02); box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        table.tix-table { width: 100%; border-collapse: collapse; min-width: 980px; }
        .tix-table thead tr { background: rgba(255,255,255,0.03); text-align: left; }
        .tix-table th {
          padding: 14px 16px; color: #7d93a3; font-size: 12px; text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 700;
        }
        .tix-table td { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .route { font-weight: 800; color: #cfe0ea; font-size: 14px; }
        .flight-no { font-size: 12px; color: #7d93a3; margin-top: 2px; }
        .cell { color: #a9bccb; font-size: 13.5px; }
        .price { font-weight: 700; color: #fff; font-size: 14px; }
        .status-select {
          padding: 6px; border-radius: 6px; font-size: 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff;
        }
        .btn-save {
          padding: 6px 12px; background: rgba(47, 127, 122, 0.2); color: #6fd0c8;
          border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700;
        }
        .btn-visibility { padding: 5px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; }
        .btn-delete {
          padding: 6px 14px; background: rgba(217, 83, 79, 0.18); color: #ff8f8a;
          border: none; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 700;
        }
        .delete-disabled {
          padding: 6px 14px; background: rgba(255,255,255,0.03); color: #4a5a68;
          border-radius: 6px; font-size: 12.5px; cursor: not-allowed; display: inline-block;
        }
      `}</style>

      <h1 style={{ color: '#fff', margin: '0 0 24px', fontSize: '22px', fontWeight: 800 }}>
        Manage Tickets
      </h1>

      <div className="form-card">
        <h3>Add New Ticket</h3>
        <form action={addTicket}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div className="field-wrap">
              <label className="field-label">Ticket Type</label>
              <select name="ticket_type" required className="field-input">
                <option value="One Way">One Way</option>
                <option value="Return">Return</option>
              </select>
            </div>

            <div className="field-wrap">
              <label className="field-label">Airline</label>
              <select name="airline_id" required className="field-input">
                <option value="">Select airline</option>
                {airlines?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="field-wrap">
              <label className="field-label">Origin</label>
              <input type="text" name="origin" required className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Destination</label>
              <input type="text" name="destination" required className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Flight Number</label>
              <input type="text" name="flight_number" required className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Departure Date/Time</label>
              <input type="datetime-local" name="departure_datetime" required className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Arrival Date/Time</label>
              <input type="datetime-local" name="arrival_datetime" required className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Return Flight Number (if Return)</label>
              <input type="text" name="return_flight_number" className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Return Departure (if Return)</label>
              <input type="datetime-local" name="return_departure_datetime" className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Return Arrival (if Return)</label>
              <input type="datetime-local" name="return_arrival_datetime" className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Baggage Allowance</label>
              <input type="text" name="baggage_allowance" placeholder="e.g. 30kg" className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Adult Price</label>
              <input type="number" name="price" required className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Child Price</label>
              <input type="number" name="child_price" className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Infant Price</label>
              <input type="number" name="infant_price" className="field-input" />
            </div>

            <div className="field-wrap">
              <label className="field-label">Available Seats</label>
              <input type="number" name="available_seats" required className="field-input" />
            </div>

            <div style={{ flex: '1 1 100%', marginBottom: '12px' }}>
              <label className="field-label">Notes</label>
              <textarea name="notes" rows={2} className="field-input" />
            </div>
          </div>

          <button type="submit" className="btn-submit">Add Ticket</button>
        </form>
      </div>

      <div className="tix-table-wrap">
        <table className="tix-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Airline</th>
              <th>Departure</th>
              <th>Price</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Visibility</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {tickets?.map((t: any) => {
              const canDelete = t.status === 'Departed'

              return (
                <tr key={t.id}>
                  <td>
                    <div className="route">{t.origin} → {t.destination}</div>
                    <div className="flight-no">{t.flight_number}</div>
                  </td>
                  <td className="cell">{t.airlines?.name || '—'}</td>
                  <td className="cell">
                    {new Date(t.departure_datetime).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="price">PKR {Number(t.price).toLocaleString()}</td>
                  <td className="cell">{t.available_seats}</td>
                  <td>
                    <form action={updateStatus} style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <input type="hidden" name="id" value={t.id} />
                      <select name="status" defaultValue={t.status} className="status-select">
                        <option value="Booking Open">Booking Open</option>
                        <option value="Sold Out">Sold Out</option>
                        <option value="Booking Closed">Booking Closed</option>
                        <option value="Departed">Departed</option>
                      </select>
                      <button type="submit" className="btn-save">Save</button>
                    </form>
                  </td>
                  <td>
                    <form action={toggleHidden}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="is_hidden" value={String(t.is_hidden)} />
                      <button
                        type="submit"
                        className="btn-visibility"
                        style={{
                          background: t.is_hidden ? 'rgba(217, 83, 79, 0.18)' : 'rgba(95, 224, 160, 0.18)',
                          color: t.is_hidden ? '#ff8f8a' : '#5FE0A0',
                        }}
                      >
                        {t.is_hidden ? 'Hidden' : 'Visible'}
                      </button>
                    </form>
                  </td>
                  <td>
                    {canDelete ? (
                      <DeleteTicketButton action={deleteTicket} id={t.id} route={`${t.origin} → ${t.destination}`} />
                    ) : (
                      <span className="delete-disabled" title="Only Departed tickets can be deleted">
                        Delete
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}