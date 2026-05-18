// ── Tiny core — only the helpers that App.jsx + Layout.jsx need ──────────────
// Keeping this file small means it's included in the main bundle without
// dragging in the 155 KB full translations object.
import { useState, useEffect } from 'react'

export const LANGUAGES = {
  en: { name: 'English',    flag: '🇺🇸' },
  es: { name: 'Español',    flag: '🇪🇸' },
  fr: { name: 'Français',   flag: '🇫🇷' },
  pt: { name: 'Português',  flag: '🇧🇷' },
  sw: { name: 'Kiswahili',  flag: '🇰🇪' },
  yo: { name: 'Yorùbá',     flag: '🇳🇬' },
  ig: { name: 'Igbo',       flag: '🇳🇬' },
  ha: { name: 'Hausa',      flag: '🇳🇬' },
  zh: { name: '中文',        flag: '🇨🇳' },
  hi: { name: 'हिन्दी',     flag: '🇮🇳' },
  ar: { name: 'العربية',    flag: '🇸🇦' },
  ru: { name: 'Русский',    flag: '🇷🇺' },
  de: { name: 'Deutsch',    flag: '🇩🇪' },
  it: { name: 'Italiano',   flag: '🇮🇹' },
  ko: { name: '한국어',       flag: '🇰🇷' },
}

export const RTL_LANGS = new Set(['ar'])

export const LANG_LOCALES = {
  en:'en-US', es:'es-ES', fr:'fr-FR', pt:'pt-BR',
  sw:'en-US', yo:'en-US', ig:'en-US', ha:'en-US',
  zh:'zh-CN', hi:'hi-IN', ar:'ar',
  ru:'ru-RU', de:'de-DE', it:'it-IT', ko:'ko-KR',
}

export function getLang() {
  try { return localStorage.getItem('sh_lang') || 'en' } catch { return 'en' }
}

export function setLang(lang) {
  try { localStorage.setItem('sh_lang', lang) } catch {}
  window.dispatchEvent(new CustomEvent('sh:langchange'))
}

// ── Nav labels only — the 6 words shown in the bottom tab bar ───────────────
// Full translations live in i18n.js (loaded lazily with page chunks)
const NAV = {
  en: { dashboard:'Home',       budget:'Budget',      invest:'Invest',      loans:'Loans',     community:'Community', exploreNav:'Explore' },
  es: { dashboard:'Inicio',     budget:'Presupuesto', invest:'Inversión',   loans:'Préstamos', community:'Comunidad', exploreNav:'Explorar' },
  fr: { dashboard:'Accueil',    budget:'Budget',      invest:'Investir',    loans:'Prêts',     community:'Communauté',exploreNav:'Explorer' },
  pt: { dashboard:'Início',     budget:'Orçamento',   invest:'Investir',    loans:'Empréstimos',community:'Comunidade',exploreNav:'Explorar' },
  sw: { dashboard:'Nyumbani',   budget:'Bajeti',      invest:'Uwekezaji',   loans:'Mikopo',    community:'Jamii',     exploreNav:'Gundua' },
  yo: { dashboard:'Ile',        budget:'Isuna',       invest:'Idokowo',     loans:'Awin',      community:'Àwùjọ',     exploreNav:'Ṣawari' },
  ig: { dashboard:'Ụlọ',        budget:'Mmefu',       invest:'Itinye ego',  loans:'Ịgbazere',  community:'Obodo',     exploreNav:'Nyochaa' },
  ha: { dashboard:'Gida',       budget:'Kasafin',     invest:'Saka jari',   loans:'Rance',     community:'Al\'umma',  exploreNav:'Bincika' },
  zh: { dashboard:'主页',       budget:'预算',         invest:'投资',         loans:'贷款',      community:'社区',       exploreNav:'探索' },
  hi: { dashboard:'होम',        budget:'बजट',          invest:'निवेश',        loans:'ऋण',        community:'समुदाय',    exploreNav:'खोजें' },
  ar: { dashboard:'الرئيسية',  budget:'الميزانية',    invest:'استثمار',      loans:'قروض',      community:'المجتمع',   exploreNav:'استكشف' },
  ru: { dashboard:'Главная',    budget:'Бюджет',      invest:'Инвестиции',   loans:'Кредиты',   community:'Сообщество',exploreNav:'Обзор' },
  de: { dashboard:'Startseite', budget:'Budget',      invest:'Investieren',  loans:'Darlehen',  community:'Gemeinschaft',exploreNav:'Entdecken' },
  it: { dashboard:'Home',       budget:'Bilancio',    invest:'Investire',    loans:'Prestiti',  community:'Comunità',  exploreNav:'Esplora' },
  ko: { dashboard:'홈',          budget:'예산',         invest:'투자',          loans:'대출',      community:'커뮤니티',   exploreNav:'탐색' },
}

export function useNavT() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const handler = () => setTick(n => n + 1)
    window.addEventListener('sh:langchange', handler)
    return () => window.removeEventListener('sh:langchange', handler)
  }, [])
  return NAV[getLang()] || NAV.en
}

// ── Boot loading line only — keeps App.jsx off the full i18n bundle ──────────
const LOADING_UI = {
  en: { loadingAppName: 'StewardHub', loadingTagline: 'Faith-based financial freedom' },
  es: { loadingAppName: 'StewardHub', loadingTagline: 'Libertad financiera basada en la fe' },
  fr: { loadingAppName: 'StewardHub', loadingTagline: 'Liberté financière fondée sur la foi' },
  pt: { loadingAppName: 'StewardHub', loadingTagline: 'Liberdade financeira baseada na fé' },
  sw: { loadingAppName: 'StewardHub', loadingTagline: 'Uhuru wa kifedha unaotegemea imani' },
  yo: { loadingAppName: 'StewardHub', loadingTagline: 'Ominira owo ti o da lori igbagbo' },
  ig: { loadingAppName: 'StewardHub', loadingTagline: 'Onye nwe onwe ya n\'ego' },
  ha: { loadingAppName: 'StewardHub', loadingTagline: 'Yanci na kuɗi bisa bangaskiya' },
  zh: { loadingAppName: 'StewardHub', loadingTagline: '基于信仰的财务自由' },
  hi: { loadingAppName: 'StewardHub', loadingTagline: 'आस्था-आधारित वित्तीय स्वतंत्रता' },
  ar: { loadingAppName: 'StewardHub', loadingTagline: 'الحرية المالية القائمة على الإيمان' },
  ru: { loadingAppName: 'StewardHub', loadingTagline: 'Финансовая свобода на основе веры' },
  de: { loadingAppName: 'StewardHub', loadingTagline: 'Glaubensbasierte finanzielle Freiheit' },
  it: { loadingAppName: 'StewardHub', loadingTagline: 'Libertà finanziaria basata sulla fede' },
  ko: { loadingAppName: 'StewardHub', loadingTagline: '믿음에 기반한 재정적 자유' },
}

/** Minimal strings for the initial auth bootstrap screen (no ./i18n import). */
export function getLoadingUi(lang) {
  return LOADING_UI[lang] || LOADING_UI.en
}
