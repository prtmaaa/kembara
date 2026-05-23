import React, { createContext, useContext, useState } from 'react'

interface ActiveTripContextType {
  activeTripId: string | null
  setActiveTripId: (id: string | null) => void
}

const ActiveTripContext = createContext<ActiveTripContextType>({
  activeTripId: null,
  setActiveTripId: () => {},
})

export function ActiveTripProvider({ children }: { children: React.ReactNode }) {
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  return (
    <ActiveTripContext.Provider value={{ activeTripId, setActiveTripId }}>
      {children}
    </ActiveTripContext.Provider>
  )
}

export function useActiveTrip() {
  return useContext(ActiveTripContext)
}
