// getCurrentCamp.js (DB-ready)
export function getCurrentCamp(camps, context = 'home') {
  if (!Array.isArray(camps) || camps.length === 0) return null

  const pickBestByEndDate = (list) => {
    const withEnd = list
      .map((camp) => ({ camp, end: new Date(camp?.endDate) }))
      .filter((x) => !isNaN(x.end))

    if (withEnd.length === 0) return list[0] ?? null
    withEnd.sort((a, b) => a.end - b.end)
    return withEnd[0].camp
  }

  const published = camps.filter((c) => c?.status === 'published')
  const drafts = camps.filter((c) => c?.status === 'draft')

  if (context === 'home') {
    return published.length ? pickBestByEndDate(published) : null
  }

  if (context === 'admin') {
    if (drafts.length) return pickBestByEndDate(drafts)
    if (published.length) return pickBestByEndDate(published)
    return null
  }

  return published.length ? pickBestByEndDate(published) : null
}
