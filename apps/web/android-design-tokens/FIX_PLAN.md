# Решение: Обновяване на съществуващите компоненти

## Проблем
Създадохме Kotlin (.kt) файлове за Android native, но проектът е React Native (TypeScript), който компилира в APK.

## Решение
Обновяваме съществуващите компоненти в `src/components/ui/` и `src/components/enhanced/` да използват дизайн токените от `android-design-tokens/tokens/`.

## План за действие

### 1. Създаване на TypeScript токени (от JSON токените)
- `src/core/tokens/dimens.ts` - от `spacing.json` и `radius.json`
- `src/core/tokens/colors.ts` - от `colors.oklch.md`
- `src/core/tokens/typography.ts` - от `typography.json`
- `src/core/tokens/motion.ts` - от `motion.json`

### 2. Обновяване на съществуващите компоненти
- `src/components/ui/button.tsx` - да използва токените
- `src/components/ui/card.tsx` - да използва токените
- `src/components/enhanced/PremiumButton.tsx` - да използва токените
- `src/components/enhanced/PremiumCard.tsx` - да използва токените

### 3. Изтриване на Kotlin файловете
- Премахваме `android-design-tokens/src/main/java/` (Kotlin файлове)
- Запазваме `android-design-tokens/tokens/` (JSON токени)
- Запазваме `android-design-tokens/res/` (Android string resources - те са полезни)

## Стъпки

1. Създавам TypeScript токени от JSON токените
2. Обновявам съществуващите компоненти
3. Изтривам Kotlin файловете

