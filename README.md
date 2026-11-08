# LEVEL NEXT

Niezależna witryna publikowana przez GitHub Pages.

## Struktura

- `index.html` i pozostałe pliki `.html` - strony witryny. Pozostają w katalogu głównym, aby zachować proste adresy i zgodność z GitHub Pages.
- `site.css`, `site.js` - wspólny wygląd i skrypty głównej witryny.
- `assets/images/` - grafiki, ikony i obrazy używane na stronie.
- `assets/audio/` - pliki dźwiękowe, muzyka i ambient.
- `data/` - dane witryny i pliki zasilające DAILY.
- `archive/` - archiwalne wydania DAILY.
- `scripts/` - skrypty generujące i aktualizujące dane.
- `.github/workflows/` - automatyzacje GitHub Actions.

## Dodawanie muzyki

Pliki MP3 umieszczaj w `assets/audio/`. W kodzie strony odwołuj się do nich przez ścieżkę względną, np. `assets/audio/nazwa-utworu.mp3`.

`daily.html` i `admin.html` są odrębnymi częściami projektu i nie korzystają ze wspólnego arkusza `site.css`.
