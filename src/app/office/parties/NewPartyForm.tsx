'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NewPartyForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const create = async () => {
    setErr('')
    if (name.trim().length < 2) {
      setErr('Type the party name.')
      return
    }
    setBusy(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('create_party', { p_name: name, p_note: note.trim() || null })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    router.push(`/office/parties/${(data as any).id}`)
  }

  return (
    <div className="card">
      <h3>New party</h3>
      {err && <div className="msg bad">{err}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'end' }}>
        <div>
          <label className="lab">Party name</label>
          <input className="in" value={name} placeholder="e.g. GOGA" onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="lab">Note (optional)</label>
          <input className="in" value={note} placeholder="e.g. Lahore agent" onChange={(e) => setNote(e.target.value)} />
        </div>
        <div>
          <button className="btn" disabled={busy} onClick={create}>{busy ? 'Creating...' : 'Create party'}</button>
        </div>
      </div>
    </div>
  )
}
