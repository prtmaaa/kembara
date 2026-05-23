import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../theme'

type Variant = 'primary' | 'secondary' | 'danger'

type Props = {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

const BG: Record<Variant, string> = {
  primary: colors.sunset,
  secondary: colors.sand,
  danger: '#E53935',
}

const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.text,
  danger: colors.white,
}

export default function AppButton({
  label, onPress, variant = 'primary', loading, disabled, style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: BG[variant] }, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={FG[variant]} />
        : <Text style={[styles.label, { color: FG[variant] }]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
  disabled: { opacity: 0.5 },
})
