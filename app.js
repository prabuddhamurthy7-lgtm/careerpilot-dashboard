'use strict';
/* ============ Utilities ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso(new Date());
const daysUntil = s => Math.round((new Date(s + 'T00:00') - new Date(today() + 'T00:00')) / 864e5);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const icons = () => { try { window.lucide && lucide.createIcons(); } catch (e) {} };
const ic = (n, cls = '') => `<i data-lucide="${n}" class="${cls}"></i>`;
function dueLabel(s) {
  if (!s) return { t: 'No date', c: '' };
  const d = daysUntil(s);
  if (d < 0) return { t: `${-d}d overdue`, c: 'red' };
  if (d === 0) return { t: 'Today', c: 'amber' };
  if (d === 1) return { t: 'Tomorrow', c: 'amber' };
  if (d <= 7) return { t: `In ${d} days`, c: 'blue' };
  return { t: new Date(s + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), c: '' };
}
function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now'; if (m < 60) return m + 'm';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd';
}

/* ============ Domain data ============ */
const STAGES = [
  { id: 'saved', label: 'Saved', color: '#8a94b8' },
  { id: 'applied', label: 'Applied', color: '#4f8cff' },
  { id: 'interview', label: 'Interview', color: '#8b5cf6' },
  { id: 'offer', label: 'Offer', color: '#34d399' },
  { id: 'rejected', label: 'Closed', color: '#f87171' }
];
const ROLES = {
  frontend: { label: 'Frontend Developer', req: [['HTML & CSS',4],['JavaScript',4],['React',4],['TypeScript',3],['Git',3],['Accessibility',3],['Testing',2],['Figma',2]] },
  data: { label: 'Data Analyst', req: [['Python',4],['SQL',4],['Statistics',3],['Pandas',3],['Data visualization',3],['Excel',3],['Machine learning',2]] },
  design: { label: 'Product Designer', req: [['Figma',4],['User research',3],['Prototyping',4],['Visual design',4],['Design systems',3],['HTML & CSS',2]] },
  backend: { label: 'Backend Developer', req: [['Node.js',4],['SQL',4],['REST APIs',4],['Git',3],['Testing',3],['Docker',2],['System design',2]] }
};
const ROADMAPS = {
  frontend: [
    { phase: 'Foundations', items: [
      ['f1','Build 3 pages with semantic HTML and responsive CSS','Use Grid, Flexbox and media queries without a framework.',8],
      ['f2','Learn modern JavaScript (ES6+)','Modules, async/await, array methods, DOM events.',12],
      ['f3','Get comfortable with Git and GitHub','Branches, pull requests and a clean commit history.',4] ]},
    { phase: 'Frameworks and tooling', items: [
      ['f4','Build a React app with routing and state','Hooks, context, and a data-fetching pattern.',15],
      ['f5','Add TypeScript to a project','Typed props, API responses and utility types.',8],
      ['f6','Write component tests','Testing Library for behaviour, not implementation.',6] ]},
    { phase: 'Portfolio and job search', items: [
      ['f7','Ship a polished portfolio project','Real data, empty states, loading states and accessibility.',20],
      ['f8','Run an accessibility audit','Keyboard navigation, contrast and screen reader checks.',4],
      ['f9','Do 3 mock interviews','Cover JavaScript fundamentals and a live coding task.',5] ]}
  ],
  data: [
    { phase: 'Foundations', items: [
      ['d1','Learn SQL joins, windows and CTEs','Answer questions on a practice database.',10],
      ['d2','Python basics and Pandas','Clean and reshape a messy CSV.',12],
      ['d3','Statistics refresher','Distributions, hypothesis tests and confidence intervals.',8] ]},
    { phase: 'Applied work', items: [
      ['d4','Build a dashboard from public data','Tell one clear story with 3 charts.',10],
      ['d5','Run an A/B test analysis','Write up the method, result and caveats.',6],
      ['d6','Train a simple model','Baseline first, then compare two approaches.',10] ]},
    { phase: 'Job search', items: [
      ['d7','Publish a case study','Problem, data, method, result.',8],
      ['d8','Practice SQL interview questions','Time yourself on 20 problems.',6] ]}
  ],
  design: [
    { phase: 'Foundations', items: [
      ['p1','Learn layout, type and colour fundamentals','Redesign one screen of an app you use.',8],
      ['p2','Master Figma components and auto layout','Build a small component library.',10],
      ['p3','Run 5 user interviews','Summarise findings in one page.',6] ]},
    { phase: 'Product thinking', items: [
      ['p4','Create a clickable prototype','Test it with 3 people and iterate.',12],
      ['p5','Design a mini design system','Tokens, components and usage notes.',14] ]},
    { phase: 'Portfolio', items: [
      ['p6','Publish 2 case studies','Show process, trade-offs and outcomes.',20],
      ['p7','Practice a design critique','Present your work in 15 minutes.',4] ]}
  ],
  backend: [
    { phase: 'Foundations', items: [
      ['b1','Build a REST API with Node.js','CRUD endpoints, validation and error handling.',12],
      ['b2','Design a relational schema','Normalise tables and write indexed queries.',8],
      ['b3','Learn Git workflows','Feature branches and code review.',4] ]},
    { phase: 'Production skills', items: [
      ['b4','Add authentication and tests','JWT or sessions, plus integration tests.',12],
      ['b5','Containerise with Docker','Run app and database with Compose.',6],
      ['b6','Study system design basics','Caching, queues and scaling reads.',10] ]},
    { phase: 'Job search', items: [
      ['b7','Deploy a project publicly','Add logging and a health check.',8],
      ['b8','Practice data-structure problems','Arrays, hashing, trees, graphs.',15] ]}
  ]
};

function seed() {
  const hours = {}; [1.5, 2, 0, 2.5, 3, 1, 2].forEach((h, i) => { if (h) hours[addDays(-(6 - i))] = h; });
  return {
    v: 1,
    profile: { name: 'Alex Rivera', university: 'State University', grad: '2027', role: 'frontend', goal: 2.5 },
    apps: [
      { id: uid(), company: 'Northwind Labs', role: 'Frontend Intern', status: 'saved', date: addDays(2), location: 'Remote', notes: 'Tailor resume for design-system work.' },
      { id: uid(), company: 'Lumen Health', role: 'UI Engineering Intern', status: 'saved', date: addDays(9), location: 'Hybrid', notes: '' },
      { id: uid(), company: 'Orbit Pay', role: 'Web Developer Intern', status: 'applied', date: addDays(-4), location: 'On-site', notes: 'Referred by a senior from the coding club.' },
      { id: uid(), company: 'Kite Analytics', role: 'Frontend Engineer Intern', status: 'applied', date: addDays(-2), location: 'Remote', notes: '' },
      { id: uid(), company: 'Fieldnote', role: 'React Developer Intern', status: 'interview', date: addDays(3), location: 'Remote', notes: 'Technical round on component design. Review hooks and accessibility.' },
      { id: uid(), company: 'Parcel Co.', role: 'Junior Web Developer', status: 'rejected', date: addDays(-12), location: 'On-site', notes: 'Asked for more backend experience.' }
    ],
    skills: [
      { id: uid(), name: 'HTML & CSS', cat: 'Core', level: 4 },
      { id: uid(), name: 'JavaScript', cat: 'Core', level: 3 },
      { id: uid(), name: 'React', cat: 'Framework', level: 3 },
      { id: uid(), name: 'Git', cat: 'Tooling', level: 3 },
      { id: uid(), name: 'Figma', cat: 'Design', level: 2 },
      { id: uid(), name: 'TypeScript', cat: 'Core', level: 1 }
    ],
    tasks: [
      { id: uid(), title: 'Prepare for Fieldnote technical round', due: addDays(2), pri: 'high', done: false },
      { id: uid(), title: 'Tailor resume for Northwind Labs', due: addDays(1), pri: 'high', done: false },
      { id: uid(), title: 'Finish TypeScript handbook chapter 3', due: addDays(4), pri: 'med', done: false },
      { id: uid(), title: 'Update LinkedIn headline', due: addDays(-1), pri: 'low', done: false },
      { id: uid(), title: 'Push portfolio project to GitHub', due: addDays(-2), pri: 'med', done: true }
    ],
    hours,
    roadmap: { frontend: { f1: true, f2: true, f3: true, f4: true } },
    resume: '',
    activity: [
      { t: Date.now() - 36e5 * 3, text: 'Moved Fieldnote to Interview', icon: 'calendar-check' },
      { t: Date.now() - 36e5 * 26, text: 'Completed “Push portfolio project to GitHub”', icon: 'check-circle-2' },
      { t: Date.now() - 36e5 * 50, text: 'Applied to Kite Analytics', icon: 'send' }
    ],
    ui: { collapsed: false }
  };
}

/* ============ State ============ */
const KEY = 'careerpilot.v1';
let mem = null;
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return s; } } catch (e) {}
  return seed();
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { mem = S; } }
function log(text, icon = 'activity') { S.activity.unshift({ t: Date.now(), text, icon }); S.activity = S.activity.slice(0, 30); }
function commit(fn, opts = {}) { fn(S); save(); if (!opts.quiet) render(); else renderChrome(); }

/* ============ Derived metrics ============ */
const normName = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function findSkill(name) {
  const n = normName(name);
  return S.skills.find(s => { const m = normName(s.name); return m === n || (m.length > 2 && n.length > 2 && (m.includes(n) || n.includes(m))); });
}
function gaps() {
  return ROLES[S.profile.role].req.map(([name, target]) => {
    const sk = findSkill(name); const level = sk ? sk.level : 0;
    return { name, target, level, skill: sk, ratio: Math.min(level / target, 1), gap: Math.max(target - level, 0) };
  });
}
function roadmapProgress(role = S.profile.role) {
  const all = ROADMAPS[role].flatMap(p => p.items); const done = all.filter(i => (S.roadmap[role] || {})[i[0]]).length;
  return { done, total: all.length, ratio: all.length ? done / all.length : 0 };
}
function weekHours() { return Array.from({ length: 7 }, (_, i) => { const d = addDays(-(6 - i)); return { date: d, v: S.hours[d] || 0, label: new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' }), today: i === 6 }; }); }
function streak() { let n = 0, i = (S.hours[today()] || 0) > 0 ? 0 : 1; while ((S.hours[addDays(-i)] || 0) > 0) { n++; i++; } return n; }
function readiness() {
  const g = gaps(); const skills = g.reduce((a, b) => a + b.ratio, 0) / (g.length || 1);
  const road = roadmapProgress().ratio;
  const active = S.apps.filter(a => ['applied', 'interview', 'offer'].includes(a.status)).length;
  const hasIv = S.apps.some(a => ['interview', 'offer'].includes(a.status));
  const apps = Math.min(1, active / 8) * .7 + (hasIv ? .3 : 0);
  const wk = weekHours().reduce((a, b) => a + b.v, 0);
  const tasksDone = S.tasks.length ? S.tasks.filter(t => t.done).length / S.tasks.length : 0;
  const consistency = Math.min(1, wk / (S.profile.goal * 7)) * .6 + tasksDone * .4;
  const total = Math.round((skills * .4 + road * .25 + apps * .2 + consistency * .15) * 100);
  return { total, parts: [['Skills match', skills], ['Roadmap', road], ['Applications', apps], ['Consistency', consistency]] };
}
function nextMove() {
  const open = S.tasks.filter(t => !t.done && t.due && daysUntil(t.due) <= 0 && t.pri === 'high');
  if (open.length) return { icon: 'flag', title: open[0].title, why: 'High-priority and due now.', cta: 'Open planner', href: '#/planner' };
  const iv = S.apps.filter(a => a.status === 'interview' && a.date && daysUntil(a.date) >= 0 && daysUntil(a.date) <= 7).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (iv) return { icon: 'calendar-check', title: `Prepare for your ${iv.company} interview`, why: `${dueLabel(iv.date).t}. Review your project stories and role fundamentals.`, cta: 'View application', href: '#/applications' };
  const dl = S.apps.filter(a => a.status === 'saved' && a.date && daysUntil(a.date) >= 0 && daysUntil(a.date) <= 3).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (dl) return { icon: 'send', title: `Submit your ${dl.company} application`, why: `Deadline ${dueLabel(dl.date).t.toLowerCase()}.`, cta: 'View application', href: '#/applications' };
  const g = gaps().filter(x => x.gap > 0).sort((a, b) => b.gap - a.gap)[0];
  if (g) return { icon: 'trending-up', title: `Raise ${g.name} from level ${g.level} to ${g.target}`, why: `Your biggest gap for ${ROLES[S.profile.role].label}.`, cta: 'Open skills', href: '#/skills' };
  return { icon: 'timer', title: 'Log today’s study session', why: 'Small, steady sessions keep your streak alive.', cta: 'Log time', act: 'logHours' };
}

/* ============ Charts (SVG) ============ */
function ringSvg(pct, size = 150, sw = 12, id = 'rg') {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset=".5" stop-color="#4f8cff"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(150,165,255,.16)" stroke-width="${sw}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c * pct / 100} ${c}"/></svg>`;
}
function barChart(data, goal) {
  const W = 520, H = 230, pl = 28, pb = 28, pt = 14; const max = Math.max(goal * 1.35, ...data.map(d => d.v), 1); const ch = H - pb - pt; const bw = (W - pl) / data.length;
  const y = v => pt + ch - (v / max) * ch;
  const ticks = [0, .5, 1].map(f => { const v = max * f; return `<line x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(150,165,255,.12)"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${v % 1 ? v.toFixed(1) : v}h</text>`; }).join('');
  const bars = data.map((d, i) => { const x = pl + i * bw + bw * .22, w = bw * .56, h = Math.max((d.v / max) * ch, d.v ? 4 : 0);
    return `<g><rect x="${x}" y="${pt + ch - h}" width="${w}" height="${h}" rx="7" fill="${d.today ? 'url(#bg1)' : 'rgba(110,130,255,.38)'}"><title>${d.label}: ${d.v}h</title></rect><text x="${x + w / 2}" y="${H - 8}" text-anchor="middle" ${d.today ? 'style="fill:#e9edff;font-weight:600"' : ''}>${d.label}</text></g>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Study hours over the last 7 days"><defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#4f8cff"/></linearGradient></defs>${ticks}${bars}
  <line x1="${pl}" x2="${W}" y1="${y(goal)}" y2="${y(goal)}" stroke="#fbbf24" stroke-dasharray="5 5" opacity=".7"/><text x="${W}" y="${y(goal) - 6}" text-anchor="end" style="fill:#fbbf24">Daily goal ${goal}h</text></svg>`;
}
function donut(counts) {
  const total = counts.reduce((a, b) => a + b.n, 0); const r = 52, c = 2 * Math.PI * r; let off = 0;
  const segs = total ? counts.filter(x => x.n).map(x => { const len = x.n / total * c; const s = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${x.color}" stroke-width="16" stroke-dasharray="${Math.max(len - 3, 1)} ${c}" stroke-dashoffset="${-off}"><title>${x.label}: ${x.n}</title></circle>`; off += len; return s; }).join('') : '';
  return `<svg viewBox="0 0 140 140" role="img" aria-label="Applications by stage"><g transform="rotate(-90 70 70)"><circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(150,165,255,.14)" stroke-width="16"/>${segs}</g><text x="70" y="68" text-anchor="middle" style="fill:#e9edff;font:600 26px Sora,sans-serif">${total}</text><text x="70" y="86" text-anchor="middle" style="fill:#8a94b8;font-size:11px">total</text></svg>`;
}

/* ============ Views ============ */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', group: 'Overview' },
  { id: 'applications', label: 'Applications', icon: 'briefcase', group: 'Overview', badge: () => S.apps.filter(a => ['applied', 'interview'].includes(a.status)).length },
  { id: 'planner', label: 'Planner', icon: 'list-checks', group: 'Overview', badge: () => S.tasks.filter(t => !t.done).length },
  { id: 'skills', label: 'Skills', icon: 'gauge', group: 'Grow' },
  { id: 'roadmap', label: 'Roadmap', icon: 'route', group: 'Grow' },
  { id: 'resume', label: 'Resume check', icon: 'file-text', group: 'Grow' },
  { id: 'settings', label: 'Settings', icon: 'settings', group: 'Account' }
];
let appQuery = '';
let taskFilter = 'all';
let roadmapRole = null;

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

function viewDashboard() {
  const r = readiness(), nm = nextMove(), wk = weekHours(), first = S.profile.name.split(' ')[0];
  const counts = STAGES.map(s => ({ ...s, n: S.apps.filter(a => a.status === s.id).length }));
  const gp = gaps().filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 5);
  const upcoming = [
    ...S.apps.filter(a => a.date && ['saved', 'interview'].includes(a.status) && daysUntil(a.date) >= 0).map(a => ({ title: `${a.company}`, sub: a.status === 'interview' ? 'Interview' : 'Application deadline', date: a.date, icon: a.status === 'interview' ? 'calendar-check' : 'send' })),
    ...S.tasks.filter(t => !t.done && t.due).map(t => ({ title: t.title, sub: 'Task', date: t.due, icon: 'circle-check' }))
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const wkTotal = wk.reduce((a, b) => a + b.v, 0);
  const dueWeek = S.tasks.filter(t => !t.done && t.due && daysUntil(t.due) <= 7).length;
  const ivs = S.apps.filter(a => a.status === 'interview').length;
  const activeApps = S.apps.filter(a => ['applied', 'interview'].includes(a.status)).length;
  return `
  <section class="card hero" aria-label="Career readiness">
    <div class="hero-l">
      <h1>${greeting()}, ${esc(first)}.</h1>
      <p>You are ${r.total}% ready for ${esc(ROLES[S.profile.role].label)} roles. Here is the single move that will help most right now.</p>
      <div class="next">
        <div class="ico">${ic(nm.icon)}</div>
        <div><small>Your next move</small><b>${esc(nm.title)}</b><p>${esc(nm.why)}</p></div>
        ${nm.href ? `<a class="btn primary sm" href="${nm.href}">${esc(nm.cta)}</a>` : `<button class="btn primary sm" data-act="${nm.act}">${esc(nm.cta)}</button>`}
      </div>
    </div>
    <div class="hero-r">
      <div class="ring">${ringSvg(r.total)}<div class="num"><b>${r.total}</b><span>readiness</span></div></div>
      <div class="factors">${r.parts.map(([l, v]) => `<div class="factor"><div><span>${l}</span><span>${Math.round(v * 100)}%</span></div><div class="bar" style="height:6px"><i style="width:${Math.round(v * 100)}%"></i></div></div>`).join('')}</div>
    </div>
  </section>

  <section class="grid g-4 mt" aria-label="Key numbers">
    <div class="card stat"><div class="top">Active applications<span class="ic">${ic('briefcase')}</span></div><b>${activeApps}</b><small>${S.apps.length} tracked in total</small></div>
    <div class="card stat"><div class="top">Interviews<span class="ic v">${ic('calendar-check')}</span></div><b>${ivs}</b><small>${ivs ? 'Prepare in the planner' : 'None scheduled yet'}</small></div>
    <div class="card stat"><div class="top">Study streak<span class="ic a">${ic('flame')}</span></div><b>${streak()} <span style="font-size:15px;color:var(--muted);font-weight:400">days</span></b><small>${wkTotal.toFixed(1)}h logged this week</small></div>
    <div class="card stat"><div class="top">Tasks due this week<span class="ic g">${ic('list-checks')}</span></div><b>${dueWeek}</b><small>${S.tasks.filter(t => t.done).length} of ${S.tasks.length} completed</small></div>
  </section>

  <section class="grid g-21 mt">
    <div class="card"><div class="card-head"><div><h3>Study time, last 7 days</h3><p>${wkTotal.toFixed(1)} hours logged. Goal is ${(S.profile.goal * 7).toFixed(1)} hours a week.</p></div><button class="btn sm" data-act="logHours">${ic('plus')}Log time</button></div><div class="chart">${barChart(wk, S.profile.goal)}</div></div>
    <div class="card"><div class="card-head"><div><h3>Application pipeline</h3><p>Where each application stands.</p></div></div>
      <div class="donut-wrap">${donut(counts)}<div class="legend">${counts.map(c => `<div><i style="background:${c.color}"></i>${c.label}<b>${c.n}</b></div>`).join('')}</div></div></div>
  </section>

  <section class="grid g-21 mt">
    <div class="card"><div class="card-head"><div><h3>Skill gaps for ${esc(ROLES[S.profile.role].label)}</h3><p>The white marker shows the level employers expect.</p></div><a class="btn sm" href="#/skills">Manage skills</a></div>
      ${gp.length ? gp.map(g => gapRow(g)).join('') : `<div class="empty">${ic('badge-check')}<b>No gaps found</b>Your skills meet every target for this role.</div>`}</div>
    <div class="card"><div class="card-head"><div><h3>Coming up</h3><p>Deadlines, interviews and tasks.</p></div></div>
      ${upcoming.length ? `<div class="list">${upcoming.map(u => { const d = dueLabel(u.date); return `<div class="li"><div class="dot">${ic(u.icon)}</div><div class="meta"><b>${esc(u.title)}</b><span>${u.sub}</span></div><span class="chip ${d.c}">${d.t}</span></div>`; }).join('')}</div>` : `<div class="empty">${ic('calendar')}<b>Nothing scheduled</b>Add a deadline or task to see it here.</div>`}</div>
  </section>

  <section class="card mt"><div class="card-head"><div><h3>Recent activity</h3></div></div>
    <div class="list feed">${S.activity.slice(0, 5).map(a => `<div class="li"><div class="dot">${ic(a.icon)}</div><div class="meta"><b>${esc(a.text)}</b></div><small>${timeAgo(a.t)}</small></div>`).join('') || `<div class="empty"><b>No activity yet</b>Your changes will show up here.</div>`}</div></section>`;
}
function gapRow(g) {
  return `<div class="gap"><span>${esc(g.name)}</span><div class="track" title="Level ${g.level} of target ${g.target}"><i style="width:${g.level / 5 * 100}%"></i><s style="left:${g.target / 5 * 100}%"></s></div><em>${g.level} / ${g.target}</em></div>`;
}

function appCardHtml(a) {
  const d = a.date ? dueLabel(a.date) : null;
  const label = a.status === 'interview' ? 'Interview' : a.status === 'saved' ? 'Deadline' : a.status === 'applied' ? 'Applied' : 'Updated';
  return `<article class="kcard" draggable="true" data-id="${a.id}">
    <h4>${esc(a.company)}</h4><div class="sub">${esc(a.role)}</div>
    ${a.notes ? `<div class="notes">${esc(a.notes)}</div>` : ''}
    <div class="foot">${a.location ? `<span class="chip">${ic('map-pin')}${esc(a.location)}</span>` : ''}${d ? `<span class="chip ${['saved', 'interview'].includes(a.status) ? d.c : ''}" title="${label}">${ic('clock')}${d.t}</span>` : ''}</div>
    <div class="foot"><select aria-label="Move ${esc(a.company)} to stage" data-move="${a.id}">${STAGES.map(s => `<option value="${s.id}" ${s.id === a.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
      <div class="acts"><button class="btn ghost xs" data-act="editApp" data-id="${a.id}" aria-label="Edit ${esc(a.company)}">${ic('pencil')}</button><button class="btn ghost danger xs" data-act="delApp" data-id="${a.id}" aria-label="Delete ${esc(a.company)}">${ic('trash-2')}</button></div></div>
  </article>`;
}
function boardHtml() {
  const q = appQuery.trim().toLowerCase();
  const list = S.apps.filter(a => !q || (a.company + ' ' + a.role + ' ' + a.location).toLowerCase().includes(q));
  return STAGES.map(s => { const items = list.filter(a => a.status === s.id);
    return `<section class="kcol" data-stage="${s.id}" aria-label="${s.label}"><header><i style="background:${s.color}"></i>${s.label}<span>${items.length}</span></header>
    ${items.map(appCardHtml).join('') || `<div class="empty" style="padding:22px 8px;font-size:13px">${q ? 'No matches' : 'Drop an application here'}</div>`}</section>`; }).join('');
}
function viewApplications() {
  const total = S.apps.length, resp = S.apps.filter(a => ['interview', 'offer', 'rejected'].includes(a.status)).length, sent = S.apps.filter(a => a.status !== 'saved').length;
  return `<div class="page-head"><div><h1>Applications</h1><p>Drag cards between stages, or use the stage menu on each card. ${sent ? `You have heard back from ${resp} of ${sent} submitted applications.` : ''}</p></div>
    <button class="btn primary" data-act="addApp">${ic('plus')}Add application</button></div>
    <div class="toolbar"><input class="input" id="appSearch" type="search" placeholder="Filter by company, role or location" value="${esc(appQuery)}" aria-label="Filter applications"><span class="muted">${total} total</span></div>
    ${total ? `<div class="board" id="board">${boardHtml()}</div>` : `<div class="card empty">${ic('briefcase')}<b>Track your first application</b>Save roles you like, then move them through each stage.<div style="margin-top:14px"><button class="btn primary" data-act="addApp">${ic('plus')}Add application</button></div></div>`}`;
}

const LEVELS = ['Not started', 'Beginner', 'Basic', 'Working', 'Strong', 'Expert'];
function viewSkills() {
  const g = gaps(); const meet = g.filter(x => x.gap === 0).length;
  const cats = [...new Set(S.skills.map(s => s.cat))];
  return `<div class="page-head"><div><h1>Skills</h1><p>Rate yourself honestly, then compare against what ${esc(ROLES[S.profile.role].label)} roles expect.</p></div><button class="btn primary" data-act="addSkill">${ic('plus')}Add skill</button></div>
  <div class="grid g-2" style="align-items:start">
    <div class="card"><div class="card-head"><div><h3>Your skills</h3><p>${S.skills.length} skills. Click a bar to set your level.</p></div></div>
      ${S.skills.length ? [...S.skills].sort((a, b) => b.level - a.level).map(s => `<div class="skill"><div class="name"><b>${esc(s.name)}</b><span>${esc(s.cat)} · ${LEVELS[s.level]}</span></div>
        <div class="pips" role="group" aria-label="${esc(s.name)} level">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= s.level ? 'on' : ''}" data-act="setLevel" data-id="${s.id}" data-n="${n}" aria-label="Set ${esc(s.name)} to level ${n}"></button>`).join('')}</div>
        <button class="btn ghost danger xs" data-act="delSkill" data-id="${s.id}" aria-label="Remove ${esc(s.name)}">${ic('x')}</button></div>`).join('') : `<div class="empty">${ic('gauge')}<b>No skills yet</b>Add your first skill to start the gap analysis.</div>`}</div>
    <div class="card"><div class="card-head"><div><h3>Target: ${esc(ROLES[S.profile.role].label)}</h3><p>${meet} of ${g.length} requirements met.</p></div></div>
      ${g.map(x => { const st = x.gap === 0 ? ['green', 'Ready'] : x.level === 0 ? ['red', 'Missing'] : ['amber', 'Needs work'];
        return `<div class="req"><div class="meta"><b>${esc(x.name)}</b><span>Level ${x.level} of ${x.target} needed</span></div><span class="chip ${st[0]}">${st[1]}</span>
        ${x.level === 0 ? `<button class="btn sm" data-act="quickSkill" data-name="${esc(x.name)}">${ic('plus')}Add</button>` : ''}</div>`; }).join('')}</div>
  </div>`;
}

function viewRoadmap() {
  const role = roadmapRole || S.profile.role; const p = roadmapProgress(role); const done = S.roadmap[role] || {};
  const hrs = ROADMAPS[role].flatMap(ph => ph.items).filter(i => !done[i[0]]).reduce((a, i) => a + i[3], 0);
  return `<div class="page-head"><div><h1>Roadmap</h1><p>A step-by-step plan for each role. Tick milestones as you finish them and your readiness score updates.</p></div></div>
  <div class="toolbar"><div class="seg" role="tablist">${Object.entries(ROLES).map(([k, v]) => `<button role="tab" class="${k === role ? 'on' : ''}" data-act="roadRole" data-role="${k}" aria-selected="${k === role}">${v.label}</button>`).join('')}</div></div>
  <div class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px"><div><h3>${p.done} of ${p.total} milestones complete</h3><p class="muted" style="font-size:13px;margin-top:2px">About ${hrs} hours of work remaining.</p></div><b style="font-family:var(--font-h);font-size:24px">${Math.round(p.ratio * 100)}%</b></div><div class="bar"><i style="width:${p.ratio * 100}%"></i></div></div>
  ${ROADMAPS[role].map(ph => { const n = ph.items.filter(i => done[i[0]]).length;
    return `<div class="phase"><h3>${ph.phase}<span>${n} of ${ph.items.length} done</span></h3>${ph.items.map(i => `<button class="mile ${done[i[0]] ? 'done' : ''}" data-act="toggleMile" data-role="${role}" data-id="${i[0]}" aria-pressed="${!!done[i[0]]}"><span class="check">${ic('check')}</span><span><b>${i[1]}</b><p>${i[2]}</p></span><span class="chip">${i[3]}h</span></button>`).join('')}</div>`; }).join('')}`;
}

function taskRow(t) {
  const d = dueLabel(t.due); const pc = { high: 'red', med: 'amber', low: '' }[t.pri];
  return `<div class="task ${t.done ? 'done' : ''}"><button class="check ${t.done ? 'on' : ''}" data-act="toggleTask" data-id="${t.id}" role="checkbox" aria-checked="${t.done}" aria-label="Mark “${esc(t.title)}” ${t.done ? 'not done' : 'done'}">${ic('check')}</button>
    <span class="t">${esc(t.title)}</span><span class="chip ${pc}">${{ high: 'High', med: 'Medium', low: 'Low' }[t.pri]}</span>${t.due ? `<span class="chip ${t.done ? '' : d.c}">${d.t}</span>` : ''}
    <button class="btn ghost danger xs" data-act="delTask" data-id="${t.id}" aria-label="Delete task">${ic('trash-2')}</button></div>`;
}
function filteredTasks() {
  let l = [...S.tasks];
  if (taskFilter === 'today') l = l.filter(t => !t.done && t.due && daysUntil(t.due) <= 0);
  else if (taskFilter === 'upcoming') l = l.filter(t => !t.done && t.due && daysUntil(t.due) > 0);
  else if (taskFilter === 'done') l = l.filter(t => t.done);
  const po = { high: 0, med: 1, low: 2 };
  return l.sort((a, b) => (a.done - b.done) || ((a.due || '9') .localeCompare(b.due || '9')) || po[a.pri] - po[b.pri]);
}
function viewPlanner() {
  const wk = weekHours(); const tot = wk.reduce((a, b) => a + b.v, 0); const goal = S.profile.goal; const l = filteredTasks();
  return `<div class="page-head"><div><h1>Planner</h1><p>Keep applications, study sessions and interview prep moving with a short, honest list.</p></div></div>
  <div class="grid g-21" style="align-items:start">
    <div class="card"><div class="card-head"><h3>Tasks</h3><div class="seg">${[['all', 'All'], ['today', 'Due now'], ['upcoming', 'Upcoming'], ['done', 'Done']].map(([k, v]) => `<button class="${taskFilter === k ? 'on' : ''}" data-act="taskFilter" data-f="${k}">${v}</button>`).join('')}</div></div>
      <div class="addrow"><input class="input" id="tTitle" placeholder="Add a task, for example “Mock interview with a friend”" aria-label="Task title"><input class="input" id="tDue" type="date" aria-label="Due date" value="${addDays(1)}"><select class="select" id="tPri" aria-label="Priority"><option value="high">High</option><option value="med" selected>Medium</option><option value="low">Low</option></select><button class="btn primary" data-act="addTask">${ic('plus')}Add</button></div>
      ${l.length ? l.map(taskRow).join('') : `<div class="empty">${ic('list-checks')}<b>${taskFilter === 'done' ? 'Nothing completed yet' : 'You are all caught up'}</b>${taskFilter === 'all' ? 'Add a task above to get started.' : 'Switch filters to see other tasks.'}</div>`}</div>
    <div class="card"><div class="card-head"><div><h3>Study log</h3><p>${tot.toFixed(1)}h of ${(goal * 7).toFixed(1)}h this week</p></div><button class="btn sm" data-act="logHours">${ic('plus')}Log</button></div>
      <div class="bar" style="margin-bottom:18px"><i style="width:${clamp(tot / (goal * 7) * 100, 0, 100)}%"></i></div>
      <div class="daybars">${wk.slice().reverse().map(d => `<div class="dayrow"><span>${d.today ? 'Today' : d.label}</span><div class="bar" style="height:6px"><i style="width:${clamp(d.v / goal * 100, 0, 100)}%"></i></div><b>${d.v}h</b></div>`).join('')}</div></div>
  </div>`;
}

/* Resume analysis (rule-based, runs locally) */
function analyzeResume(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0; const lower = text.toLowerCase();
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text); const links = /(github\.com|linkedin\.com|portfolio|https?:\/\/)/i.test(text);
  const secs = { Education: /education|university|college|b\.?tech|bachelor/i, Experience: /experience|intern|employment|work history/i, Projects: /projects?\b/i, Skills: /skills|technologies|tools/i };
  const secHit = Object.entries(secs).filter(([, re]) => re.test(text)).map(([k]) => k);
  const verbs = (text.match(/\b(built|developed|designed|led|created|launched|improved|reduced|increased|optimi[sz]ed|implemented|shipped|automated|analy[sz]ed|managed|delivered|migrated|refactored)\b/gi) || []).length;
  const metrics = (text.match(/\b\d+(\.\d+)?\s?(%|x\b|k\b|ms\b|users|students|hours|seconds|requests)|\b\d{2,}\b/gi) || []).length;
  const weak = (text.match(/(responsible for|worked on|helped with|hard[- ]?working|team player|duties included)/gi) || []);
  const req = ROLES[S.profile.role].req.map(r => r[0]); const kwHit = req.filter(k => lower.includes(k.toLowerCase().replace(' & ', ' ').split(' ')[0]));
  const items = [];
  const add = (label, got, max, tip, okMsg) => { const r = got / max; items.push({ label, got: Math.round(got), max, st: r >= .85 ? 'pass' : r >= .4 ? 'warn' : 'fail', tip: r >= .85 ? okMsg : tip }); };
  add('Contact details', (email ? 8 : 0) + (links ? 7 : 0), 15, `${!email ? 'Add an email address. ' : ''}${!links ? 'Link your GitHub, LinkedIn or portfolio.' : ''}`, 'Email and profile links are present.');
  add('Key sections', secHit.length * 5, 20, `Missing: ${Object.keys(secs).filter(k => !secHit.includes(k)).join(', ')}.`, 'Education, experience, projects and skills are all covered.');
  const lenScore = words >= 300 && words <= 700 ? 10 : words === 0 ? 0 : words < 300 ? clamp(words / 300 * 10, 0, 8) : clamp(10 - (words - 700) / 100, 4, 9);
  add('Length', lenScore, 10, words < 300 ? `${words} words is short. Aim for 300 to 700 with one page of focused detail.` : `${words} words is long. Trim older or less relevant detail.`, `${words} words is a good length.`);
  add('Action verbs', Math.min(verbs / 6, 1) * 15, 15, `Found ${verbs}. Start bullets with verbs like built, shipped, reduced or led.`, `Found ${verbs} strong action verbs.`);
  add('Measurable results', Math.min(metrics / 4, 1) * 15, 15, `Found ${metrics} numbers. Add scale or impact, such as “cut load time by 35%”.`, `Found ${metrics} quantified results.`);
  add(`Match with ${ROLES[S.profile.role].label}`, kwHit.length / req.length * 20, 20, `Mentioned ${kwHit.length} of ${req.length} key skills. Consider adding: ${req.filter(k => !kwHit.includes(k)).slice(0, 4).join(', ')}.`, 'Most of the key skills for this role appear.');
  add('Clear wording', weak.length ? Math.max(5 - weak.length * 2, 0) : 5, 5, `Replace phrases like “${weak[0]}” with what you actually did and achieved.`, 'No vague filler phrases found.');
  const total = items.reduce((a, b) => a + b.got, 0);
  return { total: words ? Math.round(total) : 0, items, words };
}
const SAMPLE_RESUME = `Alex Rivera
alex.rivera@email.com | github.com/alexrivera | linkedin.com/in/alexrivera

Education
B.Tech in Computer Science, State University, 2023 to 2027. CGPA 8.4

Experience
Frontend Intern, Brightside Studio (Jun to Aug 2025)
- Built 12 reusable React components that reduced page build time by 30%
- Improved Lighthouse accessibility score from 72 to 96 across 5 pages
- Worked on bug fixes for the checkout flow

Projects
CareerPilot Dashboard - Designed and shipped a responsive dashboard used by 150 students
Weather Atlas - Developed a TypeScript app with a REST API and offline caching, tested with Jest

Skills
JavaScript, React, TypeScript, HTML, CSS, Git, Figma, Accessibility, Testing`;
function resumeResultHtml(res) {
  const ic2 = { pass: 'check', warn: 'minus', fail: 'x' };
  return `<div class="score-big"><div class="ring" style="width:120px;height:120px">${ringSvg(res.total, 120, 10, 'rg2')}<div class="num"><b style="font-size:30px">${res.total}</b><span>out of 100</span></div></div>
    <div style="flex:1;min-width:180px"><h3>${res.words ? (res.total >= 80 ? 'Strong resume' : res.total >= 55 ? 'Good start, a few fixes needed' : 'Needs work') : 'Waiting for your resume'}</h3><p class="muted" style="font-size:13.5px;margin-top:4px">${res.words ? `${res.words} words analysed against ${esc(ROLES[S.profile.role].label)} roles. This check runs in your browser and nothing is uploaded.` : 'Paste your resume text to get a score and specific fixes.'}</p></div></div>
    ${res.words ? `<div style="margin-top:14px">${res.items.map(i => `<div class="chk"><span class="st ${i.st}">${ic(ic2[i.st])}</span><div><b>${i.label}</b><p>${esc(i.tip)}</p></div><span class="pts">${i.got} / ${i.max}</span></div>`).join('')}</div>` : ''}`;
}
function viewResume() {
  return `<div class="page-head"><div><h1>Resume check</h1><p>Paste your resume as plain text and get an instant score with concrete suggestions.</p></div></div>
  <div class="grid g-2" style="align-items:start">
    <div class="card"><div class="card-head"><h3>Your resume</h3><div style="display:flex;gap:8px"><button class="btn sm" data-act="sampleResume">Use sample</button><button class="btn sm ghost" data-act="clearResume">Clear</button></div></div>
      <textarea class="textarea" id="resumeText" style="min-height:420px;font-size:14px" placeholder="Paste your resume text here" aria-label="Resume text">${esc(S.resume)}</textarea></div>
    <div class="card" id="resumeOut">${resumeResultHtml(analyzeResume(S.resume))}</div>
  </div>`;
}

function viewSettings() {
  const p = S.profile;
  return `<div class="page-head"><div><h1>Settings</h1><p>Your data stays in this browser. Export a backup any time.</p></div></div>
  <div class="grid g-2" style="align-items:start">
    <form class="card" id="profileForm"><div class="card-head"><h3>Profile</h3></div>
      <div class="field"><label for="pn">Full name</label><input class="input" id="pn" name="name" value="${esc(p.name)}" required maxlength="60"></div>
      <div class="row2"><div class="field"><label for="pu">University</label><input class="input" id="pu" name="university" value="${esc(p.university)}" maxlength="60"></div><div class="field"><label for="pg">Graduation year</label><input class="input" id="pg" name="grad" value="${esc(p.grad)}" maxlength="4" inputmode="numeric"></div></div>
      <div class="row2"><div class="field"><label for="pr">Target role</label><select class="select" id="pr" name="role">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${k === p.role ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
      <div class="field"><label for="pgl">Daily study goal (hours)</label><input class="input" id="pgl" name="goal" type="number" min="0.5" max="12" step="0.5" value="${p.goal}"></div></div>
      <button class="btn primary" type="submit">Save changes</button></form>
    <div class="card"><div class="card-head"><h3>Your data</h3></div>
      <div class="list">
        <div class="li"><div class="meta"><b>Export backup</b><span>Download everything as a JSON file.</span></div><button class="btn sm" data-act="export">${ic('download')}Export</button></div>
        <div class="li"><div class="meta"><b>Import backup</b><span>Replace current data with a backup file.</span></div><button class="btn sm" data-act="import">${ic('upload')}Import</button><input type="file" id="importFile" accept="application/json" hidden></div>
        <div class="li"><div class="meta"><b>Reset to sample data</b><span>Restore the demo workspace.</span></div><button class="btn sm" data-act="reset">${ic('rotate-ccw')}Reset</button></div>
        <div class="li"><div class="meta"><b>Delete all data</b><span>Start with an empty workspace.</span></div><button class="btn sm danger" data-act="wipe">${ic('trash-2')}Delete</button></div>
      </div></div>
  </div>`;
}

const VIEWS = { dashboard: viewDashboard, applications: viewApplications, planner: viewPlanner, skills: viewSkills, roadmap: viewRoadmap, resume: viewResume, settings: viewSettings };
const TITLES = { dashboard: 'Dashboard', applications: 'Applications', planner: 'Planner', skills: 'Skills', roadmap: 'Roadmap', resume: 'Resume check', settings: 'Settings' };

/* ============ Rendering ============ */
function route() { const r = (location.hash.replace(/^#\/?/, '') || 'dashboard'); return VIEWS[r] ? r : 'dashboard'; }
function renderChrome() {
  const cur = route(); let lastGroup = '';
  $('#nav').innerHTML = NAV.map(n => { const g = n.group !== lastGroup ? `<div class="nav-label">${n.group}</div>` : ''; lastGroup = n.group; const b = n.badge ? n.badge() : 0;
    return `${g}<a href="#/${n.id}" class="${n.id === cur ? 'active' : ''}" title="${n.label}" ${n.id === cur ? 'aria-current="page"' : ''}>${ic(n.icon)}<span>${n.label}</span>${b ? `<em class="badge" style="font-style:normal">${b}</em>` : ''}</a>`; }).join('');
  $('#app').classList.toggle('collapsed', !!S.ui.collapsed);
  $('.collapse-btn').setAttribute('aria-label', S.ui.collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  $('#sbName').textContent = S.profile.name.split(' ')[0] || 'You';
  $('#sbRole').textContent = ROLES[S.profile.role].label;
  $('#sbAvatar').textContent = (S.profile.name.trim()[0] || 'A').toUpperCase();
  document.title = `${TITLES[cur]} · CareerPilot AI`;
  icons();
}
function render() {
  const cur = route(); $('#view').innerHTML = VIEWS[cur](); renderChrome(); icons();
}
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `${ic('check-circle-2')}<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el); icons(); setTimeout(() => el.remove(), 2800);
}

/* ============ Modals ============ */
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; if (m._prev && document.contains(m._prev)) m._prev.focus(); }
function openModal(title, body, onSubmit, label = 'Save') {
  const m = $('#modal'); m._prev = document.activeElement;
  m.innerHTML = `<div class="scrim" data-act="closeModal"></div><div class="dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h3>${esc(title)}</h3><button class="icon-btn" data-act="closeModal" aria-label="Close dialog">${ic('x')}</button></header>
    <form id="mform" novalidate>${body}<footer><button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">${esc(label)}</button></footer></form></div>`;
  m.hidden = false; icons();
  const f = $('#mform'); const first = $('input,select,textarea', f); first && first.focus();
  f.addEventListener('submit', e => { e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; } onSubmit(Object.fromEntries(new FormData(f))); closeModal(); });
  f.noValidate = false;
}
function appForm(a = {}) {
  return `<div class="field"><label for="m1">Company</label><input class="input" id="m1" name="company" required maxlength="60" value="${esc(a.company || '')}" placeholder="Company name"></div>
  <div class="field"><label for="m2">Role</label><input class="input" id="m2" name="role" required maxlength="80" value="${esc(a.role || '')}" placeholder="Frontend Intern"></div>
  <div class="row2"><div class="field"><label for="m3">Stage</label><select class="select" id="m3" name="status">${STAGES.map(s => `<option value="${s.id}" ${s.id === (a.status || 'saved') ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
  <div class="field"><label for="m4">Key date</label><input class="input" id="m4" type="date" name="date" value="${a.date || ''}"></div></div>
  <div class="field"><label for="m5">Location</label><input class="input" id="m5" name="location" maxlength="40" value="${esc(a.location || '')}" placeholder="Remote, Hybrid or city"></div>
  <div class="field"><label for="m6">Notes</label><textarea class="textarea" id="m6" name="notes" maxlength="300" placeholder="Referrals, prep ideas, contacts">${esc(a.notes || '')}</textarea></div>`;
}
function openAppModal(id) {
  const a = id ? S.apps.find(x => x.id === id) : null;
  openModal(a ? 'Edit application' : 'Add application', appForm(a || {}), d => {
    commit(s => { if (a) { Object.assign(a, d); log(`Updated ${d.company}`, 'pencil'); } else { s.apps.push({ id: uid(), ...d }); log(`Added ${d.company} (${STAGES.find(x => x.id === d.status).label})`, 'plus-circle'); } });
    toast(a ? 'Application saved' : 'Application added'); if (!a && route() !== 'applications') location.hash = '#/applications';
  }, a ? 'Save changes' : 'Add application');
}
function openSkillModal(pre = '') {
  openModal('Add skill', `<div class="field"><label for="s1">Skill</label><input class="input" id="s1" name="name" required maxlength="40" value="${esc(pre)}" placeholder="For example, Node.js"></div>
  <div class="row2"><div class="field"><label for="s2">Category</label><select class="select" id="s2" name="cat">${['Core', 'Framework', 'Tooling', 'Design', 'Data', 'Soft skill'].map(c => `<option>${c}</option>`).join('')}</select></div>
  <div class="field"><label for="s3">Level</label><select class="select" id="s3" name="level">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} · ${LEVELS[n]}</option>`).join('')}</select></div></div>`,
  d => { commit(s => { s.skills.push({ id: uid(), name: d.name.trim(), cat: d.cat, level: +d.level }); log(`Added skill ${d.name.trim()}`, 'gauge'); }); toast('Skill added'); }, 'Add skill');
}
function openHoursModal() {
  openModal('Log study time', `<div class="row2"><div class="field"><label for="h1">Hours studied</label><input class="input" id="h1" name="h" type="number" min="0.25" max="16" step="0.25" value="1" required></div>
  <div class="field"><label for="h2">Date</label><input class="input" id="h2" name="date" type="date" value="${today()}" max="${today()}" required></div></div><p class="muted" style="font-size:13px;margin-bottom:14px">Hours are added to anything already logged for that day.</p>`,
  d => { commit(s => { s.hours[d.date] = +((s.hours[d.date] || 0) + (+d.h)).toFixed(2); log(`Logged ${d.h}h of study`, 'timer'); }); toast(`Logged ${d.h}h`); }, 'Log time');
}
function confirmModal(title, msg, label, fn) { openModal(title, `<p class="muted" style="margin-bottom:18px">${esc(msg)}</p>`, fn, label); const b = $('#mform .btn.primary'); b && b.focus(); }

/* ============ Actions ============ */
function moveApp(id, status) {
  const a = S.apps.find(x => x.id === id); if (!a || a.status === status) return;
  commit(s => { a.status = status; log(`Moved ${a.company} to ${STAGES.find(x => x.id === status).label}`, 'move-right'); }); toast(`Moved to ${STAGES.find(x => x.id === status).label}`);
}
const ACT = {
  collapse: () => commit(s => { s.ui.collapsed = !s.ui.collapsed; }, { quiet: true }),
  openMenu: () => $('#app').classList.add('open'),
  closeMenu: () => $('#app').classList.remove('open'),
  closeModal,
  addApp: () => openAppModal(),
  editApp: el => openAppModal(el.dataset.id),
  delApp: el => { const a = S.apps.find(x => x.id === el.dataset.id); confirmModal('Delete application', `Remove ${a.company} from your tracker? This cannot be undone.`, 'Delete', () => { commit(s => { s.apps = s.apps.filter(x => x.id !== a.id); log(`Deleted ${a.company}`, 'trash-2'); }); toast('Application deleted'); }); },
  addSkill: () => openSkillModal(),
  quickSkill: el => openSkillModal(el.dataset.name),
  setLevel: el => commit(s => { const k = s.skills.find(x => x.id === el.dataset.id); k.level = k.level === +el.dataset.n ? +el.dataset.n - 1 : +el.dataset.n; }),
  delSkill: el => commit(s => { const k = s.skills.find(x => x.id === el.dataset.id); s.skills = s.skills.filter(x => x.id !== k.id); log(`Removed skill ${k.name}`, 'x'); }),
  roadRole: el => { roadmapRole = el.dataset.role; render(); },
  toggleMile: el => { const role = el.dataset.role, id = el.dataset.id; commit(s => { s.roadmap[role] = s.roadmap[role] || {}; s.roadmap[role][id] = !s.roadmap[role][id]; if (s.roadmap[role][id]) { const m = ROADMAPS[role].flatMap(p => p.items).find(i => i[0] === id); log(`Finished milestone “${m[1]}”`, 'flag'); } }); },
  logHours: openHoursModal,
  addTask: () => { const t = $('#tTitle').value.trim(); if (!t) { $('#tTitle').focus(); toast('Enter a task title first'); return; } commit(s => { s.tasks.push({ id: uid(), title: t, due: $('#tDue').value, pri: $('#tPri').value, done: false }); log(`Added task “${t}”`, 'plus-circle'); }); toast('Task added'); },
  toggleTask: el => commit(s => { const t = s.tasks.find(x => x.id === el.dataset.id); t.done = !t.done; if (t.done) log(`Completed “${t.title}”`, 'check-circle-2'); }),
  delTask: el => commit(s => { s.tasks = s.tasks.filter(x => x.id !== el.dataset.id); }),
  taskFilter: el => { taskFilter = el.dataset.f; render(); },
  sampleResume: () => { commit(s => { s.resume = SAMPLE_RESUME; }); },
  clearResume: () => { commit(s => { s.resume = ''; }); },
  export: () => { const b = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'careerpilot-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast('Backup exported'); },
  import: () => $('#importFile').click(),
  reset: () => confirmModal('Reset to sample data', 'This replaces your current data with the demo workspace.', 'Reset', () => { S = seed(); save(); render(); toast('Sample data restored'); }),
  wipe: () => confirmModal('Delete all data', 'This removes every application, skill, task and log. It cannot be undone.', 'Delete everything', () => { const p = S.profile; S = { ...seed(), profile: p, apps: [], skills: [], tasks: [], hours: {}, roadmap: {}, resume: '', activity: [] }; save(); render(); toast('All data deleted'); })
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-move]')) moveApp(e.target.dataset.move, e.target.value);
  if (e.target.id === 'importFile') {
    const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); if (d.v !== 1 || !Array.isArray(d.apps)) throw 0; S = d; save(); render(); toast('Backup imported'); } catch (_) { toast('That file is not a CareerPilot backup'); } };
    rd.readAsText(f);
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'appSearch') { appQuery = e.target.value; const b = $('#board'); if (b) { b.innerHTML = boardHtml(); icons(); } }
  if (e.target.id === 'resumeText') { S.resume = e.target.value; clearTimeout(window._rt); window._rt = setTimeout(() => { save(); $('#resumeOut').innerHTML = resumeResultHtml(analyzeResume(S.resume)); icons(); }, 250); }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'profileForm') { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); commit(s => { s.profile = { ...s.profile, name: d.name.trim() || s.profile.name, university: d.university, grad: d.grad, role: d.role, goal: clamp(+d.goal || 2, .5, 12) }; roadmapRole = null; }); toast('Profile saved'); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); $('#app').classList.remove('open'); hideResults(); }
  if (e.key === 'Enter' && e.target.id === 'tTitle') { e.preventDefault(); ACT.addTask(); }
  if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); }
});

/* Drag and drop for the kanban board */
let dragId = null;
document.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.kcard'); if (!c) return; dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {} });
document.addEventListener('dragend', () => { dragId = null; $$('.kcard.dragging').forEach(c => c.classList.remove('dragging')); $$('.kcol.over').forEach(c => c.classList.remove('over')); });
document.addEventListener('dragover', e => { const col = e.target.closest && e.target.closest('.kcol'); if (!col || !dragId) return; e.preventDefault(); $$('.kcol.over').forEach(c => c !== col && c.classList.remove('over')); col.classList.add('over'); });
document.addEventListener('drop', e => { const col = e.target.closest && e.target.closest('.kcol'); if (!col || !dragId) return; e.preventDefault(); const id = dragId; dragId = null; moveApp(id, col.dataset.stage); });

/* Global search */
function hideResults() { $('#results').hidden = true; }
$('#q').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase(); const box = $('#results'); if (!q) { hideResults(); return; }
  const hits = [
    ...S.apps.filter(a => (a.company + ' ' + a.role).toLowerCase().includes(q)).map(a => ({ t: `${a.company} · ${a.role}`, k: 'Application', i: 'briefcase', h: '#/applications' })),
    ...S.tasks.filter(t => t.title.toLowerCase().includes(q)).map(t => ({ t: t.title, k: 'Task', i: 'list-checks', h: '#/planner' })),
    ...S.skills.filter(s => s.name.toLowerCase().includes(q)).map(s => ({ t: s.name, k: 'Skill', i: 'gauge', h: '#/skills' }))
  ].slice(0, 8);
  box.innerHTML = hits.length ? hits.map(h => `<a href="${h.h}">${ic(h.i)}<span>${esc(h.t)}</span><small>${h.k}</small></a>`).join('') : `<div class="none">No results for “${esc(e.target.value)}”.</div>`;
  box.hidden = false; icons();
});
$('#results').addEventListener('click', () => { hideResults(); $('#q').value = ''; });
document.addEventListener('click', e => { if (!e.target.closest('.search')) hideResults(); });

window.addEventListener('hashchange', () => { $('#app').classList.remove('open'); render(); window.scrollTo(0, 0); });

/* Boot */
render();
