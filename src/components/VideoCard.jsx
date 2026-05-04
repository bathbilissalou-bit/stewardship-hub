import { useState } from 'react'
import PromoVideo from './PromoVideo'

const STORAGE_KEY = 'sh_promo_video_id'

function getStoredId() {
  try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}

export default function VideoCard({
  title    = 'See Stewardship Hub in Action',
  subtitle = 'A complete walkthrough — budgeting, investing, giving & more',
}) {
  const [videoId, setVideoId]   = useState(getStoredId)
  const [playing, setPlaying]   = useState(false)
  const [editing, setEditing]   = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [showPromo, setShowPromo] = useState(false)

  function parseYouTubeId(raw) {
    raw = raw.trim()
    // Full URL: youtube.com/watch?v=ID  or  youtu.be/ID
    const m = raw.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (m) return m[1]
    // Bare ID (11 chars)
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw
    return null
  }

  function saveVideo() {
    const id = parseYouTubeId(inputVal)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
      setVideoId(id)
      setPlaying(true)
    }
    setEditing(false)
    setInputVal('')
  }

  function removeVideo() {
    localStorage.removeItem(STORAGE_KEY)
    setVideoId('')
    setPlaying(false)
  }

  // ── Playing state ────────────────────────────────────────────────────────
  if (playing && videoId) {
    return (
      <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid #e5e7eb', marginBottom:4, boxShadow:'0 4px 20px rgba(0,0,0,0.12)', background:'#000' }}>
        <iframe
          width="100%" height="215"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display:'block' }}
        />
        <div style={{ padding:'10px 14px', background:'#111', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'white' }}>{title}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>{subtitle}</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setPlaying(false)}
              style={{ padding:'4px 10px', background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:6, fontSize:11, cursor:'pointer' }}>
              ✕ Close
            </button>
            <button onClick={removeVideo}
              style={{ padding:'4px 10px', background:'rgba(255,0,0,0.2)', color:'#ff6b6b', border:'none', borderRadius:6, fontSize:11, cursor:'pointer' }}>
              Remove
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Has video — show thumbnail ────────────────────────────────────────────
  if (videoId) {
    return (
      <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid #e5e7eb', marginBottom:4, boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
        <div
          onClick={() => setPlaying(true)}
          style={{
            position:'relative', height:200, cursor:'pointer',
            background:`url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg) center/cover no-repeat`,
          }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }} />
          {/* Play button */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ width:0, height:0, borderTop:'13px solid transparent', borderBottom:'13px solid transparent', borderLeft:'22px solid #1D9E75', marginLeft:5 }} />
            </div>
          </div>
          <div style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,0.7)', color:'white', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:5 }}>▶ WATCH</div>
        </div>
        <div style={{ padding:'12px 14px', background:'white', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🎬</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>{title}</div>
            <div style={{ fontSize:11, color:'#6b7280' }}>{subtitle}</div>
          </div>
          <button onClick={() => setPlaying(true)}
            style={{ padding:'7px 16px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
            ▶ Play
          </button>
        </div>
      </div>
    )
  }

  // ── No video yet — show promo + add link ─────────────────────────────────
  return (
    <>
      {showPromo && <PromoVideo onClose={() => setShowPromo(false)} />}

      <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid #e5e7eb', marginBottom:4, background:'white', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
        {/* Branded clickable thumbnail */}
        <div
          onClick={() => setShowPromo(true)}
          style={{ height:200, background:'linear-gradient(135deg,#1D9E75,#0F6E56,#185FA5)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:20, position:'relative', cursor:'pointer' }}>
          <div style={{ fontSize:38 }}>✦</div>
          <div style={{ fontSize:16, fontWeight:800, color:'white', textAlign:'center' }}>{title}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)', textAlign:'center' }}>{subtitle}</div>
          {/* Play button */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.15)' }}>
            <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(255,255,255,0.95)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ width:0, height:0, borderTop:'13px solid transparent', borderBottom:'13px solid transparent', borderLeft:'22px solid #1D9E75', marginLeft:5 }} />
            </div>
          </div>
        </div>

        {/* Buttons row */}
        <div style={{ padding:'12px 14px', display:'flex', gap:8 }}>
          <button onClick={() => setShowPromo(true)}
            style={{ flex:2, padding:'11px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            ▶ Watch App Tour
          </button>
          <button onClick={() => setEditing(v => !v)}
            style={{ flex:1, padding:'11px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            + YouTube
          </button>
        </div>

        {editing && (
          <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            <input
              autoFocus
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveVideo()}
              placeholder="Paste YouTube link or video ID"
              style={{ padding:'10px 12px', border:'1.5px solid #1D9E75', borderRadius:8, fontSize:12, outline:'none', color:'#1a1a1a' }}
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setEditing(false); setInputVal('') }}
                style={{ flex:1, padding:'9px', background:'#f3f4f6', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', color:'#6b7280' }}>Cancel</button>
              <button onClick={saveVideo}
                style={{ flex:2, padding:'9px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', color:'white' }}>Save & Play</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
