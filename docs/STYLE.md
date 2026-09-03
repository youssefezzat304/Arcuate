# Arcuate — Visual Style Guide

Arcuate follows a **retro editorial UI** direction.

The application should feel more like a beautifully designed printed report, planner, magazine, or reading journal than a conventional SaaS dashboard.

The goal is to preserve the **typographic character, color palette, restraint, and printed/editorial atmosphere** of the reference style without prescribing any specific page structure or layout.

Keywords:

**editorial · Swiss-inspired · retro-modern · muted · typographic · print-like · elegant · understated · calm · refined**

---

# 1. General direction

Arcuate's visual identity should be driven primarily by:

- typography
- restrained color
- subtle contrast
- flat visual treatment
- careful use of detail
- a calm, editorial tone

The interface should feel intentional, sophisticated, and content-focused.

Avoid visual trends that make the product feel like a generic modern SaaS or AI application.

---

# 2. Color palette

Use the following palette as the primary visual foundation.

The colors are inspired by the provided reference palette and should be treated as semantic design tokens rather than arbitrary per-component colors.

## Page background

```css
--background: #EAEDF2;
```

A very light cool gray.

Avoid harsh pure white as the default application background when a softer neutral is appropriate.

---

## Paper / primary surface

```css
--paper: #FCFBF7;
```

A warm off-white.

Use it to create a subtle paper-like editorial feeling without using literal paper textures.

---

## Primary ink

```css
--ink: #161616;
```

Use instead of pure black for most primary text and strong visual elements.

---

## Secondary dark

```css
--ink-secondary: #31312F;
```

A softer charcoal suitable for secondary text and subdued dark elements.

---

## Muted warm neutral

```css
--muted-warm: #BBAF92;
```

Use sparingly for muted information, subtle accents, and secondary visual details.

---

## Warm highlight

```css
--warm-highlight: #E8CF90;
```

A pale, desaturated warm yellow.

Suitable for subtle emphasis and highlighted content.

---

## Primary accent

```css
--accent: #F6BF13;
```

A warm printed yellow.

Use the accent sparingly so it remains visually meaningful.

---

## Accent foreground

```css
--accent-foreground: #161616;
```

Use dark text or icons over the yellow accent.

---

## Border / divider

```css
--border: #D8D8D4;
```

A quiet neutral for subtle separators and control boundaries when needed.

---

# 3. Semantic color usage

Do not scatter raw hex values throughout components.

Prefer semantic tokens such as:

```css
--background
--paper
--foreground
--muted-foreground
--border
--accent
--accent-foreground
```

Map these tokens into the Tailwind/shadcn theme where practical.

Prefer semantic utilities such as:

```tsx
className="bg-background text-foreground"
className="bg-paper"
className="border-border"
className="bg-accent text-accent-foreground"
```

rather than:

```tsx
className="bg-[#FCFBF7] text-[#161616]"
```

unless there is a strong reason to do otherwise.

---

# 4. Typography

Typography is the most important part of Arcuate's visual identity.

Use two complementary typefaces:

1. an elegant, high-contrast serif for editorial emphasis
2. a clean sans-serif for functional UI text

The contrast between the two should create the retro-editorial character.

## Serif

Use the serif for visually important text such as:

- major headings
- article titles
- section titles
- dates
- important numbers
- selected editorial emphasis

The serif should feel refined, literary, and slightly vintage rather than decorative or ornamental.

Suitable directions include typefaces similar to:

- Libre Baskerville
- DM Serif Display
- Cormorant Garamond
- Playfair Display

Do not use the serif for every piece of text.

---

## Sans-serif

Use a neutral, highly readable sans-serif for functional and supporting text such as:

- labels
- metadata
- navigation
- buttons
- form text
- helper text
- captions
- utility text

A clean font such as Geist, Inter, or an equivalent is appropriate.

The sans-serif should feel understated so the serif remains visually distinctive.

---

# 5. Typographic character

Typography should feel editorial rather than purely utilitarian.

Prefer:

- clear contrast between serif and sans-serif roles
- expressive but restrained heading typography
- slightly oversized important text where appropriate
- compact metadata
- subtle letter spacing for small labels
- dark ink-like text rather than harsh pure black

Avoid:

- overly rounded display fonts
- futuristic or techno fonts
- excessive font weights
- excessive uppercase
- decorative script fonts
- typography associated with gaming or crypto products

---

# 6. Body text

Reading comfort has priority over visual novelty.

Body text should be:

- highly readable
- comfortably sized
- set with generous line height
- rendered with strong contrast
- visually calm

A practical starting point is:

```css
font-size: 18px;
line-height: 1.7;
```

Do not reduce readability merely to make the interface look denser.

---

# 7. Micro-labels and metadata

Secondary information should feel similar to captions or annotations in a printed report.

Use:

- sans-serif
- small size
- restrained weight
- optional uppercase
- slightly increased letter spacing
- muted ink colors

Examples of the intended tone:

```text
LANGUAGE
GERMAN

LEVEL
A2

READING TIME
8 MIN
```

Do not overuse uppercase in normal content.

---

# 8. Expressive numbers

Important numbers may be treated as typography rather than ordinary UI labels.

Examples include:

- CEFR levels
- percentages
- reading time
- word counts
- progress statistics

The serif typeface may be used for prominent numbers where it reinforces the editorial feel.

Use this selectively.

---

# 9. Flat visual treatment

The overall visual language should remain flat and print-like.

Prefer:

- solid colors
- subtle borders
- simple fills
- restrained contrast
- clean line-based graphics

Avoid:

- gradients
- gloss
- glass effects
- fake depth
- pseudo-3D styling
- strong embossing
- excessive texture

The interface should feel like it could plausibly belong to a carefully printed publication.

---

# 10. Corners

Rounded corners should be moderate and intentional.

Suggested scale:

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

Avoid applying large rounded corners everywhere.

Pill shapes should be used only when they make semantic sense.

---

# 11. Shadows

Avoid decorative shadows.

Most UI elements should have little or no shadow.

Use shadows only when needed to communicate temporary layering, such as:

- dialogs
- popovers
- dropdown menus

Even then, keep them soft and restrained.

---

# 12. Buttons and controls

Controls should visually belong to the editorial system rather than look like generic SaaS components.

Prefer:

- solid colors
- restrained borders
- moderate corner rounding
- simple typography
- minimal visual effects

Primary actions may use the yellow accent.

Avoid:

- gradients
- glossy buttons
- exaggerated rounding
- large shadows
- overly playful button styling

---

# 13. Vocabulary and text highlighting

Highlighted vocabulary or important text should remain subtle and print-like.

Prefer:

```css
background: var(--warm-highlight);
```

or another restrained use of the warm palette.

Avoid bright fluorescent highlighter colors.

The goal is emphasis without breaking the editorial atmosphere.

---

# 14. Graphics and data visualization

If Arcuate displays statistics, reading progress, vocabulary progress, or CEFR analysis, graphics should remain visually simple and flat.

Prefer:

- circles
- dots
- thin bars
- basic pie charts
- simple line graphics
- restrained progress indicators

Avoid:

- glossy charts
- gradients
- pseudo-3D visualization
- excessive chart decoration

Visualizations should feel compatible with a printed report or magazine.

---

# 15. Icons

Use restrained line-based icons.

Icons should:

- remain visually secondary
- use consistent stroke weight
- avoid unnecessary detail
- fit the muted editorial character

Avoid highly filled, glossy, cartoon-like, or overly playful icon sets.

---

# 16. Motion

Animation should be minimal and quiet.

Appropriate motion includes:

- short fades
- subtle transitions
- gentle state changes
- understated hover transitions
- restrained number or chart transitions

Avoid:

- bounce effects
- elastic animation
- excessive spring motion
- large transforms
- decorative motion

Motion should communicate state changes rather than provide entertainment.

---

# 17. Tailwind CSS

Use **Tailwind CSS whenever practical**.

Prefer Tailwind utility classes for:

- typography
- colors
- borders
- sizing
- states
- transitions
- responsive styling
- standard component styling

Prefer:

```tsx
<h1 className="font-serif text-5xl leading-none tracking-tight">
```

over component-specific CSS when Tailwind can express the styling clearly.

Use the project's shared `cn()` helper for conditional class composition where available.

Avoid:

- inline `style={{ ... }}` declarations when Tailwind can express the rule
- creating CSS modules for simple utility styling
- duplicating CSS rules already supported by Tailwind
- arbitrary Tailwind values when an existing design token is appropriate

Custom CSS is appropriate when:

- Tailwind cannot reasonably express the behavior
- defining global design tokens
- typography requires global treatment
- complex animation requires it
- third-party library styling requires it

---

# 18. Tailwind and design tokens

The color palette and visual system should be represented through shared theme tokens.

Prefer:

```tsx
bg-background
bg-paper
text-foreground
text-muted-foreground
bg-accent
text-accent-foreground
border-border
```

instead of repeating literal colors.

Where practical, configure semantic tokens centrally in the application's global theme or Tailwind configuration.

A palette change should ideally require updating the theme rather than editing individual components.

---

# 19. shadcn/ui

Use existing shadcn/ui components when they provide useful behavior or accessibility.

However, do not allow the default shadcn aesthetic to determine Arcuate's visual identity.

Adapt shadcn components to Arcuate by:

- using Arcuate typography
- using Arcuate semantic colors
- reducing unnecessary rounding
- removing unnecessary shadows
- keeping borders subtle
- avoiding generic SaaS visual treatment

Use shadcn primarily for **behavior and accessible primitives**, not as the visual identity.

---

# 20. Accessibility

Visual style must not override usability.

Maintain:

- sufficient text contrast
- visible keyboard focus states
- accessible control labels
- appropriate semantic HTML
- comfortable touch targets
- readable text sizes
- keyboard-operable interactions

Never use color as the only indicator of state or meaning.

---

# 21. Things to avoid

Avoid introducing the following unless explicitly justified:

- glassmorphism
- neon colors
- purple/blue "AI product" gradients
- gradient text
- glossy graphics
- large decorative shadows
- excessive badges
- excessive pills
- excessive icons
- skeuomorphic paper textures
- excessive animation
- playful cartoon styling
- futuristic AI aesthetics
- visual clutter

---

# 22. Final style test

Before considering a UI implementation visually complete, ask:

> Does this feel like a refined editorial product with a muted, printed character rather than a generic SaaS or AI interface?

The target is:

**elegant serif typography, understated sans-serif utility text, muted print-like colors, flat graphics, restrained effects, and a calm retro-editorial atmosphere.**
