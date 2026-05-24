import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native'
import { colors } from '../../theme'

type Props = TextInputProps & {
  label?: string
  error?: string
}

export default function AppInput({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style as any]}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.sunset },
  error: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: colors.sunset },
})
