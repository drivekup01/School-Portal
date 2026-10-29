const sidebar = document.getElementById('sidebar');
const menuButton = document.getElementById('menuButton');
const scrim = document.getElementById('mobileScrim');
function closeMenu() {
  sidebar?.classList.remove('is-open');
  scrim?.classList.remove('is-visible');
  menuButton?.setAttribute('aria-expanded', 'false');
}
menuButton?.addEventListener('click', () => {
  const open = !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', open);
  scrim.classList.toggle('is-visible', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
scrim?.addEventListener('click', closeMenu);
sidebar?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.querySelector('.group-toggle')?.addEventListener('click', event => {
  const group = event.currentTarget.closest('.nav-group');
  const open = group.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
  group.querySelector('.sub-nav').hidden = !open;
});
