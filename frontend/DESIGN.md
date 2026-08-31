# Evalia Frontend Design System

## 1. Atmosphere & Identity

Evalia feels like a focused academic command center: calm for students, data-dense for lecturers, and restrained enough for repeated daily work. The signature is split-mode clarity: dark analytical admin surfaces and light student workspace surfaces tied together by one indigo-violet accent.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/base | --user-page | #f7f8fb | #0d1117 | Student page background / admin base |
| Surface/primary | --user-surface | #ffffff | #161b22 | Student panels / admin surfaces |
| Surface/elevated | --bg-elevated | #ffffff | #21262d | Elevated admin panels |
| Surface/overlay | --bg-overlay | #eef0f4 | #30363d | Segmented controls, hover layers |
| Text/primary | --user-ink | #182032 | #f0f6fc | Primary copy |
| Text/secondary | --user-muted | #697386 | #8b949e | Captions and metadata |
| Text/muted | --text-muted | #6b7280 | #6b7280 | Disabled and low-priority text |
| Border/default | --user-line | #e6e9ef | #30363d | Dividers and panel borders |
| Accent/primary | --user-accent | #6255e7 | #6366f1 | CTAs, active navigation, focus |
| Accent/hover | --accent-light | #818cf8 | #818cf8 | Hover and soft highlight |
| Status/success | --status-active | #10b981 | #10b981 | Completed and pass states |
| Status/warning | --status-warn | #f59e0b | #f59e0b | Upcoming and caution states |
| Status/error | --status-danger | #ef4444 | #ef4444 | Error and destructive states |
| Status/info | --status-info | #3b82f6 | #3b82f6 | Informational score states |

### Rules

- Use the student tokens for `/user` surfaces and admin tokens for `/admin` surfaces.
- Accent color is reserved for interactive emphasis and current navigation.
- Status colors communicate state only; they are not decorative palette options.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 28px | 700-800 | 1.2 | 0 | Student page titles |
| H2 | 19px | 700 | 1.3 | 0 | Panel headings |
| H3 | 16px | 700 | 1.35 | 0 | Card titles |
| Body | 14px | 400-600 | 1.5 | 0 | Default UI copy |
| Body/sm | 13px | 500-700 | 1.4 | 0 | Buttons and row metadata |
| Caption | 11px | 700-800 | 1.3 | 0.1em | Eyebrows and labels |

### Font Stack

- Primary: Inter, system-ui, -apple-system, sans-serif.
- Mono: system monospace only where code or identifiers require it.
- Serif: not used.

### Rules

- Body text stays at 13px or larger in dense UI and 14px for normal copy.
- Dashboard headings are compact, not hero scale.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px base.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight inline gaps |
| --space-2 | 8px | Pills and compact controls |
| --space-3 | 12px | Nav and form padding |
| --space-4 | 16px | Compact cards |
| --space-5 | 20px | Panel rhythm |
| --space-6 | 24px | Standard cards |
| --space-8 | 32px | Dashboard sections |
| --space-10 | 40px | Page gutters |
| --space-12 | 48px | Major section separation |

### Grid

- Max content width: 1210px for student dashboard content.
- Student shell: fixed 244px desktop sidebar, responsive drawer on mobile.
- Breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px.

### Rules

- Dashboard cards use compact 8px radii unless an existing hero card pattern requires larger.
- Keep student pages scannable: short rows, clear metadata, no marketing sections.

## 5. Components

### Student Panel

- Structure: heading row, optional link, compact list body.
- Variants: standard, topic, study tip.
- Spacing: 16-24px inner padding, 20-32px between panels.
- States: loading, empty, error, hover links, focus rings.
- Accessibility: semantic headings, real buttons/links, visible focus.
- Motion: use existing fade/slide utilities only.

### Status Pill

- Structure: dot plus label.
- Variants: available, upcoming, in-progress, completed, expired.
- Spacing: 4px vertical, 8-9px horizontal.
- States: static informational state.
- Accessibility: text label carries the status; color is secondary.
- Motion: none.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100-150ms | ease-out | Button hover and press |
| Standard | 200-300ms | ease-in-out | Panel and drawer changes |

### Rules

- Animate transform and opacity only.
- Every interactive control keeps hover and focus affordances.
- Respect existing reduced-motion behavior when added globally.

## 7. Depth & Surface

### Strategy

Mixed, by product area: student surfaces use borders and tonal shifts; admin surfaces use dark tonal layers with subtle borders.

| Type | Value | Usage |
|------|-------|-------|
| Default border | 1px solid var(--user-line) | Student cards and panels |
| Admin border | 1px solid var(--border) | Admin cards and controls |
| Soft shadow | 0 1px 2px #d8dce4 | Selected segmented controls only |
