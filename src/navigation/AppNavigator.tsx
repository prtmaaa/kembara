import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { colors } from '../theme'
import { ActiveTripProvider } from '../context/ActiveTripContext'
import Icon from '../components/Icon'
import HeaderUser from '../components/HeaderUser'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import ProfileScreen from '../screens/auth/ProfileScreen'
import TripListScreen from '../screens/trips/TripListScreen'
import TripDetailScreen from '../screens/trips/TripDetailScreen'
import CreateTripScreen from '../screens/trips/CreateTripScreen'
import EditTripScreen from '../screens/trips/EditTripScreen'
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen'
import EditExpenseScreen from '../screens/expenses/EditExpenseScreen'
import InviteMemberScreen from '../screens/trips/InviteMemberScreen'
import JoinTripScreen from '../screens/trips/JoinTripScreen'
import MemberPermissionsScreen from '../screens/trips/MemberPermissionsScreen'
import ExpensesTabScreen from '../screens/expenses/ExpensesTabScreen'
import ItineraryScreen from '../screens/itinerary/ItineraryScreen'
import DiscoverScreen from '../screens/discover/DiscoverScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const INACTIVE_COLOR = 'rgba(255,255,255,0.35)'

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.night,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.sunset,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={TripListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon name="home" size={22} color={focused ? colors.sunset : INACTIVE_COLOR} />
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesTabScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon name="receipt" size={22} color={focused ? colors.sunset : INACTIVE_COLOR} />
          ),
        }}
      />
      <Tab.Screen
        name="Itinerary"
        component={ItineraryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon name="calendar" size={22} color={focused ? colors.sunset : INACTIVE_COLOR} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon name="compass" size={22} color={focused ? colors.sunset : INACTIVE_COLOR} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const darkHeader = {
  headerStyle: { backgroundColor: colors.night },
  headerTintColor: colors.white,
  headerTitleStyle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 20, color: colors.white,
  },
  headerShadowVisible: false,
  headerRight: () => <HeaderUser light />,
} as const

function AppStack() {
  return (
    <ActiveTripProvider>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ ...darkHeader, title: '' }} />
        <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ ...darkHeader, title: 'Trip Baru' }} />
        <Stack.Screen name="EditTrip" component={EditTripScreen} options={{ ...darkHeader, title: 'Edit Trip' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ ...darkHeader, title: 'Tambah Pengeluaran' }} />
        <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ ...darkHeader, title: 'Edit Pengeluaran' }} />
        <Stack.Screen name="InviteMember" component={InviteMemberScreen} options={{ ...darkHeader, title: 'Undang Anggota' }} />
        <Stack.Screen name="MemberPermissions" component={MemberPermissionsScreen} options={{ ...darkHeader, title: 'Permissions' }} />
        <Stack.Screen name="JoinTrip" component={JoinTripScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </ActiveTripProvider>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

const linking = {
  prefixes: ['kembara://'],
  config: {
    screens: {
      JoinTrip: 'join/:token',
    },
  },
}

export default function AppNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.night }}>
        <ActivityIndicator color={colors.sunset} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer linking={linking}>
      {session ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}
