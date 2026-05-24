import { View, Text, StyleSheet } from 'react-native'

const PALETTE = ['#5B7FA6', '#C4784C', '#6A9A7A', '#8B7AC8']

type Props = {
  name: string
  index?: number
  size?: number
}

export default function AvatarInitials({ name, index = 0, size = 38 }: Props) {
  const letter = name.trim()[0]?.toUpperCase() ?? '?'
  const bg = PALETTE[index % PALETTE.length]
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.letter, { fontSize: size * 0.37 }]}>{letter}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  circle: { justifyContent: 'center', alignItems: 'center' },
  letter: { fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
})
