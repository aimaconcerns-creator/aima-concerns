'use client'

import { useTransition } from 'react'
import { deleteEntry } from './actions'

type Props = {
  airlineId: string
  ledgerId: string
  entryId: string
  label?: string
}

export default function DeleteEntryButton({ airlineId, ledgerId, entryId, label }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    const what = label ? `"${label}"` : 'this entry'
    if (!confirm(`Delete ${what}? This cannot be undone.`)) return

    const fd = new FormData()
    fd.set('airlineId', airlineId)
    fd.set('ledgerId', ledgerId)
    fd.set('entryId', entryId)

    startTransition(async () => {
      try {
        await deleteEntry(fd)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
