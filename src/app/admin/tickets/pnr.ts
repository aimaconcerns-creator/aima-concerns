export function cleanPnr(raw: any): { ok: boolean; value: string | null; message: string } {
  const v = String(raw ?? '').toUpperCase().replace(/\s+/g, '')
  if (!v) return { ok: true, value: null, message: '' }
  if (!/^[A-Z0-9]{4,10}$/.test(v)) {
    return { ok: false, value: null, message: 'The PNR must be 4 to 10 letters or numbers, with no symbols.' }
  }
  return { ok: true, value: v, message: '' }
}
