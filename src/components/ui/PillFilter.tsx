import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'

type Props = {
  options: { label: string; value: string }[]
  selected: string
  onSelect: (value: string) => void
}

export default function PillFilter({ options, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((opt) => {
        const active = opt.value === selected
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  pill: { borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  pillActive: { backgroundColor: colors.night },
  pillInactive: { backgroundColor: colors.sand },
  label: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  labelActive: { color: colors.white },
  labelInactive: { color: colors.muted },
})
