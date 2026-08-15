import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import hi from '../locales/hi.json'
import km from '../locales/km.json'
import zhCN from '../locales/zh-CN.json'

export const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'km', label: 'ខ្មែរ' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh-CN', label: '简体中文' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      km: { translation: km },
      hi: { translation: hi },
      'zh-CN': { translation: zhCN },
    },
    fallbackLng: 'en',
    supportedLngs: languageOptions.map((language) => language.code),
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'heatSafe.language',
      caches: ['localStorage'],
    },
  })

export default i18n
