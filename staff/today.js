import {moduleRole} from '../shared/school-auth.js?v=20261107-academic1';
import {staffLinks} from './quick-links.js?v=20261108-shortcuts2';
export async function renderToday(host,profile,openRoute){
 host.replaceChildren();
 const section=document.createElement('section');section.className='panel staff-shortcuts';section.setAttribute('aria-label','เมนูลัดสำหรับครู');
 const title=document.createElement('h2');title.textContent='เมนูลัด';section.append(title);
 const grid=document.createElement('div');grid.className='staff-shortcut-grid';section.append(grid);
 const items=[
  {title:'เช็คชื่อเข้าแถว',description:'บันทึกการมาเรียนช่วงเช้าของห้องประจำชั้น',icon:'☀',route:'student-morning',allowed:moduleRole(profile,'attendance')!=='none'},
  {title:'เช็คชื่อรายคาบเรียน',description:'เช็คชื่อนักเรียนในคาบเรียนที่รับผิดชอบ',icon:'✓',route:'student-subject',allowed:moduleRole(profile,'attendance')!=='none'},
  {title:'ตารางสอนของฉัน',description:'เปิดตารางสอนของครูที่เข้าสู่ระบบ',icon:'▦',route:'academic-teacher-view',allowed:moduleRole(profile,'timetable')!=='none'&&Boolean(profile.teacherId),note:!profile.teacherId?'ยังไม่ได้ผูกบัญชีกับข้อมูลครู กรุณาติดต่อผู้ดูแล':''},
  {title:'ใบลาออนไลน์',description:'เข้าใช้ระบบใบลาเดิมของโรงเรียน',icon:'↗',url:staffLinks.leave,note:'รอลิงก์ระบบใบลาเดิม'},
  {title:'รูปกิจกรรมโรงเรียน',description:'เปิดอัลบั้มภาพกิจกรรมใน Google Drive',icon:'▧',url:staffLinks.photos,note:'รอลิงก์โฟลเดอร์รูปกิจกรรม'}
 ];
 for(const item of items){let url='';try{const u=new URL(item.url);if(u.protocol==='https:'&&!u.username&&!u.password)url=u.href;}catch{}
 const node=document.createElement(url?'a':'button');node.className='staff-shortcut';
 if(url){node.href=url;node.target='_blank';node.rel='noopener noreferrer';}else{node.type='button';node.disabled=item.route?!item.allowed:true;if(item.route&&item.allowed)node.onclick=()=>openRoute(item.route);}
 const icon=document.createElement('span');icon.className='shortcut-icon';icon.textContent=item.icon;icon.setAttribute('aria-hidden','true');
 const copy=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=item.title;small.textContent=node.disabled?(item.note||'บัญชีนี้ยังไม่มีสิทธิ์เข้าใช้'):item.description;copy.append(strong,small);node.append(icon,copy);grid.append(node);
 }
 host.append(section);
}
