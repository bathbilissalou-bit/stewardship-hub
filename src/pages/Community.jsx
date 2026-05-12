import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT, interpolate } from '../lib/i18n'

const POST_TYPES = ['update', 'testimony', 'question', 'prayer', 'milestone']

function typeStyles(tr) {
  return {
    update: { bg: '#E6F1FB', color: '#185FA5', label: tr.comm_type_update },
    testimony: { bg: '#EAF3DE', color: '#3B6D11', label: tr.comm_type_testimony },
    question: { bg: '#FAEEDA', color: '#BA7517', label: tr.comm_type_question },
    prayer: { bg: '#EEEDFE', color: '#534AB7', label: tr.comm_type_prayer },
    milestone: { bg: '#E1F5EE', color: '#0F6E56', label: tr.comm_type_milestone },
  }
}

function timeAgo(ts, tr) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return tr.comm_time_now
  if (diff < 3600) return interpolate(tr.comm_time_m, { n: Math.floor(diff / 60) })
  if (diff < 86400) return interpolate(tr.comm_time_h, { n: Math.floor(diff / 3600) })
  return interpolate(tr.comm_time_d, { n: Math.floor(diff / 86400) })
}

function Avatar({ name, size=36 }) {
  const initials=(name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const colors=['#1D9E75','#185FA5','#BA7517','#7F77DD','#A32D2D','#3B6D11']
  const color=colors[(name||'').charCodeAt(0)%colors.length]
  return <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:700, color:'white', flexShrink:0 }}>{initials}</div>
}

export default function Community({ session }) {
  const tr = useT()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ content:'', post_type:'update' })
  const [saving, setSaving] = useState(false)
  const [expandedPost, setExpandedPost] = useState(null)
  const [comments, setComments] = useState({})
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [filter, setFilter] = useState('all')
  const userId = session.user.id
  const userName = session?.user?.user_metadata?.full_name || tr.comm_member

  async function fetchPosts() {
    setLoading(true)
    const { data } = await supabase.from('community_posts').select('*, users(full_name)').order('created_at',{ascending:false}).limit(50)
    setPosts(data||[])
    setLoading(false)
  }
  useEffect(() => { fetchPosts() }, [])

  async function fetchComments(postId) {
    const { data } = await supabase.from('community_comments').select('*, users(full_name)').eq('post_id',postId).order('created_at',{ascending:true})
    setComments(c=>({...c,[postId]:data||[]}))
  }

  async function submitPost() {
    if (!form.content.trim()) return
    setSaving(true)
    await supabase.from('community_posts').insert({ user_id:userId, content:form.content, post_type:form.post_type, likes_count:0, group_id:null })
    setForm({ content:'', post_type:'update' }); setSaving(false); setShowModal(false); fetchPosts()
  }

  async function likePost(postId, currentLikes) {
    await supabase.from('community_posts').update({ likes_count:currentLikes+1 }).eq('id',postId)
    setPosts(prev=>prev.map(p=>p.id===postId?{...p,likes_count:currentLikes+1}:p))
  }

  async function submitComment(postId) {
    if (!newComment.trim()) return
    setSavingComment(true)
    await supabase.from('community_comments').insert({ post_id:postId, user_id:userId, content:newComment })
    setNewComment(''); setSavingComment(false); fetchComments(postId)
  }

  function togglePost(postId) {
    if(expandedPost===postId){setExpandedPost(null)}
    else{setExpandedPost(postId); if(!comments[postId]) fetchComments(postId)}
  }

  const filtered = filter==='all'?posts:posts.filter(p=>p.post_type===filter)
  const myPosts = posts.filter(p=>p.user_id===userId).length

  return (
    <div>
      <div style={{ background:'linear-gradient(135deg, #534AB7, #342D8A)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>👥</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.communityTitle2||"Community"}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.communitySubtitle||"Grow together in financial freedom"}</p>
      </div>
      <div className="metric-grid" style={{ gridTemplateColumns:'1fr 1fr', marginBottom:16 }}>
        <div className="metric-card"><div className="metric-label">{tr.totalPosts||'Total posts'}</div><div className="metric-value" style={{fontSize:20}}>{posts.length}</div></div>
        <div className="metric-card"><div className="metric-label">{tr.yourPosts||'Your posts'}</div><div className="metric-value green" style={{fontSize:20}}>{myPosts}</div></div>
      </div>
      <div style={{ background:'var(--green-dark)', borderRadius:12, padding:16, color:'white', marginBottom:16 }}>
        <div style={{ fontSize:11, opacity:0.8, marginBottom:4 }}>✦ {tr.weeklyCheckin||'Weekly check-in'}</div>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:10 }}>{tr.howDidYouDo||'How did you do with money this week?'}</div>
        <button onClick={()=>{setForm({content: tr.comm_preset_week, post_type:'update'});setShowModal(true)}} style={{ padding:'8px 16px', background:'white', color:'var(--green-dark)', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>
          {tr.shareUpdate||'Share your update →'}
        </button>
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:16, paddingBottom:4 }}>
        <button type="button" onClick={()=>setFilter('all')} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid', borderColor:filter==='all'?'var(--green)':'var(--border)', background:filter==='all'?'var(--green-light)':'var(--bg)', color:filter==='all'?'var(--green-dark)':'var(--text-muted)', fontSize:12, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>{tr.comm_filter_all}</button>
        {POST_TYPES.map(type=>(
          <button key={type} type="button" onClick={()=>setFilter(type)} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid', borderColor:filter===type?'var(--green)':'var(--border)', background:filter===type?'var(--green-light)':'var(--bg)', color:filter===type?'var(--green-dark)':'var(--text-muted)', fontSize:12, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>{tr[`comm_type_${type}`]}</button>
        ))}
      </div>
      {loading&&<div className="spinner"/>}
      {!loading&&filtered.length===0&&<div className="empty-state"><div className="icon">👥</div><p>{tr.noPosts||'No posts yet.'}</p><p style={{marginTop:8}}>{tr.beFirst||'Be the first to share your journey!'}</p></div>}
      {!loading&&filtered.map(post=>{
        const typeStyle=typeStyles(tr)[post.post_type]||typeStyles(tr).update
        const isExpanded=expandedPost===post.id
        const postComments=comments[post.id]||[]
        const authorName=post.users?.full_name||tr.comm_member
        const isOwn=post.user_id===userId
        return (
          <div key={post.id} className="card" style={{ marginBottom:10, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
                <Avatar name={authorName}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{isOwn?tr.comm_you:authorName}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{timeAgo(post.created_at, tr)}</div>
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:typeStyle.bg, color:typeStyle.color, fontWeight:500 }}>{typeStyle.label}</span>
                </div>
              </div>
              <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.6, marginBottom:12 }}>{post.content}</div>
              <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                <button onClick={()=>likePost(post.id,post.likes_count||0)} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13 }}>♥ {post.likes_count||0}</button>
                <button onClick={()=>togglePost(post.id)} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13 }}>💬 {postComments.length||0} {isExpanded?'▲':'▼'}</button>
                <div style={{flex:1}}/>
                {isOwn&&<button onClick={async()=>{await supabase.from('community_posts').delete().eq('id',post.id);fetchPosts()}} style={{fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer'}}>{tr.deleteBtn||'Delete'}</button>}
              </div>
            </div>
            {isExpanded&&(
              <div style={{ borderTop:'1px solid #f3f4f6', background:'#fafafa' }}>
                {postComments.map((c,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, padding:'10px 16px', borderBottom:'1px solid #f3f4f6' }}>
                    <Avatar name={c.users?.full_name||'?'} size={28}/>
                    <div><div style={{fontSize:12,fontWeight:600}}>{c.user_id===userId?tr.comm_you:c.users?.full_name||tr.comm_author_member}</div><div style={{fontSize:13,color:'var(--text)',lineHeight:1.5}}>{c.content}</div></div>
                  </div>
                ))}
                <div style={{ display:'flex', gap:8, padding:'10px 16px', alignItems:'center' }}>
                  <Avatar name={userName} size={28}/>
                  <input type="text" placeholder={tr.encourageThem||'Encourage them…'} value={newComment} onChange={e=>setNewComment(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submitComment(post.id)}}
                    style={{ flex:1, padding:'8px 12px', borderRadius:20, border:'1px solid var(--border)', fontSize:13, background:'white', color:'var(--text)', outline:'none' }}/>
                  <button onClick={()=>submitComment(post.id)} disabled={savingComment||!newComment.trim()} style={{ padding:'8px 14px', background:'var(--green)', color:'white', border:'none', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer' }}>{tr.send||'Send'}</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      <button className="fab" onClick={()=>setShowModal(true)}>+</button>
      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{tr.shareWithCommunity||'Share with the community'}</div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.postType||'Post type'}</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {POST_TYPES.map(type=>{
                  const s=typeStyles(tr)[type]
                  return <button key={type} type="button" onClick={()=>setForm(f=>({...f,post_type:type}))} style={{ padding:'6px 12px', borderRadius:20, border:'1px solid', borderColor:form.post_type===type?s.color:'var(--border)', background:form.post_type===type?s.bg:'var(--bg)', color:form.post_type===type?s.color:'var(--text-muted)', fontSize:12, fontWeight:500, cursor:'pointer' }}>{tr[`comm_type_${type}`]}</button>
                })}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.whatsOnHeart||"What's on your heart?"}</label>
              <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={4}
                style={{ padding:'12px 14px', border:'1px solid var(--border)', borderRadius:8, fontSize:14, background:'var(--bg)', color:'var(--text)', resize:'none', width:'100%', outline:'none', lineHeight:1.6 }}/>
            </div>
            <div className="modal-actions">
              <button onClick={()=>setShowModal(false)} style={{padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer"}}>{tr.cancel||"Cancel"}</button>
              <button onClick={submitPost} disabled={saving||!form.content.trim()} style={{flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #1D9E75, #0F6E56)", color:"white", border:"none", borderRadius:10, cursor:"pointer"}}>{saving ? "💾 " + (tr.posting||"Posting…") : "💾 " + (tr.postCommunity||"Post")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
