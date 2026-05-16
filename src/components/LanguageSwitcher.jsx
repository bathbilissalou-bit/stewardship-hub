import { useState } from 'react'
import { LANGUAGES, getLang } from '../lib/i18n-core'
import { useT } from '../lib/i18n'

export default function LanguageSwitcher({ lang, setLang }) {
  const tr = useT()
  const [open, setOpen] = useState(false)
  const current = lang || getLang()
  const currentLang = LANGUAGES[current]

  function handleSelect(code) {
    try { localStorage.setItem('sh_lang', code) } catch {}
    if (setLang) setLang(code)
    setOpen(false)
  }

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:998, background:'rgba(0,0,0,0.3)' }}
        />
      )}
      <div style={{ position:'relative', zIndex:999 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'var(--green-light)', border:'1px solid var(--green)', borderRadius:20, cursor:'pointer', fontSize:12, color:'var(--green-dark)', fontWeight:600 }}
        >
          <span style={{ fontSize:15 }}>{currentLang?.flag}</span>
          <span>{currentLang?.name}</span>
          <span style={{ fontSize:9 }}>{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div style={{ position:'fixed', top:60, right:16, background:'white', border:'1px solid #e5e7eb', borderRadius:14, padding:8, width:200, zIndex:999, maxHeight:350, overflowY:'auto', boxShadow:'0 8px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:10, fontWeight:600, color:'#9ca3af', padding:'2px 10px 8px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {tr.selectLanguage}
            </div>
            {Object.entries(LANGUAGES).map(([code, lang2]) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 10px', background: current===code ? '#E1F5EE' : 'transparent', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, color: current===code ? '#0F6E56' : '#2C2C2A', textAlign:'left', fontWeight: current===code ? 600 : 400 }}
              >
                <span style={{ fontSize:18, flexShrink:0 }}>{lang2.flag}</span>
                <span style={{ flex:1 }}>{lang2.name}</span>
                {current===code && <span style={{ color:'#1D9E75' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
