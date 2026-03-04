# Accessibility Standards

This repository targets **WCAG 2.2 AA** as the minimum accessibility bar for all user-facing frontend changes.

## Principles
- Accessibility is a release requirement, not a post-release cleanup task.
- Every interactive feature must be usable with keyboard only.
- Semantics and assistive technology compatibility take priority over visual-only behavior.

## Definition Of Done
- Functional tests pass (`npm run test:run`).
- Lint passes (`npm run lint`) with accessibility rules enabled.
- Build passes (`npm run build`).
- Accessibility smoke tests pass (`npm run test:a11y`).
- For UI flow changes, keyboard E2E tests pass (`npm run test:e2e`).
- New UI color/text combinations meet WCAG AA contrast requirements.
- Landmark, heading, and form semantics are preserved or improved.

## Required Engineering Patterns

### Keyboard And Focus
- All clickable controls must be native interactive elements (`button`, `a`, `input`, etc.) unless there is a hard constraint.
- Focus order must follow visual and task order.
- Escape closes dialogs/overlays.
- Focus should be moved into dialogs when opened and restored on close.

### Semantics
- Pages must expose clear landmarks (`main`, `nav`, `header`, etc.).
- Each screen should have one primary `h1`.
- Dialogs must use `role="dialog"` + `aria-modal="true"` + programmatic labeling.

### Forms
- Every form control must have an associated label (`label` + `htmlFor`/`id`).
- Validation errors should be surfaced with programmatic relationships (`aria-invalid`, `aria-describedby`, alert regions where appropriate).
- Submit failures should keep keyboard users oriented (focus and/or clear inline summary).

### Visual Accessibility
- Text and meaningful icons must meet WCAG AA contrast in their rendered context.
- Do not rely on color alone to convey state.
- Respect reduced-motion user preferences.

## Testing Strategy

### Automated
- Unit/integration accessibility smoke checks with `axe-core`.
- Keyboard behavior E2E tests with Playwright for critical journeys.
- Lighthouse CI accessibility audit (minimum score enforced in CI).

### Manual (minimum)
- Keyboard-only walkthrough of changed flows.
- Screen reader smoke check for changed flows (VoiceOver or NVDA).
- Verify visible focus indicators on all newly introduced controls.

## CI Gates
- `.github/workflows/accessibility.yml` enforces:
  - lint
  - build
  - accessibility smoke test
  - keyboard E2E test
  - Lighthouse accessibility threshold

## Exceptions
- Any temporary accessibility exception must:
  - be documented in the PR risk section,
  - include mitigation and owner,
  - include a dated follow-up issue before merge.
