import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { colors } from '../../theme'

type Props = {
  label?: string
  value: string
  onChange: (date: string) => void
  placeholder?: string
  minimumDate?: Date
  maximumDate?: Date
}

function parseDate(str: string): Date {
  if (!str) return new Date()
  const [y, m, d] = str.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return isNaN(dt.getTime()) ? new Date() : dt
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function displayDate(str: string): string {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`
}

export default function DateInput({
  label, value, onChange, placeholder = 'Select date', minimumDate, maximumDate,
}: Props) {
  const [show, setShow] = useState(false)
  const [pendingDate, setPendingDate] = useState<Date>(new Date())

  function openPicker() {
    setPendingDate(parseDate(value))
    setShow(true)
  }

  function handleAndroidChange(_: any, selected?: Date) {
    setShow(false)
    if (selected) onChange(formatDate(selected))
  }

  function handleIOSChange(_: any, selected?: Date) {
    if (selected) setPendingDate(selected)
  }

  function confirmIOS() {
    onChange(formatDate(pendingDate))
    setShow(false)
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.input} onPress={openPicker} activeOpacity={0.7}>
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? displayDate(value) : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={pendingDate}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={confirmIOS}>
                  <Text style={styles.doneBtn}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pendingDate}
                mode="date"
                display="spinner"
                onChange={handleIOSChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.text },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 16,
    padding: 14, backgroundColor: colors.white,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  text: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.text },
  placeholder: { color: colors.muted },
  icon: { fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  doneBtn: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: colors.ocean },
})
