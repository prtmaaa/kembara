import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../theme'
import Icon from '../Icon'

type Props = {
  iconName: string
  iconBg: string
  iconColor: string
  value: string
  label: string
}

export default function StatCard({ iconName, iconBg, iconColor, value, label }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon name={iconName as any} size={14} color={iconColor} />
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  value: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 20, color: colors.text, lineHeight: 22 },
  label: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
})
