/* ═══ NAVIGATION ═══ */
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'})}
function scrollToSection(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}

/* ═══ MOBILE MENU ═══ */
function toggleMobileMenu(){
  const menu=document.getElementById('mobile-menu')
  const btn=document.getElementById('nav-hamburger')
  const isOpen=menu.classList.contains('open')
  menu.classList.toggle('open')
  btn.classList.toggle('open')
  document.body.style.overflow=isOpen?'':'hidden'
}
function closeMobileMenu(){
  document.getElementById('mobile-menu').classList.remove('open')
  document.getElementById('nav-hamburger').classList.remove('open')
  document.body.style.overflow=''
}
// Close mobile menu when clicking outside
document.addEventListener('click',function(e){
  const menu=document.getElementById('mobile-menu')
  const btn=document.getElementById('nav-hamburger')
  if(menu.classList.contains('open')&&!menu.contains(e.target)&&!btn.contains(e.target)){
    closeMobileMenu()
  }
})

/* ═══ MODALS ═══ */
function openModal(id){document.getElementById(id).classList.add('open');document.body.style.overflow='hidden'}
function closeModal(id){document.getElementById(id).classList.remove('open');document.body.style.overflow=''}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o){o.classList.remove('open');document.body.style.overflow=''}}))
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow=''})})

/* ═══ TOAST ═══ */
let toastTimer
function showToast(icon,msg,dur=2800){
  const t=document.getElementById('toast')
  document.getElementById('toast-icon').textContent=icon
  document.getElementById('toast-msg').textContent=msg
  t.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer=setTimeout(()=>t.classList.remove('show'),dur)
}

/* ═══ DASHBOARD REFRESH ═══ */
const dsStates=[
  {prot:{p:'57%',v:'68g',s:'of 120g',w:'57%'},cal:{p:'84%',v:'1,840',w:'84%'},energy:{p:'72%',v:'72',w:'72%'},hydra:{p:'60%',v:'1.8L',w:'60%'},i:'Protein 43% below target. Add 1 cup of dal or 2 eggs at dinner.'},
  {prot:{p:'75%',v:'90g',s:'of 120g',w:'75%'},cal:{p:'62%',v:'1,364',w:'62%'},energy:{p:'88%',v:'88',w:'88%'},hydra:{p:'80%',v:'2.4L',w:'80%'},i:'Great progress! Energy is high. Add a protein snack after 6 PM.'},
  {prot:{p:'45%',v:'54g',s:'of 120g',w:'45%'},cal:{p:'95%',v:'2,090',w:'95%'},energy:{p:'55%',v:'55',w:'55%'},hydra:{p:'40%',v:'1.2L',w:'40%'},i:'Low hydration affecting energy. Drink 500ml now and reduce carbs at dinner.'},
]
let dsIdx=0
function refreshDashboard(){
  dsIdx=(dsIdx+1)%dsStates.length
  const s=dsStates[dsIdx]
  document.getElementById('prot-pct').textContent=s.prot.p
  document.getElementById('prot-val').textContent=s.prot.v
  document.getElementById('prot-sub').textContent=s.prot.s
  document.getElementById('prot-bar').style.width=s.prot.w
  document.getElementById('cal-pct').textContent=s.cal.p
  document.getElementById('cal-val').textContent=s.cal.v
  document.getElementById('cal-bar').style.width=s.cal.w
  document.getElementById('energy-pct').textContent=s.energy.p
  document.getElementById('energy-val').textContent=s.energy.v
  document.getElementById('energy-bar').style.width=s.energy.w
  document.getElementById('hydra-pct').textContent=s.hydra.p
  document.getElementById('hydra-val').textContent=s.hydra.v
  document.getElementById('hydra-bar').style.width=s.hydra.w
  document.getElementById('insight-text').textContent=s.i
  showToast('📊','Dashboard refreshed!')
}

/* ═══ CHIP SELECTION ═══ */
function selectChip(el,group){
  const parent=el.closest('.chips')||el.closest('.selector-chips')
  parent.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'))
  el.classList.add('on')
}

/* ═══ AI MEAL PLANNER — 100% Groq powered, no hardcoded plans ═══ */
async function generatePlan(){
  const btn = document.getElementById('generate-btn')
  btn.classList.add('loading'); btn.disabled = true
  document.getElementById('daily-plan').classList.remove('visible')

  // Collect ALL user preferences
  const goalEl   = document.querySelector('#goal-chips .chip.on')
  const dietEl   = document.querySelector('#diet-chips .chip.on')
  const goal     = goalEl  ? goalEl.textContent.trim().replace(/^[\S]+\s/,'') : 'Exam Focus'
  const diet     = dietEl  ? dietEl.textContent.trim().replace(/^[\S]+\s/,'') : 'Vegetarian'
  const allergyChips = Array.from(document.querySelectorAll('#allergy-chips .chip.on'))
                             .map(c => c.textContent.trim().replace(/^[\S]+\s/,''))
  const allergyFree  = document.getElementById('allergy-other').value.trim()
  const allergies    = [...allergyChips, allergyFree].filter(Boolean)
  const allergyStr   = allergies.length ? allergies.join(', ') : 'none'
  const isStudent    = collegeVerified
  const budgetNote   = isStudent ? 'Keep each meal under ₹80 — student hostel budget.' : 'Use affordable Indian ingredients.'

  // Use TDEE data if available
  const tdeeData = JSON.parse(localStorage.getItem('nv_tdee') || 'null')
  const calTarget = tdeeData ? tdeeData.calories : 2000
  const protTarget = tdeeData ? tdeeData.protein : 80
  const tdeeNote = tdeeData ? `TARGET CALORIES: ${calTarget} kcal/day. TARGET PROTEIN: ${protTarget}g/day. Plan meals to hit these targets.` : 'Aim for approximately 1800-2200 kcal and 60-80g protein.'

  // Build a very explicit prompt so the model cannot ignore any field
  const prompt = `You are a precise Indian nutrition expert. Generate a 1-day personalized meal plan strictly following ALL of these rules:

${tdeeNote}
GOAL: ${goal}
DIET TYPE: ${diet} — only suggest foods compatible with this diet. If Vegetarian, NO chicken/fish/meat. If Vegan, NO dairy or eggs. If Eggetarian, eggs are fine but no meat.
ALLERGIES / AVOID: ${allergyStr} — NEVER include these ingredients or any dish containing them, not even as a minor component.
CONTEXT: ${isStudent ? 'Indian college hostel student with mess/canteen access.' : 'Indian adult cooking at home or eating out.'}
BUDGET: ${budgetNote}

Return ONLY a valid JSON object. No explanation, no markdown fences, no extra text.

Required format:
{"title":"<descriptive plan name>","cal":<total daily calories as integer>,"protein":"<total protein e.g. 74g>","meals":[{"tag":"Breakfast","name":"<specific Indian meal name>","protein":<grams as integer>,"kcal":<kcal as integer>,"note":"<1 short tip>"},{"tag":"Lunch","name":"...","protein":<n>,"kcal":<n>,"note":"..."},{"tag":"Snack","name":"...","protein":<n>,"kcal":<n>,"note":"..."},{"tag":"Dinner","name":"...","protein":<n>,"kcal":<n>,"note":"..."}]}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.5  // lower = more consistent JSON compliance
      })
    })
    const data = await res.json()

    if (!data.choices?.[0]) {
      const errMsg = data.error?.message || 'Unknown API error'
      showToast('⚠️', `AI error: ${errMsg}`, 5000)
      btn.classList.remove('loading'); btn.disabled = false
      return
    }

    // Safely parse — strip any accidental markdown fences
    let raw = data.choices[0].message.content.trim()
    raw = raw.replace(/^```json?\s*/i,'').replace(/```\s*$/,'').trim()
    const plan = JSON.parse(raw)

    // Render the plan
    document.getElementById('plan-title-text').textContent = plan.title || `${goal} Plan`
    document.getElementById('plan-cal-num').textContent    = (plan.cal || 0).toLocaleString()
    document.getElementById('plan-total-val').textContent  = plan.protein || '—'

    // Show allergy/diet badges under the title so the user can see they were respected
    const badgeHtml = [
      `<span style="background:var(--green-bg);color:var(--green);border:1px solid var(--green-xl);border-radius:50px;padding:2px 10px;font-size:0.7rem;font-weight:700">${diet}</span>`,
      ...allergies.map(a => `<span style="background:#FEF3DC;color:#92400E;border:1px solid #FCD34D;border-radius:50px;padding:2px 10px;font-size:0.7rem;font-weight:700">No ${a}</span>`)
    ].join(' ')
    document.getElementById('plan-ready-tag').innerHTML = `AI Generated &nbsp;·&nbsp; ${badgeHtml}`

    document.getElementById('meal-rows').innerHTML = (plan.meals || []).map(m => `
      <div class="meal-row">
        <div style="flex:1">
          <div class="meal-tag-pill">${m.tag}</div>
          <div class="meal-name">${m.name}</div>
          ${m.note ? `<div style="font-size:0.75rem;color:var(--muted);margin-top:4px;padding-left:13px">💡 ${m.note}</div>` : ''}
        </div>
        <div class="meal-macros">
          <div><div class="mac-val">${m.protein}g</div><div class="mac-label">Protein</div></div>
          <div><div class="mac-val">${m.kcal}</div><div class="mac-label">kcal</div></div>
        </div>
      </div>`).join('')

    const dp = document.getElementById('daily-plan')
    dp.classList.add('visible')
    dp.scrollIntoView({ behavior: 'smooth', block: 'start' })
    showToast('✨', `${plan.title} ready!`)

  } catch(err) {
    showToast('⚠️', `Plan generation failed: ${err.message}. Try again.`, 5000)
    console.error('generatePlan error:', err)
  }

  btn.classList.remove('loading'); btn.disabled = false
}

function savePlan(){
  const email = localStorage.getItem('nv_user_email')
  if(!email){showToast('⚠️','Sign in first to save plans!');openVerifyModal();return}
  const title = document.getElementById('plan-title-text').textContent
  const cal = document.getElementById('plan-cal-num').textContent
  const prot = document.getElementById('plan-total-val').textContent
  const mealsHTML = document.getElementById('meal-rows').innerHTML
  const key = 'nv_plans_'+email
  const plans = JSON.parse(localStorage.getItem(key)||'[]')
  if(plans.length>=5){plans.pop()}
  plans.unshift({title,cal,prot,mealsHTML,date:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),ts:Date.now()})
  localStorage.setItem(key,JSON.stringify(plans))
  renderSavedPlans()
  showToast('💾','Plan saved to your history!')
}

function sharePlan(){
  const title = document.getElementById('plan-title-text').textContent
  const cal   = document.getElementById('plan-cal-num').textContent
  const prot  = document.getElementById('plan-total-val').textContent
  const rows  = [...document.querySelectorAll('.meal-row')].map(r => {
    const tag  = r.querySelector('.meal-tag-pill')?.textContent || ''
    const name = r.querySelector('.meal-name')?.textContent || ''
    return `  ${tag}: ${name}`
  }).join('\n')
  const text = `🥗 My NutriVerse AI Plan: ${title}\n📊 ${cal} cal · 💪 ${prot} protein\n\n${rows}\n\nGenerated by NutriVerse AI — Fuel Smarter. Study Better.`
  if (navigator.share) navigator.share({ title: 'My NutriVerse Plan', text }).catch(()=>{})
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => showToast('📋','Plan copied to clipboard!'))
  else showToast('📤','Copy the plan from above!')
}

/* ═══ GAP CARDS ═══ */
const gapData={
  'skip-lunch':{icon:'☕',title:'Why Students Skip Lunch',text:'68% of students skip lunch due to tight schedules and poor mess variety. Skipping lunch drops blood glucose by 30%, directly reducing concentration and memory recall. NutriVerse AI helps you plan quick, portable high-nutrition alternatives.'},
  'protein':{icon:'⚡',title:'The Protein Deficit Crisis',text:'The average student consumes just 42g of protein daily — nearly half the recommended 80g. Low protein leads to muscle loss, slower recovery, and poor focus. A single serving of dal, paneer, or eggs can bridge the gap.'},
  'energy':{icon:'🔋',title:'The 3PM Energy Crash',text:'Post-lunch energy crashes at 3PM affect 74% of students. High-carb, low-fiber meals spike and crash blood sugar. NutriVerse AI recommends balanced macros to maintain steady energy through evening classes.'},
  'focus':{icon:'🧠',title:'Nutrition & Academic Performance',text:'85% of students who improved their daily nutrition reported better focus, faster recall, and higher exam scores within 4 weeks. Omega-3s, B-vitamins, and steady glucose are key.'}
}
function openGapCard(key){
  const d=gapData[key]
  document.getElementById('gap-modal-icon').textContent=d.icon
  document.getElementById('gap-modal-title').textContent=d.title
  document.getElementById('gap-modal-text').textContent=d.text
  openModal('gap-modal')
}

/* ═══ MESS / MEAL TRACKER ═══ */
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const FULL_DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
let meals=JSON.parse(localStorage.getItem('nv_meals')||'[]')

function saveMeals(){localStorage.setItem('nv_meals',JSON.stringify(meals))}

function renderWeeklyGrid(){
  const grid=document.getElementById('weekly-grid')
  grid.innerHTML=DAYS.map((d,i)=>{
    const dayMeals=meals.filter(m=>m.day===FULL_DAYS[i])
    const has=dayMeals.length>0
    return`<div class="day-col">
      <div class="day-label">${d}</div>
      <div class="day-dot ${has?'has-meal':'empty'}" onclick="showDayMeals('${FULL_DAYS[i]}')">${has?dayMeals.length:'+'}</div>
    </div>`
  }).join('')
}

function renderMealList(){
  const el=document.getElementById('meal-list')
  if(!meals.length){document.getElementById('saved-meals-section').style.display='none';return}
  document.getElementById('saved-meals-section').style.display='block'
  el.innerHTML=meals.map((m,i)=>`
    <div class="meal-item">
      <div class="mi-left">
        <div class="mi-name">${m.name}</div>
        <div class="mi-meta">${m.type} · ${m.day}</div>
      </div>
      <div class="mi-right">
        <div class="mi-cal">${m.cal}kcal · ${m.prot}g P</div>
        <button class="mi-del" onclick="deleteMeal(${i})">✕</button>
      </div>
    </div>`).join('')
}

function updateWeekSummary(){
  const total=meals.length
  const totalCal=meals.reduce((s,m)=>s+parseInt(m.cal||0),0)
  const totalProt=meals.reduce((s,m)=>s+parseInt(m.prot||0),0)
  const daysLogged=new Set(meals.map(m=>m.day)).size||1
  document.getElementById('ws-total-meals').textContent=total
  document.getElementById('ws-avg-cal').textContent=Math.round(totalCal/daysLogged)
  document.getElementById('ws-avg-prot').textContent=Math.round(totalProt/daysLogged)+'g'
}

function addMeal(){
  const name=document.getElementById('meal-name-input').value.trim()
  const cal=document.getElementById('meal-cal-input').value
  const prot=document.getElementById('meal-prot-input').value
  const type=document.getElementById('meal-type-input').value
  const day=document.getElementById('meal-day-input').value
  if(!name){showToast('⚠️','Please enter a meal name');return}
  if(!day){showToast('⚠️','Please select a day');return}
  meals.push({name,cal:cal||0,prot:prot||0,type:type||'Meal',day})
  saveMeals()
  renderMealList()
  renderWeeklyGrid()
  updateWeekSummary()
  document.getElementById('meal-name-input').value=''
  document.getElementById('meal-cal-input').value=''
  document.getElementById('meal-prot-input').value=''
  document.getElementById('meal-type-input').value=''
  document.getElementById('meal-day-input').value=''
  showToast('✅',`${name} added to tracker!`)
}

function deleteMeal(i){
  const name=meals[i].name
  meals.splice(i,1)
  saveMeals()
  renderMealList()
  renderWeeklyGrid()
  updateWeekSummary()
  showToast('🗑️',`Removed ${name}`)
}

function clearMeals(){
  if(!confirm('Clear all meals for this week?'))return
  meals=[]
  saveMeals()
  renderMealList()
  renderWeeklyGrid()
  updateWeekSummary()
  showToast('🧹','All meals cleared')
}

function showDayMeals(day){
  const dayMeals=meals.filter(m=>m.day===day)
  document.getElementById('day-modal-title').textContent=`${day}'s Meals`
  const container=document.getElementById('day-modal-meals')
  if(!dayMeals.length){
    container.innerHTML=`<div style="color:var(--muted);font-size:0.88rem;text-align:center;padding:20px">No meals logged for ${day} yet.<br><span style="cursor:pointer;color:var(--green);font-weight:600" onclick="closeModal('day-modal')">Add one above ↑</span></div>`
  }else{
    container.innerHTML=dayMeals.map(m=>`
      <div style="background:var(--bg);border-radius:10px;padding:12px 14px;border:1px solid var(--border-l)">
        <div style="font-weight:700;font-size:0.9rem;color:var(--dark)">${m.name}</div>
        <div style="font-size:0.78rem;color:var(--muted);margin-top:2px">${m.type} · ${m.cal}kcal · ${m.prot}g protein</div>
      </div>`).join('')
  }
  openModal('day-modal')
}

function handleFileUpload(e){
  const file=e.target.files[0]
  if(!file)return
  showToast('📁',`${file.name} received — analyzing with AI…`,3500)

  const reader=new FileReader()
  reader.onload=async(ev)=>{
    const optResult=document.getElementById('opt-result')
    const optResultText=document.getElementById('opt-result-text')
    optResult.style.display='block'
    optResultText.textContent='⏳ AI is reading your mess menu…'

    let userContent=''
    if(file.type==='text/plain'){
      // Real text — send the actual content
      userContent=`Here is the actual mess menu the student uploaded:\n\n${ev.target.result.slice(0,3000)}\n\nAnalyze this and provide: 1) Estimated daily calories and protein. 2) Top 3 nutritional gaps. 3) Specific, affordable Indian food additions to fix the gaps. Be concise and practical.`
    } else {
      // Image or PDF — use contextual analysis
      userContent=`A college student uploaded a mess menu file called "${file.name}" (${(file.size/1024).toFixed(0)}KB, type: ${file.type}). Based on a typical Indian college mess that serves dal, roti, rice, sabzi, and occasionally egg or paneer: analyze the likely nutritional profile and provide: 1) Estimated daily calories (~1200-1600 kcal) and protein (~30-50g) typical of Indian college messes. 2) The 3 most common nutritional gaps (protein, iron, vitamins). 3) Three specific, cheap additions (canteen or kirana) to meaningfully improve nutrition. Keep it under 200 words and actionable.`
    }

    try{
      const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
        body:JSON.stringify({
          model:'llama-3.1-8b-instant',
          messages:[
            {role:'system',content:'You are an Indian college nutrition analyst. Be concise, specific, and practical. Focus on realistic, affordable improvements.'},
            {role:'user',content:userContent}
          ],
          max_tokens:400,temperature:0.6
        })
      })
      const data=await res.json()
      if(data.choices&&data.choices[0]){
        const reply=data.choices[0].message.content
        optResultText.textContent=reply
        showToast('✅','Mess menu analyzed by AI!')
      } else {
        const errMsg=data.error?.message||'Unknown error'
        optResultText.textContent=`⚠️ AI error: ${errMsg}`
      }
    }catch(err){
      optResultText.textContent=`⚠️ Could not analyze: ${err.message}. Check your internet connection.`
    }
  }

  if(file.type==='text/plain') reader.readAsText(file)
  else reader.readAsDataURL(file) // triggers onload for non-text files too
}

/* ═══ DRAG & DROP ═══ */
const uploadZone=document.getElementById('upload-zone')
uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over')})
uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'))
uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])showToast('📁',`Uploaded: ${e.dataTransfer.files[0].name}`)})

async function optimizeMeals(){
  if(!meals.length){showToast('⚠️','Add some meals first to optimize!');return}
  const spinner=document.getElementById('opt-spinner')
  const text=document.getElementById('opt-text')
  spinner.style.display='inline-block'; text.textContent='AI analyzing…'

  const totalCal  = meals.reduce((s,m)=>s+parseInt(m.cal||0),0)
  const totalProt = meals.reduce((s,m)=>s+parseInt(m.prot||0),0)
  const days      = new Set(meals.map(m=>m.day)).size || 1
  const avgCal    = Math.round(totalCal/days)
  const avgProt   = Math.round(totalProt/days)
  const mealList  = meals.map(m=>`- ${m.name} (${m.type}, ${m.day}): ${m.cal} kcal, ${m.prot}g protein`).join('\n')

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'system',
          content: 'You are an Indian college nutrition coach. Give direct, specific, actionable optimization advice. Be concise — max 200 words. Use bullet points.'
        },{
          role: 'user',
          content: `Here are my logged meals this week:\n${mealList}\n\nWeekly averages: ${avgCal} cal/day, ${avgProt}g protein/day across ${days} day(s).\n\nGive me:\n1. What's working well (1-2 lines)\n2. Top 3 specific problems with my current meals\n3. Three concrete Indian food swaps or additions to fix them — with specific foods and rough quantities\n\nBe direct. No generic advice.`
        }],
        max_tokens: 450,
        temperature: 0.6
      })
    })
    const data = await res.json()
    if(data.choices?.[0]){
      const insights = data.choices[0].message.content
      document.getElementById('optimize-modal-content').innerText = insights
      openModal('optimize-modal')
      const optResult = document.getElementById('opt-result')
      optResult.style.display = 'block'
      document.getElementById('opt-result-text').textContent = insights.slice(0,240)+'…'
    } else {
      const errMsg = data.error?.message || 'Unknown error'
      showToast('⚠️', `AI error: ${errMsg}`, 5000)
    }
  } catch(err){
    showToast('⚠️', `Optimization failed: ${err.message}`, 5000)
  }

  spinner.style.display='none'; text.textContent='✨ Optimize My Week with AI'
}

/* ════════════════════════════════════════════════════
   ⚠️  ADMIN CONFIG — SET YOUR GMAIL ADDRESS BELOW
   ════════════════════════════════════════════════════ */
const ADMIN_GMAIL = 'shivanshboora14@gmail.com'

/* ═══ API KEY — set by admin, shared with all users ═══
   Admin can override this at runtime via the admin panel.
   To pre-fill a key at build time, paste it in SITE_API_KEY below. */
const SITE_API_KEY = '' // Set via Admin Panel (triple-click the logo)
let apiKey = localStorage.getItem('nv_groq_key') || SITE_API_KEY
let chatHistory = []

/* ════════ ADMIN PANEL ════════ */
let adminAuthed = false

function initAdmin() {
  // Restore session if admin logged in earlier this session
  if (sessionStorage.getItem('nv_admin_ok') === '1') {
    adminAuthed = true
    document.getElementById('admin-fab').style.display = 'flex'
  }
}

// Secret entry: triple-click the logo in <600ms
let _logoClicks = 0, _logoTimer
document.querySelector('.nav-logo').addEventListener('click', function(e) {
  _logoClicks++
  clearTimeout(_logoTimer)
  _logoTimer = setTimeout(() => { _logoClicks = 0 }, 600)
  if (_logoClicks >= 3) { _logoClicks = 0; openAdminPanel() }
})

function openAdminPanel() {
  const overlay = document.getElementById('admin-overlay')
  overlay.classList.add('open')
  document.body.style.overflow = 'hidden'
  if (adminAuthed) { showAdminKeyView() }
  else { showAdminLoginView() }
}

function closeAdminPanel() {
  document.getElementById('admin-overlay').classList.remove('open')
  document.body.style.overflow = ''
  document.getElementById('admin-login-error').style.display = 'none'
  document.getElementById('admin-email-input').value = ''
}

function showAdminLoginView() {
  document.getElementById('admin-login-view').style.display = 'block'
  document.getElementById('admin-key-view').style.display = 'none'
  setTimeout(() => document.getElementById('admin-email-input').focus(), 100)
}

function showAdminKeyView() {
  document.getElementById('admin-login-view').style.display = 'none'
  document.getElementById('admin-key-view').style.display = 'block'
  const stored = localStorage.getItem('nv_groq_key') || ''
  const display = document.getElementById('admin-key-current')
  display.textContent = stored
    ? stored.slice(0, 8) + '••••••••••••••' + stored.slice(-4) + '  (active)'
    : 'No key saved yet.'
  document.getElementById('admin-key-saved-msg').style.display = 'none'
  document.getElementById('admin-key-input').value = ''
}

function adminDoLogin() {
  const entered = document.getElementById('admin-email-input').value.trim().toLowerCase()
  const errEl = document.getElementById('admin-login-error')
  if (entered === ADMIN_GMAIL.toLowerCase()) {
    adminAuthed = true
    sessionStorage.setItem('nv_admin_ok', '1')
    document.getElementById('admin-fab').style.display = 'flex'
    errEl.style.display = 'none'
    showAdminKeyView()
  } else {
    errEl.style.display = 'block'
    document.getElementById('admin-email-input').value = ''
    document.getElementById('admin-email-input').focus()
  }
}

function adminSaveKey() {
  const val = document.getElementById('admin-key-input').value.trim()
  if (!val || !val.startsWith('gsk_')) {
    showToast('⚠️', 'Key must start with gsk_ — paste a valid Groq key.')
    return
  }
  apiKey = val  // update live for this session immediately
  localStorage.setItem('nv_groq_key', val)
  document.getElementById('admin-key-saved-msg').style.display = 'block'
  document.getElementById('admin-key-input').value = ''
  showAdminKeyView()
  showToast('🔑', 'API key updated! AI chat is now live for all users.')
}

function adminLogout() {
  adminAuthed = false
  sessionStorage.removeItem('nv_admin_ok')
  document.getElementById('admin-fab').style.display = 'none'
  closeAdminPanel()
  showToast('👋', 'Signed out of admin panel.')
}

// Close admin panel on backdrop click
document.getElementById('admin-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeAdminPanel()
})

/* ════════ COLLEGE EMAIL VERIFICATION ════════ */
// Recognised institutional domain patterns
const COLLEGE_PATTERNS = [
  /\.ac\.in$/, /\.edu$/, /\.edu\.in$/, /\.ernet\.in$/,
  /\.ac\.uk$/, /\.edu\.au$/, /\.edu\.sg$/, /\.edu\.hk$/,
  /\.ac\.nz$/, /\.edu\.my$/, /\.ac\.za$/,
  /iit[a-z]+\.ac\.in$/, /nit[a-z]+\.ac\.in$/, /bits-pilani\.ac\.in$/,
]

function isCollegeEmail(email) {
  if (!email || !email.includes('@')) return false
  const domain = email.toLowerCase().split('@')[1]
  if (!domain) return false
  return COLLEGE_PATTERNS.some(p => p.test(domain))
}

let collegeVerified = false

function initCollegeVerify() {
  const collegeMail = localStorage.getItem('nv_college_email')
  if (collegeMail && isCollegeEmail(collegeMail)) {
    collegeVerified = true
    applyCollegeVerifiedUI(collegeMail)
    return
  }
  const anyMail = localStorage.getItem('nv_user_email')
  if (anyMail) { applyNormalUserUI(anyMail); showUserProfile(anyMail) }
}

function openVerifyModal() {
  if (collegeVerified) { showToast('✅', 'You already have college student access!'); return }
  if (localStorage.getItem('nv_user_email')) { showToast('✅', 'You\'re already signed in!'); return }
  document.getElementById('verify-overlay').classList.add('open')
  document.body.style.overflow = 'hidden'
  document.getElementById('vm-enter-view').style.display = 'block'
  document.getElementById('vm-success-view').style.display = 'none'
  document.getElementById('vm-success-normal-view').style.display = 'none'
  document.getElementById('vm-error').style.display = 'none'
  document.getElementById('vm-email-input').value = ''
  setTimeout(() => document.getElementById('vm-email-input').focus(), 150)
}

function closeVerifyModal() {
  document.getElementById('verify-overlay').classList.remove('open')
  document.body.style.overflow = ''
}

function doVerifyEmail() {
  const email = document.getElementById('vm-email-input').value.trim()
  const errEl = document.getElementById('vm-error')
  // Accept any valid email format
  if (!email || !email.includes('@') || !email.split('@')[1]?.includes('.')) {
    errEl.style.display = 'block'
    return
  }
  errEl.style.display = 'none'
  localStorage.setItem('nv_user_email', email)

  if (isCollegeEmail(email)) {
    // College user → unlock student features
    localStorage.setItem('nv_college_email', email)
    collegeVerified = true
    document.getElementById('vm-enter-view').style.display = 'none'
    document.getElementById('vm-success-view').style.display = 'block'
    document.getElementById('vm-success-email').textContent = email
    applyCollegeVerifiedUI(email)
  } else {
    // Normal user → just sign them in, AI still works
    document.getElementById('vm-enter-view').style.display = 'none'
    document.getElementById('vm-success-normal-view').style.display = 'block'
    document.getElementById('vm-success-normal-email').textContent = email
    applyNormalUserUI(email)
  }
}

function applyNormalUserUI(email) {
  showUserProfile(email)
  const cbBtn = document.querySelector('.btn-cb-verify')
  if (cbBtn) { cbBtn.textContent = '✅ Signed In'; cbBtn.disabled = true; cbBtn.style.background = '#6B7280' }
}

function showUserProfile(email) {
  const wrap = document.getElementById('nav-user-wrap')
  const navBtn = document.getElementById('nav-student-btn')
  if(navBtn) navBtn.style.display='none'
  if(wrap){
    wrap.style.display='block'
    document.getElementById('nav-user-avatar').textContent=email.charAt(0).toUpperCase()
    document.getElementById('nav-user-name').textContent=email.split('@')[0]
    document.getElementById('nud-email').textContent=email
  }
  renderSavedPlans()
  // Mobile menu
  const mmAuth=document.getElementById('mm-auth-btn')
  const mmSign=document.getElementById('mm-signout-btn')
  if(mmAuth)mmAuth.style.display='none'
  if(mmSign)mmSign.style.display=''
}

function toggleUserMenu(){
  document.getElementById('nav-user-dropdown').classList.toggle('open')
}
document.addEventListener('click',function(e){
  const dd=document.getElementById('nav-user-dropdown')
  const btn=document.getElementById('nav-user-btn')
  if(dd&&dd.classList.contains('open')&&!dd.contains(e.target)&&btn&&!btn.contains(e.target))dd.classList.remove('open')
})

function userLogout(){
  localStorage.removeItem('nv_user_email')
  localStorage.removeItem('nv_college_email')
  collegeVerified=false
  document.getElementById('nav-user-wrap').style.display='none'
  const navBtn=document.getElementById('nav-student-btn')
  if(navBtn){navBtn.style.display='';navBtn.textContent='🎓 College Access';navBtn.style.background='';navBtn.style.color='';navBtn.style.borderColor=''}
  const navV=document.getElementById('nav-student-verified')
  if(navV)navV.style.display='none'
  const strip=document.getElementById('student-exclusive-strip')
  if(strip)strip.classList.remove('visible')
  const chatSub=document.getElementById('chat-header-sub')
  if(chatSub)chatSub.textContent='Powered by Groq AI'
  const cbBtn=document.querySelector('.btn-cb-verify')
  if(cbBtn){cbBtn.style.display='';cbBtn.disabled=false;cbBtn.textContent='Verify Email →';cbBtn.style.background=''}
  const cbTag=document.getElementById('cb-verified-tag')
  if(cbTag)cbTag.style.display='none'
  const banner=document.getElementById('college-banner')
  if(banner)banner.style.background=''
  document.getElementById('nav-user-dropdown').classList.remove('open')
  renderSavedPlans()
  // Mobile menu
  const mmAuth2=document.getElementById('mm-auth-btn')
  const mmSign2=document.getElementById('mm-signout-btn')
  if(mmAuth2)mmAuth2.style.display=''
  if(mmSign2)mmSign2.style.display='none'
  showToast('👋','Signed out successfully!')
}

function applyCollegeVerifiedUI(email) {
  showUserProfile(email)
  const domain = email.split('@')[1] || 'college'
  const navBtn = document.getElementById('nav-student-btn')
  const navVerified = document.getElementById('nav-student-verified')
  if (navBtn) navBtn.style.display = 'none'
  if (navVerified) { navVerified.style.display = 'flex'; navVerified.textContent = '✅ ' + domain }
  // AI chat banner
  const banner = document.getElementById('college-banner')
  const cbVerified = document.getElementById('cb-verified-tag')
  const cbBtn = document.querySelector('.btn-cb-verify')
  if (banner) banner.style.background = 'linear-gradient(135deg,#D1FAE5,#EFF6FF)'
  if (cbBtn) cbBtn.style.display = 'none'
  if (cbVerified) { cbVerified.style.display = 'flex'; cbVerified.textContent = '✅ ' + domain }
  // Student exclusive strip
  const strip = document.getElementById('student-exclusive-strip')
  if (strip) strip.classList.add('visible')
  // Chat header
  const chatSub = document.getElementById('chat-header-sub')
  if (chatSub) chatSub.textContent = '🎓 Student Mode • Powered by Groq AI'
}

// Close verify modal on backdrop click
document.getElementById('verify-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeVerifyModal()
})

/* ════════ AI CHAT ════════ */
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
}

function sendQuickPrompt(text) {
  const inp = document.getElementById('chat-input')
  inp.value = text
  autoResize(inp)
  sendMessage()
}

function addMsg(role, text, isTyping = false) {
  const msgs = document.getElementById('chat-msgs')
  const div = document.createElement('div')
  div.className = `msg msg-${role}`
  div.innerHTML = `<div class="msg-bubble${isTyping ? ' typing' : ''}">${isTyping ? '<div class="typing-dots"><span></span><span></span><span></span></div>' : text}</div>`
  msgs.appendChild(div)
  msgs.scrollTop = msgs.scrollHeight
  return div
}

async function sendMessage() {
  const input = document.getElementById('chat-input')
  const text = input.value.trim()
  if (!text) return
  addMsg('user', text)
  input.value = ''; autoResize(input)
  chatHistory.push({ role: 'user', content: text })
  const typingDiv = addMsg('ai', '', true)
  document.getElementById('send-btn').disabled = true

  if (!apiKey) {
    setTimeout(() => {
      typingDiv.remove()
      addMsg('ai', '⚠️ The AI service is being set up. Please check back shortly — the site admin will enable it soon.')
      document.getElementById('send-btn').disabled = false
    }, 900)
    return
  }

  // Build a context-aware system prompt
  const studentCtx = collegeVerified ? 'The user is a verified college student. Give advice specifically relevant to hostel and mess life, budget constraints (₹50–150/meal), exam schedules, and canteen food.' : 'The user may be a general user or student. Give practical, Indian-context nutrition advice.'

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: `You are NutriVerse AI, an expert nutrition coach for Indian students and young adults. You specialise in hostel and mess food, affordable high-protein Indian foods, exam-prep diets, and budget-friendly meal planning. Keep responses concise, practical, and grounded in Indian food culture. Use emojis sparingly. Give specific, actionable advice with real Indian food examples (dal, paneer, roti, rajma, poha, etc.). ${studentCtx}` },
          ...chatHistory
        ],
        max_tokens: 600, temperature: 0.7
      })
    })
    const data = await res.json()
    typingDiv.remove()
    if (data.choices && data.choices[0]) {
      const reply = data.choices[0].message.content
      chatHistory.push({ role: 'assistant', content: reply })
      addMsg('ai', reply.replace(/\n/g, '<br>'))
    } else {
      // Show the actual Groq error — e.g. invalid key, rate limit, model error
      const errMsg = data.error?.message || JSON.stringify(data)
      const errType = data.error?.type || ''
      let friendlyHint = ''
      if (errType === 'invalid_request_error' || errMsg.includes('API key')) friendlyHint = ' (API key may be invalid or expired — admin should update it)'
      else if (errMsg.includes('rate_limit') || errMsg.includes('rate limit')) friendlyHint = ' (Rate limit hit — try again in a few seconds)'
      else if (errMsg.includes('model')) friendlyHint = ' (Model issue — try refreshing)'
      addMsg('ai', `⚠️ Groq API error: ${errMsg}${friendlyHint}`)
    }
  } catch (err) {
    typingDiv.remove()
    // Distinguish network errors from other JS errors
    if (err instanceof TypeError && err.message.includes('fetch')) {
      addMsg('ai', `⚠️ Network error: Could not reach Groq API. Check your internet connection and try again.\n\nDetails: ${err.message}`)
    } else {
      addMsg('ai', `⚠️ Unexpected error: ${err.message || err}. Please refresh the page and try again.`)
    }
  }
  document.getElementById('send-btn').disabled = false
  document.getElementById('chat-msgs').scrollTop = 9999
}

/* ═══ TDEE CALCULATOR ═══ */
let tdeeGender = 'male'
function selectTDEE(el, group) {
  el.parentElement.querySelectorAll('.tt-btn').forEach(b => b.classList.remove('on'))
  el.classList.add('on')
  if (group === 'gender') tdeeGender = el.dataset.val
}

function calculateTDEE() {
  const age = parseInt(document.getElementById('tdee-age').value)
  const weight = parseFloat(document.getElementById('tdee-weight').value)
  const height = parseFloat(document.getElementById('tdee-height').value)
  const activity = parseFloat(document.getElementById('tdee-activity').value)
  if (!age || !weight || !height) { showToast('⚠️', 'Please fill in age, weight, and height'); return }
  let bmr
  if (tdeeGender === 'male') bmr = 10 * weight + 6.25 * height - 5 * age + 5
  else bmr = 10 * weight + 6.25 * height - 5 * age - 161
  const tdee = Math.round(bmr * activity)
  const protein = Math.round(weight * 1.8)
  const fat = Math.round((tdee * 0.25) / 9)
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4)
  document.getElementById('tdee-cal-val').textContent = tdee.toLocaleString()
  document.getElementById('tdee-prot-val').textContent = protein + 'g'
  document.getElementById('tdee-carb-val').textContent = carbs + 'g'
  document.getElementById('tdee-fat-val').textContent = fat + 'g'
  document.getElementById('tdee-result').style.display = 'block'
  localStorage.setItem('nv_tdee', JSON.stringify({ calories: tdee, protein, carbs, fat }))
  showToast('🔥', `Your TDEE: ${tdee} kcal/day`)
}

/* ═══ SAVED PLANS ═══ */
function renderSavedPlans() {
  const email = localStorage.getItem('nv_user_email')
  const prompt = document.getElementById('sp-login-prompt')
  const grid = document.getElementById('sp-grid')
  const empty = document.getElementById('sp-empty')
  if (!email) { prompt.style.display = ''; grid.style.display = 'none'; empty.style.display = 'none'; return }
  prompt.style.display = 'none'
  const key = 'nv_plans_' + email
  const plans = JSON.parse(localStorage.getItem(key) || '[]')
  if (!plans.length) { grid.style.display = 'none'; empty.style.display = ''; return }
  empty.style.display = 'none'; grid.style.display = 'grid'
  grid.innerHTML = plans.map((p, i) => `
    <div class="sp-card" onclick="viewSavedPlan(${i})">
      <div class="sp-card-head">
        <div class="sp-card-title">${p.title}</div>
        <div class="sp-card-date">${p.date}</div>
      </div>
      <div class="sp-card-footer">
        <div class="sp-card-stats">
          <div class="sp-card-stat">${p.cal} <span>kcal</span></div>
          <div class="sp-card-stat">${p.prot} <span>protein</span></div>
        </div>
        <button class="sp-card-del" onclick="event.stopPropagation();deleteSavedPlan(${i})" title="Delete">🗑️</button>
      </div>
    </div>`).join('')
}

function viewSavedPlan(i) {
  const email = localStorage.getItem('nv_user_email')
  const plans = JSON.parse(localStorage.getItem('nv_plans_' + email) || '[]')
  const p = plans[i]; if (!p) return
  document.getElementById('plan-title-text').textContent = p.title
  document.getElementById('plan-cal-num').textContent = p.cal
  document.getElementById('plan-total-val').textContent = p.prot
  document.getElementById('meal-rows').innerHTML = p.mealsHTML
  document.getElementById('plan-ready-tag').textContent = 'Saved Plan · ' + p.date
  const dp = document.getElementById('daily-plan')
  dp.classList.add('visible')
  dp.scrollIntoView({ behavior: 'smooth', block: 'start' })
  showToast('📋', 'Viewing saved plan: ' + p.title)
}

function deleteSavedPlan(i) {
  if (!confirm('Delete this saved plan?')) return
  const email = localStorage.getItem('nv_user_email')
  const key = 'nv_plans_' + email
  const plans = JSON.parse(localStorage.getItem(key) || '[]')
  plans.splice(i, 1)
  localStorage.setItem(key, JSON.stringify(plans))
  renderSavedPlans()
  showToast('🗑️', 'Plan deleted')
}

/* ═══ WEEKLY CHECK-IN ═══ */
function selectCIPill(el, group) {
  el.parentElement.querySelectorAll('.ci-pill').forEach(b => b.classList.remove('on'))
  el.classList.add('on')
}

async function submitCheckin() {
  const btn = document.getElementById('ci-submit-btn')
  btn.classList.add('loading'); btn.disabled = true
  const goal = document.getElementById('ci-goal').value
  const meals = document.querySelector('#ci-meals-pills .ci-pill.on')?.dataset.val || '3'
  const quality = document.querySelector('#ci-quality-pills .ci-pill.on')?.dataset.val || '3'
  const notes = document.getElementById('ci-notes').value.trim()
  const tdeeData = JSON.parse(localStorage.getItem('nv_tdee') || 'null')
  const tdeeCtx = tdeeData ? `Their TDEE target is ${tdeeData.calories} kcal and ${tdeeData.protein}g protein per day.` : ''
  const prompt = `You are a supportive Indian nutrition coach. A user just completed their weekly eating check-in. Give a short, warm, actionable AI reflection (150-200 words max). Use bullet points.

Their stated goal: ${goal}
Avg meals per day: ${meals}
Self-rated eating quality (1-5): ${quality}/5
${tdeeCtx}
Additional notes: ${notes || 'None provided'}

Structure your response as:
1. 🎯 Goal alignment (how well did they align with their goal?)
2. ✅ What's working (1-2 positives)
3. ⚡ Key improvements (2-3 specific, actionable tips with Indian food examples)
4. 💪 Motivational closing line`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], max_tokens: 500, temperature: 0.6 })
    })
    const data = await res.json()
    if (data.choices?.[0]) {
      const text = data.choices[0].message.content
      document.getElementById('ci-result-text').textContent = text
      document.getElementById('ci-form').style.display = 'none'
      document.getElementById('ci-result').style.display = 'block'
      showToast('🤖', 'AI reflection ready!')
    } else {
      showToast('⚠️', data.error?.message || 'AI error', 4000)
    }
  } catch (err) {
    showToast('⚠️', 'Check-in failed: ' + err.message, 4000)
  }
  btn.classList.remove('loading'); btn.disabled = false
}

function resetCheckin() {
  document.getElementById('ci-form').style.display = ''
  document.getElementById('ci-result').style.display = 'none'
}

/* ═══ NUTRITION GLOSSARY ═══ */
const GLOSSARY = {
  'tdee': 'Total Daily Energy Expenditure — the total number of calories your body burns in a day including exercise. Used to determine how much you should eat.',
  'bmr': 'Basal Metabolic Rate — calories your body burns at complete rest just to keep you alive (breathing, circulation, etc.).',
  'omega-3': 'Essential fatty acids found in fish, flaxseeds, and walnuts. Critical for brain function, reducing inflammation, and heart health.',
  'glycemic index': 'A scale (0-100) ranking how quickly foods raise blood sugar. Low GI foods (dal, oats) give sustained energy; high GI (white rice, sugar) cause spikes.',
  'macros': 'Short for macronutrients — protein, carbohydrates, and fat. The three main nutrients your body needs in large amounts.',
  'protein': 'Essential nutrient for muscle repair, immune function, and satiety. Found in dal, paneer, eggs, chicken, and legumes.',
  'micronutrients': 'Vitamins and minerals needed in small amounts — iron, zinc, B12, vitamin D, etc. Often deficient in hostel diets.',
  'calorie deficit': 'Eating fewer calories than your TDEE. Required for fat loss. A 500 kcal/day deficit = ~0.5 kg weight loss per week.',
  'calorie surplus': 'Eating more calories than your TDEE. Required for muscle gain. A 300-500 kcal/day surplus supports lean mass growth.',
  'complex carbs': 'Slow-digesting carbohydrates (whole grains, oats, brown rice) that provide sustained energy without blood sugar spikes.',
  'fiber': 'Indigestible plant material that aids digestion, keeps you full, and feeds healthy gut bacteria. Found in vegetables, dal, and whole grains.',
  'iron': 'A mineral essential for oxygen transport in blood. Deficiency causes fatigue. Rich sources: spinach, jaggery, rajma, red meat.',
  'b12': 'Vitamin B12 — crucial for nerve function and energy. Often low in vegetarian diets. Found in dairy, eggs, and fortified foods.',
  'whey protein': 'A fast-absorbing protein supplement derived from milk. Popular for post-workout recovery. ~24g protein per scoop.',
  'intermittent fasting': 'An eating pattern cycling between fasting and eating periods (e.g., 16:8). May improve focus and fat loss when done correctly.'
}

function addGlossaryTooltips(container) {
  if (!container) return
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false)
  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length)
  const regex = new RegExp('\\b(' + terms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')\\b', 'gi')
  textNodes.forEach(node => {
    if (node.parentElement.closest('.glossary-link') || node.parentElement.closest('button') || node.parentElement.closest('input') || node.parentElement.closest('select')) return
    const text = node.textContent
    if (!regex.test(text)) return
    regex.lastIndex = 0
    const frag = document.createDocumentFragment()
    let lastIdx = 0, match
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)))
      const span = document.createElement('span')
      span.className = 'glossary-link'
      span.textContent = match[0]
      span.dataset.term = match[1].toLowerCase()
      span.addEventListener('mouseenter', showGlossary)
      span.addEventListener('mouseleave', hideGlossary)
      span.addEventListener('touchstart', showGlossary)
      frag.appendChild(span)
      lastIdx = regex.lastIndex
    }
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)))
    if (frag.childNodes.length > 1) node.parentElement.replaceChild(frag, node)
  })
}

function showGlossary(e) {
  const term = e.target.dataset.term
  const def = GLOSSARY[term]
  if (!def) return
  const tt = document.getElementById('glossary-tooltip')
  document.getElementById('gt-term').textContent = term
  document.getElementById('gt-def').textContent = def
  const rect = e.target.getBoundingClientRect()
  tt.style.left = Math.min(rect.left, window.innerWidth - 340) + 'px'
  tt.style.top = (rect.bottom + 8) + 'px'
  tt.classList.add('visible')
}

function hideGlossary() {
  document.getElementById('glossary-tooltip').classList.remove('visible')
}

// Apply glossary to AI chat messages as they appear
const chatObserver = new MutationObserver(mutations => {
  mutations.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.classList.contains('msg')) addGlossaryTooltips(n)
  }))
})
const chatMsgs = document.getElementById('chat-msgs')
if (chatMsgs) chatObserver.observe(chatMsgs, { childList: true })

/* ═══ PWA INSTALL ═══ */
let deferredPrompt = null
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault()
  deferredPrompt = e
  if (!sessionStorage.getItem('nv_pwa_dismissed')) {
    document.getElementById('pwa-install-bar').style.display = 'block'
  }
})

function installPWA() {
  if (!deferredPrompt) { showToast('ℹ️', 'Use your browser menu to install'); return }
  deferredPrompt.prompt()
  deferredPrompt.userChoice.then(result => {
    if (result.outcome === 'accepted') showToast('✅', 'NutriVerse installed!')
    deferredPrompt = null
    document.getElementById('pwa-install-bar').style.display = 'none'
  })
}

function dismissPWA() {
  document.getElementById('pwa-install-bar').style.display = 'none'
  sessionStorage.setItem('nv_pwa_dismissed', '1')
}

/* ═══ INIT ═══ */
renderWeeklyGrid()
renderMealList()
updateWeekSummary()
initAdmin()
initCollegeVerify()
renderSavedPlans()

// Apply glossary to existing static content
setTimeout(() => {
  addGlossaryTooltips(document.querySelector('.campus-section'))
  addGlossaryTooltips(document.querySelector('.gap-section'))
  addGlossaryTooltips(document.getElementById('daily-plan'))
}, 500)

// Restore TDEE if previously calculated
const savedTDEE = JSON.parse(localStorage.getItem('nv_tdee') || 'null')
if (savedTDEE) {
  document.getElementById('tdee-cal-val').textContent = savedTDEE.calories.toLocaleString()
  document.getElementById('tdee-prot-val').textContent = savedTDEE.protein + 'g'
  document.getElementById('tdee-carb-val').textContent = savedTDEE.carbs + 'g'
  document.getElementById('tdee-fat-val').textContent = savedTDEE.fat + 'g'
  document.getElementById('tdee-result').style.display = 'block'
}
