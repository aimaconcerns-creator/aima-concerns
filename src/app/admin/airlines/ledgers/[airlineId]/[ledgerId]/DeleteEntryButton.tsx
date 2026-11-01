'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEntry } from './actions'

export default function DeleteEntryButton({
  airlineId,
  ledgerId,
  entryId,
  label,
}: {
  airlineId: string
  ledgerId: string
  entryId: string
  label: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [err, setErr] = useState('')

  const go = () => {
    if (
      !window.confirm(
        `Delete this entry?\n\n${label}\n\nThe ledger balance will change. The deletion is recorded in the change history.`
      )
    ) {
      return
    }
    setErr('')
    start(async () => {
      try {
        const r = await deleteEntry({ airlineId, ledgerId, entryId })
        if (!r.ok) setErr(r.message)
        else router.refresh()
      } catch {
        setErr('Could not delete. Please try again.')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={go}
        style={{
          background: 'none', border: 'none', padding: 0, marginLeft: 14, color: '#ff8f8a',
          fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {pending ? 'Deleting...' : 'Delete'}
      </button>
      {err ? <div style={{ color: '#ff8f8a', fontSize: 11.5, marginTop: 4 }}>{err}</div> : null}
    </>
  )
}
