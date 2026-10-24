import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { officeCss } from '../lib'

export default async function FindBooking({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  const code = (ref || '').trim().toUpperCase()
  const supabase = await createClient()

  if (code) {
    const { data: pb } = await supabase.from('bookings').select('id').eq('reference', code).maybeSingle()
    if (pb) redirect(`/office/b/package/${pb.id}`)
    const { data: tb } = await supabase.from('ticket_bookings').select('id').eq('reference', code).maybeSingle()
    if (tb) redirect(`/office/b/ticket/${tb.id}`)
  }

  return (
    <div>
      <style>{officeCss}</style>
      <div className="pg-h"><h1>Search result</h1></div>
      <div className="empty" style={{ marginTop: 22 }}>
        {code ? <>No booking found for reference <b>{code}</b>. Check the letters and numbers and try again.</>
              : <>Type a PNR or reference number in the search box at the top.</>}
        <div style={{ marginTop: 18 }}>
          <Link href="/office" className="btn">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
