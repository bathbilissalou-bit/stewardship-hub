import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'goals',   label: 'My Goals',    icon: '🎯' },
  { id: 'recipes', label: 'Recipes',     icon: '📖' },
  { id: 'weight',  label: 'Weight',      icon: '⚖️' },
  { id: 'food',    label: 'Food Access', icon: '🏪' },
]

const DIET_OPTIONS = [
  { value: 'none',         label: 'No Restriction' },
  { value: 'vegan',        label: '🌱 Vegan' },
  { value: 'vegetarian',   label: '🥚 Vegetarian' },
  { value: 'keto',         label: '🥑 Keto' },
  { value: 'halal',        label: '☪️ Halal' },
  { value: 'paleo',        label: '🍖 Paleo' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',    label: 'Sedentary (desk job, no exercise)',    mult: 1.2 },
  { value: 'light',        label: 'Lightly active (1–2 days/week)',       mult: 1.375 },
  { value: 'moderate',     label: 'Moderately active (3–5 days/week)',    mult: 1.55 },
  { value: 'active',       label: 'Very active (6–7 days/week)',          mult: 1.725 },
  { value: 'extra',        label: 'Extra active (athlete / physical job)', mult: 1.9 },
]

const RECIPES = [
  {
    id:1, name:'Overnight Oats', emoji:'🥣',
    desc:'No-cook breakfast packed with fiber and protein.',
    calories:350, protein:12, carbs:52, fat:9,
    budget:'cheap', diet:['vegan','vegetarian'], time:'5 min + overnight', servings:1,
    ingredients:['1 cup rolled oats','1 cup plant milk','1 tbsp chia seeds','1 tbsp maple syrup','½ cup mixed berries','Pinch of cinnamon'],
    steps:['Combine oats, milk, chia seeds, and maple syrup in a jar.','Stir until well mixed.','Refrigerate overnight (minimum 4 hours).','Top with berries and cinnamon before eating.','Warm in microwave 1–2 min if you prefer it hot.']
  },
  {
    id:2, name:'Lentil & Veggie Soup', emoji:'🍲',
    desc:'Hearty, filling soup with plant-based protein.',
    calories:280, protein:16, carbs:44, fat:4,
    budget:'cheap', diet:['vegan','vegetarian','halal'], time:'35 min', servings:4,
    ingredients:['2 cups red lentils','1 onion diced','3 carrots diced','3 celery stalks','4 garlic cloves','1 can diced tomatoes','6 cups vegetable broth','2 tsp cumin','1 tsp turmeric','Salt & pepper'],
    steps:['Sauté onion, carrots, celery in a pot 5 min.','Add garlic, cumin, turmeric — cook 1 min.','Rinse lentils; add with tomatoes and broth.','Boil then simmer 25 min until lentils are soft.','Season and serve with crusty bread.']
  },
  {
    id:3, name:'Black Bean Tacos', emoji:'🌮',
    desc:'Quick weeknight tacos, budget-friendly and filling.',
    calories:310, protein:14, carbs:48, fat:7,
    budget:'cheap', diet:['vegan','vegetarian'], time:'15 min', servings:2,
    ingredients:['1 can black beans drained','4 corn tortillas','1 cup shredded cabbage','1 avocado sliced','½ cup salsa','1 lime','1 tsp cumin','1 tsp chili powder','Fresh cilantro'],
    steps:['Warm beans in pan with cumin, chili powder, splash of water.','Warm tortillas in a dry skillet or over flame.','Fill with beans, cabbage, avocado.','Top with salsa, lime, and cilantro.','Serve immediately.']
  },
  {
    id:4, name:'Chicken Shawarma Bowl', emoji:'🍗',
    desc:'Restaurant-style halal bowl made at home.',
    calories:520, protein:42, carbs:38, fat:18,
    budget:'moderate', diet:['halal'], time:'30 min', servings:2,
    ingredients:['400g halal chicken thighs','1 cup basmati rice','1 tsp cumin','1 tsp paprika','½ tsp turmeric','½ tsp cinnamon','2 tbsp olive oil','1 cup plain yogurt','2 garlic cloves','1 cucumber diced'],
    steps:['Marinate chicken with spices and 1 tbsp olive oil, 15 min.','Cook basmati rice per package instructions.','Grill or pan-fry chicken 5–6 min per side until cooked.','Mix yogurt with garlic and salt for sauce.','Slice chicken, serve over rice with cucumber and yogurt sauce.']
  },
  {
    id:5, name:'Keto Egg & Avocado Bowl', emoji:'🥑',
    desc:'Low-carb, high-fat breakfast to fuel your morning.',
    calories:420, protein:20, carbs:6, fat:36,
    budget:'moderate', diet:['keto','vegetarian'], time:'10 min', servings:1,
    ingredients:['2 large eggs','1 ripe avocado','¼ cup cherry tomatoes halved','Salt, pepper, chili flakes','1 tbsp butter','Fresh chives or green onion'],
    steps:['Melt butter in a non-stick pan over medium-low heat.','Scramble eggs gently — remove while still slightly soft.','Halve avocado and score the flesh.','Place avocado in bowl, top with eggs.','Add tomatoes, chives, salt, pepper, and chili flakes.']
  },
  {
    id:6, name:'Chickpea Coconut Curry', emoji:'🍛',
    desc:'Creamy, warming curry ready in 25 minutes.',
    calories:380, protein:14, carbs:50, fat:14,
    budget:'cheap', diet:['vegan','vegetarian','halal'], time:'25 min', servings:3,
    ingredients:['2 cans chickpeas drained','1 can coconut milk','1 can diced tomatoes','1 onion','3 garlic cloves','1 tbsp ginger','2 tbsp curry powder','1 tsp garam masala','2 cups spinach','Basmati rice to serve'],
    steps:['Sauté onion in oil 5 min until soft.','Add garlic, ginger — cook 1 min.','Stir in curry powder and garam masala, 30 sec.','Add chickpeas, tomatoes, coconut milk. Simmer 15 min.','Stir in spinach until wilted. Serve over rice.']
  },
  {
    id:7, name:'Baked Salmon & Broccoli', emoji:'🐟',
    desc:'Omega-3 rich one-pan dinner, keto-friendly.',
    calories:490, protein:38, carbs:12, fat:32,
    budget:'premium', diet:['keto','halal'], time:'25 min', servings:2,
    ingredients:['2 salmon fillets (170g each)','1 head broccoli','2 tbsp olive oil','3 garlic cloves minced','1 lemon sliced','1 tsp dill','1 tsp paprika','Salt and pepper'],
    steps:['Preheat oven to 400°F (200°C).','Toss broccoli with 1 tbsp oil, salt, pepper — spread on baking sheet.','Place salmon on sheet, brush with oil, garlic, dill, paprika.','Lay lemon slices on each fillet.','Bake 18–20 min until salmon flakes easily.']
  },
  {
    id:8, name:'Rice & Beans', emoji:'🍚',
    desc:'The ultimate budget meal — complete protein, high fiber.',
    calories:450, protein:18, carbs:82, fat:5,
    budget:'cheap', diet:['vegan','vegetarian','halal'], time:'30 min', servings:4,
    ingredients:['2 cups long-grain rice','2 cans kidney beans','1 onion','3 garlic cloves','1 bell pepper','1 tsp cumin','1 tsp oregano','2 cups broth','Hot sauce to serve'],
    steps:['Sauté onion and bell pepper in oil 5 min.','Add garlic, cumin, oregano — 1 min.','Add rice, stir to coat.','Pour in broth + water to cover. Boil.','Add beans, reduce heat, cover, simmer 20 min. Fluff and serve.']
  },
  {
    id:9, name:'Turkey Veggie Stir Fry', emoji:'🥘',
    desc:'High-protein, low-carb dinner in under 20 minutes.',
    calories:420, protein:38, carbs:22, fat:16,
    budget:'moderate', diet:['halal'], time:'20 min', servings:2,
    ingredients:['300g ground halal turkey','2 cups mixed vegetables','3 tbsp soy sauce','1 tbsp sesame oil','2 garlic cloves','1 tsp ginger','1 tbsp cornstarch','Green onions to garnish'],
    steps:['Brown turkey in hot wok over high heat, break apart.','Add garlic and ginger, stir 30 sec.','Add vegetables — stir fry 3–4 min.','Mix soy sauce, sesame oil, cornstarch; pour over pan.','Toss until glossy. Garnish with green onions.']
  },
  {
    id:10, name:'Cauliflower Fried Rice', emoji:'🥦',
    desc:'Keto spin on fried rice — low carb, big flavor.',
    calories:260, protein:12, carbs:14, fat:18,
    budget:'moderate', diet:['keto','vegan'], time:'20 min', servings:2,
    ingredients:['1 head cauliflower riced','2 eggs beaten','1 cup frozen peas & carrots','3 tbsp soy sauce or coconut aminos','2 garlic cloves','1 tsp sesame oil','2 green onions','1 tbsp oil'],
    steps:['Heat oil in a large skillet over high heat.','Add garlic, cook 30 sec. Add peas & carrots, 2 min.','Push vegetables aside, scramble eggs in empty space.','Add cauliflower rice, combine everything.','Pour in soy sauce and sesame oil, cook 4–5 min until golden.']
  },
  {
    id:11, name:'Greek Yogurt Parfait', emoji:'🍓',
    desc:'High-protein snack or breakfast ready in 3 minutes.',
    calories:290, protein:22, carbs:34, fat:6,
    budget:'moderate', diet:['vegetarian'], time:'3 min', servings:1,
    ingredients:['1 cup plain Greek yogurt','½ cup granola','½ cup strawberries sliced','1 tbsp honey','1 tbsp chia seeds'],
    steps:['Spoon Greek yogurt into a bowl or glass.','Layer granola over yogurt.','Add sliced strawberries.','Drizzle with honey, sprinkle chia seeds.','Eat immediately or refrigerate up to 2 hours.']
  },
  {
    id:12, name:'Beef & Vegetable Soup', emoji:'🥩',
    desc:'Nourishing one-pot meal, perfect for meal prep.',
    calories:340, protein:28, carbs:28, fat:12,
    budget:'moderate', diet:['halal'], time:'45 min', servings:6,
    ingredients:['500g halal beef stew cubes','3 potatoes diced','3 carrots','2 celery stalks','1 onion','3 garlic cloves','1 can diced tomatoes','4 cups beef broth','1 tsp thyme','1 bay leaf'],
    steps:['Brown beef in batches in a large pot. Set aside.','Sauté onion, carrots, celery 5 min.','Add garlic, thyme, bay leaf — 1 min.','Return beef. Add tomatoes, broth, potatoes.','Boil, reduce heat, cover, simmer 35 min. Season and serve.']
  },
]

const US_STORES = [
  { name:'Walmart Supercenter',        emoji:'🏬', cat:'Supermarket',    desc:'Full groceries, produce, bulk items at low prices.' },
  { name:'Target (grocery section)',   emoji:'🎯', cat:'Supermarket',    desc:'Good variety with weekly Circle deals.' },
  { name:'Kroger / Fred Meyer / Ralphs', emoji:'🛒', cat:'Supermarket', desc:'Large national chain with digital coupons.' },
  { name:'Safeway / Albertsons / Vons', emoji:'🛒', cat:'Supermarket',  desc:'Weekly specials and loyalty card savings.' },
  { name:'Aldi',                       emoji:'💚', cat:'Discount',       desc:'Lowest grocery prices — limited but quality selection.' },
  { name:'Publix',                     emoji:'🌿', cat:'Supermarket',    desc:'Great BOGO deals (Southeast US).' },
  { name:'Costco',                     emoji:'📦', cat:'Warehouse',      desc:'Bulk buying at low per-unit cost. Membership required.' },
  { name:"Sam's Club",                 emoji:'📦', cat:'Warehouse',      desc:'Bulk groceries with EBT accepted. Membership required.' },
  { name:'Whole Foods Market',         emoji:'🌾', cat:'Specialty',      desc:'Organic and natural products. Higher price point.' },
  { name:"Trader Joe's",              emoji:'🌺', cat:'Specialty',      desc:'Unique products, fair prices, great frozen meals.' },
  { name:'Dollar General / Family Dollar', emoji:'💰', cat:'Dollar Store', desc:'Canned goods, snacks, and pantry staples.' },
  { name:'CVS / Walgreens',           emoji:'💊', cat:'Drugstore',      desc:'EBT accepted on eligible food items.' },
  { name:'Farmers Markets',           emoji:'🥕', cat:'Farmers Market', desc:'Many accept EBT — some DOUBLE your dollars with SNAP bonuses!' },
  { name:'Amazon Fresh',             emoji:'📱', cat:'Online',          desc:'Online EBT grocery shopping with delivery (select states).' },
  { name:'Instacart / Walmart Online', emoji:'🚚', cat:'Online',        desc:'EBT delivery in many states — check your state eligibility.' },
]

const CANADA_RESOURCES = [
  { name:'Food Banks Canada',         emoji:'🤝', cat:'Food Bank',       desc:'National network. Find yours at foodbankscanada.ca', link:'https://foodbankscanada.ca' },
  { name:'Second Harvest',           emoji:'♻️', cat:'Food Rescue',     desc:"Canada's largest food rescue organization.", link:'https://secondharvest.ca' },
  { name:'Salvation Army',           emoji:'❤️', cat:'Emergency Aid',   desc:'Food hampers, hot meals, emergency assistance.', link:'https://salvationarmy.ca' },
  { name:'Community Food Centres',   emoji:'🏘️', cat:'Community Hub',   desc:'Cooking programs, meals, and food access.', link:'https://cfccanada.ca' },
  { name:'No Frills',                emoji:'🏷️', cat:'Discount Grocery', desc:"Loblaw's budget brand — great everyday prices." },
  { name:'Food Basics',              emoji:'🏷️', cat:'Discount Grocery', desc:"Metro's budget grocery chain." },
  { name:'FreshCo',                  emoji:'🛒', cat:'Discount Grocery', desc:"Sobeys' discount banner with affordable fresh produce." },
  { name:'Giant Tiger',              emoji:'🐯', cat:'Discount',         desc:'Mix of affordable groceries and clothing.' },
  { name:'Walmart Canada',           emoji:'🏬', cat:'Supermarket',      desc:'Competitive pricing on groceries and household essentials.' },
  { name:'PC Optimum Points',        emoji:'💳', cat:'Savings Program',  desc:'Earn points at Loblaws & Shoppers Drug Mart for free groceries.' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcCalories(profile) {
  const { gender='male', age=30, weight_kg=70, height_cm=170, activity='moderate', goal='maintenance' } = profile
  const mult = ACTIVITY_OPTIONS.find(a => a.value === activity)?.mult || 1.55
  const bmr = gender === 'female'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    : 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
  const tdee = bmr * mult
  if (goal === 'loss')  return Math.round(tdee - 500)
  if (goal === 'gain')  return Math.round(tdee + 300)
  return Math.round(tdee)
}

function calcMacros(calories, diet) {
  if (diet === 'keto') {
    return { protein: Math.round(calories * 0.25 / 4), carbs: Math.round(calories * 0.05 / 4), fat: Math.round(calories * 0.70 / 9) }
  }
  return { protein: Math.round(calories * 0.25 / 4), carbs: Math.round(calories * 0.45 / 4), fat: Math.round(calories * 0.30 / 9) }
}

function bmi(weight_kg, height_cm) {
  const h = height_cm / 100
  return (weight_kg / (h * h)).toFixed(1)
}

function bmiLabel(b) {
  if (b < 18.5) return { label:'Underweight', color:'#185FA5' }
  if (b < 25)   return { label:'Normal',       color:'#1D9E75' }
  if (b < 30)   return { label:'Overweight',   color:'#BA7517' }
  return              { label:'Obese',          color:'#A32D2D' }
}

function openMaps(query) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},13z`, '_blank')
      },
      () => window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank')
    )
  } else {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank')
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
        <span style={{ fontWeight:600, color:'var(--text)' }}>{label}</span>
        <span style={{ color:'#6b7280' }}>{value}g</span>
      </div>
      <div style={{ height:7, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:4, transition:'width 0.4s' }}/>
      </div>
    </div>
  )
}

function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'var(--white)', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:40, marginBottom:4 }}>{recipe.emoji}</div>
            <h3 style={{ margin:0, fontSize:20, fontWeight:800 }}>{recipe.name}</h3>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>⏱ {recipe.time} · 🍽 {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#9ca3af', padding:4 }}>✕</button>
        </div>

        {/* Macros */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, background:'#f9fafb', borderRadius:12, padding:'12px 8px', marginBottom:18 }}>
          {[
            { label:'Calories', val:recipe.calories, unit:'kcal', color:'#1D9E75' },
            { label:'Protein',  val:`${recipe.protein}g`, unit:'', color:'#185FA5' },
            { label:'Carbs',    val:`${recipe.carbs}g`,   unit:'', color:'#BA7517' },
            { label:'Fat',      val:`${recipe.fat}g`,     unit:'', color:'#A32D2D' },
          ].map(m => (
            <div key={m.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, color:m.color }}>{m.val}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>🛒 Ingredients</div>
          {recipe.ingredients.map((ing, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #f3f4f6' }}>
              <span style={{ color:'#1D9E75', fontSize:14 }}>✓</span>
              <span style={{ fontSize:14 }}>{ing}</span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>👨‍🍳 Instructions</div>
          {recipe.steps.map((step, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
              <div style={{ width:24, height:24, borderRadius:12, background:'#1D9E75', color:'white', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:14, lineHeight:1.6, color:'var(--text)', paddingTop:2 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Nutrition({ session }) {
  const [tab, setTab] = useState('goals')

  // ── Goals tab state
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    gender:'male', age:'25', weight_kg:'70', height_cm:'170',
    target_weight:'65', goal:'maintenance', activity:'moderate', diet:'none'
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Recipes tab state
  const [recipeFilter, setRecipeFilter] = useState({ diet:'all', budget:'all', maxCal:9999 })
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  // ── Weight tab state
  const [weightLogs, setWeightLogs] = useState([])
  const [weightInput, setWeightInput] = useState('')
  const [weightNote, setWeightNote] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg') // 'kg' or 'lbs'
  const [addingWeight, setAddingWeight] = useState(false)
  const [weightLoading, setWeightLoading] = useState(true)

  // ── Food tab state
  const [country, setCountry] = useState('US')

  const uid = session?.user?.id

  // Load profile + weight logs
  useEffect(() => {
    if (!uid) return
    Promise.all([
      supabase.from('nutrition_profiles').select('*').eq('user_id', uid).single(),
      supabase.from('weight_logs').select('*').eq('user_id', uid).order('logged_at').limit(60),
    ]).then(([{ data: p }, { data: w }]) => {
      if (p) {
        setProfile(p)
        setForm({
          gender: p.gender || 'male',
          age: String(p.age || 25),
          weight_kg: String(p.weight_kg || 70),
          height_cm: String(p.height_cm || 170),
          target_weight: String(p.target_weight || 65),
          goal: p.goal || 'maintenance',
          activity: p.activity || 'moderate',
          diet: p.diet || 'none',
        })
        setCountry(p.country || 'US')
      } else {
        setEditing(true) // New user — show setup
      }
      setWeightLogs(w || [])
      setProfileLoading(false)
      setWeightLoading(false)
    }).catch(() => {
      setProfileLoading(false)
      setWeightLoading(false)
    })
  }, [uid])

  async function saveProfile() {
    setSavingProfile(true)
    const payload = {
      user_id: uid,
      gender: form.gender,
      age: parseInt(form.age) || 25,
      weight_kg: parseFloat(form.weight_kg) || 70,
      height_cm: parseFloat(form.height_cm) || 170,
      target_weight: parseFloat(form.target_weight) || 65,
      goal: form.goal,
      activity: form.activity,
      diet: form.diet,
      country,
    }
    const { data } = await supabase.from('nutrition_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select().single().catch(() => ({ data: null }))
    if (data) setProfile(data)
    setSavingProfile(false)
    setEditing(false)
  }

  async function logWeight() {
    if (!weightInput) return
    setAddingWeight(true)
    const kg = weightUnit === 'lbs' ? parseFloat(weightInput) / 2.205 : parseFloat(weightInput)
    const { data } = await supabase.from('weight_logs')
      .insert({ user_id: uid, weight: parseFloat(kg.toFixed(1)), note: weightNote.trim() || null })
      .select().single().catch(() => ({ data: null }))
    if (data) setWeightLogs(prev => [...prev, data].sort((a,b) => a.logged_at.localeCompare(b.logged_at)))
    setWeightInput('')
    setWeightNote('')
    setAddingWeight(false)
  }

  async function deleteWeight(id) {
    await supabase.from('weight_logs').delete().eq('id', id).catch(() => {})
    setWeightLogs(prev => prev.filter(w => w.id !== id))
  }

  // ── Derived values
  const calories = profile ? calcCalories({
    gender: profile.gender,
    age: profile.age,
    weight_kg: profile.weight_kg,
    height_cm: profile.height_cm,
    activity: profile.activity,
    goal: profile.goal,
  }) : 2000

  const macros = calcMacros(calories, profile?.diet || 'none')

  const filteredRecipes = RECIPES.filter(r => {
    if (recipeFilter.diet !== 'all' && !r.diet.includes(recipeFilter.diet)) return false
    if (recipeFilter.budget !== 'all' && r.budget !== recipeFilter.budget) return false
    if (r.calories > recipeFilter.maxCal) return false
    return true
  })

  const chartData = weightLogs.slice(-20).map(w => ({
    date: new Date(w.logged_at).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
    weight: weightUnit === 'lbs' ? parseFloat((w.weight * 2.205).toFixed(1)) : w.weight,
  }))

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null
  const bmiValue = latestWeight && profile?.height_cm ? bmi(latestWeight, profile.height_cm) : null
  const bmiInfo = bmiValue ? bmiLabel(parseFloat(bmiValue)) : null

  const goalLabel = { loss:'🔽 Weight Loss', gain:'🔼 Weight Gain', maintenance:'⚖️ Maintenance' }
  const dietLabel = DIET_OPTIONS.find(d => d.value === (profile?.diet || 'none'))?.label || 'No Restriction'

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:'16px 16px 0 0', padding:'20px 16px 16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🥗</div>
        <h2 style={{ color:'white', margin:'0 0 2px', fontSize:22, fontWeight:800 }}>Food & Healthy Living</h2>
        <p style={{ color:'rgba(255,255,255,0.85)', margin:0, fontSize:13 }}>Nutrition, recipes, weight tracking & food access</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, padding:'12px 0 4px', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:'none', padding:'8px 14px', borderRadius:20, border:'none', cursor:'pointer',
            background: tab === t.id ? '#1D9E75' : '#f3f4f6',
            color: tab === t.id ? 'white' : '#6b7280',
            fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:5,
            transition:'all 0.2s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: My Goals ────────────────────────────────────────── */}
      {tab === 'goals' && (
        <div style={{ paddingTop:12 }}>
          {profileLoading ? (
            <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading...</div>
          ) : editing ? (
            /* Setup / Edit Form */
            <div style={{ background:'var(--white)', borderRadius:16, padding:20, border:'1px solid var(--border)' }}>
              <h3 style={{ margin:'0 0 16px', fontSize:17, fontWeight:800 }}>
                {profile ? 'Edit Your Profile' : '👋 Set Up Your Nutrition Profile'}
              </h3>

              {[
                { label:'Gender', key:'gender', type:'select', opts:[{v:'male',l:'Male'},{v:'female',l:'Female'}] },
                { label:'Age', key:'age', type:'number', placeholder:'e.g. 28', unit:'years' },
                { label:'Current Weight', key:'weight_kg', type:'number', placeholder:'e.g. 70', unit:'kg' },
                { label:'Height', key:'height_cm', type:'number', placeholder:'e.g. 170', unit:'cm' },
                { label:'Target Weight', key:'target_weight', type:'number', placeholder:'e.g. 65', unit:'kg' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5 }}>{f.label}</div>
                  {f.type === 'select' ? (
                    <select value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]:e.target.value}))}
                      style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:14, background:'white' }}>
                      {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
                      <input type="number" value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]:e.target.value}))}
                        placeholder={f.placeholder}
                        style={{ flex:1, padding:'10px 12px', border:'none', outline:'none', fontSize:15, fontWeight:600, color:'#1D9E75' }}/>
                      <div style={{ padding:'0 12px', color:'#9ca3af', fontSize:12 }}>{f.unit}</div>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5 }}>Goal</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                  {[{v:'loss',l:'🔽 Lose'},{v:'maintenance',l:'⚖️ Maintain'},{v:'gain',l:'🔼 Gain'}].map(g => (
                    <button key={g.v} onClick={() => setForm(p => ({...p, goal:g.v}))}
                      style={{ padding:'10px 4px', borderRadius:10, border:`2px solid ${form.goal===g.v?'#1D9E75':'#e5e7eb'}`, background:form.goal===g.v?'#E1F5EE':'white', cursor:'pointer', fontSize:13, fontWeight:600, color:form.goal===g.v?'#0F6E56':'#374151' }}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5 }}>Activity Level</div>
                <select value={form.activity} onChange={e => setForm(p => ({...p, activity:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, background:'white' }}>
                  {ACTIVITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5 }}>Dietary Preference</div>
                <select value={form.diet} onChange={e => setForm(p => ({...p, diet:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, background:'white' }}>
                  {DIET_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#6b7280', marginBottom:5 }}>Country</div>
                <div style={{ display:'flex', gap:8 }}>
                  {[{v:'US',l:'🇺🇸 United States'},{v:'CA',l:'🇨🇦 Canada'}].map(c => (
                    <button key={c.v} onClick={() => setCountry(c.v)}
                      style={{ flex:1, padding:'10px', borderRadius:10, border:`2px solid ${country===c.v?'#1D9E75':'#e5e7eb'}`, background:country===c.v?'#E1F5EE':'white', cursor:'pointer', fontSize:13, fontWeight:600, color:country===c.v?'#0F6E56':'#374151' }}>
                      {c.l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                {profile && (
                  <button onClick={() => setEditing(false)}
                    style={{ flex:1, padding:'13px', background:'#f3f4f6', color:'#374151', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                    Cancel
                  </button>
                )}
                <button onClick={saveProfile} disabled={savingProfile}
                  style={{ flex:2, padding:'13px', background:'#1D9E75', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer' }}>
                  {savingProfile ? 'Saving...' : '✓ Save Profile'}
                </button>
              </div>
            </div>
          ) : (
            /* Profile Dashboard */
            <>
              {/* Daily Calorie Target */}
              <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:16, padding:'20px', marginBottom:14, color:'white' }}>
                <div style={{ fontSize:11, opacity:0.8, letterSpacing:'0.05em', marginBottom:4 }}>DAILY CALORIE TARGET</div>
                <div style={{ fontSize:42, fontWeight:800, letterSpacing:'-1px', marginBottom:4 }}>{calories.toLocaleString()}</div>
                <div style={{ fontSize:12, opacity:0.8 }}>kcal/day · {goalLabel[profile.goal]} · {dietLabel}</div>
              </div>

              {/* Macros */}
              <div style={{ background:'var(--white)', borderRadius:16, padding:18, marginBottom:14, border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Daily Macro Targets</div>
                <MacroBar label={`Protein — ${macros.protein}g`} value={macros.protein} max={200} color='#185FA5' />
                <MacroBar label={`Carbs — ${macros.carbs}g`}    value={macros.carbs}   max={400} color='#BA7517' />
                <MacroBar label={`Fat — ${macros.fat}g`}        value={macros.fat}     max={150} color='#A32D2D' />
                <div style={{ marginTop:12, fontSize:12, color:'#9ca3af', textAlign:'center' }}>
                  {profile.diet === 'keto' ? '⚠️ Keto ratios: 70% fat / 25% protein / 5% carbs' : 'Balanced macros for your goal'}
                </div>
              </div>

              {/* Smart suggestion */}
              <div style={{ background:'#EBF4FB', borderRadius:14, padding:'14px 16px', marginBottom:14, border:'1px solid #BFDBFE' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#185FA5', marginBottom:4 }}>💡 Smart Suggestion</div>
                <div style={{ fontSize:13, color:'#1e3a5f', lineHeight:1.6 }}>
                  {profile.goal === 'loss'
                    ? `Eating ${calories} kcal/day puts you in a 500 kcal deficit — aim to lose ~0.5kg per week. Try 3 meals + 1 snack.`
                    : profile.goal === 'gain'
                    ? `Eating ${calories} kcal/day adds a 300 kcal surplus. Prioritize protein (${macros.protein}g/day) and strength training.`
                    : `At ${calories} kcal/day you'll maintain your current weight. Focus on food quality and consistency.`}
                </div>
              </div>

              {/* Profile summary + edit */}
              <div style={{ background:'var(--white)', borderRadius:14, padding:'14px 16px', border:'1px solid var(--border)', marginBottom:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>Your Profile</div>
                  <button onClick={() => setEditing(true)}
                    style={{ background:'none', border:'1px solid #e5e7eb', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer', color:'#374151' }}>
                    ✏️ Edit
                  </button>
                </div>
                {[
                  ['Age',      `${profile.age} years`],
                  ['Weight',   `${profile.weight_kg} kg`],
                  ['Height',   `${profile.height_cm} cm`],
                  ['Target',   `${profile.target_weight} kg`],
                  ['Activity', ACTIVITY_OPTIONS.find(a=>a.value===profile.activity)?.label.split(' (')[0] || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:13, borderBottom:'1px solid #f9fafb' }}>
                    <span style={{ color:'#6b7280' }}>{k}</span>
                    <span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Recipes ─────────────────────────────────────────── */}
      {tab === 'recipes' && (
        <div style={{ paddingTop:12 }}>
          {/* Filters */}
          <div style={{ background:'var(--white)', borderRadius:14, padding:'14px', marginBottom:14, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>🔍 Filter Recipes</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:5 }}>Diet Type</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[{v:'all',l:'All'},{v:'vegan',l:'🌱 Vegan'},{v:'vegetarian',l:'🥚 Veggie'},{v:'keto',l:'🥑 Keto'},{v:'halal',l:'☪️ Halal'}].map(d => (
                  <button key={d.v} onClick={() => setRecipeFilter(p=>({...p, diet:d.v}))}
                    style={{ padding:'5px 11px', borderRadius:16, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
                      background: recipeFilter.diet===d.v?'#1D9E75':'#f3f4f6',
                      color: recipeFilter.diet===d.v?'white':'#6b7280' }}>
                    {d.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:5 }}>Budget</div>
              <div style={{ display:'flex', gap:6 }}>
                {[{v:'all',l:'All'},{v:'cheap',l:'💚 Budget'},{v:'moderate',l:'💛 Mid'},{v:'premium',l:'💎 Premium'}].map(b => (
                  <button key={b.v} onClick={() => setRecipeFilter(p=>({...p, budget:b.v}))}
                    style={{ padding:'5px 11px', borderRadius:16, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
                      background: recipeFilter.budget===b.v?'#1D9E75':'#f3f4f6',
                      color: recipeFilter.budget===b.v?'white':'#6b7280' }}>
                    {b.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#6b7280', marginBottom:5 }}>Max Calories: {recipeFilter.maxCal === 9999 ? 'Any' : `${recipeFilter.maxCal} kcal`}</div>
              <input type="range" min={200} max={800} step={50} value={recipeFilter.maxCal === 9999 ? 800 : recipeFilter.maxCal}
                onChange={e => setRecipeFilter(p => ({...p, maxCal: parseInt(e.target.value) === 800 ? 9999 : parseInt(e.target.value)}))}
                style={{ width:'100%', accentColor:'#1D9E75' }}/>
            </div>
          </div>

          {/* Recipe count */}
          <div style={{ fontSize:12, color:'#9ca3af', marginBottom:10 }}>{filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found</div>

          {/* Recipe grid */}
          {filteredRecipes.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'#9ca3af' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🍽</div>
              <div>No recipes match your filters. Try adjusting them.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {filteredRecipes.map(r => (
                <button key={r.id} onClick={() => setSelectedRecipe(r)}
                  style={{ background:'var(--white)', borderRadius:14, padding:'14px 12px', border:'1px solid var(--border)', cursor:'pointer', textAlign:'left', transition:'box-shadow 0.15s' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{r.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:3, lineHeight:1.3 }}>{r.name}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', marginBottom:8, lineHeight:1.4 }}>{r.desc}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#1D9E75' }}>{r.calories} kcal</div>
                    <div style={{ fontSize:10, color:'white', background: r.budget==='cheap'?'#1D9E75':r.budget==='moderate'?'#BA7517':'#185FA5', borderRadius:6, padding:'2px 6px' }}>
                      {r.budget === 'cheap' ? '💚' : r.budget === 'moderate' ? '💛' : '💎'}
                    </div>
                  </div>
                  <div style={{ marginTop:6, display:'flex', flexWrap:'wrap', gap:3 }}>
                    {r.diet.slice(0,2).map(d => (
                      <span key={d} style={{ fontSize:9, background:'#f3f4f6', color:'#6b7280', borderRadius:4, padding:'2px 5px' }}>{d}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        </div>
      )}

      {/* ── TAB: Weight ──────────────────────────────────────────── */}
      {tab === 'weight' && (
        <div style={{ paddingTop:12 }}>
          {weightLoading ? (
            <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading...</div>
          ) : (
            <>
              {/* Current stats */}
              {latestWeight && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:14, padding:'16px', color:'white' }}>
                    <div style={{ fontSize:11, opacity:0.8, marginBottom:4 }}>CURRENT WEIGHT</div>
                    <div style={{ fontSize:28, fontWeight:800 }}>
                      {weightUnit === 'lbs' ? (latestWeight * 2.205).toFixed(1) : latestWeight}
                    </div>
                    <div style={{ fontSize:12, opacity:0.7 }}>{weightUnit}</div>
                  </div>
                  {bmiValue && (
                    <div style={{ background:'var(--white)', borderRadius:14, padding:'16px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>BMI</div>
                      <div style={{ fontSize:28, fontWeight:800, color:bmiInfo.color }}>{bmiValue}</div>
                      <div style={{ fontSize:12, color:bmiInfo.color, fontWeight:600 }}>{bmiInfo.label}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Unit toggle */}
              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                {['kg','lbs'].map(u => (
                  <button key={u} onClick={() => setWeightUnit(u)}
                    style={{ padding:'7px 18px', borderRadius:20, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                      background: weightUnit===u?'#1D9E75':'#f3f4f6',
                      color: weightUnit===u?'white':'#6b7280' }}>
                    {u}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 1 ? (
                <div style={{ background:'var(--white)', borderRadius:16, padding:'16px', marginBottom:14, border:'1px solid var(--border)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>📈 Weight Progress</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginBottom:12 }}>Last {chartData.length} entries</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={32}
                        domain={['auto','auto']}
                        tickFormatter={v => `${v}`}
                      />
                      <Tooltip
                        formatter={v => [`${v} ${weightUnit}`, 'Weight']}
                        contentStyle={{ fontSize:11, borderRadius:10, border:'1px solid #e5e7eb' }}
                      />
                      {profile?.target_weight && (
                        <ReferenceLine
                          y={weightUnit === 'lbs' ? parseFloat((profile.target_weight * 2.205).toFixed(1)) : profile.target_weight}
                          stroke="#1D9E75" strokeDasharray="4 4"
                          label={{ value:'Goal', position:'right', fontSize:9, fill:'#1D9E75' }}
                        />
                      )}
                      <Line type="monotone" dataKey="weight" stroke="#1D9E75" strokeWidth={2.5} dot={{ r:3, fill:'#1D9E75' }} activeDot={{ r:5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : chartData.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 0', color:'#9ca3af' }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>⚖️</div>
                  <div style={{ fontWeight:600 }}>No weight entries yet</div>
                  <div style={{ fontSize:13, marginTop:4 }}>Log your first weight below to start tracking</div>
                </div>
              ) : null}

              {/* Log weight form */}
              <div style={{ background:'var(--white)', borderRadius:16, padding:18, marginBottom:14, border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Log Today's Weight</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', border:'2px solid #1D9E75', borderRadius:12, marginBottom:10 }}>
                  <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                    placeholder={`Weight in ${weightUnit}`}
                    style={{ flex:1, border:'none', outline:'none', fontSize:22, fontWeight:700, color:'#1D9E75' }}/>
                  <span style={{ color:'#1D9E75', fontWeight:700, fontSize:14 }}>{weightUnit}</span>
                </div>
                <input value={weightNote} onChange={e => setWeightNote(e.target.value)}
                  placeholder="Optional note (e.g. after workout)"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:12 }}/>
                <button onClick={logWeight} disabled={!weightInput || addingWeight}
                  style={{ width:'100%', padding:'13px', background:'#1D9E75', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', opacity:!weightInput?0.6:1 }}>
                  {addingWeight ? 'Saving...' : '+ Log Weight'}
                </button>
              </div>

              {/* Recent logs */}
              {weightLogs.length > 0 && (
                <div style={{ background:'var(--white)', borderRadius:16, padding:'14px 16px', border:'1px solid var(--border)' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Recent Entries</div>
                  {[...weightLogs].reverse().slice(0,8).map(w => (
                    <div key={w.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f9fafb' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>
                          {weightUnit === 'lbs' ? (w.weight * 2.205).toFixed(1) : w.weight} {weightUnit}
                        </div>
                        {w.note && <div style={{ fontSize:11, color:'#9ca3af' }}>{w.note}</div>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ fontSize:12, color:'#6b7280' }}>
                          {new Date(w.logged_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                        </div>
                        <button onClick={() => deleteWeight(w.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, color:'#d1d5db', padding:2 }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Food Access ─────────────────────────────────────── */}
      {tab === 'food' && (
        <div style={{ paddingTop:12 }}>
          {/* Country toggle */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[{v:'US',l:'🇺🇸 United States'},{v:'CA',l:'🇨🇦 Canada'}].map(c => (
              <button key={c.v} onClick={() => setCountry(c.v)}
                style={{ flex:1, padding:'11px', borderRadius:12, border:`2px solid ${country===c.v?'#1D9E75':'#e5e7eb'}`, background:country===c.v?'#E1F5EE':'var(--white)', cursor:'pointer', fontSize:13, fontWeight:700, color:country===c.v?'#0F6E56':'#374151' }}>
                {c.l}
              </button>
            ))}
          </div>

          {country === 'US' ? (
            <>
              {/* SNAP/EBT info banner */}
              <div style={{ background:'linear-gradient(135deg, #185FA5, #0d3f70)', borderRadius:14, padding:'16px', marginBottom:14, color:'white' }}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>🏛 SNAP / EBT Benefits</div>
                <div style={{ fontSize:13, opacity:0.9, lineHeight:1.6 }}>
                  All stores below accept SNAP Electronic Benefits Transfer (EBT) cards for eligible food purchases.
                  To apply for SNAP, visit <span style={{ textDecoration:'underline' }}>benefits.gov</span>.
                </div>
              </div>

              {/* Find on map button */}
              <button onClick={() => openMaps('SNAP EBT grocery store near me')}
                style={{ width:'100%', padding:'14px', background:'#1D9E75', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                📍 Find EBT Stores Near Me (Map)
              </button>

              {/* Store list */}
              {['Supermarket','Discount','Warehouse','Specialty','Dollar Store','Drugstore','Farmers Market','Online'].map(cat => {
                const stores = US_STORES.filter(s => s.cat === cat)
                if (!stores.length) return null
                return (
                  <div key={cat} style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:4, height:14, borderRadius:2, background:'#1D9E75', display:'inline-block' }}/>
                      {cat}s
                    </div>
                    {stores.map(s => (
                      <div key={s.name} style={{ background:'var(--white)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ fontSize:24, flexShrink:0 }}>{s.emoji}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{s.desc}</div>
                        </div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#1D9E75', background:'#E1F5EE', borderRadius:6, padding:'3px 7px', flexShrink:0 }}>EBT ✓</div>
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* Farmers Market tip */}
              <div style={{ background:'#FAEEDA', borderRadius:14, padding:'14px 16px', marginBottom:8, border:'1px solid #FCD88A' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#7A4D0F', marginBottom:4 }}>💡 Farmers Market Tip</div>
                <div style={{ fontSize:13, color:'#92400e', lineHeight:1.6 }}>
                  Many farmers markets <strong>double your EBT dollars</strong> through programs like Double Up Food Bucks — spend $10 EBT, get $20 in fresh produce!
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Canada info */}
              <div style={{ background:'linear-gradient(135deg, #A32D2D, #7a1f1f)', borderRadius:14, padding:'16px', marginBottom:14, color:'white' }}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>🇨🇦 Food Access in Canada</div>
                <div style={{ fontSize:13, opacity:0.9, lineHeight:1.6 }}>
                  Canada does not have a SNAP/EBT system. Food assistance is provided through food banks, community programs, and discount grocery stores.
                </div>
              </div>

              {/* Find food bank button */}
              <button onClick={() => openMaps('food bank near me')}
                style={{ width:'100%', padding:'14px', background:'#1D9E75', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                📍 Find Food Banks Near Me (Map)
              </button>

              {['Food Bank','Food Rescue','Emergency Aid','Community Hub','Discount Grocery','Supermarket','Savings Program'].map(cat => {
                const items = CANADA_RESOURCES.filter(r => r.cat === cat)
                if (!items.length) return null
                return (
                  <div key={cat} style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:4, height:14, borderRadius:2, background:'#A32D2D', display:'inline-block' }}/>
                      {cat}
                    </div>
                    {items.map(s => (
                      <div key={s.name} style={{ background:'var(--white)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ fontSize:24, flexShrink:0 }}>{s.emoji}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{s.desc}</div>
                        </div>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noreferrer"
                            style={{ fontSize:11, fontWeight:700, color:'#185FA5', background:'#EBF4FB', borderRadius:6, padding:'3px 7px', flexShrink:0, textDecoration:'none' }}>
                            Visit →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
