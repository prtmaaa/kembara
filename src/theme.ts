export const colors = {
  cream:        '#F8F6F1',
  sand:         '#EDE9E0',
  border:       '#E2DDD5',
  text:         '#1B1D28',
  muted:        '#7B8090',
  night:        '#22253A',
  nightMid:     '#333652',
  ocean:        '#2375C4',
  oceanSoft:    '#EBF3FD',
  sunset:       '#D4663A',
  sunsetSoft:   '#FBF0EA',
  forest:       '#1E8F54',
  forestSoft:   '#E8F5EE',
  lavender:     '#7B5CC2',
  lavenderSoft: '#F0ECFA',
  white:        '#FFFFFF',
}

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
}

export const categoryColor: Record<string, { bg: string; icon: string }> = {
  food:          { bg: colors.sunsetSoft,  icon: colors.sunset },
  transport:     { bg: colors.oceanSoft,   icon: colors.ocean },
  accommodation: { bg: colors.lavenderSoft,icon: colors.lavender },
  activity:      { bg: colors.forestSoft,  icon: colors.forest },
  shopping:      { bg: colors.sand,        icon: colors.muted },
  other:         { bg: colors.sand,        icon: colors.muted },
}

export const tripGradients = [
  ['#2375C4', '#1E8F54'],
  ['#D4663A', '#C4832D'],
  ['#7B5CC2', '#2375C4'],
  ['#1E8F54', '#2375C4'],
]
