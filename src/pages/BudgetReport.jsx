import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

function getMonthYear(offset=0) {
  const d = new Date(); d.setMonth(d.getMonth()+offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

const TEMPLATE = [
  { section:'INCOME', items:[
    { label:'Income Source 1 (e.g. Job 1)', keywords:['salary','job','work','income','wage','paycheck','403','401','payroll'] },
    { label:'Income Source 2 (e.g. Job 2)', keywords:['second job','part time','side job'] },
    { label:'Income Source 3 (e.g. Gig, benefits)', keywords:['gig','freelance','uber','lyft','doordash','benefit','ssi','disability'] },
    { label:'Income Source 4 (e.g. Social Security)', keywords:['social security','pension','retirement','annuity'] },
    { label:'Income Source 5 (e.g. Tax Refund)', keywords:['tax refund','tax return','bonus','commission'] },
  ]},
  { section:'HOME', items:[
    { label:'Rent/Mortgage', keywords:['rent','mortgage','housing'] },
    { label:'Insurance', keywords:['home insurance','renters insurance','homeowners'] },
    { label:'Utilities', keywords:['electric','electricity','water','gas','utility','utilities','con ed','coned'] },
    { label:'Laundry and Dry Cleaning', keywords:['laundry','dry cleaning','washer','dryer'] },
    { label:'Phone', keywords:['phone','mobile','cell','verizon','att','tmobile','sprint'] },
    { label:'Property Tax', keywords:['property tax'] },
    { label:'Furnishings', keywords:['furniture','furnishing','ikea','bed','sofa','couch'] },
    { label:'Cable/WiFi', keywords:['cable','wifi','internet','spectrum','xfinity','comcast'] },
    { label:'Storage Unit', keywords:['storage','storage unit'] },
  ]},
  { section:'FAMILY', items:[
    { label:'Childcare', keywords:['childcare','daycare','babysitter','nanny','child'] },
    { label:"Kids' Clothes and Toys", keywords:['kids','children','toys','baby'] },
  ]},
  { section:'TRANSPORTATION & TRAVEL', items:[
    { label:'Public Transit', keywords:['transit','subway','bus','metro','mta','train','commute'] },
    { label:'Taxis/Rideshare', keywords:['taxi','uber','lyft','cab','rideshare'] },
    { label:'Car Note or Lease', keywords:['car payment','car note','auto loan','lease','vehicle'] },
    { label:'Auto Insurance', keywords:['auto insurance','car insurance','geico','progressive','allstate'] },
    { label:'Gas', keywords:['gas','fuel','gasoline','petrol'] },
    { label:'Vacation', keywords:['vacation','trip','travel','hotel','airbnb','flight','airline'] },
  ]},
  { section:'FOOD', items:[
    { label:'Groceries', keywords:['grocery','groceries','supermarket','food','whole foods','trader','costco','walmart','target'] },
    { label:'Dining Out', keywords:['restaurant','dining','eat out','takeout','delivery','doordash','grubhub','seamless','coffee','starbucks','mcdonald','chipotle'] },
  ]},
  { section:'EDUCATION', items:[
    { label:'Tuition and Fees', keywords:['tuition','school','college','university','fees'] },
    { label:'Student Loans', keywords:['student loan','sallie mae','navient'] },
    { label:'Professional Development', keywords:['course','class','certification','training','udemy','coursera'] },
  ]},
  { section:'SHOPPING, ENTERTAINMENT & HOBBIES', items:[
    { label:'Movies/Entertainment', keywords:['movie','cinema','theater','concert','event','ticket'] },
    { label:'Subscriptions', keywords:['netflix','spotify','hulu','disney','apple','amazon prime','subscription','magazine','newspaper','youtube'] },
    { label:'Clothes/Shopping', keywords:['clothes','clothing','shopping','amazon','zara','h&m','nordstrom','macy'] },
    { label:'Hobbies', keywords:['hobby','sport','gym hobby','craft','art'] },
    { label:'Personal Care', keywords:['personal care','salon','spa','massage','skincare','beauty','cosmetics'] },
    { label:'Hair', keywords:['hair','haircut','barber','braids','locs'] },
    { label:'Nails', keywords:['nails','manicure','pedicure','nail salon'] },
    { label:'Discretionary', keywords:['miscellaneous','misc','other','discretionary'] },
  ]},
  { section:'HEALTH', items:[
    { label:'Health Insurance', keywords:['health insurance','medical insurance','dental','vision','oscar','cigna','aetna','bluecross'] },
    { label:'Doctor Visits', keywords:['doctor','physician','hospital','clinic','medical','copay'] },
    { label:'Medications', keywords:['medication','pharmacy','drug','prescription','cvs','walgreens','medicine'] },
    { label:'Gym and Fitness', keywords:['gym','fitness','planet fitness','equinox','yoga','pilates','workout'] },
  ]},
  { section:'GIVING', items:[
    { label:'Charitable Contributions', keywords:['charity','donation','nonprofit','church','tithe','offering','ministry','mission','zakat','sadaqah'] },
    { label:'Gifts', keywords:['gift','present','birthday','christmas','holiday'] },
  ]},
  { section:'SAVINGS', items:[
    { label:'Personal Savings', keywords:['savings','emergency fund','reserve','piggy bank'] },
    { label:'Employer-Sponsored Savings', keywords:['401k','403b','457','roth','ira','retirement','pension'] },
  ]},
  { section:'OTHER / DEBT', items:[
    { label:'Credit Card 1', keywords:['credit card','visa','mastercard','amex','american express','discover','citi'] },
    { label:'Credit Card 2', keywords:[] },
    { label:'Personal Loan', keywords:['personal loan','loan payment'] },
    { label:'Other Debt', keywords:['debt','payment','installment','best buy','affirm','klarna'] },
  ]},
]

function matchAmount(label, keywords, entries) {
  const matched = entries.filter(e => {
    const l = (e.label||'').toLowerCase()
    return keywords.some(k => l.includes(k))
  })
  return matched.reduce((s,e) => s+Number(e.amount||0), 0)
}

export default function BudgetReport({ session }) {
  const tr = useT()
  const [entries, setEntries] = useState([])
  const [month, setMonth] = useState(getMonthYear(0))
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const userId = session.user.id

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('budget_entries').select('*').eq('user_id', userId).eq('month_year', month)
      setEntries(data||[])
      const { data: u } = await supabase.from('users').select('full_name').eq('id', userId).single()
      setUserName(u?.full_name || '')
      setLoading(false)
    }
    load()
  }, [month])

  const incomeEntries = entries.filter(e => e.type==='income')
  const expenseEntries = entries.filter(e => e.type==='expense')
  const totalIncome = incomeEntries.reduce((s,e)=>s+Number(e.amount),0)
  const totalExpenses = expenseEntries.reduce((s,e)=>s+Number(e.amount),0)
  const fmt = n => n > 0 ? `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}` : '$0'

  function handlePrint() { window.print() }

  function handleDownloadExcel() {
    const wb = XLSX.utils.book_new()

    // Income sheet
    const incomeData = [
      ['INCOME', 'Amount', 'Category', 'Notes'],
      ...incomeEntries.map(e => [e.label, Number(e.amount), e.category||'Income', e.notes||''])
    ]
    const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData)
    XLSX.utils.book_append_sheet(wb, incomeSheet, 'Income')

    // Expenses sheet
    const expenseData = [
      ['EXPENSES', 'Amount', 'Category', 'Notes'],
      ...expenseEntries.map(e => [e.label, Number(e.amount), e.category||'Expense', e.notes||''])
    ]
    const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData)
    XLSX.utils.book_append_sheet(wb, expenseSheet, 'Expenses')

    // Summary sheet
    const summaryData = [
      ['SUMMARY', ''],
      ['Month', monthYear],
      ['Total Income', totalIncome],
      ['Total Expenses', totalExpenses],
      ['Net Surplus', totalIncome - totalExpenses],
      [''],
      ['SPENDING BY CATEGORY', ''],
      ...['Needs','Wants','Giving','Savings','Investments'].map(cat => {
        const amt = expenseEntries.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amount),0)
        return [cat, amt]
      }).filter(r => r[1] > 0)
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

    XLSX.writeFile(wb, `Budget-Report-${monthYear}.xlsx`)
  }

  async function handleDownloadPDF() {
    const el = document.getElementById('full-report-content')
    if (!el) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(el, { scale:2, useCORS:true, backgroundColor:'#ffffff', logging:false, allowTaint:true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      const pageHeight = pdf.internal.pageSize.getHeight()
      let heightLeft = pdfHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }
      const monthLabel = months.find(m=>m.value===month)?.label || month
      pdf.save(`Budget-Report-${monthLabel.replace(' ','-')}.pdf`)
    } catch(e) { alert('PDF generation failed. Please try again.') }
    setDownloading(false)
  }

  const months = Array.from({length:12},(_,i)=>{
    const d = new Date(); d.setMonth(i)
    const y = new Date().getFullYear()
    const m = String(i+1).padStart(2,'0')
    return { value:`${y}-${m}`, label:d.toLocaleDateString('en-US',{month:'long',year:'numeric'}) }
  })

  return (
    <div>
      {/* Screen controls - hidden when printing */}
      <div className="no-print" style={{ padding:'16px 0 8px' }}>
        <div className="page-header section-header theme-budget" style={{ paddingTop:16, marginBottom:12 }}>
          <h2>{tr.budgetReportTitle||'📄 Budget Report'}</h2>
          <p>{tr.budgetReportSub||'Printable budget summary — current month'}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
          <select value={month} onChange={e=>setMonth(e.target.value)}
            style={{ flex:1, padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:14, outline:'none' }}>
            {months.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleDownloadExcel}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#1D6F42', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
            📊 Excel
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading}
              style={{ padding:'10px 20px', background:'var(--green)', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:downloading?0.7:1 }}>
              {downloading ? (tr.generatingPDF||'⏳ Generating...') : (tr.downloadPDFLabel||'⬇️ Download PDF')}
            </button>
            <button onClick={handlePrint}
              style={{ padding:'10px 20px', background:'var(--bg)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              {tr.printLabel||'🖨️ Print'}
            </button>
          </div>
        </div>
        {loading && <div className="spinner"/>}
      </div>

      <div id="full-report-content" style={{ background:"white", padding:"0 0 20px" }}>
      {/* Spending Statistics */}
      {!loading && entries.length > 0 && (
        <div className="no-print">
          <div style={{ fontWeight:700, fontSize:16, marginBottom:12, marginTop:4 }}>{tr.spendingBreakdown||'📊 Spending Breakdown'}</div>

          {/* Top spending categories bar chart */}
          {(() => {
            const cats = ['Needs','Wants','Giving','Savings','Investments']
            const COLORS = ['#185FA5','#BA7517','#1D9E75','#5F5E5A','#3B6D11']
            const data = cats.map((cat,i) => ({
              name: cat,
              amount: expenseEntries.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amount),0),
              color: COLORS[i]
            })).filter(d => d.amount > 0).sort((a,b) => b.amount-a.amount)

            if (data.length === 0) return null

            const topItem = data[0]
            const fmt2 = n => `$${Number(n).toLocaleString('en-US',{maximumFractionDigits:0})}`

            return (
              <div className="card" style={{ marginBottom:16, padding:'16px' }}>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>{tr.mostSpentOn||'Most spent on'}</div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--green-dark)', marginBottom:12 }}>
                  {topItem.name} — {fmt2(topItem.amount)}
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data} layout="vertical" margin={{ top:0, right:40, left:60, bottom:0 }}>
                    <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v=>`$${v>=1000?Math.round(v/1000)+'k':v}`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize:12 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip formatter={v=>[`$${Number(v).toLocaleString()}`, 'Amount']} contentStyle={{ fontSize:12, borderRadius:8 }} />
                    <Bar dataKey="amount" radius={[0,6,6,0]}>
                      {data.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                  {data.map((d,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:d.color }}/>
                      <span style={{ color:'var(--text-muted)' }}>{d.name}</span>
                      <span style={{ fontWeight:600 }}>{fmt2(d.amount)}</span>
                      <span style={{ color:'var(--text-muted)', fontSize:10 }}>({Math.round(d.amount/totalExpenses*100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Top 5 individual expenses */}
          {(() => {
            const top5 = [...expenseEntries].sort((a,b)=>Number(b.amount)-Number(a.amount)).slice(0,5)
            if (top5.length === 0) return null
            const fmt2 = n => `$${Number(n).toLocaleString('en-US',{maximumFractionDigits:0})}`
            const CAT_COLORS = { Needs:'#185FA5', Wants:'#BA7517', Giving:'#1D9E75', Savings:'#5F5E5A', Investments:'#3B6D11' }
            return (
              <div className="card" style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{tr.top5Expenses||'🔝 Top 5 Expenses'}</div>
                {top5.map((e,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:24, height:24, borderRadius:6, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--text-muted)', flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{e.label}</div>
                      <div style={{ width:`${Math.round(Number(e.amount)/top5[0].amount*100)}%`, height:4, background:CAT_COLORS[e.category]||'#e5e7eb', borderRadius:2, marginTop:3 }}/>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#A32D2D' }}>{fmt2(e.amount)}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>{Math.round(Number(e.amount)/totalExpenses*100)}% of expenses</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Income vs Expense ratio */}
          {totalIncome > 0 && (
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{tr.incomeVsExpenses||'💰 Income vs Expenses'}</div>
              <div style={{ display:'flex', gap:12, marginBottom:10 }}>
                <div style={{ flex:1, padding:'10px 14px', background:'#E1F5EE', borderRadius:10 }}>
                  <div style={{ fontSize:11, color:'var(--green-dark)', marginBottom:2 }}>Income</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--green)' }}>${fmt(totalIncome)}</div>
                </div>
                <div style={{ flex:1, padding:'10px 14px', background:'#FCEBEB', borderRadius:10 }}>
                  <div style={{ fontSize:11, color:'#A32D2D', marginBottom:2 }}>Expenses</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#A32D2D' }}>${fmt(totalExpenses)}</div>
                </div>
              </div>
              <div style={{ marginBottom:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>
                  <span>Spent {Math.round(totalExpenses/totalIncome*100)}% of income</span>
                  <span>Saved {Math.round((totalIncome-totalExpenses)/totalIncome*100)}%</span>
                </div>
                <div style={{ height:10, background:'#f3f4f6', borderRadius:5, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100,Math.round(totalExpenses/totalIncome*100))}%`, height:'100%', background: totalExpenses/totalIncome > 0.9 ? '#A32D2D' : totalExpenses/totalIncome > 0.7 ? '#BA7517' : '#1D9E75', borderRadius:5, transition:'width 0.5s' }}/>
                </div>
              </div>
              <div style={{ fontSize:12, color: totalIncome-totalExpenses>=0?'var(--green-dark)':'#A32D2D', fontWeight:600, textAlign:'center', marginTop:8 }}>
                {totalIncome-totalExpenses>=0 ? `${tr.youSaved||'✓ You saved'} $${fmt(totalIncome-totalExpenses)}!` : `${tr.overspentBy||'⚠ Overspent by'} $${fmt(Math.abs(totalIncome-totalExpenses))}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable report */}
      <div id="budget-report" style={{ fontFamily:'Arial, sans-serif', fontSize:11, color:'#000', background:'white', maxWidth:800, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #2e7d32', paddingBottom:8, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#2e7d32' }}>✦ STEWARDSHIP HUB</div>
            <div style={{ fontSize:10, color:'#666' }}>Faith-based Financial Management</div>
          </div>
          <div style={{ textAlign:'right', fontSize:10, color:'#666' }}>
            <div>{new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
            <div>{months.find(m=>m.value===month)?.label}</div>
          </div>
        </div>

        <div style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>
          Budget Report — {userName && <span style={{ color:'#2e7d32' }}>{userName}</span>}
        </div>

        {/* Summary bar */}
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:14, border:'1px solid #ddd' }}>
          <thead>
            <tr style={{ background:'#f5f5f5' }}>
              <th style={{ padding:'6px 10px', textAlign:'left', fontSize:11, color:'#e65100', fontWeight:700 }}>SUMMARY</th>
              <th style={{ padding:'6px 10px', textAlign:'right', fontSize:11, fontWeight:600 }}>Total Income</th>
              <th style={{ padding:'6px 10px', textAlign:'right', fontSize:11, fontWeight:600 }}>Total Expenses</th>
              <th style={{ padding:'6px 10px', textAlign:'right', fontSize:11, fontWeight:600 }}>Net Surplus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding:'6px 10px' }}></td>
              <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color:'#2e7d32' }}>{fmt(totalIncome)}</td>
              <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color:'#c62828' }}>{fmt(totalExpenses)}</td>
              <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color: totalIncome-totalExpenses>=0?'#2e7d32':'#c62828' }}>{totalIncome-totalExpenses>=0?'+':''}{fmt(totalIncome-totalExpenses)}</td>
            </tr>
          </tbody>
        </table>

        {/* Each section */}
        {TEMPLATE.map((section, si) => {
          const isIncome = section.section === 'INCOME'
          const sectionEntries = isIncome ? incomeEntries : expenseEntries
          const rows = section.items.map(item => ({
            label: item.label,
            current: matchAmount(item.label, item.keywords, sectionEntries)
          }))
          const sectionTotal = rows.reduce((s,r)=>s+r.current, 0)

          return (
            <table key={si} style={{ width:'100%', borderCollapse:'collapse', marginBottom:10, border:'1px solid #ddd' }}>
              <thead>
                <tr style={{ background:'#f5f5f5' }}>
                  <th style={{ padding:'5px 10px', textAlign:'left', fontSize:11, color:'#e65100', fontWeight:700, width:'45%' }}>{section.section}</th>
                  <th style={{ padding:'5px 10px', textAlign:'right', fontSize:10, fontWeight:600, width:'15%' }}>Current</th>
                  <th style={{ padding:'5px 10px', textAlign:'right', fontSize:10, fontWeight:600, width:'15%' }}>Proposed</th>
                  <th style={{ padding:'5px 10px', textAlign:'right', fontSize:10, fontWeight:600, width:'15%' }}>Difference</th>
                  <th style={{ padding:'5px 10px', textAlign:'left', fontSize:10, fontWeight:600, width:'10%' }}>Notes</th>
                </tr>
                <tr style={{ background:'#fafafa', borderBottom:'1px solid #ddd' }}>
                  <td style={{ padding:'4px 10px', fontSize:11, fontWeight:600 }}>
                    {isIncome ? 'Monthly Income' : `${section.section} Total`}
                  </td>
                  <td style={{ padding:'4px 10px', textAlign:'right', fontSize:11, fontWeight:600, color: isIncome?'#2e7d32':'#c62828' }}>{fmt(sectionTotal)}</td>
                  <td style={{ padding:'4px 10px', textAlign:'right', fontSize:10, color:'#999' }}>$</td>
                  <td style={{ padding:'4px 10px', textAlign:'right', fontSize:11, fontWeight:600, color: isIncome?'#2e7d32':'#c62828' }}>{fmt(sectionTotal)}</td>
                  <td style={{ padding:'4px 10px' }}></td>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom:'1px solid #f0f0f0', background: ri%2===0?'white':'#fafafa' }}>
                    <td style={{ padding:'4px 10px 4px 20px', fontSize:10, color:'#333' }}>{row.label}</td>
                    <td style={{ padding:'4px 10px', textAlign:'right', fontSize:10, color: row.current>0?(isIncome?'#2e7d32':'#c62828'):'#bbb' }}>
                      {row.current > 0 ? fmt(row.current) : '$'}
                    </td>
                    <td style={{ padding:'4px 10px', textAlign:'right', fontSize:10, color:'#bbb' }}>$</td>
                    <td style={{ padding:'4px 10px', textAlign:'right', fontSize:10, color: row.current>0?(isIncome?'#2e7d32':'#c62828'):'#bbb' }}>
                      {row.current > 0 ? fmt(row.current) : '$'}
                    </td>
                    <td style={{ padding:'4px 10px', fontSize:9, color:'#999' }}>--</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })}

        {/* Spending Summary for print */}
        {expenseEntries.length > 0 && (
          <div style={{ marginTop:16, borderTop:'2px solid #2e7d32', paddingTop:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#2e7d32', marginBottom:8 }}>SPENDING ANALYSIS</div>
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:10, border:'1px solid #ddd' }}>
              <thead>
                <tr style={{ background:'#f5f5f5' }}>
                  <th style={{ padding:'5px 10px', textAlign:'left', fontSize:11, color:'#e65100', fontWeight:700 }}>Category</th>
                  <th style={{ padding:'5px 10px', textAlign:'right', fontSize:11, fontWeight:600 }}>Amount</th>
                  <th style={{ padding:'5px 10px', textAlign:'right', fontSize:11, fontWeight:600 }}>% of Expenses</th>
                  <th style={{ padding:'5px 10px', textAlign:'left', fontSize:11, fontWeight:600 }}>Visual</th>
                </tr>
              </thead>
              <tbody>
                {['Needs','Wants','Giving','Savings','Investments'].map((cat,i) => {
                  const amt = expenseEntries.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amount),0)
                  if (amt === 0) return null
                  const pct = Math.round(amt/totalExpenses*100)
                  const colors = ['#185FA5','#BA7517','#1D9E75','#5F5E5A','#3B6D11']
                  return (
                    <tr key={cat} style={{ borderBottom:'1px solid #f0f0f0' }}>
                      <td style={{ padding:'5px 10px', fontSize:11, fontWeight:600 }}>{cat}</td>
                      <td style={{ padding:'5px 10px', textAlign:'right', fontSize:11, color:colors[i], fontWeight:700 }}>${Number(amt).toLocaleString()}</td>
                      <td style={{ padding:'5px 10px', textAlign:'right', fontSize:11 }}>{pct}%</td>
                      <td style={{ padding:'5px 10px' }}>
                        <div style={{ height:8, width:`${pct}%`, background:colors[i], borderRadius:4, minWidth:4 }}/>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ fontSize:11, fontWeight:700, color:'#2e7d32', marginBottom:6 }}>TOP 5 EXPENSES</div>
            <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #ddd' }}>
              <thead>
                <tr style={{ background:'#f5f5f5' }}>
                  <th style={{ padding:'5px 10px', textAlign:'left', fontSize:11, fontWeight:600 }}>#</th>
                  <th style={{ padding:'5px 10px', textAlign:'left', fontSize:11, fontWeight:600 }}>Description</th>
                  <th style={{ padding:'5px 10px', textAlign:'right', fontSize:11, fontWeight:600 }}>Amount</th>
                  <th style={{ padding:'5px 10px', textAlign:'right', fontSize:11, fontWeight:600 }}>% of Expenses</th>
                </tr>
              </thead>
              <tbody>
                {[...expenseEntries].sort((a,b)=>Number(b.amount)-Number(a.amount)).slice(0,5).map((e,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f0f0f0', background:i%2===0?'white':'#fafafa' }}>
                    <td style={{ padding:'5px 10px', fontSize:11, fontWeight:700, color:'#999' }}>{i+1}</td>
                    <td style={{ padding:'5px 10px', fontSize:11 }}>{e.label}</td>
                    <td style={{ padding:'5px 10px', textAlign:'right', fontSize:11, fontWeight:700, color:'#c62828' }}>${Number(e.amount).toLocaleString()}</td>
                    <td style={{ padding:'5px 10px', textAlign:'right', fontSize:11 }}>{Math.round(Number(e.amount)/totalExpenses*100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop:'2px solid #2e7d32', paddingTop:8, marginTop:8, display:'flex', justifyContent:'space-between', fontSize:9, color:'#999' }}>
          <span>Generated by Stewardship Hub · stewardship-hub-tau.vercel.app</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      </div>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #budget-report, #budget-report * { visibility: visible !important; }
          #budget-report { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 12px !important; font-size: 10px !important; }
          .no-print { display: none !important; }
          .bottom-nav, nav { display: none !important; }
          #budget-report table { page-break-inside: auto; }
          #budget-report tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
