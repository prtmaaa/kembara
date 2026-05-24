import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme'
import AppButton from '../../components/ui/AppButton'
import AppInput from '../../components/ui/AppInput'

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function signUp() {
    if (!fullName.trim()) { setError('Full name is required.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <View style={styles.successWrap}>
        <Text style={styles.logo}>Kembara</Text>
        <Text style={styles.successTitle}>Check your email</Text>
        <Text style={styles.successSub}>We sent a confirmation link to {email}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Back to <Text style={styles.linkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Kembara</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppInput
            label="Full Name"
            placeholder="Alex Johnson"
            value={fullName}
            onChangeText={setFullName}
          />
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
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <AppButton label="Create Account" onPress={signUp} loading={loading} style={styles.btn} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
              Already have an account? <Text style={styles.linkBold}>Sign In</Text>
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
  successWrap: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontFamily: 'Fraunces_900Black', fontSize: 36, color: colors.night, letterSpacing: 2 },
  tagline: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 6 },
  successTitle: { fontFamily: 'Fraunces_600SemiBold', fontSize: 28, color: colors.night, textAlign: 'center', marginBottom: 8, marginTop: 20 },
  successSub: { fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, textAlign: 'center', marginBottom: 24 },
  form: { gap: 16 },
  btn: { marginTop: 4 },
  link: { fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'center', color: colors.muted, fontSize: 14 },
  linkBold: { fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.ocean },
  error: { fontFamily: 'PlusJakartaSans_400Regular', color: colors.sunset, textAlign: 'center', fontSize: 13 },
})
