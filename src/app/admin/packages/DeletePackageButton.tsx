'use client'

export default function DeletePackageButton({
  action,
  id,
  packageName,
}: {
  action: (formData: FormData) => void
  id: string
  packageName: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Permanently delete "${packageName}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        style={{
          padding: '6px 14px',
          backgroundColor: '#d9534f',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        Delete
      </button>
    </form>
  )
}