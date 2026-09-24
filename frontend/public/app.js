const state = {
  apiBase: localStorage.getItem('seo.apiBase') || 'http://localhost:8000/api/v1',
  access: localStorage.getItem('seo.access') || '',
  refresh: localStorage.getItem('seo.refresh') || '',
  user: JSON.parse(localStorage.getItem('seo.user') || 'null'),
  projects: [],
  activeProjectId: localStorage.getItem('seo.projectId') || ''
};

const $ = (selector) => document.querySelector(selector);
const fmt = (value) => new Intl.NumberFormat('fa-IR').format(Number(value || 0));

function setMessage(text, type = 'info') {
  const el = document.createElement('div');
  el.className = `message ${type === 'error' ? 'error' : ''}`;
  el.textContent = text;
  $('#messageLog').prepend(el);
}

function normalizePayload(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.access) headers.Authorization = `Bearer ${state.access}`;
  const response = await fetch(`${state.apiBase}${path}`, { ...options, headers });
  let payload = null;
  try { payload = await response.json(); } catch (_) { payload = null; }
  if (!response.ok || payload?.success === false) {
    const message = payload?.message || payload?.detail || `خطای ارتباط با API (${response.status})`;
    throw new Error(message);
  }
  return normalizePayload(payload);
}

function saveSession(data) {
  const tokens = data?.tokens || data;
  state.access = tokens?.access || '';
  state.refresh = tokens?.refresh || '';
  state.user = data?.user || state.user;
  localStorage.setItem('seo.access', state.access);
  localStorage.setItem('seo.refresh', state.refresh);
  localStorage.setItem('seo.user', JSON.stringify(state.user));
  renderAuth();
}

function renderAuth() {
  const loggedIn = Boolean(state.access);
  $('#authPanel').classList.toggle('hidden', loggedIn);
  $('#logoutBtn').classList.toggle('hidden', !loggedIn);
  $('#authState').classList.toggle('muted', !loggedIn);
  $('#authState').textContent = loggedIn ? (state.user?.email || 'وارد شده') : 'وارد نشده';
}

function renderMetrics(summary = {}) {
  const items = [
    ['کلیک‌ها', summary.clicks],
    ['نمایش‌ها', summary.impressions],
    ['CTR', summary.ctr ? `${Number(summary.ctr).toFixed(2)}%` : '0%'],
    ['میانگین رتبه', summary.position ? Number(summary.position).toFixed(1) : '0']
  ];
  $('#metricsGrid').innerHTML = items.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${typeof value === 'number' ? fmt(value) : value}</strong></div>`).join('');
}

function table(rows, columns, emptyText) {
  if (!Array.isArray(rows) || rows.length === 0) return `<p class="empty">${emptyText}</p>`;
  return `<table><thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(c => `<td>${c.render ? c.render(row) : row[c.key] ?? '-'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderProjects() {
  $('#projectSelect').innerHTML = state.projects.length
    ? state.projects.map(p => `<option value="${p.id}" ${p.id === state.activeProjectId ? 'selected' : ''}>${p.name}</option>`).join('')
    : '<option value="">پروژه‌ای وجود ندارد</option>';
  $('#projectsList').innerHTML = table(state.projects, [
    { label: 'نام', key: 'name' },
    { label: 'دامنه', key: 'domain' },
    { label: 'وضعیت', key: 'status' },
    { label: 'GSC', render: row => row.gsc_connected ? 'متصل' : 'متصل نیست' },
    { label: 'اعضا', key: 'members_count' }
  ], 'هنوز پروژه‌ای ثبت نشده است.');
}

function renderBars(rows = []) {
  const list = Array.isArray(rows) ? rows.slice(0, 10) : [];
  if (!list.length) return '<p class="empty">داده روند موجود نیست.</p>';
  const max = Math.max(...list.map(x => Number(x.clicks || x.value || 0)), 1);
  return list.map(x => {
    const value = Number(x.clicks || x.value || 0);
    const height = Math.max(8, Math.round((value / max) * 190));
    const label = String(x.date || x.day || '').slice(5) || value;
    return `<div class="bar" style="height:${height}px" title="${value}"><small>${label}</small></div>`;
  }).join('');
}

function renderDevice(rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return '<p class="empty">داده دستگاه موجود نیست.</p>';
  const max = Math.max(...list.map(x => Number(x.clicks || x.value || 0)), 1);
  return list.map(x => {
    const label = x.device || x.name || 'نامشخص';
    const value = Number(x.clicks || x.value || 0);
    return `<div class="list-row"><strong>${label}</strong><div class="progress"><span style="width:${Math.round((value / max) * 100)}%"></span></div><span>${fmt(value)}</span></div>`;
  }).join('');
}

async function loadProjects() {
  if (!state.access) return;
  const data = await api('/projects/');
  state.projects = Array.isArray(data) ? data : data?.results || [];
  if (!state.activeProjectId && state.projects[0]) state.activeProjectId = state.projects[0].id;
  localStorage.setItem('seo.projectId', state.activeProjectId || '');
  renderProjects();
}

async function loadDashboardData() {
  renderMetrics({});
  $('#trendChart').innerHTML = '<p class="empty">پروژه‌ای انتخاب نشده است.</p>';
  $('#deviceChart').innerHTML = '<p class="empty">پروژه‌ای انتخاب نشده است.</p>';
  $('#keywordsList').innerHTML = '<p class="empty">پروژه‌ای انتخاب نشده است.</p>';
  $('#pagesList').innerHTML = '<p class="empty">پروژه‌ای انتخاب نشده است.</p>';
  $('#kpiList').innerHTML = '<p class="empty">پروژه‌ای انتخاب نشده است.</p>';
  $('#reportsList').innerHTML = '<p class="empty">پروژه‌ای انتخاب نشده است.</p>';
  if (!state.activeProjectId || !state.access) return;

  const projectId = state.activeProjectId;
  const requests = [
    api(`/seo/${projectId}/summary/`).catch(e => ({ error: e.message })),
    api(`/seo/${projectId}/trend/`).catch(() => []),
    api(`/seo/${projectId}/devices/`).catch(() => []),
    api(`/seo/${projectId}/keywords/`).catch(() => []),
    api(`/seo/${projectId}/pages/`).catch(() => []),
    api(`/kpi/projects/${projectId}/kpis/`).catch(() => []),
    api(`/reports/projects/${projectId}/`).catch(() => [])
  ];
  const [summary, trend, devices, keywords, pages, kpis, reports] = await Promise.all(requests);
  if (!summary.error) renderMetrics(summary);
  $('#trendChart').innerHTML = renderBars(trend?.results || trend);
  $('#deviceChart').innerHTML = renderDevice(devices?.results || devices);
  $('#keywordsList').innerHTML = table(keywords?.results || keywords, [
    { label: 'کلمه', key: 'query' },
    { label: 'کلیک', render: r => fmt(r.clicks) },
    { label: 'نمایش', render: r => fmt(r.impressions) },
    { label: 'رتبه', render: r => r.position ? Number(r.position).toFixed(1) : '-' }
  ], 'کلمه کلیدی موجود نیست.');
  $('#pagesList').innerHTML = table(pages?.results || pages, [
    { label: 'صفحه', key: 'page' },
    { label: 'کلیک', render: r => fmt(r.clicks) },
    { label: 'نمایش', render: r => fmt(r.impressions) }
  ], 'صفحه‌ای موجود نیست.');
  $('#kpiList').innerHTML = table(kpis?.results || kpis, [
    { label: 'نام', key: 'name' },
    { label: 'هدف', key: 'target_value' },
    { label: 'وضعیت', key: 'status' }
  ], 'KPI ثبت نشده است.');
  $('#reportsList').innerHTML = table(reports?.results || reports, [
    { label: 'عنوان', key: 'title' },
    { label: 'نوع', key: 'report_type' },
    { label: 'وضعیت', key: 'status' }
  ], 'گزارشی موجود نیست.');
}

async function loadHealth() {
  try {
    const data = await api('/monitoring/health/', { headers: state.access ? {} : { Authorization: '' } });
    $('#healthBox').textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    $('#healthBox').textContent = error.message;
  }
}

async function refreshAll() {
  try {
    await loadProjects();
    await Promise.all([loadDashboardData(), loadHealth()]);
    setMessage('داده‌ها به‌روزرسانی شد.');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

function bindEvents() {
  $('#apiBase').value = state.apiBase;
  $('#saveApi').addEventListener('click', () => {
    state.apiBase = $('#apiBase').value.replace(/\/$/, '');
    localStorage.setItem('seo.apiBase', state.apiBase);
    setMessage('آدرس API ذخیره شد.');
  });
  document.querySelectorAll('.nav-link').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    $(`#${btn.dataset.section}`).classList.add('active');
  }));
  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const data = await api('/auth/login/', { method: 'POST', body: JSON.stringify(body) });
      saveSession(data);
      setMessage('ورود موفق بود.');
      await refreshAll();
    } catch (error) { setMessage(error.message, 'error'); }
  });
  $('#registerForm').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      await api('/auth/register/', { method: 'POST', body: JSON.stringify(body) });
      setMessage('حساب ساخته شد. حالا وارد شوید.');
      event.currentTarget.reset();
    } catch (error) { setMessage(error.message, 'error'); }
  });
  $('#logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('seo.access');
    localStorage.removeItem('seo.refresh');
    localStorage.removeItem('seo.user');
    state.access = '';
    state.refresh = '';
    state.user = null;
    state.projects = [];
    renderAuth();
    renderProjects();
    setMessage('از حساب خارج شدید.');
  });
  $('#openProjectForm').addEventListener('click', () => $('#projectForm').classList.toggle('hidden'));
  $('#projectForm').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const project = await api('/projects/', { method: 'POST', body: JSON.stringify(body) });
      state.activeProjectId = project.id;
      event.currentTarget.reset();
      await refreshAll();
      setMessage('پروژه ساخته شد.');
    } catch (error) { setMessage(error.message, 'error'); }
  });
  $('#projectSelect').addEventListener('change', event => {
    state.activeProjectId = event.target.value;
    localStorage.setItem('seo.projectId', state.activeProjectId || '');
    loadDashboardData();
  });
  $('#refreshBtn').addEventListener('click', refreshAll);
}

bindEvents();
renderAuth();
renderProjects();
renderMetrics({});
loadHealth();
if (state.access) refreshAll();
