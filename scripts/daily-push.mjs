// Daily push — runs via GitHub Actions every morning.
// Reads tasks + push subscriptions from Firestore, sends a focus push per subscriber.

import admin from 'firebase-admin';
import webpush from 'web-push';

const { FIREBASE_SA, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_EMAIL } = process.env;
const missing = [
  !FIREBASE_SA   && 'FIREBASE_SA',
  !VAPID_PUBLIC  && 'VAPID_PUBLIC',
  !VAPID_PRIVATE && 'VAPID_PRIVATE',
  !VAPID_EMAIL   && 'VAPID_EMAIL'
].filter(Boolean);
if (missing.length) {
  console.log('Skipping push — missing secrets:', missing.join(', '));
  console.log('Configure them at: https://github.com/Mickael-BOAH/mytasks/settings/secrets/actions');
  process.exit(0); // exit OK so GitHub does not send a failure email
}

const sa = JSON.parse(FIREBASE_SA);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

webpush.setVapidDetails('mailto:' + VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// Compute today's focus
const pad = n => String(n).padStart(2,'0');
const today = (() => { const d = new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); })();

const tasksSnap = await db.collection('tasks').get();
const tasks = tasksSnap.docs.map(d => d.data()).filter(t => !t.completed);

const overdue  = tasks.filter(t => t.dueDate && t.dueDate < today);
const dueToday = tasks.filter(t => t.dueDate === today);
const highPri  = tasks.filter(t => t.priority === 'alta' && t.dueDate !== today);

let body;
if (overdue.length && dueToday.length) body = `${dueToday.length} due today · ${overdue.length} overdue`;
else if (overdue.length)               body = `${overdue.length} overdue task${overdue.length===1?'':'s'} — clear the backlog`;
else if (dueToday.length)              body = `${dueToday.length} task${dueToday.length===1?'':'s'} for today`;
else if (highPri.length)               body = `${highPri.length} high-priority task${highPri.length===1?'':'s'} pending`;
else                                   body = 'Inbox zero. Nothing burning. ✦';

const payload = JSON.stringify({
  title: 'Good morning · today\'s focus',
  body,
  url: 'https://mickael-boah.github.io/mytasks/',
  tag: 'daily-focus-' + today,
  requireInteraction: overdue.length > 0
});

// Send to all subscribers
const subsSnap = await db.collection('pushSubs').get();
let ok = 0, gone = 0, fail = 0;
for (const sub of subsSnap.docs) {
  const s = sub.data();
  if (!s.endpoint || !s.keys) continue;
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload);
    ok++;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) {
      // Subscription expired/unregistered — clean up
      await sub.ref.delete();
      gone++;
    } else {
      console.warn('push failed', e.statusCode, e.body);
      fail++;
    }
  }
}
console.log(`Daily push — ok: ${ok}, expired: ${gone}, failed: ${fail}, total subs: ${subsSnap.size}`);
