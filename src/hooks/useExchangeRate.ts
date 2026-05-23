import { useQuery } from '@tanstack/react-query'

type RatesResponse = {
  base: string
  rates: Record<string, number>
}

async function fetchRates(baseCurrency: string): Promise<RatesResponse> {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`)
  if (!res.ok) throw new Error('Failed to fetch exchange rates')
  return res.json()
}

export function useExchangeRate(baseCurrency: string, enabled = true) {
  return useQuery({
    queryKey: ['exchange-rates', baseCurrency],
    queryFn: () => fetchRates(baseCurrency),
    staleTime: 1000 * 60 * 60,
    enabled: enabled && !!baseCurrency,
  })
}

export function getRateToBase(
  rates: Record<string, number> | undefined,
  fromCurrency: string,
  baseCurrency: string
): number {
  if (fromCurrency === baseCurrency) return 1
  if (!rates) return 1
  // Frankfurter returns rates FROM base TO others
  // To convert FROM currency TO base: rate = 1 / rates[fromCurrency]
  const rate = rates[fromCurrency]
  return rate ? 1 / rate : 1
}
