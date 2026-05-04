---
name: Chess Grande Payroll Portal
description: Warm, sophisticated payroll and timesheet operations for employees, managers, and admins.
colors:
  paper-mist: "#f4efe5"
  study-cream: "#fffaf2"
  ledger-ivory: "#fafaf6"
  library-white: "#ffffff"
  ink-green: "#1d2a2a"
  slate-muted: "#5d6a67"
  faculty-teal: "#245a52"
  faculty-teal-soft: "#dcebe7"
  seminar-clay: "#bd5d38"
  seminar-clay-deep: "#8f3f1e"
  archive-gold: "#f2e4be"
  archive-gold-deep: "#d8b869"
typography:
  display:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "normal"
  headline:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "clamp(2rem, 4vw, 3.2rem)"
    fontWeight: 400
    lineHeight: 0.95
  title:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Avenir Next, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "18px"
  xl: "22px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.faculty-teal}"
    textColor: "{colors.library-white}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
  button-secondary:
    backgroundColor: "{colors.faculty-teal-soft}"
    textColor: "{colors.faculty-teal}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
  button-danger:
    backgroundColor: "{colors.seminar-clay}"
    textColor: "{colors.library-white}"
    rounded: "{rounded.pill}"
    padding: "11px 16px"
  panel-surface:
    backgroundColor: "{colors.study-cream}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.xl}"
    padding: "28px"
  input-default:
    backgroundColor: "{colors.library-white}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  menu-button:
    backgroundColor: "{colors.faculty-teal}"
    textColor: "{colors.library-white}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
---

# Design System: Chess Grande Payroll Portal

## 1. Overview

**Creative North Star: "The Faculty Desk"**

This system should feel like work laid out on a thoughtful academic administrator's desk: orderly, warm, and trusted. The interface uses soft paper backgrounds, deep green-teal anchors, and restrained clay accents so payroll work reads as careful stewardship rather than hard-edged bureaucracy.

The visual philosophy is refined and restrained. Most screens rely on calm surfaces, readable forms, and clear state changes instead of loud emphasis. Decorative energy is limited to gentle gradients, soft tonal shifts, and the contrast between serif headings and practical UI copy. This system explicitly rejects the anti-references in [PRODUCT.md](/Users/elmo/Documents/Codex/backup/chess-timesheet-impeccable-trial/PRODUCT.md:1): cold enterprise HR portals, neon startup dashboards, playful kids-app energy, generic SaaS gradients, dense admin clutter, and anything transactional or cheap.

**Key Characteristics:**
- Warm paper-toned backgrounds with campus-like calm.
- Deep teal as the working color, clay as the selective secondary signal.
- Serif headlines only where a screen needs dignity or narrative weight.
- Rounded panels and soft ambient lift instead of hard containers.
- Administrative clarity first, polish second, ornament last.

## 2. Colors

The palette reads like paper, ink, and annotated records, with teal carrying trust and clay used sparingly for emphasis, warnings, and secondary warmth.

### Primary
- **Faculty Teal** (`#245a52`): The operational anchor for primary buttons, interactive emphasis, active states, links, and dashboard header gradients.

### Secondary
- **Seminar Clay** (`#bd5d38`): The warm counterweight used for alerts, key accents, calendar emphasis, and selected high-attention actions.

### Tertiary
- **Archive Gold** (`#f2e4be`): A specialized dashboard accent used for folder metaphors and administrative grouping on manager-facing surfaces.

### Neutral
- **Paper Mist** (`#f4efe5`): Main employee app background for the timesheet and pay views.
- **Study Cream** (`#fffaf2`): Stronger panel surface used inside hero panels, month boxes, and inner containers.
- **Ledger Ivory** (`#fafaf6`): Manager dashboard surface, slightly cooler and more archival than employee-facing pages.
- **Library White** (`#ffffff`): Form fields, menu panels, modal sheets, and high-clarity utility surfaces.
- **Ink Green** (`#1d2a2a`): Primary text, form text, and high-contrast content.
- **Slate Muted** (`#5d6a67`): Supporting copy, labels, helper text, and de-emphasized metadata.

### Named Rules
**The Marked-Paper Rule.** Neutrals do most of the work. Accent colors should feel like annotations on a document, not paint poured over the whole interface.

## 3. Typography

**Display Font:** Georgia (with `Times New Roman`, serif fallback)  
**Body Font:** Avenir Next (with `Segoe UI`, sans-serif fallback)  
**Label/Mono Font:** Avenir Next (with `Segoe UI`, sans-serif fallback)

**Character:** The type pairing is administrative with a scholarly edge. Serif display moments add dignity and sophistication, while the sans-serif body stack keeps forms and dense interface work practical and legible.

### Hierarchy
- **Display** (400, `clamp(2rem, 5vw, 3.5rem)`, `0.95`): Used for hero headings on the main employee timesheet and summary pages where the screen needs ceremony or orientation.
- **Headline** (400, `clamp(2rem, 4vw, 3.2rem)`, `0.95`): Used on dashboard hero sections and major sectional entry points.
- **Title** (700, `1.6rem`, `1.2`): Used for login cards, setup cards, and local screen titles where serif would feel too formal.
- **Body** (400, `1rem`, `1.5`): Default copy and field text. Keep long explanatory copy around `60ch` where the layout allows it.
- **Label** (700, `0.72rem`, `0.16em`): Used in uppercase for eyebrows, utility labels, and metadata chips that need crisp administrative cadence.

### Named Rules
**The Reserved Serif Rule.** Georgia appears only where the interface needs authority or welcome. Day-to-day form work stays in the sans-serif system.

## 4. Elevation

This system uses soft ambient lift. Surfaces are mostly defined by warm tonal contrast, rounded corners, and light borders, then supported by broad, low-contrast shadows. Depth should feel like paper stacked on a desk, not floating glass or aggressive raised cards.

### Shadow Vocabulary
- **Panel Lift** (`box-shadow: 0 20px 60px rgba(77, 52, 35, 0.12)`): Primary employee panel treatment for hero surfaces, main content shells, and larger grouped sections.
- **Dashboard Lift** (`box-shadow: 0 18px 48px rgba(53, 62, 57, 0.1)`): Manager and admin panel treatment, slightly tighter and cleaner than the employee-facing version.
- **Header Lift** (`box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12)`): Used on top navigation bars to establish separation from the page.
- **Popover Lift** (`box-shadow: 0 14px 28px rgba(0, 0, 0, 0.15)`): Used for menu panels and smaller floating surfaces.

### Named Rules
**The Ambient-Lift Rule.** Shadows are broad and quiet. If a surface looks like a product card in a SaaS marketplace, the lift is too hard.

## 5. Components

### Buttons
- **Shape:** Rounded and approachable, usually `10px` for standard actions and `999px` for utility pills.
- **Primary:** Faculty Teal background with white text, typically `11px 12px` padding on auth surfaces and larger spacing on app actions.
- **Hover / Focus:** Hover states usually shift through tonal background change rather than dramatic motion. Focus uses visible teal-based outlines or border strengthening.
- **Secondary / Ghost / Tertiary:** Secondary actions use pale teal fills with teal text, while destructive or high-attention chips use Seminar Clay. Header utilities often use translucent white-on-gradient pill buttons.

### Chips
- **Style:** Pill-shaped metadata and action chips with restrained fills, either pale teal for filter context or clay for attention states.
- **State:** Selected or highlighted chips increase color contrast rather than adding extra decoration.

### Cards / Containers
- **Corner Style:** Primary panels use `20px` to `22px` radii, with inner cards commonly at `16px` to `18px`.
- **Background:** Most containers use cream, ivory, or white surfaces rather than tinted accent blocks.
- **Shadow Strategy:** Soft ambient lift for major shells, with lighter or no shadow for internal cards.
- **Border:** Thin translucent borders often reinforce the surface edge, especially on light panels.
- **Internal Padding:** Common interior spacing lands at `24px` to `28px`, with `12px` to `16px` on supporting controls.

### Inputs / Fields
- **Style:** White fields with soft line borders, generous height (`52px` on main app forms), and rounded corners from `12px` to `14px`.
- **Focus:** Focus states rely on teal-tinted outlines or border shifts, always visible and calm.
- **Error / Disabled:** Error messaging leans clay or rust rather than bright red, preserving warmth while still reading as corrective.

### Navigation
- **Style, typography, default/hover/active states, mobile treatment:** Top bars use teal-to-clay or teal monochrome gradients with uppercase utility titling. Menus open as white floating sheets with `12px` corners and pale teal hover fills. Mobile layouts collapse by stacking sections rather than introducing heavy navigation chrome.

### Signature Component
- **Calendar Ledger:** The employee timesheet calendar combines soft paper cells, teal outlines for selected states, clay totals, and compact label treatment so dense monthly data stays readable without looking mechanical.

## 6. Do's and Don'ts

### Do:
- **Do** keep primary actions in Faculty Teal (`#245a52`) and reserve Seminar Clay (`#bd5d38`) for selective emphasis, warnings, and secondary warmth.
- **Do** use paper-toned neutrals such as Paper Mist (`#f4efe5`), Study Cream (`#fffaf2`), and Ledger Ivory (`#fafaf6`) as the dominant surface language.
- **Do** pair serif hero headings with sans-serif interface text so sophistication appears at the right moments without slowing routine work.
- **Do** preserve generous rounding between `16px` and `22px` on major surfaces, with quieter `10px` to `14px` radii on controls and fields.
- **Do** keep shadows soft, broad, and low-contrast, especially on large panels and floating menus.

### Don't:
- **Don't** make this feel like a cold enterprise HR portal.
- **Don't** turn it into a neon startup dashboard.
- **Don't** let it drift toward a playful kids app.
- **Don't** use generic SaaS gradients, dense admin clutter, or any visual language that feels transactional, cheap, or overly gamified.
- **Don't** replace the current paper-and-ink tone with black, pure-white, or high-saturation UI that breaks the warm academic restraint.
