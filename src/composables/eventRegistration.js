export function getUserCampIds(user, usersById) {
  if (!user) return []

  // enfant → ses propres camps
  if (!user.role?.includes('parent')) {
    return user['camps-attended'] || []
  }

  // parent → camps de ses enfants
  const result = []
  for (const childId of user.children || []) {
    const child = usersById[childId]
    if (child?.['camps-attended']) {
      result.push(...child['camps-attended'])
    }
  }

  return result
}

export function isUserRegisteredToCamp(user, camp, usersById) {
  if (!user || !camp) return false
  const camps = getUserCampIds(user, usersById)
  return camps.includes(camp.id)
}

export function isRegisteredToEvent({ user, camp, event, usersById }) {
  if (!user || !camp || !event) return false

  // Camp
  if (event.type === 'camp') {
    return isUserRegisteredToCamp(user, camp, usersById)
  }

  // Training
  if (event.type === 'training') {
    return isUserRegisteredToCamp(user, camp, usersById)
  }

  // Fundraising
  if (event.type === 'fundraising') {
    return (event['users-id'] || []).includes(user.id)
  }

  // AG
  if (event.type === 'ag') {
    return (event.participants || []).some((p) => p.mail === user.email)
  }

  // Soirée d'info
  if (event.type === 'information-evening') {
    return (event.participants || []).some((p) => p.mail === user.email)
  }

  return false
}
