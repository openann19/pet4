// Pure, framework-agnostic age utilities with strict validation.

export class DOBValidationError extends Error {}

export function parseISODateStrict(input: string): Date {
  // YYYY-MM-DD only
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!m) throw new DOBValidationError('Invalid format. Use YYYY-MM-DD.')
  const [_, y, mo, d] = m
  const year = Number(y), month = Number(mo), day = Number(d)
  // Construct in UTC to avoid TZ boundary bugs.
  const dt = new Date(Date.UTC(year, month - 1, day))
  // Validate round-trip (e.g., 2010-02-29 should fail)
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() + 1 !== month ||
    dt.getUTCDate() !== day
  ) {
    throw new DOBValidationError('Invalid calendar date.')
  }
  return dt
}

export function calcAgeUTC(dobUtc: Date, nowUtc: Date = new Date()): number {
  const y1 = dobUtc.getUTCFullYear()
  const m1 = dobUtc.getUTCMonth()
  const d1 = dobUtc.getUTCDate()
  const y2 = nowUtc.getUTCFullYear()
  const m2 = nowUtc.getUTCMonth()
  const d2 = nowUtc.getUTCDate()
  let age = y2 - y1
  if (m2 < m1 || (m2 === m1 && d2 < d1)) age -= 1
  return age
}

export function isOfMinimumAge(inputISO: string, minYears = 13, nowUtc?: Date): boolean {
  const dob = parseISODateStrict(inputISO)
  return calcAgeUTC(dob, nowUtc) >= minYears
}
