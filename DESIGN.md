# Kembara — Design Specification

Extracted from the Claude Design bundle. Use this as the single source of truth for all UI implementation.

---

## 1. Design Tokens

### Colors (exact hex equivalents of oklch values)
```
cream:          #F8F6F1   oklch(98% 0.007 75)   — page background
sand:           #EDE9E0   oklch(93% 0.012 75)   — secondary bg, inactive pills
night:          #22253A   oklch(22% 0.05 245)   — headers, nav, dark surfaces
night-mid:      #333652   oklch(30% 0.07 245)   — elevated dark surfaces
sunset:         #D4663A   oklch(64% 0.20 44)    — primary action, active nav, FAB
sunset-soft:    #FBF0EA   oklch(95% 0.04 44)    — sunset tint backgrounds
ocean:          #2375C4   oklch(52% 0.19 222)   — info/link accent
ocean-soft:     #EBF3FD   oklch(95% 0.04 222)   — ocean tint backgrounds
forest:         #1E8F54   oklch(50% 0.16 155)   — success/positive accent
forest-soft:    #E8F5EE   oklch(95% 0.04 155)   — forest tint backgrounds
lavender:       #7B5CC2   oklch(56% 0.14 292)   — misc accent
lavender-soft:  #F0ECFA   oklch(95% 0.03 292)   — lavender tint backgrounds
text:           #1B1D28   oklch(16% 0.03 245)   — primary text
muted:          #7B8090   oklch(54% 0.015 245)  — secondary text
border:         #E2DDD5   oklch(90% 0.008 75)   — dividers and borders
white:          #FFFFFF
```

### Border Radius
```
--r:    16px   (cards, inputs, buttons)
--r-lg: 24px   (hero card, bottom sheet)
```

### Typography
```
Display font: Cormorant Garamond (serif) — screen titles, trip names, large amounts
Body font:    DM Sans — everything else

Screen header h1:       Cormorant 600, 32px, white, line-height 1.1
Dashboard greeting sub: DM Sans 500, 12px, rgba(255,255,255,0.5), uppercase, letterSpacing 0.06em
Section headers (h3):   Cormorant 600, 20px, text color
Stat value:             DM Sans 600, 20px, text color, line-height 1
Stat label:             DM Sans 400, 11px, muted
Amount large:           DM Sans 600, 22px, text
Amount item:            DM Sans 600, 15px, text
Meta text:              DM Sans 400, 11–12px, muted
Body text:              DM Sans 400 or 500, 13–14px, text
Tab label:              DM Sans 500, 10px, uppercase, letterSpacing 0.04em
Pill text:              DM Sans 500, 12px
```

### Avatar Colors (for member initials)
```
["#5B7FA6", "#C4784C", "#6A9A7A", "#8B7AC8"]
```

---

## 2. Navigation Structure

### Bottom Tab Bar
```
Height: 76px
Background: #22253A (night)
Border top: 1px solid oklch(30% 0.05 268) ≈ rgba(255,255,255,0.08)
Padding: 0 8px 8px
Tab label: 10px DM Sans 500, uppercase, letterSpacing 0.04em
Inactive: oklch(55% 0.04 268) ≈ #5A6070
Active: --sunset (#D4663A) + glow filter: drop-shadow(0 0 6px rgba(212,102,58,0.5))

Tabs:
  0: Home      icon=home      label=HOME
  1: Expenses  icon=receipt   label=EXPENSES
  2: Itinerary icon=calendar  label=ITINERARY
  3: Discover  icon=compass   label=DISCOVER
```

### Stack Screens (pushed over tabs, dark header)
TripDetail, CreateTrip, EditTrip, AddExpense, EditExpense, InviteMember

---

## 3. Shared Components

### Screen Header (dark, used on all tab screens + stack screens)
```
Background: #22253A (night)
Padding: 18px 22px 22px (paddingBottom sometimes 24px on Dashboard)
h1: Cormorant 600, 32px, white, line-height 1.1
.sub: 13px DM Sans 400, oklch(65% 0.03 268) ≈ #8B90A0, marginTop 3px
```

### FAB Pill Button
```
Background: --sunset (#D4663A)
Border-radius: 100px (pill)
Padding: 14px 28px
Font: DM Sans 600, 14px, white
Gap between icon and text: 8px
Shadow: 0 6px 24px oklch(62% 0.18 46 / 0.45) ≈ rgba(212,102,58,0.45)
Positioned: sticky bottom 16px, centered
Contains: plus icon (16px) + "Add Expense" or "Trip Baru"
```

### Stat Card (used in 3-column row)
```
Background: white
Border-radius: 16px
Padding: 14px 12px
Gap between elements: 4px
Shadow: 0 1px 6px oklch(50% 0.05 268 / 0.1) ≈ rgba(0,0,0,0.07)

Icon box: 28×28px, borderRadius 8px, marginBottom 4px (contains SVG icon 14px)
Value: DM Sans 600, 20px, text color, line-height 1
Label: DM Sans 400, 11px, muted
```

### Budget Progress Bar Card
```
Background: white
Border-radius: 16px
Padding: 16px
Shadow: 0 1px 6px rgba(0,0,0,0.07)

Header row:
  Left: "X spent" (22px DM Sans 600) + sub "of X budget" (13px muted)
  Right: (optional) percentage text
Track: height 6px, background sand, borderRadius 100px
Fill: height 100%, borderRadius 100px, gradient 90deg ocean→forest
Meta row: 11px muted, space-between (pct% used | X travelers)
```

### Section Header
```
flex row, space-between, align baseline
h3: Cormorant 600, 20px, text
link: 12px DM Sans 500, ocean, "Details →" or "See all"
Margin bottom: 12px
```

### Pill Filter
```
Padding: 5px 12px
Border-radius: 100px
Font: DM Sans 500, 12px
Active: background night, color white
Inactive: background sand (#EDE9E0), color muted
```

### Trip List Item (below hero on dashboard)
```
Background: white
Border-radius: 16px
Padding: 14px 16px
Gap: 14px
Shadow: 0 1px 6px rgba(0,0,0,0.07)

Swatch: 48×48px, borderRadius 12px, gradient background, flex-shrink 0
Info: flex 1
  Name: DM Sans 600, 14px, text
  Date: DM Sans 400, 12px, muted, marginTop 2px
Chevron: color border/muted, chevron-right icon
```

---

## 4. Dashboard (Home Tab)

```
Layout: flex column, full scroll

HEADER (dark night):
  padding: 18px 22px 24px (paddingBottom=24)
  Row: [left: greeting + title] [right: avatar circle 38px]
  Greeting: "Good morning" — 12px DM Sans 500, rgba(255,255,255,0.5), uppercase, letterSpacing 0.06em
  Title: "Alex's Trips" (or "[Name]'s Trips") — Cormorant 600, 28px (not 32), white

CONTENT (cream bg):
  Padding: 18px
  Gap between sections: 18px

  1. TRIP HERO CARD (height 210px, borderRadius 24px):
     - Layer 1 (background): gradient 160deg: oklch(32% 0.16 218)→oklch(38% 0.18 178)→oklch(44% 0.15 152)
       Hex approx: #1D4D7A → #1D5E5A → #206640
     - Layer 2 (pattern): repeating grid lines, opacity 0.08, white lines at every 28px (1px thick)
       CSS: repeating-linear-gradient(0deg, transparent 28px, white 28px, white 29px) +
            repeating-linear-gradient(90deg, transparent 28px, white 28px, white 29px)
     - Layer 3 (overlay): gradient to top: oklch(15% 0.1 240 / 0.7) at 0% → transparent at 60%
       Hex approx: rgba(12,15,30,0.7) at bottom
     - Content: padding 16px 20px, justify space-between
       Top: "Active Trip" badge (pill: rgba(255,255,255,0.18), border rgba(255,255,255,0.25), 
            green dot 6px, text 11px DM Sans 500, letterSpacing 0.04em)
       Bottom:
         .loc: destination uppercase — 12px DM Sans 500, oklch(80% 0.05 200) ≈ #99C0D0, letterSpacing 0.08em
         h2: trip name — Cormorant 600, 34px, white, line-height 1.05, letterSpacing -0.01em
         .dates: "Apr 22–29 · 8 days · 2 left" — 12px DM Sans 400, oklch(80% 0.04 200) ≈ #9DBFCC, marginTop 6px

  2. STATS ROW (3 equal columns, gap 10px):
     Card 1: icon=receipt (sunset-soft bg, sunset icon) | val=remaining budget amount | lbl="Remaining"
     Card 2: icon=calendar (ocean-soft bg, ocean icon)  | val=days left (number or —)   | lbl="Days left"
     Card 3: icon=heart (forest-soft bg, forest icon)   | val=travelers count            | lbl="Travelers"

  3. BUDGET SECTION:
     Section head: "Budget Overview" + "Details →" link
     Budget bar card (see shared component)

  4. UPCOMING TRIPS SECTION:
     Section head: "Upcoming Trips"
     Trip list items (see shared component)
     Each swatch uses trip-specific gradient
```

---

## 5. Expenses Screen (Tab 2)

```
HEADER (dark night, NO paddingBottom on .screen-header):
  h1: "Expenses"
  .sub: trip name

  EXP-HEADER-EXT (still dark night, padding 0 22px 20px):
    BUDGET RING AREA (flexRow, gap 18px, marginBottom 16px):
      Ring wrap (80×80px):
        SVG 80×80, rotated -90deg
        Inner circle: cx=40 cy=40 r=32, stroke=oklch(30% 0.06 268)≈#2A2E45, strokeWidth=6, fill=none
        Outer circle: cx=40 cy=40 r=32, stroke=sunset, strokeWidth=6, fill=none
          strokeDasharray = 2π×32 ≈ 201.06
          strokeDashoffset = dasharray × (1 - pct/100)
          strokeLinecap=round
        Center label (absolutely positioned over SVG):
          pct%: 16px DM Sans 700, white, line-height 1
          "used": 9px, oklch(60% 0.04 268)≈#5A6070, marginTop 1px

      Ring info (flex 1):
        h2: total amount — Cormorant 600, 28px, white
        p: "of X budget" — 12px, oklch(60% 0.04 268)≈#5A6070, marginTop 2px
        .remaining: "↑ X remaining" — 13px DM Sans 500, oklch(72% 0.14 152)≈#3DAB72 (green), marginTop 4px

    CAT FILTER (horizontal scroll, no scrollbar):
      Pills: "All", "Stay", "Food", "Transport", "Activity"
      Gap 8px, paddingBottom 2px

EXPENSE LIST (padding 16px, flex column, gap 8px):
  Each item:
    background white, borderRadius 16px, padding 14px 16px
    gap 12px, shadow 0 1px 4px rgba(0,0,0,0.06)
    
    Cat icon (40×40px, borderRadius 12px):
      stay→bed icon (ocean-soft bg, ocean icon)
      food→fork icon (sunset-soft bg, sunset icon)
      transport→car icon (lavender-soft bg, lavender icon)
      activity→camera icon (forest-soft bg, forest icon)
    
    Info (flex 1, minWidth 0):
      Name: DM Sans 500, 14px, text, truncate
      Meta: "Apr 23 · tap to split" — 11px muted, marginTop 2px
    
    Amount (textAlign right):
      Amount: DM Sans 600, 15px, text
      "by Alex" — 11px muted, marginTop 2px

STICKY FAB:
  position sticky, bottom 16px, centered
  "+ Add Expense" with plus icon
```

---

## 6. Itinerary Screen (Tab 3)

```
HEADER (dark night):
  h1: "Itinerary"
  .sub: "Bali Escape · 8 days"

DAY SELECTOR (horizontal scroll, still dark night bg, padding 16px 18px, borderBottom):
  Day chips (flex column, center-aligned):
    .dc-num: 16px DM Sans 700, line-height 1
    .dc-lbl: 10px DM Sans 500, letterSpacing 0.04em
    Active: background sunset, borderColor sunset
      num=white, lbl=oklch(90% 0.06 46)≈#F5D0B8
    Inactive: background rgba(255,255,255,0.06), border rgba(255,255,255,0.12)
      num=oklch(70% 0.04 268)≈#A0A8B8, lbl=oklch(50% 0.04 268)≈#6A7080
    Padding: 8px 14px, borderRadius 14px, border 1.5px

TIMELINE (padding 20px 18px, paddingBottom 90px):
  Day label: Cormorant 600, 22px, text, marginBottom 20px
  
  Each timeline item:
    Left column (52px wide):
      Time: 11px DM Sans 600, muted, paddingTop 14px, centered
      Line top: 2px wide, border color, flex 1, minHeight 12px
      Dot: 10px circle, border 2px white, colored per type
      Line bottom: 2px wide, border color, flex 1, minHeight 20px
    
    Right card (flex 1, marginLeft 10px, marginBottom 10px):
      background white, borderRadius 16px, padding 13px 15px
      shadow 0 1px 6px rgba(0,0,0,0.07)
      
      Top row (space-between, gap 8px):
        Name: DM Sans 500, 14px, text, line-height 1.3
        Type badge: pill, 10px DM Sans 600, uppercase, letterSpacing 0.04em
          transport: bg=lavender-soft, color=lavender
          stay:      bg=ocean-soft, color=ocean
          food:      bg=sunset-soft, color=sunset
          activity:  bg=forest-soft, color=forest
      Note (if any): 12px muted, marginTop 6px, italic
      Duration: 11px muted, marginTop 5px, clock icon 11px + text
  
  Last item: hide line-bottom
```

---

## 7. Discover Screen (Tab 4)

```
HEADER (dark night):
  h1: "Discover"
  .sub: "Bali, Indonesia"

SEARCH BAR (still dark night bg, padding 0 18px 18px):
  Input wrap: rgba(255,255,255,0.1) bg, 1px border rgba(255,255,255,0.15)
    borderRadius 14px, padding 11px 14px, flex row gap 10px
    Search icon (16px, muted), text input (14px white, placeholder=muted)

CATEGORY PILLS (cream bg, horizontal scroll, padding 16px 18px 4px, gap 8px):
  "All", "Eat", "Sights", "Temples", "Beaches", "Activities"

PLACES GRID (2 columns, gap 12px, padding 14px 18px 90px):
  Each place card:
    background white, borderRadius 16px, overflow hidden
    shadow 0 2px 10px rgba(0,0,0,0.07)
    
    Thumb (height 100px):
      Diagonal stripe pattern bg (45deg, color stripes at opacity 0.35)
      Cat label text (9px monospace, centered)
      Save heart button (top-right, 28px circle, white bg)
    
    Info (padding 11px 12px):
      Name: DM Sans 600, 13px, text, lineHeight 1.2
      Tags: flex row wrap, gap 4px
        Each tag: 10px DM Sans, sand bg, muted color, radius 100px, padding 2px 7px
      Meta row (space-between):
        Distance: pin icon 10px + "0.3 km" (11px muted)
        Rating: star icon (sunset fill) + score (12px DM Sans 600)
```

---

## 8. SVG Icon Paths (24×24 viewBox)

All icons: fill=none, stroke=currentColor, strokeLinecap=round, strokeLinejoin=round

```
home:     <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z" strokeWidth="1.8"/>
receipt:  <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="1.8"/>
          <line x1="8" y1="8" x2="16" y2="8" strokeWidth="1.8"/>
          <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.8"/>
          <line x1="8" y1="16" x2="12" y2="16" strokeWidth="1.8"/>
calendar: <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8"/>
          <line x1="3" y1="9" x2="21" y2="9" strokeWidth="1.8"/>
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.8"/>
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.8"/>
compass:  <circle cx="12" cy="12" r="9" strokeWidth="1.8"/>
          <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill=color strokeWidth="1.6"/>
plus:     <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/>
          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
heart:    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeWidth="1.8"/>
bed:      <path d="M3 22V12h18v10M3 12V6a2 2 0 012-2h14a2 2 0 012 2v6M3 16h18" strokeWidth="1.8"/>
fork:     <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.8"/>
          <path d="M7 2v6a3 3 0 006 0V2" strokeWidth="1.8"/>
car:      <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h13a2 2 0 012 2v6a2 2 0 01-2 2h-2" strokeWidth="1.8"/>
          <rect x="7" y="14" width="10" height="6" rx="2" strokeWidth="1.8"/>
camera:   <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeWidth="1.8"/>
          <circle cx="12" cy="13" r="4" strokeWidth="1.8"/>
pin:      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeWidth="1.8"/>
          <circle cx="12" cy="10" r="3" strokeWidth="1.8"/>
clock:    <circle cx="12" cy="12" r="9" strokeWidth="1.8"/>
          <polyline points="12,7 12,12 15,15" strokeWidth="1.8"/>
chevronR: <polyline points="9,18 15,12 9,6" strokeWidth="2"/>
search:   <circle cx="11" cy="11" r="7" strokeWidth="1.8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2"/>
star:     <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" strokeWidth="1.8"/>
```

---

## 9. Category Icon System

```
Category → Icon type, background, icon color:
  stay/accommodation → bed icon,    ocean-soft (#EBF3FD),    ocean (#2375C4)
  food               → fork icon,   sunset-soft (#FBF0EA),   sunset (#D4663A)
  transport          → car icon,    lavender-soft (#F0ECFA), lavender (#7B5CC2)
  activity           → camera icon, forest-soft (#E8F5EE),   forest (#1E8F54)
  shopping           → bag icon,    sand (#EDE9E0),          muted (#7B8090)
  other              → pin icon,    sand (#EDE9E0),          muted (#7B8090)
```

---

## 10. Trip Hero Gradient Presets

```
Trip 1 (ocean-to-forest):   160deg, #1D4D7A → #1D5E5A → #206640
Trip 2 (sunset-to-amber):   160deg, oklch(38% 0.18 148)≈#3D5C1A → oklch(48% 0.16 178)≈#2A6040 → oklch(55% 0.14 208)≈#1A6090
Trip 3 (purple-to-ocean):   160deg, #5a3580 → #2a3a7a → #1a4a7a
Trip 4 (rose-to-amber):     160deg, oklch(58% 0.14 320)≈#903070 → oklch(68% 0.12 15)≈#B05040
```

---

## 11. Key Differences from Previous Implementation

1. **Dashboard stat cards**: Remaining budget / Days left / Travelers — NOT members/transactions/total
2. **Donut ring is on the EXPENSES TAB** inside the dark header extension — not on TripDetail
3. **Budget bar is on the DASHBOARD**, not inside TripDetail
4. **Screen header h1 on Dashboard is 28px** (not 32px), and uses "[Name]'s Trips" format
5. **Category icons** use SVG paths (bed, fork, car, camera) — NOT emojis
6. **Expense screen extended header** (ring + category filter) is part of the dark night area, flush with screen header
7. **Trip hero grid pattern** must be SVG lines (28px spacing, 1px wide, opacity 0.08, white)
8. **Bottom nav has 4 tabs**: Home, Expenses, Itinerary, Discover
9. **Avatar circle on dashboard header** is 38×38px with one of 4 palette colors
10. **Section titles** use Cormorant Garamond (display font), not DM Sans
