// Separate file so recharts (411 kB) only downloads when charts actually render
import { memo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

const fmt = (n, symbol='$') =>
  `${symbol}${Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0})}`

export const DonutChart = memo(function DonutChart({ data, total, symbol='$' }) {
  return (
    <div style={{ position:'relative', width:150, height:150, flexShrink:0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={68}
            dataKey="value" strokeWidth={2} stroke="white">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={v => [`${symbol}${Number(v).toLocaleString()}`, '']}
            contentStyle={{ fontSize:11, borderRadius:8 }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
        <div style={{ fontSize:13, fontWeight:800, color:'var(--text)', lineHeight:1.1 }}>
          {fmt(total, symbol)}
        </div>
        <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2 }}>spent</div>
      </div>
    </div>
  )
})

export const TrendChart = memo(function TrendChart({ data, symbol='$' }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} barCategoryGap="30%" barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={36}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip formatter={(v, name) => [`${symbol}${Number(v).toLocaleString()}`, name]}
          contentStyle={{ fontSize:11, borderRadius:10, border:'1px solid #e5e7eb' }}
          cursor={{ fill:'rgba(0,0,0,0.04)' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, paddingTop:8 }} />
        <Bar dataKey="Income"   fill="#1D9E75" radius={[4,4,0,0]} />
        <Bar dataKey="Expenses" fill="#A32D2D" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})
