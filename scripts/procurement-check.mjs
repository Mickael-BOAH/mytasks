// Daily procurement-holiday check for Quinta da Barroca.
// Hotel operates April–October. Orders: Mon→Tue delivery, Thu→Fri delivery.
// When a holiday falls on Mon/Tue/Thu/Fri inside the season, creates an
// alert task 7 days ahead in Quinta da Barroca · Procurement.

import admin from 'firebase-admin';

const { FIREBASE_SA } = process.env;
if (!FIREBASE_SA) { console.log('Skipping: FIREBASE_SA missing'); process.exit(0); }

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(FIREBASE_SA)) });
const db = admin.firestore();

// ── Helpers ─────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2,'0');
const fmt = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };

// Gauss's algorithm — Easter Sunday for any Gregorian year
function easterSunday(y) {
  const a = y%19, b = Math.floor(y/100), c = y%100;
  const d = Math.floor(b/4), e = b%4;
  const f = Math.floor((b+8)/25), g = Math.floor((b-f+1)/3);
  const h = (19*a + b - d - g + 15) % 30;
  const i = Math.floor(c/4), k = c%4;
  const l = (32 + 2*e + 2*i - h - k) % 7;
  const m = Math.floor((a + 11*h + 22*l) / 451);
  const month = Math.floor((h + l - 7*m + 114) / 31);
  const day   = ((h + l - 7*m + 114) % 31) + 1;
  return new Date(y, month-1, day);
}

function ptHolidays(year) {
  const easter = easterSunday(year);
  return [
    { date: `${year}-01-01`,            name: 'Ano Novo' },
    { date: fmt(addDays(easter, -47)),  name: 'Carnaval' },
    { date: fmt(addDays(easter, -2)),   name: 'Sexta-feira Santa' },
    { date: fmt(easter),                name: 'Páscoa' },
    { date: `${year}-04-25`,            name: '25 de Abril' },
    { date: `${year}-05-01`,            name: 'Dia do Trabalhador' },
    { date: fmt(addDays(easter, 60)),   name: 'Corpo de Deus' },
    { date: `${year}-06-10`,            name: 'Dia de Portugal' },
    { date: `${year}-06-24`,            name: 'São João (Porto)' },
    { date: `${year}-08-15`,            name: 'Assunção' },
    { date: `${year}-10-05`,            name: 'Implantação da República' },
    { date: `${year}-11-01`,            name: 'Todos os Santos' },
    { date: `${year}-12-01`,            name: 'Restauração da Independência' },
    { date: `${year}-12-08`,            name: 'Imaculada Conceição' },
    { date: `${year}-12-25`,            name: 'Natal' }
  ];
}

// ── Run ─────────────────────────────────────────────────────────────────────
const today = new Date(); today.setHours(0,0,0,0);
const thisMonth = today.getMonth() + 1;
if (thisMonth < 4 || thisMonth > 10) {
  console.log('Outside operating season (Apr–Oct). Today month =', thisMonth);
  process.exit(0);
}

// Check holidays in the next 7 days only (1-week notice)
const lookaheadDays = 7;
const lookaheadDate = addDays(today, lookaheadDays);
const yearsToConsider = new Set([today.getFullYear(), lookaheadDate.getFullYear()]);
const allHolidays = [...yearsToConsider].flatMap(y => ptHolidays(y));

const DOW_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const ORDER_DAYS    = new Set([1, 4]); // Mon, Thu
const DELIVERY_DAYS = new Set([2, 5]); // Tue, Fri

const affecting = [];
for (const h of allHolidays) {
  const hDate = new Date(h.date + 'T00:00:00');
  const diff = Math.round((hDate - today) / 86400000);
  if (diff !== lookaheadDays) continue; // exactly 7 days ahead
  const hMonth = hDate.getMonth() + 1;
  if (hMonth < 4 || hMonth > 10) continue; // holiday outside operating season
  const dow = hDate.getDay();
  if (!ORDER_DAYS.has(dow) && !DELIVERY_DAYS.has(dow)) continue;
  affecting.push({ ...h, dow, hDate });
}

if (!affecting.length) {
  console.log('No procurement-affecting holiday 7 days from today.');
  process.exit(0);
}

// Find Quinta da Barroca list
const listsSnap = await db.collection('lists').get();
const lists = listsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const quinta = lists.find(l => /quinta da barroca/i.test(l.name || ''));
if (!quinta) {
  console.warn('Quinta da Barroca list not found. Lists:', lists.map(l=>l.name));
  process.exit(0);
}
const hasProcurement = (quinta.departments || []).some(d => /procurement/i.test(d));

// Fetch existing tasks in that list with autoKey to dedupe
const existingSnap = await db.collection('tasks').where('listId','==', quinta.id).get();
const existingAutoKeys = new Set(existingSnap.docs.map(d => d.data().autoKey).filter(Boolean));

let created = 0, skipped = 0;
for (const h of affecting) {
  const autoKey = 'procurement-holiday:' + h.date;
  if (existingAutoKeys.has(autoKey)) { console.log('Already exists for', h.date); skipped++; continue; }

  const dowName = DOW_NAMES[h.dow];
  const ddmm = h.date.slice(8,10) + '/' + h.date.slice(5,7);
  const isOrderDay    = ORDER_DAYS.has(h.dow);
  const isDeliveryDay = DELIVERY_DAYS.has(h.dow);

  const subtasks = [];
  if (h.dow === 1) {
    subtasks.push({ text: 'Antecipar encomenda da segunda — verificar com fornecedor', done:false, due:null, notes:'', repeat:null, monthDay:null });
    subtasks.push({ text: 'Confirmar com fornecedor se há entrega terça mesmo assim', done:false, due:null, notes:'', repeat:null, monthDay:null });
  } else if (h.dow === 2) {
    subtasks.push({ text: 'Encomenda segunda → entrega quarta (em vez de terça)', done:false, due:null, notes:'', repeat:null, monthDay:null });
    subtasks.push({ text: 'Confirmar fornecedor + ajustar quantidades', done:false, due:null, notes:'', repeat:null, monthDay:null });
  } else if (h.dow === 4) {
    subtasks.push({ text: 'Antecipar encomenda para quarta — entrega quinta?', done:false, due:null, notes:'', repeat:null, monthDay:null });
    subtasks.push({ text: 'Confirmar com fornecedor disponibilidade', done:false, due:null, notes:'', repeat:null, monthDay:null });
  } else if (h.dow === 5) {
    subtasks.push({ text: 'Encomenda quinta → ver alternativa para sex (entrega sábado? segunda?)', done:false, due:null, notes:'', repeat:null, monthDay:null });
    subtasks.push({ text: 'Confirmar fornecedor para FdS / antecipar', done:false, due:null, notes:'', repeat:null, monthDay:null });
  }
  subtasks.push({ text: 'Avisar chef e equipa F&B das alterações', done:false, due:null, notes:'', repeat:null, monthDay:null });
  subtasks.push({ text: 'Garantir stock suficiente para cobrir o feriado', done:false, due:null, notes:'', repeat:null, monthDay:null });

  // Task due 2 days before the holiday (so user has 5 days to act after the alert lands)
  const taskDue = fmt(addDays(h.hDate, -2));
  const impact = isOrderDay ? 'encomenda do dia cancelada' : 'entrega do dia cancelada';
  const taskDoc = {
    title: `⚠ Feriado ${ddmm} (${dowName}) — ${impact}`,
    listId: quinta.id,
    department: hasProcurement ? 'Procurement' : null,
    priority: 'alta',
    status: 'todo',
    dueDate: taskDue,
    startDate: fmt(today),
    notes: `Auto-criada · ${h.name}\nDia da semana: ${dowName}\nImpacto: ${impact}\nEsquema: encomenda Seg→entrega Ter · encomenda Qui→entrega Sex`,
    subtasks,
    completed: false,
    autoKey,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('tasks').add(taskDoc);
  console.log('Created:', taskDoc.title, '· due', taskDue);
  created++;
}
console.log(`Done. Created: ${created}, skipped (already existed): ${skipped}, total affecting: ${affecting.length}`);
