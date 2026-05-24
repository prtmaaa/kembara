import 'react-native-url-polyfill/auto'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces'
import AppNavigator from './src/navigation/AppNavigator'
import QueryProvider from './src/providers/QueryProvider'
import { colors } from './src/theme'

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.ocean} />
      </View>
    )
  }

  return (
    <QueryProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </QueryProvider>
  )
}
