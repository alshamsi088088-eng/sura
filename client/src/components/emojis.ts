// Shared emoji constants - Phase 2 backend uses VALID_EMOJIS
// This is UI-only display mapping, single source of truth is Phase 2 backend

export const EMOJI_MAP: Record<string, string> = {
  love: '\u2764\ufe0f',
  fire: '\ud83d\udd25',
  funny: '\ud83d\ude02',
  sad: '\ud83d\ude22',
  wow: '\ud83d\ude2e',
  clap: '\ud83d\udcff',
  mind_blown: '\ud83e\udd2f',
  excellent: '\ud83d\udcaf'
};

export const EMOJI_KEYS = Object.keys(EMOJI_MAP);