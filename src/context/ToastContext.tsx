import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Animated, Text, StyleSheet, View } from 'react-native'
import { colors } from '../theme'

type ToastType = 'success' | 'error'

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ToastType>('success')
  const opacity = useRef(new Animated.Value(0)).current
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, t: ToastType = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    opacity.stopAnimation()
    setMessage(msg)
    setType(t)
    opacity.setValue(0)
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start()
    timeoutRef.current = setTimeout(() => setMessage(''), 2600)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      opacity.stopAnimation()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={{ flex: 1 }}>
        {children}
        {message ? (
          <Animated.View style={[styles.toast, { opacity }, type === 'error' && styles.toastError]}>
            <Text style={styles.toastText}>{message}</Text>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    backgroundColor: colors.night, borderRadius: 100,
    paddingVertical: 10, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    zIndex: 999,
  },
  toastError: { backgroundColor: '#E53935' },
  toastText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.white },
})
