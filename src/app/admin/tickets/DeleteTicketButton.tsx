'use client'

export default function DeleteTicketButton({
  action,
  id,
  route,
}: {
  action: (formData: FormData) => void
  id: string
  route: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Permanently delete the ${route} ticket? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-delete">
        Delete
      </button>
    </form>
  )
}