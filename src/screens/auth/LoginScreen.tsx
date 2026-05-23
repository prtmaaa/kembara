import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import AppInput from '../../components/ui/AppInput'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Kembara</Text>
          <Text style={styles.tagline}>Track trips. Split bills. Travel easy.</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppInput
            label="Email"
            placeholder="you@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <AppInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <AppButton label="Sign In" onPress={signIn} loading={loading} style={styles.btn} />
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 48, color: colors.night, letterSpacing: 1 },
  tagline: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6 },
  form: { gap: 16 },
  btn: { marginTop: 4 },
  link: { fontFamily: 'DMSans_400Regular', textAlign: 'center', color: colors.muted, fontSize: 14 },
  linkBold: { fontFamily: 'DMSans_600SemiBold', color: colors.ocean },
  error: { fontFamily: 'DMSans_400Regular', color: colors.sunset, textAlign: 'center', fontSize: 13 },
})
