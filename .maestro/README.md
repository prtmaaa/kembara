# Maestro E2E Tests

## Setup

```bash
# Install Maestro CLI (one-time)
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## Running locally

1. Start the app in iOS Simulator via Expo Go:
   ```bash
   npx expo start --ios
   ```

2. Run all flows:
   ```bash
   maestro test .maestro/flows/ \
     --env TEST_EMAIL=your@email.com \
     --env TEST_PASSWORD=yourpassword
   ```

3. Run a single flow:
   ```bash
   maestro test .maestro/flows/01_add_expense.yaml \
     --env TEST_EMAIL=your@email.com \
     --env TEST_PASSWORD=yourpassword
   ```

## Flows

| File | What it tests |
|---|---|
| `01_add_expense.yaml` | Add an expense, verify it appears in list |
| `02_category_filter.yaml` | Category filter pills work correctly |
| `03_add_itinerary.yaml` | Add itinerary item, verify in timeline |
| `04_settle_debt.yaml` | Mark a debt as settled |

## CI

E2E runs on `macos-latest` only on push to `main`/`master` (not on PRs) to conserve CI minutes.

Required GitHub secrets:
- `TEST_EMAIL` — test account email
- `TEST_PASSWORD` — test account password
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
