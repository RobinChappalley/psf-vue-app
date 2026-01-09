export function getTypeEvent(item) {
  // item attendu (normalisé):
  // { type: 'camp'|'trainings'|'information-evening'|'generalMeeting'|'fundraisings', data: {...}, camp?: {...} }

  const type = item?.type
  const e = item?.data ?? {}

  const META = {
    camp: {
      icon: 'camp',
      title: () => e?.title ?? 'Camp',
    },

    trainings: {
      icon: 'training',
      title: () => `Entrainement ${e.number ?? ''}`.trim(),
      description: () => e.meetingPoint ?? '',
    },

    'information-evening': {
      icon: 'informationEvening',
      title: () => `Soirée d'information`,
      description: () => '',
    },

    generalMeeting: {
      icon: 'ag',
      title: () => `Assemblée générale`,
      description: () => '',
    },

    fundraisings: {
      icon: 'fundraising',
      title: () => {
        const loc = e.location ?? e.meetingPoint ?? e.place ?? ''
        return loc ? `Vente de pâtisserie ${loc}` : `Vente de pâtisserie`
      },
      description: () => '',
    },
  }

  const m = META[type]
  if (!m) return { title: 'Évènement', icon: 'calendar' }

  return {
    title: m.title?.() ?? 'Évènement',
    icon: m.icon ?? 'calendar',
    description: m.description?.() ?? '',
  }
}
