import { Outlet, NavLink, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNavT } from '../lib/i18n-core'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationCenter from './NotificationCenter'

export default function Layout({ session, lang, setLang }) {
  const tr = useNavT()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="app-layout">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px 8px', background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
        <LanguageSwitcher lang={lang} setLang={setLang} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Link to="/search" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:10, background:'var(--green-light)', fontSize:18 }}>🔍</Link>
          <NotificationCenter userId={session?.user?.id} />
          <Link to="/settings" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:10, background:'var(--green-light)', color:'var(--green-dark)', fontSize:18 }}>⚙️</Link>
        </div>
      </div>

      <div className="app-content" style={{ paddingTop:12 }}>
        <Outlet />
      </div>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          {tr.dashboard}
        </NavLink>
        <NavLink to="/budget" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          {tr.budget}
        </NavLink>
        <NavLink to="/investments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          {tr.invest}
        </NavLink>
        <NavLink to="/loans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          {tr.loans}
        </NavLink>
        <NavLink to="/community" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {tr.community}
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          {tr.exploreNav||'Explore'}
        </NavLink>
      </nav>
    </div>
  )
}
