import {startPublicCalendar} from './home-calendar.js?v=20261108-live-content1';
import {loadDefaults,renderHomepage,initializeInteractions} from './home-renderer.js?v=20261108-live-content1';
initializeInteractions();startPublicCalendar();
const preview=new URLSearchParams(location.search).get('preview')==='1'&&parent!==window;
if(preview){
const defaults=await loadDefaults();renderHomepage(defaults);
const notice=document.createElement('div');notice.className='preview-banner';notice.textContent='ตัวอย่างฉบับร่าง — ยังไม่ได้เผยแพร่';document.body.prepend(notice);
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='school-homepage-preview')return;try{renderHomepage(event.data.content);}catch{notice.textContent='แสดงตัวอย่างไม่ได้ กรุณาตรวจข้อมูล';}});
parent.postMessage({type:'school-homepage-preview-ready'},location.origin);
}else{
try{
const {call}=await import('../../shared/school-auth.js?v=20261027-roles1');
const result=await call('schoolHomepage',{method:'getPublished'});
if(result.content)renderHomepage(result.content);else{const defaults=await loadDefaults();renderHomepage({...defaults,heroImage:'',news:[],announcements:[],sampleContent:false});}
}catch(error){console.warn('โหลดเนื้อหาที่เผยแพร่ไม่สำเร็จ',error.code||'connection-error');const message=document.createElement('p');message.className='empty-content';message.textContent='ยังโหลดข่าวสารล่าสุดไม่ได้ กรุณาลองใหม่';const retry=document.createElement('button');retry.type='button';retry.className='outline-button';retry.textContent='ลองโหลดใหม่';retry.onclick=()=>location.reload();document.querySelector('.news-grid').replaceChildren(message,retry);}
}
