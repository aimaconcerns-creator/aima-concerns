'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const MAX_MB = 10
const TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const BUCKET = 'issued-visas'

export default function IssuedVisaBox({
  applicationId,
  applicantId,
  fileName,
  fileUrl,
  canEdit,
  status,
}: {
  applicationId: string
  applicantId: string
  fileName: string | null
  fileUrl: string | null
  canEdit: boolean
  status: string
}) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setMsg(null)
    if (!TYPES.includes(file.type)) {
      setMsg({ ok: false, text: 'Please use a PDF, JPG or PNG file.' })
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setMsg({ ok: false, text: `The file must be smaller than ${MAX_MB} MB.` })
      return
    }

    setBusy(true)
    const supabase = createClient()
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
    const path = `${applicationId}/${applicantId}-${Date.now()}.${ext}`

    const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
    if (up.error) {
      setBusy(false)
      setMsg({ ok: false, text: 'The file could not be uploaded: ' + up.error.message })
      return
    }

    const { data, error } = await supabase.rpc('attach_issued_visa', {
      p_application_id: applicationId,
      p_applicant_id: applicantId,
      p_path: path,
      p_file_name: file.name,
    })
    if (error) {
      await supabase.storage.from(BUCKET).remove([path])
      setBusy(false)
      setMsg({ ok: false, text: error.message })
      return
    }

    const old = (data as any)?.old_path
    if (old && old !== path) await supabase.storage.from(BUCKET).remove([old])

    setBusy(false)
    setMsg({ ok: true, text: 'Visa file saved.' })
    router.refresh()
  }

  const remove = async () => {
    if (!window.confirm('Remove this visa file? The customer will no longer be able to download it.')) return
    setMsg(null)
    setBusy(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('remove_issued_visa', {
      p_application_id: applicationId,
      p_applicant_id: applicantId,
    })
    if (error) {
      setBusy(false)
      setMsg({ ok: false, text: error.message })
      return
    }
    const path = (data as any)?.path
    if (path) await supabase.storage.from(BUCKET).remove([path])
    setBusy(false)
    setMsg({ ok: true, text: 'Visa file removed.' })
    router.refresh()
  }

  if (!canEdit) {
    return <p className="note" style={{ margin: 0 }}>Visa files can be uploaded after the customer has paid.</p>
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          pick(f)
        }}
      />

      {fileName ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#1f7a55', fontWeight: 700, fontSize: 13 }}>✓ {fileName}</span>
          {fileUrl && (
            <a className="btn ghost" style={{ padding: '8px 14px', fontSize: 12.5 }} href={fileUrl} target="_blank" rel="noreferrer">Open</a>
          )}
          <button className="btn ghost" style={{ padding: '8px 14px', fontSize: 12.5 }} disabled={busy}
            onClick={() => input.current?.click()}>{busy ? 'Working...' : 'Replace'}</button>
          <button className="btn red" style={{ padding: '8px 14px', fontSize: 12.5 }} disabled={busy || status === 'Issued'}
            onClick={remove}>Remove</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#b3261e', fontWeight: 700, fontSize: 13 }}>No visa file yet</span>
          <button className="btn" style={{ padding: '8px 14px', fontSize: 12.5 }} disabled={busy}
            onClick={() => input.current?.click()}>{busy ? 'Uploading...' : 'Upload visa'}</button>
        </div>
      )}

      {status === 'Issued' && fileName && (
        <p className="note" style={{ margin: '6px 0 0' }}>To remove this file, move the stage back to Approved first.</p>
      )}
      {msg && (
        <p className="note" style={{ margin: '8px 0 0', color: msg.ok ? '#1f7a55' : '#b3261e', fontWeight: 600 }}>{msg.text}</p>
      )}
    </div>
  )
}
