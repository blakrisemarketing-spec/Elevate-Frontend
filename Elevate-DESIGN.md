---
name: High-Velocity Professionalism
colors:
  surface: '#fbf9f2'
  surface-dim: '#dcdad3'
  surface-bright: '#fbf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f4ed'
  surface-container: '#f0eee7'
  surface-container-high: '#eae8e1'
  surface-container-highest: '#e4e2dc'
  on-surface: '#1b1c18'
  on-surface-variant: '#404750'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f3f1ea'
  outline: '#707881'
  outline-variant: '#c0c7d1'
  surface-tint: '#00639a'
  primary: '#005281'
  on-primary: '#ffffff'
  primary-container: '#006ba6'
  on-primary-container: '#d2e7ff'
  inverse-primary: '#96ccff'
  secondary: '#00658c'
  on-secondary: '#ffffff'
  secondary-container: '#49c1fd'
  on-secondary-container: '#004d6b'
  tertiary: '#2d526c'
  on-tertiary: '#ffffff'
  tertiary-container: '#466a86'
  on-tertiary-container: '#cfe8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#96ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004a75'
  secondary-fixed: '#c5e7ff'
  secondary-fixed-dim: '#80d0ff'
  on-secondary-fixed: '#001e2d'
  on-secondary-fixed-variant: '#004c6a'
  tertiary-fixed: '#cae6ff'
  tertiary-fixed-dim: '#a6cbea'
  on-tertiary-fixed: '#001e30'
  on-tertiary-fixed-variant: '#254a64'
  background: '#fbf9f2'
  on-background: '#1b1c18'
  surface-variant: '#e4e2dc'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-lg:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system reimagines the platform as a high-momentum career accelerator. The brand personality is **Propulsive, Expert, and Empathetic**. It avoids the sterile coldness of traditional corporate tools in favor of a "high-energy institutional" aesthetic—combining the reliability of an established university with the agility of a modern tech startup.

The visual style is **Corporate / Modern** with a focus on **Tonal Layering**. It utilizes a sophisticated, warm neutral base to reduce eye strain during long learning sessions, punctuated by vibrant, high-contrast blues that signal action and progress. The interface feels structured and intentional, using clear information hierarchy to guide students through complex career pathways without overwhelming them.

## Colors

The palette is anchored by **Deep Navy (#002E47)** for core typography and "source of truth" elements, ensuring high legibility and an air of authority. The **Primary Blue (#006BA6)** is reserved for primary actions, navigation anchors, and brand identifiers.

To inject energy, **Electric Blue (#4CC3FF)** serves as the high-energy accent, used exclusively for progress indicators, success states, and "look at me" interactive elements like active hover states or notifications. The **Sophisticated Neutral (#F6F4ED)** is the foundation of the UI, used for background canvases to provide a warmer, more premium feel than pure white, while **Pure White (#FFFFFF)** is used for elevated cards and content containers to create a clear "layering" effect.

## Typography

This design system uses a dual-font strategy to balance character with utility. **Lexend** is employed for headlines and display text; its geometric clarity and specific design for reading proficiency make it the ideal choice for an EdTech environment. It provides the "high-energy" and "modern" feel requested.

**DM Sans** is used for all body copy, inputs, and labels. Its low-contrast, stable letterforms ensure that dense instructional content or career data remains highly digestible. Large display type should use tighter letter spacing to maintain a cohesive visual "block," while labels and small captions utilize increased tracking to ensure legibility on smaller screens or within complex dashboards.

## Layout & Spacing

The system follows a **12-column fixed grid** for desktop dashboard views (centered, max-width 1440px) and a **fluid grid** for mobile and tablet views. The spacing rhythm is built on an **8px base unit**, ensuring mathematical harmony across all components.

Information is grouped using "Spatial Clusters." Related items (like a course title and its progress bar) use `sm` spacing, while distinct sections within a dashboard use `lg` spacing to create clear mental breaks. Margins are generous to emphasize the "Minimalist" influence and allow the sophisticated neutral background to act as negative space, reducing cognitive load for the student.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** rather than heavy shadows. The background sits at the lowest level (`#F6F4ED`). Interactive content containers, such as course cards or profile summaries, are "raised" using a **Pure White (#FFFFFF)** fill and a **Low-contrast outline** (1px border in a slightly darker tint of the neutral base).

Shadows are used sparingly and are strictly **Ambient**. They should be ultra-diffused (20px - 40px blur), low opacity (5-10%), and tinted with the Primary Blue to prevent the UI from looking "muddy." This creates a clean, airy feel where the most important content literally brightens the screen.

## Shapes

The shape language is **Friendly yet Structured**. A standard radius of `0.5rem` (8px) is applied to most UI components including input fields, buttons, and small cards. This "Rounded" approach softens the professional tone, making the platform feel accessible and student-centric.

Large containers and featured banners use `rounded-xl` (1.5rem / 24px) to create a soft, modern framing effect. Buttons never use sharp corners, as rounded edges are more conducive to the "inspiring" and "supportive" brand pillars.

## Components

### Buttons
Primary buttons use the **Primary Blue (#006BA6)** with white text and a subtle 2px bottom "border" in a darker shade to provide a tactile, pressable feel. Secondary buttons use a ghost style with a Primary Blue outline. 

### Progress Indicators
This is a critical EdTech component. Use the **Electric Blue (#4CC3FF)** for all progress bars and completion rings. This high-vibrancy color acts as a "reward" signal for the user.

### Cards
Cards are the primary container. They must have a white background, the standard 8px border radius, and a 1px border in a light grey-blue. On hover, cards should transition to a slightly deeper ambient shadow to signal interactivity.

### Form Inputs
Inputs use a white background with a subtle inset shadow to appear "sunken" into the neutral page. Labels are always positioned above the field in **DM Sans Bold**, using the **Deep Navy** color for maximum clarity.

### Chips & Badges
Use for "Course Categories" or "Skill Tags." These should use a semi-transparent version of the primary blue (10% opacity) with the text in the full-saturation color to keep the UI light and avoid visual clutter.