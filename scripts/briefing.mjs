// Weekly briefing — runs via GitHub Actions every Monday.
// Reads tasks from Firestore (Admin SDK, bypasses rules) and sends email via Resend.

import admin from 'firebase-admin';

// ── Env / init ──────────────────────────────────────────────────────────────
const { FIREBASE_SA, RESEND_KEY, BRIEFING_TO } = process.env;
if (!FIREBASE_SA) throw new Error('FIREBASE_SA secret missing');
if (!RESEND_KEY)  throw new Error('RESEND_KEY secret missing');
if (!BRIEFING_TO) throw new Error('BRIEFING_TO secret missing');

const sa = JSON.parse(FIREBASE_SA);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// ── Helpers (mirror the app) ────────────────────────────────────────────────
const DOW   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const pad = n => String(n).padStart(2,'0');
const fmtISO = d => d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
const fmtDate = (s) => { if (!s) return ''; const [y,m,d] = s.split('-'); return `${d} ${MONTH[+m-1].toLowerCase()}`; };
const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ── Load data ───────────────────────────────────────────────────────────────
const [tasksSnap, listsSnap] = await Promise.all([
  db.collection('tasks').get(),
  db.collection('lists').get()
]);
const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const lists = listsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const listOf = t => lists.find(l => l.id === t.listId)?.name || '';

// ── Build briefing ──────────────────────────────────────────────────────────
const now = new Date();
const today = fmtISO(now);
const day = now.getDay() || 7;
const monday = new Date(now); monday.setDate(now.getDate() - (day - 1));
const weekDates = []; for (let i = 0; i < 7; i++) { const d = new Date(monday); d.setDate(monday.getDate()+i); weekDates.push(fmtISO(d)); }
const weekStart = weekDates[0], weekEnd = weekDates[6];
const lastMonStart = new Date(monday); lastMonStart.setDate(monday.getDate()-7);
const lastMonStartTs = lastMonStart.getTime();
const mondayTs = monday.getTime();

const active = tasks.filter(t => !t.completed);
const overdue = active.filter(t => t.dueDate && t.dueDate < today).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
const highPri = active.filter(t => t.priority === 'alta' && !(t.dueDate && t.dueDate < today));

const byDay = {};
weekDates.forEach(d => byDay[d] = []);
active.forEach(t => {
  if (t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd) byDay[t.dueDate].push(t);
  (t.subtasks || []).forEach(s => {
    if (s.due && !s.done && s.due >= weekStart && s.due <= weekEnd) byDay[s.due].push({ ...t, _sub: s });
  });
});

const doneLastWeek = tasks.filter(t => t.completed && t.completedAt && t.completedAt >= lastMonStartTs && t.completedAt < mondayTs);
const totalWeek = Object.values(byDay).reduce((a,b) => a + b.length, 0);

// ── Email HTML ──────────────────────────────────────────────────────────────
const G = '#233b34', T = '#aca497';
const row = (t) => {
  const tag = listOf(t);
  const dueLbl = t._sub ? `↳ ${esc(t._sub.text)} · ${fmtDate(t._sub.due)}` : (t.dueDate ? fmtDate(t.dueDate) : '');
  return `<tr><td style="padding:7px 0;border-bottom:1px solid #e5e2d8;font-size:14px">${esc(t.title)}${t._sub ? ` — <span style="color:${T}">${esc(t._sub.text)}</span>` : ''}${tag ? ` <span style="font-size:10px;color:${G};background:#eee9dd;padding:2px 7px;letter-spacing:.06em">${esc(tag)}</span>` : ''}</td><td style="padding:7px 0;text-align:right;font-style:italic;color:${T};border-bottom:1px solid #e5e2d8;white-space:nowrap;font-size:13px">${dueLbl}</td></tr>`;
};
const sec = (title, rows) =>
  `<h3 style="color:${G};font-size:13px;letter-spacing:.18em;text-transform:uppercase;margin:26px 0 6px;border-bottom:2px solid ${G};padding-bottom:5px;font-weight:600">${title}<span style="float:right;font-weight:400">${rows.length}</span></h3>` +
  (rows.length ? `<table style="width:100%;border-collapse:collapse">${rows.join('')}</table>` : `<p style="color:${T};font-style:italic;font-size:13px">— no tasks —</p>`);

const weekBlocks = weekDates.map(dt => {
  const list = byDay[dt] || []; if (!list.length) return '';
  return `<p style="margin:16px 0 4px;font-weight:600;color:${G};font-size:12px;letter-spacing:.14em;text-transform:uppercase">${DOW[new Date(dt+'T00:00:00').getDay()]} — ${fmtDate(dt)}</p><table style="width:100%;border-collapse:collapse">${list.map(row).join('')}</table>`;
}).join('') || `<p style="color:${T};font-style:italic;font-size:13px">— no deadlines this week —</p>`;

const html = `<!DOCTYPE html><html><body style="font-family:Georgia,'Cormorant Garamond',serif;color:#262626;line-height:1.55;max-width:680px;margin:0 auto;padding:28px;background:#e2dfd6">
  <div style="background:#f5f3ec;padding:28px 32px;border:1px solid rgba(172,164,151,.3)">
    <h1 style="color:${G};font-size:30px;font-weight:500;letter-spacing:.06em;margin:0 0 6px">Weekly briefing</h1>
    <p style="color:${T};font-style:italic;margin:0 0 24px;font-size:14px">${fmtDate(today)} · ${overdue.length} overdue · ${totalWeek} this week</p>
    ${sec('Overdue', overdue.map(row))}
    <h3 style="color:${G};font-size:13px;letter-spacing:.18em;text-transform:uppercase;margin:26px 0 6px;border-bottom:2px solid ${G};padding-bottom:5px;font-weight:600">This week<span style="float:right;font-weight:400">${totalWeek}</span></h3>
    ${weekBlocks}
    ${sec('High priority', highPri.map(row))}
    <h3 style="color:${G};font-size:13px;letter-spacing:.18em;text-transform:uppercase;margin:26px 0 6px;border-bottom:2px solid ${G};padding-bottom:5px;font-weight:600">Last week<span style="float:right;font-weight:400">${doneLastWeek.length}</span></h3>
    <p style="font-size:14px">${doneLastWeek.length} ${doneLastWeek.length === 1 ? 'task completed' : 'tasks completed'} last week. Good work. ✦</p>
    <hr style="border:none;border-top:1px solid #e5e2d8;margin:32px 0 12px">
    <p style="font-size:11px;color:#999;text-align:center">BOA Hotels · Task Manager — auto-generated</p>
  </div>
</body></html>`;

const subject = `Weekly briefing — ${fmtDate(today)}`;

// ── Send via Resend ─────────────────────────────────────────────────────────
const resp = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + RESEND_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'BOA Tasks <onboarding@resend.dev>',
    to: [BRIEFING_TO],
    subject,
    html
  })
});

const out = await resp.text();
if (!resp.ok) {
  console.error('Resend error', resp.status, out);
  process.exit(1);
}
console.log('Briefing sent:', out);
