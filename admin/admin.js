import * as shared from '../shared/school-auth.js?v=20261027-roles1';

const $ = id => document.getElementById(id);
const gate = $('authGate');
const shell = $('appShell');

function gateState(title, message, showLogin = false) {
  $('gateTitle').textContent = title;
  $('gateMessage').textContent = message;
  $('gateLogin').hidden = !showLogin;
  gate.hidden = false;
  shell.hidden = true;
}

function formatThaiDate(date = new Date()) {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'full', timeZone: 'Asia/Bangkok' }).format(date);
}

async function openDashboard() {
  gateState('กำลังตรวจสอบบัญชี', 'โปรดรอสักครู่');
  try {
    const profile = await shared.profile();
    if (!profile) {
      gateState('เข้าสู่ระบบผู้ดูแล', 'ใช้บัญชี Google ที่ได้รับสิทธิ์ผู้ดูแลระบบเพื่อเปิดศูนย์ควบคุม', true);
      return;
    }
    if (!profile.identityAdmin) {
      gateState('ไม่มีสิทธิ์เข้าถึง', 'บัญชีนี้ไม่ใช่บัญชีผู้ดูแลระบบ หากต้องการกลับไปยังระบบครู ให้กลับหน้าเลือกระบบโรงเรียน');
      return;
    }

    $('adminName').textContent = profile.name || 'ผู้ดูแลระบบ';
    $('adminEmail').textContent = profile.email || '';
    $('avatarInitial').textContent = (profile.name || 'ผ').trim().charAt(0);
    $('todayDate').textContent = formatThaiDate();
    gate.hidden = true;
    shell.hidden = false;
    await loadUserSummary();
  } catch (error) {
    gateState('เชื่อมต่อระบบบัญชีไม่ได้', error?.message || 'ลองโหลดหน้าใหม่อีกครั้ง');
  }
}

async function loadUserSummary() {
  try {
    const result = await shared.call('schoolIdentity', { method: 'listUsers' });
    const users = Array.isArray(result.users) ? result.users : [];
    const invitations = Array.isArray(result.invites) ? result.invites : [];
    $('userCount').textContent = new Intl.NumberFormat('th-TH').format(users.length);
    $('inviteCount').textContent = new Intl.NumberFormat('th-TH').format(invitations.filter(item => !item.claimedUid && item.active).length);
    $('navUserCount').textContent = new Intl.NumberFormat('th-TH').format(users.length);
  } catch {
    $('userCount').textContent = '—';
    $('inviteCount').textContent = '—';
    $('navUserCount').textContent = '—';
  }
}

$('gateLogin').addEventListener('click', async () => {
  try {
    await shared.login();
    await openDashboard();
  } catch (error) {
    gateState('เข้าสู่ระบบไม่สำเร็จ', error?.message || 'ลองอีกครั้ง');
    $('gateLogin').hidden = false;
  }
});

$('logoutButton').addEventListener('click', async () => {
  await shared.logout();
  gateState('ออกจากระบบแล้ว', 'เข้าสู่ระบบอีกครั้งด้วยบัญชีผู้ดูแลเพื่อกลับมาใช้งาน', true);
});

const sidebar = $('sidebar');
const menuButton = $('menuButton');
const scrim = $('mobileScrim');
const dashboardView = $('overview');
const embeddedView = $('embeddedView');
const frame = $('systemFrame');
const appBase = 'https://drivekup01.github.io/';
const routes = {
  accounts: { title: 'ผู้ใช้และสิทธิ์', category: 'ศูนย์ผู้ดูแลระบบ', app: 'accounts', url: appBase + 'School-Portal/users.html' },
  'budget-home': { title: 'ภาพรวมงบประมาณ', category: 'งานงบประมาณ', app: 'budget', url: appBase + 'School-Budget/budget-dashboard.html' },
  'budget-projects': { title: 'โครงการและกิจกรรม', category: 'งานงบประมาณ', app: 'budget', url: appBase + 'School-Budget/budget-projects.html' },
  'budget-reports': { title: 'รายงานงบประมาณ', category: 'งานงบประมาณ', app: 'budget', url: appBase + 'School-Budget/budget-reports.html' },
  'budget-documents': { title: 'เอกสารงบ 1 และงบ 2', category: 'งานงบประมาณ', app: 'budget', url: appBase + 'School-Budget/budget-documents.html' },
  'budget-disbursement': { title: 'เอกสารเบิกจ่าย', category: 'งานงบประมาณ', app: 'budget', url: appBase + 'School-Budget/disbursement.html' },
  'budget-procurement': { title: 'จัดซื้อและจัดจ้าง', category: 'งานงบประมาณ', app: 'procurement', url: appBase + 'School-Procurement/history.html#history' },
  'academic-home': { title: 'ภาพรวมวิชาการ', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'dashboard' },
  'academic-school': { title: 'ข้อมูลโรงเรียน', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'school' },
  'academic-teachers': { title: 'ครูผู้สอน', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'teachers' },
  'academic-subjects': { title: 'รายวิชา', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'subjects' },
  'academic-rooms': { title: 'ห้องเรียน', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'rooms' },
  'academic-timeslots': { title: 'คาบเรียนและวันเรียน', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'timeslots' },
  'academic-builder': { title: 'จัดตารางเรียน', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'builder' },
  'academic-teacher-view': { title: 'ตารางสอนรายครู', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'teacher-view' },
  'academic-workload': { title: 'ภาระงานสอน', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'workload' },
  'academic-substitute': { title: 'สอนแทนและแลกคาบ', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'substitute' },
  'academic-announcements': { title: 'ประกาศวิชาการ', category: 'งานวิชาการ', app: 'academic', url: appBase + 'School-OS/', page: 'announcements' },
  'student-home': { title: 'ภาพรวมดูแลนักเรียน', category: 'ดูแลนักเรียน', app: 'attendance', url: appBase + 'School-Portal/attendance/index.html' },
  'student-morning': { title: 'เช็กชื่อเข้าแถวเช้า', category: 'ดูแลนักเรียน', app: 'attendance', url: appBase + 'School-Portal/attendance/morning.html' },
  'student-subject': { title: 'เช็กชื่อรายคาบ', category: 'ดูแลนักเรียน', app: 'attendance', url: appBase + 'School-Portal/attendance/subject.html' },
  'student-behavior': { title: 'ความประพฤติ', category: 'ดูแลนักเรียน', app: 'attendance', url: appBase + 'School-Portal/attendance/behavior.html' },
  'student-reports': { title: 'รายงานและส่งออก', category: 'ดูแลนักเรียน', app: 'attendance', url: appBase + 'School-Portal/attendance/reports.html' },
  'student-admin': { title: 'จัดการข้อมูลและสิทธิ์', category: 'ดูแลนักเรียน', app: 'attendance', url: appBase + 'School-Portal/attendance/admin.html' }
};
for (const route of Object.values(routes)) {
  if (route.app === 'academic') { const target = new URL(route.url); target.searchParams.set('ui','20261030-ui2'); route.url = target.href; }
  if (route.app === 'budget' || route.app === 'procurement') { const target = new URL(route.url); target.searchParams.set('ui','20261029-ui2'); route.url = target.href; }
}
let pendingAcademicPage = null;
const embeddedStyles = {
  accounts: '#workspace .sidebar,#workspace .topbar,.access-bar,.global-status,#mobileScrim{display:none!important}#workspace .main-area{margin-left:0!important}#workspace .page-content{padding:20px!important}',
  budget: '#budgetSidebar{display:none!important}body.has-budget-sidebar:not([data-document-view])>main{margin-left:0!important}body.has-budget-sidebar[data-document-view]{padding-left:0!important}body.has-budget-sidebar[data-document-view] #documentManager{margin:20px!important;max-width:none!important}',
  academic: '.school-topbar,.app-shell>.sidebar{display:none!important}body{min-height:100%!important}.app-shell{display:block!important;min-height:0!important;height:auto!important}.app-shell>.main{width:100%!important;min-width:0!important}',
  attendance: '#shell>.sidebar,.mobile-nav{display:none!important}.workspace{margin-left:0!important;padding-bottom:0!important}.workspace>main{max-width:none!important}'
};
function closeMobileMenu() {
  sidebar.classList.remove('is-open');
  scrim.classList.remove('is-visible');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', open);
  scrim.classList.toggle('is-visible', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
scrim.addEventListener('click', closeMobileMenu);
sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
document.querySelectorAll('.group-toggle').forEach(button => button.addEventListener('click', event => {
  const group = event.currentTarget.closest('.nav-group');
  const open = group.classList.toggle('open');
  if (open) document.querySelectorAll('.nav-group').forEach(other => {
    if (other === group) return;
    other.classList.remove('open');
    other.querySelector('.group-toggle')?.setAttribute('aria-expanded', 'false');
    const sub = other.querySelector('.sub-nav');
    if (sub) sub.hidden = true;
  });
  event.currentTarget.setAttribute('aria-expanded', String(open));
  group.querySelector('.sub-nav').hidden = !open;
}));
document.querySelectorAll('[data-section]').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.nav-link[data-section]').forEach(item => item.classList.toggle('active', item === link));
  $('pageCrumb').textContent = link.textContent.trim();
  showDashboard();
}));

function injectFrameStyle() {
  try {
    const doc = frame.contentDocument;
    if (!doc?.head || !frame.dataset.app) return;
    let style = doc.getElementById('school-admin-shell-style');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'school-admin-shell-style';
      doc.head.append(style);
    }
    style.textContent = embeddedStyles[frame.dataset.app] || '';
    if (doc.documentElement.dataset.adminClickBound !== 'true') {
      doc.documentElement.dataset.adminClickBound = 'true';
      doc.addEventListener('click', event => {
        const anchor = event.target.closest?.('a');
        if (!anchor) return;
        const target = new URL(anchor.href, doc.location.href);
        if (target.origin !== location.origin || target.pathname === doc.location.pathname && target.hash && anchor.getAttribute('target') !== '_top') return;
        if (!anchor.hasAttribute('target') && !target.pathname.startsWith('/School-Portal/')) return;
        event.preventDefault();
        if (target.pathname.startsWith('/School-Budget/') || target.pathname.startsWith('/School-Procurement/')) {
          loadRouteUrl(target.href, target.pathname.startsWith('/School-Procurement/') ? 'procurement' : 'budget', anchor.textContent.trim() || 'งานงบประมาณ');
        } else if (target.pathname.startsWith('/School-OS/')) {
          loadRouteUrl(target.href, 'academic', anchor.textContent.trim() || 'งานวิชาการ');
        } else if (target.pathname.startsWith('/School-Portal/attendance/')) {
          loadRouteUrl(target.href, 'attendance', anchor.textContent.trim() || 'ดูแลนักเรียน');
        } else if (target.pathname.startsWith('/School-Portal/')) {
          showDashboard();
        }
      }, { capture: true });
    }
  } catch {
    $('embeddedTitle').textContent = 'ระบบเปิดในกรอบรวมไม่ได้';
    $('openStandalone').hidden = false;
  }
}

frame.addEventListener('load', () => {
  injectFrameStyle();
  if (pendingAcademicPage && frame.dataset.app === 'academic') {
    const page = pendingAcademicPage;
    pendingAcademicPage = null;
    frame.contentWindow?.nav?.(page);
  }
});

function setActiveRoute(routeId) {
  document.querySelectorAll('[data-route]').forEach(item => item.classList.toggle('active', item.dataset.route === routeId));
  const activeLink = document.querySelector(`[data-route="${routeId}"]`);
  const group = activeLink?.closest('.nav-group');
  if (group) {
    document.querySelectorAll('.nav-group').forEach(other => {
      if (other === group) return;
      other.classList.remove('open');
      other.querySelector('.group-toggle')?.setAttribute('aria-expanded', 'false');
      const sub = other.querySelector('.sub-nav');
      if (sub) sub.hidden = true;
    });
    group.classList.add('open');
    const toggle = group.querySelector('.group-toggle');
    toggle?.setAttribute('aria-expanded', 'true');
    const sub = group.querySelector('.sub-nav');
    if (sub) sub.hidden = false;
  }
}

function showEmbedded(title, category, url, app) {
  dashboardView.hidden = true;
  embeddedView.hidden = false;
  $('pageCrumb').textContent = title;
  $('embeddedCategory').textContent = category;
  $('embeddedTitle').textContent = title;
  $('openStandalone').href = url;
  $('openStandalone').hidden = false;
  frame.title = `${category} · ${title}`;
  if (frame.dataset.app !== app || frame.src !== url) {
    frame.dataset.app = app;
    frame.src = url;
  } else {
    injectFrameStyle();
  }
}

function loadRouteUrl(url, app, title) {
  if (app === 'academic') { const target = new URL(url); target.searchParams.set('ui','20261030-ui2'); url = target.href; }
  if (app === 'budget' || app === 'procurement') { const target = new URL(url); target.searchParams.set('ui','20261029-ui2'); url = target.href; }
  const category = app === 'budget' || app === 'procurement' ? 'งานงบประมาณ' : app === 'academic' ? 'งานวิชาการ' : app === 'attendance' ? 'ดูแลนักเรียน' : 'ศูนย์ผู้ดูแลระบบ';
  showEmbedded(title, category, url, app);
  if (app === 'academic') pendingAcademicPage = null;
}

function openRoute(routeId) {
  const route = routes[routeId];
  if (!route) return;
  setActiveRoute(routeId);
  if (route.app === 'academic' && frame.dataset.app === 'academic' && frame.contentWindow?.nav) {
    pendingAcademicPage = null;
    frame.contentWindow.nav(route.page);
    showEmbedded(route.title, route.category, route.url, route.app);
    return;
  }
  if (route.app === 'academic' && frame.dataset.app !== 'academic') pendingAcademicPage = route.page;
  showEmbedded(route.title, route.category, route.url, route.app);
}

function showDashboard() {
  embeddedView.hidden = true;
  dashboardView.hidden = false;
  $('pageCrumb').textContent = 'ภาพรวมระบบ';
  document.querySelectorAll('[data-route]').forEach(item => item.classList.remove('active'));
  document.querySelector('[data-section="overview"]')?.classList.add('active');
  if (location.hash === '#activity' || location.hash === '#quickActions') document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  openRoute(link.dataset.route);
}));
$('backToOverview').addEventListener('click', showDashboard);

openDashboard();
