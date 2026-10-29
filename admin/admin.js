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
document.querySelector('.group-toggle').addEventListener('click', event => {
  const group = event.currentTarget.closest('.nav-group');
  const open = group.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
  group.querySelector('.sub-nav').hidden = !open;
});
document.querySelectorAll('[data-section]').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.nav-link[data-section]').forEach(item => item.classList.toggle('active', item === link));
  $('pageCrumb').textContent = link.textContent.trim();
}));

openDashboard();
