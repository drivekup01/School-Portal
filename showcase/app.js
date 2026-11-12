import * as auth from '../shared/school-auth.js?v=20261107-academic1';
import {mountShowcase} from '../shared/showcase.js?v=20261112-1';
const $=id=>document.getElementById(id),upload=new URLSearchParams(location.search).get('mode')==='upload',view=mountShowcase($('workspace'),{upload});let sequence=0,off;
$('page-title').textContent=upload?'อัปโหลดเกียรติบัตร / ผลงาน':'เกียรติบัตร / ผลงาน';document.title=$('page-title').textContent+' · KBW School';
function gate(message){sequence++;view.clear();$('gate').hidden=false;$('workspace').hidden=true;$('logout').hidden=true;$('gate-message').textContent=message;}
async function boot(){const own=++sequence;try{const c=await auth.firebase();if(!c.auth.currentUser){gate('เข้าสู่ระบบด้วยบัญชีครู หรือบัญชีนักเรียนเพื่อเปิดดูเอกสาร');return;}const uid=c.auth.currentUser.uid;await auth.call('schoolShowcase',{method:'catalog'});if(own!==sequence)return;$('gate').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;await view.load();off?.();off=c.A.onAuthStateChanged(c.auth,user=>{if(user?.uid!==uid)gate('บัญชีเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่');});}catch(e){if(own===sequence)gate(e.message);}}
$('login').onclick=async()=>{try{await auth.login();await boot()}catch(e){gate(e.message)}};$('retry').onclick=boot;$('logout').onclick=async()=>{await auth.logout();gate('ออกจากระบบแล้ว')};void boot();
