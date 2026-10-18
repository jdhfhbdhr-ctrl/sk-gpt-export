export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'Urdu' },
  { code: 'roman-ur', label: 'Roman Urdu' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ru', label: 'Russian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'id', label: 'Indonesian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'th', label: 'Thai' },
  { code: 'fa', label: 'Persian' },
  { code: 'he', label: 'Hebrew' },
  { code: 'bn', label: 'Bengali' },
  { code: 'sv', label: 'Swedish' },
  { code: 'pl', label: 'Polish' }
];

// BCP-47 mapping for speech recognition (voice input).
export const RECOGNITION_LANG = {
  en: 'en-US', ur: 'ur-PK', 'roman-ur': 'ur-PK', hi: 'hi-IN', ar: 'ar-SA',
  es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
  it: 'it-IT', pt: 'pt-BR', nl: 'nl-NL', ru: 'ru-RU', tr: 'tr-TR', id: 'id-ID',
  vi: 'vi-VN', th: 'th-TH', fa: 'fa-IR', he: 'he-IL', bn: 'bn-IN', sv: 'sv-SE', pl: 'pl-PL'
};