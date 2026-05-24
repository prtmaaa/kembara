import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../../theme'

type Props = {
  title: string
  linkLabel?: string
  onLink?: () => void
}

export default function SectionHeader({ title, linkLabel, onLink }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {linkLabel && onLink ? (
        <TouchableOpacity onPress={onLink}>
          <Text style={styles.link}>{linkLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: colors.text },
  link: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: colors.ocean },
})
