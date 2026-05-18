import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { hardLocalLogout } from '../lib/logout'
import { useT, getLang, LANGUAGES } from '../lib/i18n'

const CURRENCIES = [
  { code:'USD', symbol:'$', name:'US Dollar' },
  { code:'EUR', symbol:'€', name:'Euro' },
  { code:'GBP', symbol:'£', name:'British Pound' },
  { code:'CAD', symbol:'C$', name:'Canadian Dollar' },
  { code:'AUD', symbol:'A$', name:'Australian Dollar' },
  { code:'NGN', symbol:'₦', name:'Nigerian Naira' },
  { code:'KES', symbol:'KSh', name:'Kenyan Shilling' },
  { code:'GHS', symbol:'₵', name:'Ghanaian Cedi' },
  { code:'ZAR', symbol:'R', name:'South African Rand' },
  { code:'XOF', symbol:'CFA', name:'West African CFA' },
  { code:'XAF', symbol:'FCFA', name:'Central African CFA' },
  { code:'INR', symbol:'₹', name:'Indian Rupee' },
  { code:'BRL', symbol:'R$', name:'Brazilian Real' },
  { code:'MXN', symbol:'MX$', name:'Mexican Peso' },
  { code:'CNY', symbol:'¥', name:'Chinese Yuan' },
  { code:'JPY', symbol:'¥', name:'Japanese Yen' },
  { code:'KRW', symbol:'₩', name:'Korean Won' },
  { code:'RUB', symbol:'₽', name:'Russian Ruble' },
]

const AVATARS = ['🙂','😊','🤩','💪','🙏','✨','👑','🌟','💎','🦁','🦋','🌺','🎯','🚀','💡','🌍']

export default function Settings({ session, isPremium, theme, setTheme }) {
  const tr = useT()
  const [profile, setProfile] = useState({ full_name:'', currency:'USD', avatar:'🙂', bio:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const userId = session.user.id
  const lang = getLang()

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      const { data } = await supabase.from('users').select('*').eq('id', userId).single()
      if (data) setProfile({ full_name:data.full_name||'', currency:data.currency||'USD', avatar:data.avatar||'🙂', bio:data.bio||'' })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('users').update({ full_name:profile.full_name, currency:profile.currency, avatar:profile.avatar, bio:profile.bio }).eq('id', userId)
    setSaving(false)
    if (error) {
      alert(tr.settings_failed_save)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function handleSignOut() { await hardLocalLogout(supabase) }

  async function handleDeleteAccount() {
    if (!window.confirm(tr.settings_delete_confirm_1)) return
    if (!window.confirm(tr.settings_delete_confirm_2)) return
    try {
      await supabase.from('budget_entries').delete().eq('user_id', userId)
      await supabase.from('loans').delete().eq('user_id', userId)
      await supabase.from('investments').delete().eq('user_id', userId)
      await supabase.from('challenge_progress').delete().eq('user_id', userId)
    } catch (_) {}
    await hardLocalLogout(supabase)
  }

  const sections = [
    { id:'profile', icon:'👤', label: tr.profileTab||'Profile' },
    { id:'preferences', icon:'⚙️', label: tr.preferences||'Preferences' },
    { id:'account', icon:'🔐', label: tr.accountTab||'Account' },
    { id:'about', icon:'ℹ️', label: tr.about||'About' },
  ]

  if (loading) return <div className="spinner"/>

  return (
    <div style={{ paddingTop:16, paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg, #0F6E56, #094D3C)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>⚙️</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.settings||'Settings'}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.settingsSubtitle||'Manage your profile and preferences'}</p>
      </div>

      {/* Profile card at top */}
      <div className="card" style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
        <div onClick={() => setShowAvatarPicker(true)} style={{ width:64, height:64, borderRadius:20, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, cursor:'pointer', border:'2px solid var(--green)', flexShrink:0 }}>
          {profile.avatar}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:17 }}>{profile.full_name || (tr.yourName||'Your Name')}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{session.user.email}</div>
          {isPremium && <div style={{ fontSize:11, marginTop:4, padding:'3px 8px', background:'linear-gradient(135deg, #BA7517, #7A4D0F)', color:'white', borderRadius:10, display:'inline-block', fontWeight:700, marginBottom:4 }}>{tr.settings_premium_badge}</div>}
          <div style={{ fontSize:11, marginTop:4, padding:'3px 8px', background:'var(--green-light)', color:'var(--green-dark)', borderRadius:10, display:'inline-block', fontWeight:600 }}>
            {LANGUAGES[lang]?.flag} {LANGUAGES[lang]?.name} · {CURRENCIES.find(c=>c.code===profile.currency)?.symbol} {profile.currency}
          </div>
        </div>
        <div onClick={() => setActiveSection('profile')} style={{ fontSize:20, color:'var(--text-muted)', cursor:'pointer' }}>›</div>
      </div>

      {/* Section tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:20, border:'1px solid', borderColor:activeSection===s.id?'var(--green)':'var(--border)', background:activeSection===s.id?'var(--green-light)':'var(--bg)', color:activeSection===s.id?'var(--green-dark)':'var(--text-muted)', fontSize:13, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Profile section */}
      {activeSection==='profile' && (
        <div className="card">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>👤 {tr.profileInfo||'Profile Information'}</div>
          
          {/* Avatar picker */}
          <div className="form-group" style={{ marginBottom:14 }}>
            <label>{tr.avatarLabel||'Avatar'}</label>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:6 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, border:'2px solid var(--green)' }}>{profile.avatar}</div>
              <button onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                style={{ padding:'8px 16px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, cursor:'pointer', color:'var(--text)' }}>
                {tr.changeAvatarBtn||'Change avatar'}
              </button>
            </div>
            {showAvatarPicker && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10, padding:12, background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
                {AVATARS.map(a => (
                  <div key={a} onClick={() => { setProfile(p=>({...p,avatar:a})); setShowAvatarPicker(false) }}
                    style={{ width:40, height:40, borderRadius:10, background:profile.avatar===a?'var(--green-light)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, cursor:'pointer', border:profile.avatar===a?'2px solid var(--green)':'2px solid transparent' }}>
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom:14 }}>
            <label>{tr.fullName||'Full name'}</label>
            <input type="text" placeholder={tr.yourName||'Your full name'} value={profile.full_name} onChange={e=>setProfile(p=>({...p,full_name:e.target.value}))} />
          </div>

          <div className="form-group" style={{ marginBottom:14 }}>
            <label>{tr.bioOpt||'Bio (optional)'}</label>
            <textarea placeholder={tr.settings_bio_placeholder} value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} rows={3}
              style={{ padding:'10px 14px', border:'1px solid var(--border)', borderRadius:8, fontSize:14, background:'var(--bg)', color:'var(--text)', resize:'none', width:'100%', outline:'none' }}/>
          </div>

          <div className="form-group" style={{ marginBottom:16 }}>
            <label>{tr.email||'Email'}</label>
            <input type="email" value={session.user.email} disabled style={{ opacity:0.5 }}/>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{tr.emailNote||'Email cannot be changed here'}</div>
          </div>

          <button onClick={saveProfile} disabled={saving}
            style={{ width:'100%', padding:'13px', background:'var(--green)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
            {saved ? (tr.savedOk||'✓ Saved!') : saving ? (tr.saving||'Saving…') : (tr.saveProfile||'Save profile')}
          </button>
        </div>
      )}

      {/* Preferences section */}
      {activeSection==='preferences' && (
        <div>
          {/* Dark mode toggle */}
          <div className="card" style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>
                  {theme === 'dark' ? '🌙' : '☀️'} {theme === 'dark' ? tr.settings_theme_dark : tr.settings_theme_light}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                  {theme === 'dark' ? tr.settings_theme_hint_dark : tr.settings_theme_hint_light}
                </div>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width:52, height:28, borderRadius:14, border:'none', cursor:'pointer',
                  background: theme === 'dark' ? 'var(--green)' : 'var(--border)',
                  position:'relative', transition:'background 0.25s', flexShrink:0,
                  padding:0,
                }}
                aria-label={tr.settings_toggle_dark_aria}
              >
                <span style={{
                  position:'absolute', top:3,
                  left: theme === 'dark' ? 26 : 4,
                  width:22, height:22, borderRadius:'50%',
                  background:'white', transition:'left 0.25s',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12,
                }}>
                  {theme === 'dark' ? '🌙' : '☀️'}
                </span>
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>💰 {tr.currencyLabel||'Currency'}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => setProfile(p=>({...p,currency:c.code}))}
                  style={{ padding:'10px 12px', borderRadius:10, border:'1px solid', borderColor:profile.currency===c.code?'var(--green)':'var(--border)', background:profile.currency===c.code?'var(--green-light)':'var(--bg)', cursor:'pointer', textAlign:'left' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:profile.currency===c.code?'var(--green-dark)':'var(--text)' }}>{c.symbol} {c.code}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.name}</div>
                </button>
              ))}
            </div>
            <button onClick={saveProfile} disabled={saving} style={{ width:'100%', padding:'12px', background:'var(--green)', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:14 }}>
              {saved?(tr.savedOk||'✓ Saved!'):saving?(tr.saving||'Saving…'):(tr.saveCurrency||'Save currency')}
            </button>
          </div>

          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>🌍 {tr.languageLabel||'Language'}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <button key={code} onClick={() => { try { localStorage.setItem('sh_lang', code) } catch {}; window.location.reload() }}
                  style={{ padding:'10px 12px', borderRadius:10, border:'1px solid', borderColor:getLang()===code?'var(--green)':'var(--border)', background:getLang()===code?'var(--green-light)':'var(--bg)', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:getLang()===code?'var(--green-dark)':'var(--text)' }}>{lang.name}</div>
                  </div>
                  {getLang()===code && <span style={{ marginLeft:'auto', color:'var(--green)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account section */}
      {activeSection==='account' && (
        <div>
          <div className="card" style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>🔐 {tr.accountTab||'Account'}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>{tr.accountSecurity||'Manage your account security'}</div>
            <div style={{ padding:'12px 14px', background:'var(--bg)', borderRadius:8, marginBottom:12 }}>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{tr.signedInAs||'Signed in as'}</div>
              <div style={{ fontWeight:600, fontSize:14, marginTop:2 }}>{session.user.email}</div>
            </div>
            <button onClick={handleSignOut}
              style={{ width:'100%', padding:'12px', background:'var(--bg)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:8 }}>
              {tr.signOutBtn||'🚪 Sign out'}
            </button>
          </div>
          <div className="card" style={{ border:'1px solid #FCEBEB', background:'#FFF8F8' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#A32D2D', marginBottom:4 }}>{tr.dangerZone||'⚠️ Danger Zone'}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>{tr.deleteWarning||'This will permanently delete all your data including budget entries, loans, investments, and progress.'}</div>
            <button onClick={handleDeleteAccount}
              style={{ width:'100%', padding:'12px', background:'#A32D2D', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              {tr.deleteAccountBtn||'🗑️ Delete my account'}
            </button>
          </div>
        </div>
      )}

      {/* More section */}
      {activeSection==='profile' && (
        <div className="card" style={{ marginTop:12 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🧭 {tr.moreFeatures||'More Features'}</div>
          {[
            { to:'/coach', icon:'🤖', label: tr.settings_link_coach_t, desc: tr.settings_link_coach_d },
            { to:'/currency', icon:'💱', label: tr.settings_link_currency_t, desc: tr.settings_link_currency_d },
            { to:'/receipts', icon:'📸', label: tr.settings_link_receipts_t, desc: tr.settings_link_receipts_d },
            { to:'/premium', icon:'👑', label: tr.settings_link_premium_t, desc: tr.settings_link_premium_d },
            { to:'/savings', icon:'💰', label: tr.settings_link_savings_t, desc: tr.settings_link_savings_d },
            { to:'/giving', icon:'🎁', label: tr.settings_link_giving_t, desc: tr.settings_link_giving_d },
            { to:'/bills', icon:'🔔', label: tr.settings_link_bills_t, desc: tr.settings_link_bills_d },
            { to:'/realestate', icon:'🏠', label: tr.settings_link_realestate_t, desc: tr.settings_link_realestate_d },
            { to:'/challenge', icon:'⭐', label: tr.settings_link_challenge_t, desc: tr.settings_link_challenge_d },
            { to:'/faith', icon:'✦', label: tr.settings_link_faith_t, desc: tr.settings_link_faith_d },
            { to:'/report', icon:'📄', label: tr.settings_link_report_t, desc: tr.settings_link_report_d },
            { to:'/howtouse', icon:'❓', label: tr.settings_link_guide_t, desc: tr.settings_link_guide_d },
          ].map((item,i,arr) => (
            <Link key={item.to} to={item.to} style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{item.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <span style={{ color:'var(--text-muted)' }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Install App section */}
      {activeSection==='about' && (
        <div className="card" style={{ marginBottom:12, background:'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{tr.installAppTitle||'📱 Install App'}</div>
          <div style={{ fontSize:13, opacity:0.85, marginBottom:12 }}>{tr.installDesc||'Add Stewardship Hub to your home screen for the best experience!'}</div>
          <div style={{ fontSize:12, opacity:0.8, marginBottom:8 }}>
            <div style={{ marginBottom:4 }}><strong>{tr.settings_install_iphone}</strong> {tr.settings_install_iphone_steps}</div>
            <div><strong>{tr.settings_install_android}</strong> {tr.settings_install_android_steps}</div>
          </div>
        </div>
      )}

      {/* About section */}
      {activeSection==='about' && (
        <div>
          <div className="card" style={{ textAlign:'center', marginBottom:12 }}>
            <div style={{ fontSize:52, marginBottom:12 }}>✦</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--green-dark)' }}>{tr.settings_brand_name || 'Stewardship Hub'}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>{tr.settings_about_tagline || 'Faith-based financial freedom'}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>{tr.settings_about_version}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, fontFamily:'monospace', background:'var(--bg-secondary,#f3f4f6)', borderRadius:6, padding:'2px 8px', display:'inline-block' }}>
              Build: {typeof __BUILD_TIME__ !== 'undefined' ? new Date(__BUILD_TIME__).toLocaleString() : 'dev'}
            </div>
          </div>
          <div className="card" style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{tr.featuresTitle||'✅ Features'}</div>
            {[tr.settings_feature_budget, tr.settings_feature_invest, tr.settings_feature_loan, tr.settings_feature_challenge, tr.settings_feature_realestate, tr.settings_feature_faith, tr.settings_feature_community, tr.settings_feature_report, tr.settings_feature_langs].map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:i<8?'1px solid var(--border)':'none' }}>
                <span style={{ color:'var(--green)', fontSize:14 }}>✓</span>
                <span style={{ fontSize:13 }}>{f}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{tr.ourMissionTitle||'📖 Our Mission'}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7 }}>
              {tr.settings_mission_body}
            </div>
            <div style={{ marginTop:14, padding:'12px 14px', background:'var(--green-light)', borderRadius:8, fontSize:13, color:'var(--green-dark)', fontStyle:'italic', lineHeight:1.6 }}>
              {tr.settings_mission_quote}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
