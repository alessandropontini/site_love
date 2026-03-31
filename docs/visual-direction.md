# Visual Direction

This document tracks the visual decisions for the rebuild so style changes stay consistent with the current target.

## Current North Star

- Main reference: Pokemon LeafGreen on Game Boy Advance.
- Goal: evoke the feeling of starting a classic Kanto adventure, but centered on Alessandro and Bridget.
- Constraint: the site should feel Pokemon-inspired, not like a direct copy.

## What Is Not Working Yet

- The current palette is too dark and too saturated compared with LeafGreen's softer outdoor look.
- The current type choice feels "retro arcade", while Pokemon LeafGreen uses a cleaner handheld RPG look.
- The intro screen structure is moving in the right direction, but the surface treatment still needs to be closer to GBA menus and dialogue windows.
- Scene art is still not approved: desktop needs denser composition, less empty sky, and landmarks that read as real Milan icons instead of abstract blocks.
- Mobile banner is closer, but still needs stronger landmark silhouettes and more character.
- The current Milan read is still too weak if the Duomo cannot be recognized immediately. Landmark art must move from symbolic blocks to denser micro-sprites.

## LeafGreen Style Notes

These notes are inferred from LeafGreen screenshots, sprite/font sheets, and fan-preserved references linked below.

- Overworld colors are bright but controlled: sky blue, yellow-green grass, pine green trees, sandy paths, off-white UI panels.
- UI frames are usually light cream or white inside, with olive, dark green, or gray-green borders.
- Contrast is moderate. Large dark cinematic gradients should be avoided on core game screens.
- The title/logo is decorative, but the in-game text is a compact bitmap sans font, not an arcade display font.
- Menus and dialogue boxes rely on clean spacing and simple rectangular framing, not glowing cards or rounded modern UI.
- Character sprites read through a few strong color blocks, usually 4-6 dominant tones plus outline/shadow.

## Milano Micro-Sprite Direction

- Target a denser pixel language closer to the clarity of small collectible digital-toy art than to placeholder CSS blocks.
- Landmarks must read first through silhouette, then through 2-3 internal signature cues.
- The Duomo should be the hero landmark: broad Gothic facade, many spires, strong central arch, and a tiny Madonnina accent.
- Galleria should read through its arch / glass rhythm, Castello through side towers and central keep, Bosco through twin towers with green growth, San Siro through stadium bowl massing, tram through its yellow carriage body.
- Use small highlight/shadow ramps inside the sprite, not just a flat fill plus outline.
- Mobile can crop tighter, but the first read should still be "Milano", not generic city skyline.

## Character Reference From Photo

Use this as the base when redrawing the custom player sprites.

### Alessandro

- Bald head.
- Dark mustache.
- Dark rectangular glasses.
- Navy jacket and trousers.
- Light blue shirt.
- Blue patterned tie.
- Light-medium skin tone.

### Bridget

- Dark brown hair in an updo.
- Soft makeup with warm pink tones.
- Sage green dress.
- Light skin tone.
- Small gold jewelry accents.

## Design Direction For The First Screen

- Screen should resemble a route opening or title transition from LeafGreen.
- Prefer pale sky blues, route greens, sand path beige, and cream dialogue boxes.
- Avoid deep maroon, neon cyan, CRT overlays, and arcade cabinet styling on the landing page.
- The first screen should introduce a journey, not a battle screen.
- Keep the current title direction; improve only the supporting/interface typography around it.
- Mobile-friendly from the start: no desktop-only hero assumptions, no fixed-width card layouts that break on small screens.
- On mobile, information and actions come first; decorative route scenery becomes secondary and more compact.
- On phone widths, the intro should fit within a single screen as much as possible, with title, CTA, and avatar choice prioritized over scenic decoration.
- Implementation rule: keep separate desktop and mobile intro layouts instead of endlessly compressing the desktop composition.
- The desktop pixel scene should include recognisable Milan cues such as the Duomo, Castello Sforzesco, tram motifs, or other city symbols.
- Minimum landmark set to represent clearly in the scene art:
  Duomo di Milano, Castello Sforzesco, tram ATM, Galleria Vittorio Emanuele II, Navigli, Bosco Verticale.
- Composition rule: the Duomo is not just one landmark among equals. It should carry the scene and be the first thing that communicates "Milano".

## Font Direction

- Avoid forcing a novelty pixel font across the whole interface.
- Use a clean UI font for readability and polish.
- Keep the decorative pixel font only for short logo moments or accent words.
- Favor sentence-case dialogue and restrained uppercase labels.
- Current implementation direction: clean sans UI text with `Silkscreen` reserved for title accents.
- The title treatment is approved; iterate only on secondary/interface typography and text scale.

## Sprite Direction

- Increase sprite readability beyond the first rough mockup.
- Target a richer handheld-fan-sprite level, closer to high-quality custom GBA-style character work than ultra-minimal 12x16 blocks.
- Aim for compact chibi sprites with stronger silhouette, closer to polished fan sprite work than placeholder minis.
- On mobile, sprites should stay readable through scale and spacing, not just shrink mechanically.
- Prioritize silhouette, outfit recognition, and face cues over strict realism.
- Alessandro should read immediately through glasses, mustache, bald head, blue shirt, and dark suit.
- Bridget should read immediately through hair updo, light skin tones, and sage green dress silhouette.

## Next Steps

1. Continue refining the Milano scene art until the desktop scene feels full and layered, with less empty sky and six landmarks that are recognisable at a glance.
2. Keep iterating the Duomo and skyline micro-sprites until the city reads as Milan even without labels.
3. Improve supporting typography only: larger body sizes, stronger menu/button hierarchy, and tighter pairing with the title.
4. Rebuild Alessandro's sprite first, then Bridget's, keeping the photo reference and the chibi GBA direction.
5. Revisit mobile spacing after the sprite pass so the start screen still fits comfortably without feeling cramped.

## Sources

- Pokemon FireRed / LeafGreen screenshot gallery: https://www.rpgfan.com/gallery/pokemon-firered-leafgreen-screenshots/
- Pokemon FireRed / LeafGreen font sheet: https://www.spriters-resource.com/fullview/45598/
- Pokemon-inspired downloadable FRLG/Emerald font pack: https://pokeprint.kimbachu.com/downloads/
