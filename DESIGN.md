---
name: Chess Grande Timesheet
description: A warm, scholarly payroll portal for Chess Grande employees, managers, and web admins — accurate record-keeping that feels cared for, not bureaucratic.
colors:
  forest: "oklch(43.5% 0.076 177)"
  forest-deep: "oklch(36.8% 0.066 177)"
  forest-wash: "oklch(91.4% 0.028 175)"
  ember: "oklch(57.5% 0.108 44)"
  ember-wash: "oklch(92.6% 0.03 44)"
  ember-focus: "oklch(66% 0.104 44)"
  success: "oklch(58% 0.09 156)"
  danger: "#b42318"
  ink: "oklch(25.6% 0.028 178)"
  ink-soft: "oklch(39.8% 0.02 178)"
  muted: "oklch(52.4% 0.018 178)"
  line: "oklch(84.8% 0.012 178)"
  line-strong: "oklch(76.8% 0.018 178)"
  paper: "oklch(95.6% 0.015 96)"
  paper-soft: "oklch(97.3% 0.01 96)"
  surface: "oklch(98.5% 0.008 96)"
  surface-strong: "oklch(99.1% 0.006 96)"
  surface-muted: "oklch(96.8% 0.012 96)"
typography:
  display:
    fontFamily: "Geist, Aptos, 'Avenir Next', 'Segoe UI', sans-serif"
    fontWeight: 650
    lineHeight: 1.12
  headline:
    fontFamily: "Geist, Aptos, 'Avenir Next', 'Segoe UI', sans-serif"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "'Avenir Next', 'Segoe UI', sans-serif"
    fontWeight: 700
    fontSize: "1rem"
    lineHeight: 1.2
  body:
    fontFamily: "'Avenir Next', 'Segoe UI', sans-serif"
    fontWeight: 400
    fontSize: "1rem"
    lineHeight: 1.4
  label:
    fontFamily: "'Avenir Next', 'Segoe UI', sans-serif"
    fontWeight: 700
    fontSize: "0.68rem"
    letterSpacing: "0.06em"
rounded:
  xs: "10px"
  sm: "12px"
  field: "16px"
  md: "18px"
  stat: "22px"
  lg: "26px"
  hero: "28px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "28px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface-strong}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
  button-secondary:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.forest}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  field:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
    height: "52px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hero}"
    padding: "24px"
  chip:
    backgroundColor: "{colors.forest-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
---

# Design System: Chess Grande Timesheet

## Overview

**Creative North Star: "The Headmaster's Study"**

The Headmaster's Study is a room where nothing is rushed and nothing is out of place: warm cream paper, deep green ink, and a terracotta seal marking what has been approved. Chess Grande Timesheet carries that same composed authority into payroll work. The screens are quiet and unhurried, the type is confident without shouting, and every interactive state answers the hand gently. The product's job is to make people feel safe handling money and hours — so the design leads with calm legibility and lets polish signal care, never decoration for its own sake.

The palette is a study, not a startup. A deep pine-teal (Forest) does the structural work — body ink, primary actions, focus — while a single warm ember (clay/terracotta) is kept rare, reserved for focus rings and the occasional warm signal against all that cool green. Surfaces are layered warm papers rather than stark whites, so the interface reads as a physical document on a desk. Depth is conveyed through warm-tinted soft shadows and a slight lift on hover, never hard chrome or neon.

Everything is generous and rounded — 16px field corners, 18–28px card corners, pill buttons — which keeps an information-dense payroll tool from feeling like a spreadsheet. Motion is restrained and ease-driven: a 1–2px lift, a soft sheen on primary buttons, a fade-and-pop for panels, all of which collapse to nothing under `prefers-reduced-motion`. Trust is the aesthetic: accuracy, clear confirmation, and considered spacing over feature noise.

**Key Characteristics:**
- Warm cream/paper ground (`oklch ~95–99%`, hue ~96), never pure white
- Deep pine-teal Forest (`oklch(43.5% 0.076 177)`) as the one structural accent for text and actions
- Ember clay (`oklch(57.5% 0.108 44)`) is rare — reserved for focus and warm signal
- Avenir Next body type with Geist display headings; uppercase, letter-spaced labels
- Large radii everywhere (10–28px, pill buttons), generous spacing scale
- Warm-tinted soft shadows and a gentle translateY lift on hover
- Operate mode: scanability and confirmation states outrank expression

## Colors

The palette is a cool-forest-on-warm-paper scheme with a single rare ember accent; restraint is the point — Forest carries almost all structural color, and Ember is rationed.

### Primary
- **Forest** (`oklch(43.5% 0.076 177)`): the working accent. Primary buttons, active/selected states, links, and body ink all read from it. Deep enough for text, saturated enough to feel authoritative as a fill.
- **Forest Deep** (`oklch(36.8% 0.066 177)`): hover/pressed darkening of Forest; primary-button hover.
- **Forest Wash** (`oklch(91.4% 0.028 175)`): pale teal tint for selected nav items, hover highlights, and soft fill states.
- **Forest Ink** (`oklch(25.6% 0.028 178)`): default body text — a greened near-black, not pure black.

### Secondary
- **Ember** (`oklch(57.5% 0.108 44)`): the warm counterpart, a kiln-clay/terracotta. Used sparingly as the focus-ring color (`--focus`) and for rare warm emphasis so it always reads as a signal, not a theme.
- **Ember Wash** (`oklch(92.6% 0.03 44)` / focus `oklch(66% 0.104 44)`): soft focus glows and warm tinting around focused controls.

### Tertiary
- **Success** (`oklch(58% 0.09 156)`): a greener teal for positive confirmation states (saved, scheduled, paid), distinct enough from Forest to register as a state change.
- **Danger** (`#b42318`, border `#8f1d14`): destructive actions only (e.g. clear month); the one hard red in the system.

### Neutral
- **Paper** (`oklch(95.6% 0.015 96)`): page background — warm cream, never cool gray or white.
- **Paper Soft / Surface / Surface Strong** (`oklch(97.3% → 99.1%)`): ascending card and panel surfaces, warm and barely-there.
- **Surface Muted** (`oklch(96.8% 0.012 96)`): recessed/secondary regions inside cards.
- **Ink Soft** (`oklch(39.8% 0.02 178)`): secondary text and icon strokes.
- **Muted** (`oklch(52.4% 0.018 178)`): tertiary/placeholder text and labels.
- **Line** (`oklch(84.8% 0.012 178)`) / **Line Strong** (`oklch(76.8% 0.018 178)`): hairline borders and dividers; a faint green cast, not gray.

### Named Rules
**The Forest-and-Ember Rule.** Forest does the structural work on ~every screen; Ember is a garnish, not an ingredient. Ember appears only as focus color and the occasional deliberate warm signal — if a screen reads as "orange," Ember has been overused.

**The Warm Ground Rule.** No pure white (`#fff`) surfaces and no pure black text. Backgrounds warm toward cream (hue ~96); ink is a greened near-black. The whole UI should feel lit by lamplight, not fluorescent.

## Typography

**Display Font:** Geist (with Aptos, Avenir Next fallback)
**Body Font:** Avenir Next (with Segoe UI fallback)
**Accent Serif:** Georgia / Times New Roman (sparingly, for a single scholarly flourish)

**Character:** A clean Swiss-Grotesque pairing (Geist display over Avenir Next body) that reads modern but unhurried, with a single serif accent kept in reserve like a headmaster's signature. Confidence comes from weight and spacing, not decoration.

### Hierarchy
- **Display** (Geist, 650, line-height 1.12): page and hero headlines; calm and authoritative.
- **Headline** (800 weight): section titles and prominent numbers (`.stat-value` ~1.34rem, tabular-nums, line-height 1).
- **Title** (Avenir Next, 700, 1rem, line-height 1.2): card headers, group titles.
- **Body** (Avenir Next, 400, 1rem, line-height ~1.4): all running copy and form values.
- **Label** (700, 0.68rem, letter-spacing 0.06–0.16em, UPPERCASE): section eyebrows, stat labels, header titles — the system's signature "engraved plaque" voice.

### Named Rules
**The Engraved Label Rule.** Small structural labels are uppercase and letter-spaced (0.06–0.16em), never bold-and-shouted. They read like a brass plaque or ledger heading — quiet authority, fixed caps.

**The Tabular Numbers Rule.** Any figure the user compares (hours, pay) uses `font-variant-numeric: tabular-nums` so columns align optically and never jitter as values change.

## Layout

A single centered column on a generous grid. The page container is `width: min(1320px, 100%)`, centered, with vertical rhythm driven by the spacing scale (`--space-1…12`, 4–48px) — sections separate by a full `--space-7` (28px). Hero regions and card grids use CSS grid; the hero splits into copy plus a fixed 340–460px month panel. Density is *comfortable*, not sparse: this is a data-entry tool, so information is present but always grouped, padded, and rounded so it never feels cramped.

Responsive behavior collapses gracefully: below ~900px the navigation reflows into a wrapping grid and the hero stacks; below 600px the desktop nav is replaced by a hamburger menu panel. Field heights never drop below 44px touch targets. Spacing contracts but radii stay large, preserving the soft silhouette on small screens.

## Elevation & Depth

Depth is a warm, layered-paper model: surfaces are mostly flat at rest and lift gently in response to state. Shadows are tinted warm (`rgba(61, 52, 36, …)` — a browned shadow, never blue/gray), so cards read as paper resting on paper rather than floating chrome. Interactive surfaces (cards, calendar days, chips) lift `translateY(-2px)` and step up to `--shadow-md` on hover. There are no borders-as-depth or hard drop shadows; the soft warm shadow plus a faint hairline border do all the work.

### Shadow Vocabulary
- **Shadow Small** (`0 8px 18px rgba(61, 52, 36, 0.06)`): default rest state for cards, header, and buttons.
- **Shadow Medium** (`0 14px 32px rgba(61, 52, 36, 0.08)`): hover state and popovers/dropdowns.
- **Shadow Large** (`0 24px 56px rgba(61, 52, 36, 0.10)`): modals and the month-picker popover.

### Named Rules
**The Flat-Then-Lift Rule.** Surfaces sit flat at rest; depth is a response, not a default. A hover or open state lifts 1–2px and deepens the warm shadow — no surface should arrive already casting a large shadow.

**The Warm Shadow Rule.** Every shadow is tinted brown (`rgba(61, 52, 36, …)`), matching cream paper under lamplight. Never a neutral-gray or cool-blue shadow.

## Shapes

Soft and generous everywhere. The radius scale runs `xs 10px → sm 12px → field 16px → md 18px → stat 22px → lg 26px → hero 28px`, with `999px` pills for buttons, menu triggers, and chips. There is no sharp-cornered element in the system; even calendar day cells and chips carry rounded corners. Borders are hairline (1px) in `--line`, occasionally warmed with a tint toward the active surface. Buttons are full pills; form fields are a consistent 16px. Silhouettes are rounded "cards on a desk," reinforcing the calm, physical-document character.

## Components

### Buttons
Confident pills that answer the hand with a lift and, on primary, a passing sheen.
- **Shape:** full pill (`border-radius: 999px`), 44px+ min touch height.
- **Primary (`.primary`):** Forest background, `surface-strong` text, small warm shadow. Hover: `translateY(-1px)`, Forest Deep, a left-to-right white sheen sweep (720ms). Active: `translateY(0) scale(0.985)`.
- **Secondary (`.secondary`):** `surface-strong` background, Forest text, faint Forest-tinted border. Same lift on hover.
- **Ghost (`.ghost`):** transparent, `--line` border, `ink-soft` text — for low-emphasis actions.
- **Danger (`#clearMonth`):** the one hard red (`#b42318`); reserved for destructive clears.
- **Focus:** 3px Ember-mix outline at 3px offset (`--focus`).
- **Transition:** transform/box-shadow/border/background/color at 180ms `cubic-bezier(0.22, 1, 0.36, 1)`.

### Cards / Containers
The room's furniture — large, padded, gently rounding panels.
- **Corner Style:** 24–28px (`--radius-lg`/`--radius-hero`); inner stat tiles 22px; sub-panels 18px.
- **Background:** warm `--surface` (often a faint white→muted gradient), bordered by a hairline `--line`.
- **Shadow Strategy:** `--shadow-sm` at rest, `--shadow-md` + `translateY(-2px)` on hover for interactive cards (`.summary-card`, `.day`, `.pay-card`, `.draft-card`).
- **Internal Padding:** `--space-5`/`--space-6` (20–24px).

### Stat Tiles
Signature summary blocks (`.stat`): a warm gradient fill, 22px radius, 1px border, min-height 132px. An uppercase 0.68rem label over a bold ~1.34rem tabular number. Used in threes for hours / pay / status at a glance.

### Inputs / Fields
Tall, soft, unmistakably tappable.
- **Style:** 16px radius, 1px `--line` border, `surface-strong` (10% white-mixed) background, 12px/14px padding, 52px min-height, 1rem body type.
- **Focus:** border warms toward Ember; a 4px soft Ember ring (`0 0 0 4px color-mix(--focus 14%)`); field lifts `translateY(-1px)`. Global `:focus-visible` adds a 3px Ember outline.
- **Error/Danger:** border/ink shift to the Danger red where validation fails.

### Chips / Calendar Chips
Tiny rounded tags (10px radius) that label calendar entries. Default is a Forest-wash fill; entries can carry a per-calendar color via `--entry-calendar-color` with a darkened border and auto text color. Chips lift 1px on hover.

### Navigation
A sticky, rounded header bar (`--surface` 88% / white 12% with `backdrop-filter: blur(10px)`), 24px radius, hairline border. Nav links are pills (10px) in `ink-soft` 0.9rem/700; hover and active fill with `--accent-soft` and darken to `ink`. A trigger chevron rotates on expand. Below 900px links reflow to a wrapping grid; below 600px the bar collapses to a logo + menu button opening a sliding panel.

### Calendar Grid
Signature surface: a 7-column grid of rounded `.day` cells with faint hairline borders, outside-month days muted and desaturated (`grayscale(1)` on chips, reduced opacity). Hoverable days lift with `--shadow-md`. This is the single entry ledger for every role.

## Do's and Don'ts

### Do:
- **Do** keep Forest (`oklch(43.5% 0.076 177)`) as the one structural accent; let it own text, actions, and selected states.
- **Do** warm every neutral and shadow toward cream/brown — paper backgrounds (hue ~96), browned `rgba(61, 52, 36, …)` shadows.
- **Do** use uppercase, letter-spaced (0.06–0.16em) labels for structural eyebrows and headings-within-cards.
- **Do** keep radii large (16px fields, 18–28px cards, pill buttons) and touch targets ≥44px.
- **Do** communicate state through confirmation color and tabular numbers; favor "Saved / Projected / Submitted / Paid"-style certainty.
- **Do** respect `prefers-reduced-motion` — collapse lifts, sheens, and pops to ~0ms.

### Don't:
- **Don't** spend Ember (clay/terracotta) as a theme color; it is the focus ring and a rare warm accent only.
- **Don't** use pure white surfaces or pure black text — they break the lamplight warmth.
- **Don't** introduce cool/gray/bluish neutrals or shadows; the whole system is warm-green-cream.
- **Don't** add hard 90° corners, harsh 1px-but-loud borders, or neon/gradient SaaS treatments.
- **Don't** decorate for effect — no illustrative noise, gamification, or "competition" framing of hours; this is calm administrative work.
- **Don't** shrink fields or radii to fit more content; restructure the layout instead of tightening the silhouette.
