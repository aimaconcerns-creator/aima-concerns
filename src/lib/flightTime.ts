const UTC_OFFSET_MIN: Record<string, number> = {
  LHE: 300, KHI: 300, UET: 300, ISB: 300, SKT: 300, LYP: 300,
  MHD: 210, IKA: 210, ZAH: 210,
  BGW: 180, NJF: 180,
}

export function airportCode(label: string | null | undefined): string | null {
  const m = (label ?? '').match(/\(([A-Z]{3})\)/)
  return m ? m[1] : null
}

function toUtcMs(local: string | null | undefined, label: string | null | undefined): number | null {
  const code = airportCode(label)
  if (!code || !local) return null
  const offset = UTC_OFFSET_MIN[code]
  if (offset === undefined) return null
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  if (!m) return null
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - offset * 60000
}

export function flightDuration(
  originLabel: string | null | undefined,
  departureLocal: string | null | undefined,
  destinationLabel: string | null | undefined,
  arrivalLocal: string | null | undefined
): number | null {
  const dep = toUtcMs(departureLocal, originLabel)
  const arr = toUtcMs(arrivalLocal, destinationLabel)
  if (dep === null || arr === null) return null
  return Math.round((arr - dep) / 60000)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}
