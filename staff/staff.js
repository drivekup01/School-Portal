import * as shared from '../shared/school-auth.js?v=20261027-roles1';
import {renderToday} from './today.js?v=20261029-today1';

const $ = id => document.getElementById(id);
const gate = $('authGate');
const shell = $('appShell');
const frame = $('systemFrame');
const routes = {};
const appBase = 'https://drivekup01.github.io/';

function addRoute(id, title, category, app, path, page) {
  const target = new URL(path,appBase);
  if (app === 'budget' || app === 'procurement') target.searchParams.set('ui','20261030-unified2');
  if (app === 'academic') target.searchParams.set('ui','20261030-unified2');
  if(app === 'attendance')target.searchParams.set('ui','20261031-student1');
  routes[id] = { id, title, category, app, url: target.href, page };
}
addRoute('budget-home','ภาพรวมงบประมาณ','งานงบประมาณ','budget','School-Budget/budget-dashboard.html');
addRoute('budget-projects','โครงการและกิจกรรม','งานงบประมาณ','budget','School-Budget/budget-projects.html');
addRoute('budget-reports','รายงานงบประมาณ','งานงบประมาณ','budget','School-Budget/budget-reports.html');
addRoute('budget-import','อัปเดตข้อมูลปีงบประมาณ','งานงบประมาณ','budget','School-Budget/budget-import.html?year=2570&v=20261030-allocation1');
addRoute('budget-documents','เอกสารงบ 1 และงบ 2','งานงบประมาณ','budget','School-Budget/budget-documents.html');
addRoute('budget-disbursement','เอกสารเบิกจ่าย','งานงบประมาณ','budget','School-Budget/disbursement.html');
addRoute('budget-procurement','จัดซื้อและจัดจ้าง','งานงบประมาณ','procurement','School-Procurement/history.html#history');
addRoute('budget-inventory','ระบบคุมพัสดุ','งานงบประมาณ','budget','School-Budget/inventory.html?v=20261030-inventory2');
addRoute('academic-home','ภาพรวมวิชาการ','งานวิชาการ','academic','School-OS/','dashboard');
addRoute('academic-school','ข้อมูลโรงเรียน','งานวิชาการ','academic','School-OS/','school');
addRoute('academic-teachers','ครูผู้สอน','งานวิชาการ','academic','School-OS/','teachers');
addRoute('academic-subjects','รายวิชา','งานวิชาการ','academic','School-OS/','subjects');
addRoute('academic-rooms','ห้องเรียน','งานวิชาการ','academic','School-OS/','rooms');
addRoute('academic-timeslots','คาบเรียนและวันเรียน','งานวิชาการ','academic','School-OS/','timeslots');
addRoute('academic-builder','จัดตารางเรียน','งานวิชาการ','academic','School-OS/','builder');
addRoute('academic-teacher-builder','สร้างตารางรายครู','งานวิชาการ','academic','School-OS/','teacher-builder');
addRoute('academic-auto','จัดตารางอัตโนมัติ','งานวิชาการ','academic','School-OS/','auto-schedule');
addRoute('academic-teacher-view','ตารางสอนรายครู','งานวิชาการ','academic','School-OS/','teacher-view');
addRoute('academic-teacher-all','ตารางสอนทั้งหมด','งานวิชาการ','academic','School-OS/','teacher-all');
addRoute('academic-export','ส่งออกตารางสอน','งานวิชาการ','academic','School-OS/','export');
addRoute('academic-workload','ภาระงานสอน','งานวิชาการ','academic','School-OS/','workload');
addRoute('academic-conflict','ตรวจตารางสอนชน','งานวิชาการ','academic','School-OS/','conflict');
addRoute('academic-substitute','สอนแทนและแลกคาบ','งานวิชาการ','academic','School-OS/','substitute');
addRoute('academic-exchange','แลกคาบ','งานวิชาการ','academic','School-OS/','exchange');
addRoute('academic-leave','ประวัติการลาครู','งานวิชาการ','academic','School-OS/','leave-test');
addRoute('academic-announcements','ประกาศวิชาการ','งานวิชาการ','academic','School-OS/','announcements');
addRoute('academic-storage','สำรองข้อมูล','งานวิชาการ','academic','School-OS/','storage');
addRoute('student-home','ภาพรวมดูแลนักเรียน','ดูแลนักเรียน','attendance','School-Portal/attendance/index.html');
addRoute('student-morning','เช็กชื่อเข้าแถวเช้า','ดูแลนักเรียน','attendance','School-Portal/attendance/morning.html');
addRoute('student-subject','เช็กชื่อรายคาบ','ดูแลนักเรียน','attendance','School-Portal/attendance/subject.html');
addRoute('student-behavior','ความประพฤติ','ดูแลนักเรียน','attendance','School-Portal/attendance/behavior.html');
addRoute('student-reports','รายงานและส่งออก','ดูแลนักเรียน','attendance','School-Portal/attendance/reports.html');
addRoute('student-admin','จัดการข้อมูลและสิทธิ์','ดูแลนักเรียน','attendance','School-Portal/attendance/admin.html');

const embeddedStyles = {
  budget: '.inventory-app>#mobileMenu,.inventory-app>#scrim{display:none!important}#budgetSidebar{display:none!important}body.has-budget-sidebar:not([data-document-view])>main{margin-left:0!important}body.has-budget-sidebar[data-document-view]{padding-left:0!important}body.has-budget-sidebar[data-document-view] #documentManager{margin:20px!important;max-width:none!important}',
  procurement: '#budgetSidebar{display:none!important}body.has-budget-sidebar:not([data-document-view])>main{margin-left:0!important}',
  academic: '.school-topbar,.app-shell>.sidebar{display:none!important}body{min-height:100%!important}.app-shell{display:block!important;min-height:0!important;height:auto!important}.app-shell>.main{width:100%!important;min-width:0!important}',
  attendance: '.student-embedded .student-workspace{margin-left:0!important}'
};

const groups = [
  { key:'budget', role:'budget', id:'budget', label:'งานงบประมาณ', icon:'฿', items:['budget-home','budget-projects','budget-reports','budget-documents','budget-disbursement','budget-procurement','budget-inventory','budget-import'] },
  { key:'academic', role:'timetable', id:'academic', label:'งานวิชาการ', icon:'▦', items:['academic-home','academic-school','academic-teachers','academic-subjects','academic-rooms','academic-timeslots','academic-builder','academic-teacher-builder','academic-auto','academic-teacher-view','academic-teacher-all','academic-workload','academic-conflict','academic-export','academic-substitute','academic-exchange','academic-leave','academic-announcements','academic-storage'] },
  { key:'attendance', role:'attendance', id:'student', label:'ดูแลนักเรียน', icon:'✓', items:['student-home','student-morning','student-subject','student-behavior','student-reports','student-admin'] }
];
let profile;
let pendingAcademicPage = null;

function gateState(title, message, showLogin = false) {
  $('gateTitle').textContent = title;
  $('gateMessage').textContent = message;
  $('gateLogin').hidden = !showLogin;
  gate.hidden = false;
  shell.hidden = false;
  document.getElementById('embeddedView').hidden = true;
  document.getElementById('overview').hidden = true;
}
function roleFor(group) {
  if (profile?.identityAdmin) return 'admin';
  return shared.moduleRole(profile, group.role);
}
function groupVisible(group) { return !profile || roleFor(group) !== 'none'; }
function routeVisible(routeId, group) {
  if (routeId === 'budget-inventory') return profile?.identityAdmin || ['admin','budget','procurement'].includes(profile?.schoolRole);
  if (routeId === 'budget-import') return profile?.identityAdmin || profile?.schoolRole === 'budget';
  if (routeId === 'student-admin') return roleFor(group) === 'admin';
  if (group.key === 'academic' && roleFor(group) === 'viewer') {
    return ['academic-home','academic-teacher-view','academic-teacher-all','academic-substitute','academic-export','academic-announcements'].includes(routeId);
  }
  return true;
}
function makeLink(routeId) {
  const route = routes[routeId];
  const link = document.createElement('a');
  link.className = 'nav-link';
  link.href = '#'+routeId;
  link.dataset.route = routeId;
  link.innerHTML = `<span class="nav-icon">${route.app === 'academic' ? '▦' : route.app === 'budget' || route.app === 'procurement' ? '·' : '✓'}</span><span>${route.title}</span>`;
  return link;
}
function renderNavigation() {
  document.getElementById('staffNav').replaceChildren();
  const nav = $('staffNav');
  const home = document.createElement('a');
  home.className = 'nav-link active'; home.href = '#overview'; home.dataset.section = 'overview';
  home.innerHTML = '<span class="nav-icon">⌂</span><span>ภาพรวมวันนี้</span>';
  nav.append(home);
  for (const group of groups) {
    if (!groupVisible(group)) continue;
    const section = document.createElement('section');
    section.className = 'nav-group'; section.dataset.module = group.key;
    const toggle = document.createElement('button');
    toggle.className = 'nav-link group-toggle'; toggle.type = 'button'; toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML = `<span class="nav-icon">${group.icon}</span><span>${group.label}</span><span class="chevron">⌄</span>`;
    const sub = document.createElement('div'); sub.className = 'sub-nav'; sub.hidden = true;
    if (group.key === 'academic' && roleFor(group) === 'viewer') group.items = ['academic-home','academic-teacher-view','academic-teacher-all','academic-substitute','academic-export','academic-announcements'];
    for (const routeId of group.items) {
      if (!routeVisible(routeId, group)) continue;
      sub.append(makeLink(routeId));
    }
    toggle.addEventListener('click', () => {
      const opening = !section.classList.contains('open');
      section.classList.toggle('open', opening);
      sub.hidden = !opening;
      toggle.setAttribute('aria-expanded', String(opening));
    });
    section.append(toggle,sub); nav.append(section);
  }
  nav.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openRoute(link.dataset.route); closeMobileMenu(); }));
  home.addEventListener('click', event => { event.preventDefault(); showOverview(); closeMobileMenu(); });
}

function categoryName(app) { return app === 'budget' || app === 'procurement' ? 'งานงบประมาณ' : app === 'academic' ? 'งานวิชาการ' : 'ดูแลนักเรียน'; }
function setActive(id) {
  document.querySelectorAll('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === id));
  document.querySelectorAll('[data-section="overview"]').forEach(el => el.classList.remove('active'));
  const active = document.querySelector(`[data-route="${id}"]`);
  const group = active?.closest('.nav-group');
  if (group) {
    group.classList.add('open');
    group.querySelector('.sub-nav').hidden = false;
    group.querySelector('.group-toggle').setAttribute('aria-expanded','true');
  }
}
function injectFrameStyle() {
  try {
    const doc = frame.contentDocument;
    if (!doc?.head || !frame.dataset.app) return;
    let style = doc.getElementById('school-staff-shell-style');
    if (!style) { style = doc.createElement('style'); style.id = 'school-staff-shell-style'; doc.head.append(style); }
    style.textContent = embeddedStyles[frame.dataset.app] || '';
    if (doc.documentElement.dataset.staffClickBound === 'true') return;
    doc.documentElement.dataset.staffClickBound = 'true';
    doc.addEventListener('click', event => {
      const anchor = event.target.closest?.('a'); if (!anchor) return;
      const target = new URL(anchor.href,doc.location.href);
      if (target.origin !== location.origin) return;
      const path = target.pathname;
      if (path.startsWith('/School-Budget/') || path.startsWith('/School-Procurement/')) {
        event.preventDefault(); loadUrl(target.href,path.startsWith('/School-Procurement/')?'procurement':'budget',anchor.textContent.trim()||'งานงบประมาณ');
      } else if (path.startsWith('/School-OS/')) {
        event.preventDefault(); loadUrl(target.href,'academic',anchor.textContent.trim()||'งานวิชาการ');
      } else if (path.startsWith('/School-Portal/attendance/')) {
        event.preventDefault(); loadUrl(target.href,'attendance',anchor.textContent.trim()||'ดูแลนักเรียน');
      } else if (path === '/School-Portal/' || path === '/School-Portal/index.html') {
        event.preventDefault(); showOverview();
      }
    },{capture:true});
  } catch { $('embeddedTitle').textContent = 'เปิดระบบในพื้นที่รวมไม่ได้'; }
}
frame.addEventListener('load', () => {
  injectFrameStyle();
  if (pendingAcademicPage && frame.dataset.app === 'academic') {
    const page = pendingAcademicPage; pendingAcademicPage = null;
    if(frame.contentWindow)frame.contentWindow.schoolRequestedPage=page;
    if(frame.contentWindow?.canAccessPage?.(page))frame.contentWindow?.nav?.(page);
  }
});
function showEmbedded(title,category,url,app) {
  $('overview').hidden = true; $('embeddedView').hidden = false;
  $('pageCrumb').textContent = title; $('embeddedCategory').textContent = category; $('embeddedTitle').textContent = title;
  $('openStandalone').href = url; frame.title = `${category} · ${title}`;
  if (frame.dataset.app !== app || frame.src !== url) { frame.dataset.app = app; frame.src = url; }
  else injectFrameStyle();
}
function openRoute(id) {
  if (!profile) { gateState('เข้าสู่ระบบครูและบุคลากร','เข้าสู่ระบบด้วยบัญชีโรงเรียนเพื่อใช้งานเมนูนี้',true); return; }
  const route = routes[id]; if (!route) return;
  gate.hidden = true;
  setActive(id);
  if (route.app === 'academic' && frame.dataset.app === 'academic' && frame.contentWindow?.nav) {
    pendingAcademicPage = null; showEmbedded(route.title,route.category,route.url,route.app); frame.contentWindow.schoolRequestedPage=route.page; if(frame.contentWindow.canAccessPage?.(route.page))frame.contentWindow.nav(route.page); return;
  }
  pendingAcademicPage = route.app === 'academic' ? route.page : null;
  showEmbedded(route.title,route.category,route.url,route.app);
}
function loadUrl(url,app,title) {
  if(app === "attendance"){const target=new URL(url);target.searchParams.set("ui","20261031-student1");url=target.href;}
  if (app === 'academic') { const target = new URL(url); target.searchParams.set('ui','20261030-unified2'); url = target.href; }
  if (app === 'budget' || app === 'procurement') { const target = new URL(url); target.searchParams.set('ui','20261030-unified2'); url = target.href; }
  const category = categoryName(app);
  const guess = Object.values(routes).find(route => route.url === url || route.url.startsWith(url.split('#')[0]));
  if (guess) setActive(guess.id); else document.querySelectorAll('[data-route]').forEach(el=>el.classList.remove('active'));
  pendingAcademicPage = null; showEmbedded(title,category,url,app);
}
function showOverview() {
  if (!profile) { gateState('เข้าสู่ระบบครูและบุคลากร','ใช้บัญชีโรงเรียนเพื่อเข้าใช้งานทั้ง 3 ระบบ',true); return; }
  gate.hidden = true;
  $('embeddedView').hidden = true; $('overview').hidden = false; $('pageCrumb').textContent = 'ภาพรวมวันนี้';
  document.querySelectorAll('[data-route]').forEach(el=>el.classList.remove('active'));
  document.querySelector('[data-section="overview"]')?.classList.add('active');
}
function renderCards() {
  const box = $('systemCards');
  const cards = [
    {group:groups[0],title:'ระบบงานงบประมาณ',desc:'โครงการ เอกสารเบิกจ่าย และงานจัดซื้อจัดจ้าง',icon:'฿',route:'budget-home',className:'budget-card'},
    {group:groups[1],title:'ระบบงานวิชาการ',desc:'ข้อมูลครู วิชา ห้องเรียน และตารางสอน',icon:'▦',route:'academic-home',className:'academic-card'},
    {group:groups[2],title:'ระบบดูแลนักเรียน',desc:'เช็กชื่อเข้าแถว รายคาบ ความประพฤติ และรายงาน',icon:'✓',route:'student-home',className:'student-card'}
  ].filter(item=>groupVisible(item.group));
  if (!cards.length) { box.innerHTML='<div class="panel"><h2>ยังไม่มีระบบที่ได้รับสิทธิ์</h2><p class="staff-note">ติดต่อผู้ดูแลระบบเพื่อกำหนดสิทธิ์การใช้งานให้บัญชีนี้</p></div>'; return; }
  box.innerHTML = cards.map(item=>`<button type="button" class="system-card ${item.className}" data-open="${item.route}"><span class="system-card-head"><span class="system-icon">${item.icon}</span><span class="open-arrow">→</span></span><span class="system-kicker">${item.group.label}</span><strong>${item.title}</strong><span class="system-card-description">${item.desc}</span><span class="system-link">เปิดระบบ <b>→</b></span></button>`).join('');
  box.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openRoute(button.dataset.open)));
}
function closeMobileMenu() {
  $('sidebar').classList.remove('is-open'); $('mobileScrim').classList.remove('is-visible'); $('menuButton').setAttribute('aria-expanded','false');
}
function formatThaiDate() { return new Intl.DateTimeFormat('th-TH',{dateStyle:'full',timeZone:'Asia/Bangkok'}).format(new Date()); }
async function openWorkspace() {
  gateState('กำลังตรวจสอบบัญชี','โปรดรอสักครู่');
  try {
    profile = await shared.profile();
    if (!profile) { gateState('เข้าสู่ระบบครูและบุคลากร','ใช้บัญชี Google ที่ผู้ดูแลเพิ่มไว้ในระบบ เพื่อเข้าใช้ทั้งสามงานจากพื้นที่เดียว',true); return; }
    $('staffName').textContent = profile.name || profile.displayName || 'บุคลากร';
    $('staffEmail').textContent = profile.email || '';
    $('avatarInitial').textContent = (profile.name || profile.displayName || 'ผ').trim().charAt(0);
    $('todayDate').textContent = formatThaiDate();
    $('adminCenterLink').hidden = !profile.identityAdmin;
    renderNavigation(); document.getElementById('systemCards').hidden = true; showOverview();
    $('welcomeTitle').textContent = 'สวัสดี '+(profile.name || profile.displayName || 'คุณครู');
    let todayHost = $('todayDashboard');
    if (!todayHost) { todayHost = document.createElement('div'); todayHost.id = 'todayDashboard'; $('overview').querySelector('.welcome-row').after(todayHost); }
    renderToday(todayHost,profile,openRoute,loadUrl).catch(()=>{todayHost.textContent='โหลดภาพรวมไม่สำเร็จ กรุณาโหลดหน้าใหม่';});
    gate.hidden = true; shell.hidden = false;
  } catch (error) { gateState('เข้าใช้งานไม่ได้',error?.message || 'ตรวจสอบการเชื่อมต่อแล้วลองใหม่'); }
}
$('gateLogin').addEventListener('click',async()=>{try{await shared.login();await openWorkspace();}catch(error){gateState('เข้าสู่ระบบไม่สำเร็จ',error?.message||'ลองอีกครั้ง',true);}});
$('logoutButton').addEventListener('click',async()=>{await shared.logout();gateState('ออกจากระบบแล้ว','เข้าสู่ระบบอีกครั้งด้วยบัญชีที่ได้รับสิทธิ์',true);});
$('menuButton').addEventListener('click',()=>{const open=!$('sidebar').classList.contains('is-open');$('sidebar').classList.toggle('is-open',open);$('mobileScrim').classList.toggle('is-visible',open);$('menuButton').setAttribute('aria-expanded',String(open));});
$('mobileScrim').addEventListener('click',closeMobileMenu);
$('backToOverview').addEventListener('click',showOverview);
openWorkspace();

document.getElementById('appShell').querySelector('.main-area').append(gate);
renderNavigation();

// Show the complete mobile sidebar on first entry; users can dismiss it themselves.
const sidebarClose = document.createElement('button');
sidebarClose.type = 'button';
sidebarClose.className = 'sidebar-close';
sidebarClose.textContent = '×';
sidebarClose.setAttribute('aria-label','ซ่อนแถบเมนู');
sidebarClose.addEventListener('click',closeMobileMenu);
$('sidebar').prepend(sidebarClose);
if (window.matchMedia('(max-width:760px)').matches) {
  $('sidebar').classList.add('is-open');
  $('mobileScrim').classList.add('is-visible');
  $('menuButton').setAttribute('aria-expanded','true');
}
