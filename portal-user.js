import * as shared from './shared/school-auth.js?v=20261027-roles1';
const bar=document.getElementById('accountBar'),label=document.getElementById('accountLabel'),login=document.getElementById('portalLogin'),logout=document.getElementById('portalLogout'),manage=document.getElementById('manageUsers');
async function render(){try{const p=await shared.profile();label.textContent=p?p.name+' • '+p.email:'ใช้บัญชี Google เดียวกันทุกระบบ';login.hidden=!!p;logout.hidden=!p;manage.hidden=!p?.identityAdmin;}catch(e){label.textContent='ระบบบัญชีกลางกำลังเตรียมใช้งาน';}}
login.onclick=async()=>{try{await shared.login();await render();}catch(e){label.textContent=e.message;}};logout.onclick=async()=>{await shared.logout();await render();};render();
