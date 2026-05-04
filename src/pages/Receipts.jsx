import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'

const CATEGORIES = ['Food','Transport','Shopping','Health','Housing','Utilities','Entertainment','Business','Other']
const CAT_ICONS = { Food:'🛒', Transport:'🚗', Shopping:'🛍️', Health:'🏥', Housing:'🏠', Utilities:'💡', Entertainment:'🎬', Business:'💼', Other:'📄' }

export default function Receipts({ session }) {
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [form, setForm] = useState({ amount:'', merchant:'', category:'Food', date:new Date().toISOString().split('T')[0], notes:'', tax:'0' })
  const fileRef = useRef(null)
  const cameraRef = useRef(null)
  const userId = session.user.id

  async function fetchReceipts() {
    setLoading(true)
    const { data } = await supabase.from('receipts').select('*').eq('user_id', userId).order('date', { ascending:false })
    setReceipts(data||[])
    setLoading(false)
  }

  useEffect(() => { fetchReceipts() }, [])

  async function handleFileSelect(file) {
    if (!file) return
    setSelectedFile(file)
    setShowModal(true)
    setScanning(true)

    const reader = new FileReader()
    reader.onload = async e => {
      setFilePreview(e.target.result)
      try {
        const base64 = e.target.result.split(',')[1]
        const mediaType = file.type || 'image/jpeg'
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: [
                { type:'image', source:{ type:'base64', media_type:mediaType, data:base64 } },
                { type:'text', text:'Extract receipt data. Respond ONLY with valid JSON: {"merchant":"store name","amount":"total number only","tax":"tax number only or 0","date":"YYYY-MM-DD","category":"Food or Transport or Shopping or Health or Housing or Utilities or Entertainment or Business or Other","notes":"brief description"}' }
              ]
            }]
          })
        })
        const data = await response.json()
        const text = data.content?.[0]?.text || '{}'
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        setForm({
          amount: String(parsed.amount||''),
          merchant: parsed.merchant||'',
          category: parsed.category||'Other',
          date: parsed.date||new Date().toISOString().split('T')[0],
          notes: parsed.notes||'',
          tax: String(parsed.tax||'0'),
        })
      } catch(e) {
        // Scan failed — let user fill in manually
        setForm(f => ({ ...f, date:new Date().toISOString().split('T')[0] }))
      }
      setScanning(false)
    }
    reader.readAsDataURL(file)
  }

  async function saveReceipt() {
    if (!form.amount || !form.merchant) return
    setUploading(true)
    let imageUrl = null
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('receipts').upload(fileName, selectedFile)
      if (!error) {
        const { data } = await supabase.storage.from('receipts').createSignedUrl(fileName, 60*60*24*365)
        imageUrl = data?.signedUrl
      }
    }
    await supabase.from('receipts').insert({
      user_id:userId, amount:parseFloat(form.amount), merchant:form.merchant,
      category:form.category, date:form.date, notes:form.notes,
      tax:parseFloat(form.tax||0), image_url:imageUrl
    })
    setUploading(false)
    setShowModal(false)
    setSelectedFile(null)
    setFilePreview(null)
    setForm({ amount:'', merchant:'', category:'Food', date:new Date().toISOString().split('T')[0], notes:'', tax:'0' })
    fetchReceipts()
  }

  async function deleteReceipt(id) {
    await supabase.from('receipts').delete().eq('id', id)
    setPreview(null)
    fetchReceipts()
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.setTextColor(15,110,86)
    doc.text('Receipt Summary', 20, 20)
    doc.setFontSize(10); doc.setTextColor(100)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30)
    let y = 45
    doc.setFillColor(240,240,240); doc.rect(15, y-5, 180, 8, 'F')
    doc.setTextColor(0)
    doc.text('Merchant', 20, y); doc.text('Category', 80, y)
    doc.text('Date', 120, y); doc.text('Amount', 165, y)
    y += 10
    receipts.forEach((r,i) => {
      if (y > 270) { doc.addPage(); y = 20 }
      if (i%2===0) { doc.setFillColor(250,250,250); doc.rect(15, y-5, 180, 8, 'F') }
      doc.setTextColor(0)
      doc.text(String(r.merchant||'').substring(0,25), 20, y)
      doc.text(String(r.category||''), 80, y)
      doc.text(String(r.date||''), 120, y)
      doc.setTextColor(163,45,45)
      doc.text(`$${Number(r.amount).toFixed(2)}`, 165, y)
      y += 10
    })
    y += 5
    doc.setDrawColor(15,110,86); doc.line(15, y, 195, y); y += 8
    doc.setFontSize(12); doc.setTextColor(15,110,86)
    doc.text(`Total: $${totalSpent.toFixed(2)}`, 140, y)
    doc.save(`Receipts-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const totalSpent = receipts.reduce((s,r) => s+Number(r.amount), 0)
  const byCat = CATEGORIES.map(cat => ({
    cat, total: receipts.filter(r=>r.category===cat).reduce((s,r)=>s+Number(r.amount),0)
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total)

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg, #534AB7, #342D8A)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>📸</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>Receipt Scanner</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>AI-powered receipt scanning</p>
      </div>

      <div style={{ paddingTop:24 }}>
        {receipts.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            <div className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Total Receipts</div>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--green)' }}>{receipts.length}</div>
            </div>
            <div className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Total Spent</div>
              <div style={{ fontSize:24, fontWeight:800, color:'#A32D2D' }}>${totalSpent.toFixed(2)}</div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>📤 Add Receipt</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <button onClick={() => cameraRef.current.click()}
              style={{ padding:'14px 8px', background:'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white', border:'none', borderRadius:12, cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:4 }}>📷</div>
              <div style={{ fontSize:11, fontWeight:700 }}>Camera</div>
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }}
              onChange={e => { if(e.target.files[0]) handleFileSelect(e.target.files[0]) }} />

            <button onClick={() => fileRef.current.click()}
              style={{ padding:'14px 8px', background:'linear-gradient(135deg, #185FA5, #0D3D6E)', color:'white', border:'none', borderRadius:12, cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:4 }}>🖼️</div>
              <div style={{ fontSize:11, fontWeight:700 }}>Gallery</div>
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display:'none' }}
              onChange={e => { if(e.target.files[0]) handleFileSelect(e.target.files[0]) }} />

            <button onClick={() => setShowModal(true)}
              style={{ padding:'14px 8px', background:'linear-gradient(135deg, #BA7517, #7A4D0F)', color:'white', border:'none', borderRadius:12, cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:4 }}>✏️</div>
              <div style={{ fontSize:11, fontWeight:700 }}>Manual</div>
            </button>
          </div>
        </div>

        {byCat.length > 0 && (
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📊 By Category</div>
            {byCat.map((c,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{CAT_ICONS[c.cat]||'📄'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{c.cat}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#A32D2D' }}>${c.total.toFixed(2)}</span>
                  </div>
                  <div style={{ height:4, background:'#f3f4f6', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.round(c.total/totalSpent*100)}%`, background:'#534AB7', borderRadius:2 }}/>
                  </div>
                </div>
                <span style={{ fontSize:11, color:'var(--text-muted)', width:32, textAlign:'right' }}>{Math.round(c.total/totalSpent*100)}%</span>
              </div>
            ))}
          </div>
        )}

        {loading && <div className="spinner"/>}
        {!loading && receipts.length === 0 && (
          <div className="empty-state">
            <div className="icon">📸</div>
            <p>No receipts yet</p>
            <p style={{ fontSize:13, marginTop:8 }}>Take a photo — AI will read it automatically!</p>
          </div>
        )}

        {receipts.map((r,i) => (
          <div key={i} className="card" style={{ marginBottom:10, cursor:'pointer' }} onClick={() => setPreview(r)}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              {r.image_url ? (
                <img src={r.image_url} alt="receipt" style={{ width:56, height:56, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
              ) : (
                <div style={{ width:56, height:56, borderRadius:10, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                  {CAT_ICONS[r.category]||'🧾'}
                </div>
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{r.merchant}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{r.category} · {r.date}</div>
                {r.tax > 0 && <div style={{ fontSize:11, color:'#BA7517', marginTop:1 }}>Tax: ${Number(r.tax).toFixed(2)}</div>}
                {r.notes && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{r.notes}</div>}
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontWeight:800, fontSize:17, color:'#A32D2D' }}>${Number(r.amount).toFixed(2)}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>tap to view</div>
              </div>
            </div>
          </div>
        ))}

        {receipts.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            <div className="card" style={{ background:'linear-gradient(135deg, #A32D2D, #6B1A1A)', color:'white' }}>
              <div style={{ fontSize:11, opacity:0.8 }}>Grand Total</div>
              <div style={{ fontSize:22, fontWeight:900 }}>${totalSpent.toFixed(2)}</div>
              <div style={{ fontSize:11, opacity:0.7 }}>{receipts.length} receipts</div>
            </div>
            <button onClick={exportPDF}
              style={{ background:'linear-gradient(135deg, #0F6E56, #094D3C)', color:'white', border:'none', borderRadius:14, cursor:'pointer', padding:14 }}>
              <div style={{ fontSize:24, marginBottom:4 }}>📄</div>
              <div style={{ fontSize:13, fontWeight:700 }}>Export PDF</div>
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { if(!scanning){ setShowModal(false); setSelectedFile(null); setFilePreview(null) } }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight:'90vh', overflowY:'auto' }}>
            {scanning ? (
              <div style={{ textAlign:'center', padding:'30px 16px' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>🤖</div>
                <div style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>Reading receipt...</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>AI is extracting merchant, amount, tax and date</div>
                <div className="spinner" style={{ margin:'0 auto' }}/>
              </div>
            ) : (
              <>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>
                  {filePreview ? '✅ Receipt scanned! Review below' : '✏️ Add Receipt'}
                </div>
                {filePreview && (
                  <img src={filePreview} alt="preview" style={{ width:'100%', height:140, objectFit:'cover', borderRadius:10, marginBottom:12 }}/>
                )}
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label>Amount ($) *</label>
                  <input type="number" placeholder="25.99" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} min="0" step="0.01"/>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label>Tax ($)</label>
                  <input type="number" placeholder="0.00" value={form.tax} onChange={e=>setForm(f=>({...f,tax:e.target.value}))} min="0" step="0.01"/>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label>Merchant / Store *</label>
                  <input type="text" placeholder="e.g. Walmart" value={form.merchant} onChange={e=>setForm(f=>({...f,merchant:e.target.value}))}/>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label>Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom:10 }}>
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
                </div>
                <div className="form-group" style={{ marginBottom:16 }}>
                  <label>Notes</label>
                  <input type="text" placeholder="e.g. Business lunch" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => { setShowModal(false); setSelectedFile(null); setFilePreview(null) }}
                    style={{ flex:1, padding:'13px', background:'#f3f4f6', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={saveReceipt} disabled={uploading||!form.amount||!form.merchant}
                    style={{ flex:2, padding:'13px', background:'linear-gradient(135deg, #534AB7, #342D8A)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer' }}>
                    {uploading ? '💾 Saving...' : '💾 Save Receipt'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>🧾 Receipt Details</div>
            {preview.image_url && (
              <img src={preview.image_url} alt="receipt" style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:10, marginBottom:12, background:'#f3f4f6' }}/>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {[
                { label:'Amount', value:`$${Number(preview.amount).toFixed(2)}`, color:'#A32D2D' },
                { label:'Tax', value:`$${Number(preview.tax||0).toFixed(2)}`, color:'#BA7517' },
                { label:'Merchant', value:preview.merchant },
                { label:'Category', value:preview.category },
                { label:'Date', value:preview.date },
                { label:'Total + Tax', value:`$${(Number(preview.amount)+Number(preview.tax||0)).toFixed(2)}`, color:'#A32D2D' },
              ].map((item,i) => (
                <div key={i} style={{ padding:'10px 12px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:item.color||'var(--text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {preview.notes && (
              <div style={{ padding:'10px 12px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)', marginBottom:12 }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>Notes</div>
                <div style={{ fontSize:13 }}>{preview.notes}</div>
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setPreview(null)}
                style={{ flex:1, padding:'12px', background:'#f3f4f6', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Close</button>
              <button onClick={() => deleteReceipt(preview.id)}
                style={{ flex:1, padding:'12px', background:'#A32D2D', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
