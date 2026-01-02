export function getCurrentCamp(camps) {
  if (!Array.isArray(camps) || camps.length === 0) return null

  const now = new Date()

  const upcoming = camps
    .map((camp) => ({
      camp,
      end: new Date(camp['end-date']),
    }))
    .filter((c) => !isNaN(c.end) && c.end >= now)
    .sort((a, b) => a.end - b.end)

  return upcoming.length ? upcoming[0].camp : null
}
