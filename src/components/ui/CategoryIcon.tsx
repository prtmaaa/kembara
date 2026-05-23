import { View, StyleSheet } from 'react-native'
import { categoryColor } from '../../theme'
import { ExpenseCategory } from '../../types'
import Icon from '../Icon'

const CATEGORY_ICON: Record<ExpenseCategory, string> = {
  food: 'fork',
  transport: 'car',
  accommodation: 'bed',
  activity: 'camera',
  shopping: 'bag',
  other: 'pin',
}

type Props = {
  category: ExpenseCategory
  size?: number
}

export default function CategoryIcon({ category, size = 40 }: Props) {
  const { bg, icon } = categoryColor[category] ?? categoryColor.other
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg }]}>
      <Icon name={CATEGORY_ICON[category] as any} size={size * 0.35} color={icon} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: { justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
})
