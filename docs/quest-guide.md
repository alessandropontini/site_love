# Paper-Theatre Experience Guide

This guide covers the canonical SITE LOVE narrative mounted by `app/page.tsx`. The public experience is a cardboard-theatre journey through an invitation, a narrative index, four sequential illustrated book chapters, four collected keepsakes, and a gated final letter at the Duomo.

## Canonical flow

1. `ExperienceShell` restores local progress and shows the invitation.
2. **Entra nella storia** opens the theatre index in `JourneyMap`.
3. The index exposes exactly the first incomplete act.
4. Completing an act opens its reward scene and records one keepsake.
5. Returning to the index exposes the next act.
6. All four configured chapter IDs unlock `FinaleExperience`.

The earlier files under `components/story/`, `components/games/`, `components/quest/`, and `components/pixel/` are not mounted by the public route.

## Configuration and state

- `lib/experienceConfig.ts` defines `chapterOrder`, chapter copy, locations, instructions, visual variants, and rewards.
- `lib/i18n.ts` defines Italian/English interface copy and locale detection.
- `components/experience/LocaleProvider.tsx` exposes the locale and language selector.
- `lib/useExperienceProgress.ts` owns versioned state, `localStorage` persistence, migration, unlock checks, rewards, motion preferences, and reset.
- `components/experience/ExperienceShell.tsx` coordinates invitation, map, active chapter, reward, inventory, and finale views.
- `components/experience/JourneyMap.tsx` presents complete, available, and locked chapter states.
- `components/experience/InventoryPanel.tsx` presents collected rewards and the confirmed reset action.

Keep chapter order in configuration. Do not duplicate it in UI code. When adding or removing an act, update the chapter union, configuration, challenge routing, persistence version/migration, map presentation, and finale requirements together.

## Localization

- Add every new visible string and accessible name to both dictionaries.
- Keep structural game values as stable IDs; never store translated labels as progression state.
- Add chapter copy to both localized fields in `lib/experienceConfig.ts`.
- Check language switching on the invitation, map, every challenge state, inventory, reward, and finale.
- Confirm `html lang`, title, description, and the saved manual preference update.
- Do not call an external translation service at runtime.

## Active challenges

| Act | File | Interaction | Reward |
| --- | --- | --- | --- |
| La scintilla | `components/experience/challenges/FrequencyChallenge.tsx` | Tune a signal into the target range. | La prima scintilla |
| Le coordinate | `components/experience/challenges/CoordinatesChallenge.tsx` | Match three memory coordinates with large buttons. | Le nostre coordinate |
| Le scelte | `components/experience/challenges/TimelineChallenge.tsx` | Rebuild four moments in sequence. | Il filo rosso |
| Le luci di Adelchi | `components/experience/challenges/WindowsChallenge.tsx` | Observe and repeat three deterministic light-signal sequences outside Adelchi. | La luce di casa |

Challenge completion must remain keyboard and touch accessible. Avoid drag-only input, tiny targets, hidden time pressure, sound dependencies, and penalties that erase completed progress.

## Progress invariants

- The invitation never auto-starts the journey.
- The first chapter is available with zero progress.
- A later chapter requires every previous chapter ID.
- Completing a chapter more than once does not duplicate its reward.
- Stored chapter lists are sanitized in configured order.
- Restored state cannot open a locked chapter, invalid reward view, or premature finale.
- The finale requires all configured IDs, not only a matching number.
- Reset removes only current and legacy SITE LOVE progress keys.

Changing these rules is high risk and requires focused tests plus the independent combined Code + QA review.

## Art and styling

- `components/experience/art/PaperArt.tsx` composes the shared stage and reward symbols.
- `components/experience/art/PaperArt.module.css` owns paper depth, proscenium, scene layers, and restrained motion.
- `components/experience/ExperienceShell.module.css` owns the active layout, controls, theatre index, hard-cover chapter frame, per-chapter palettes, challenges, inventory, rewards, finale, and responsive behavior. Each chapter scene is rendered once inside the volume; phones linearize narrative, scenery, and challenge into one continuous book sequence.
- Local development renders a clearly labelled **Complete this page now** shortcut after each challenge. It calls the same idempotent completion handler as the game and is removed from production builds through `NODE_ENV`; never make it a production control.
- `public/scene/paper-theatre/` contains opaque JPEG stage panoramas and the few PNG alpha overlays still mounted. Transparent WebP files are retained as source/rollback assets, not used for Android-facing performers.
- `docs/visual-direction.md` is the source of truth for palette, materials, typography, motion, responsive behavior, and asset provenance.

Do not edit `public/` assets without explicit approval. Keep text, instructions, state, and controls in semantic HTML rather than baking them into images.

## Accessibility and motion

- Preserve the skip link and programmatic focus on each view transition.
- Keep visible `:focus-visible` treatment and accessible names for icon-only controls.
- Map state must use text and semantics as well as color.
- Inventory must keep background content inert, close on Escape, trap focus, and return focus to its trigger.
- The system `prefers-reduced-motion` preference overrides the saved motion toggle.
- When motion is disabled, timed visual sequences must expose an ordered text guide.
- Maintain touch targets of at least 44×44 px and test at 320×568 and 390×844.

## Validation checklist

Run:

```bash
git diff --check
npm run lint
npm run build
```

Then manually verify the invitation, all four acts, reward transitions, inventory, reset confirmation, persisted reload, finale gating, keyboard-only completion, reduced-motion behavior, and mobile layouts. Before merge, run the real independent Codex-backed review required by `docs/multiagent-workflow.md`.
