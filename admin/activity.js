import {call} from '../shared/school-auth.js?v=20261027-roles1';
const modules={admin:'ศูนย์ผู้ดูแล',accounts:'บัญชีและสิทธิ์',homepage:'หน้าแรกโรงเรียน',students:'ระบบนักเรียน',academic:'วิชาการ / ตารางสอน',budget:'งบประมาณ / จัดซื้อจัดจ้าง',attendance:'ดูแลนักเรียน / เช็กชื่อ',behavior:'คะแนนความประพฤติ',portal:'Portal'};
const sectionNames={'student-accounts':'บัญชีนักเรียน',homepage:'แก้ไขหน้าแรก',accounts:'ผู้ใช้และสิทธิ์'};
const date=value=>value?new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(value)):'—';
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
export function mountActivity(host){
 host.replaceChildren();host.classList.add('usage-panel');
 const heading=node('div',undefined,'panel-heading'),titles=node('div');titles.append(node('p','USAGE HISTORY','eyebrow'),node('h2','ประวัติการใช้งาน'));heading.append(titles);host.append(heading,node('p','เวลาเข้าใช้ ออกจากระบบ และการเพิ่มหรือแก้ไขข้อมูล · ไม่เก็บการเปิดดูเมนู · เวลาออกบันทึกเมื่อออกจากระบบจริง','muted'));
 const filters=node('div',undefined,'usage-filters');
 const field=(label,input)=>{const wrap=node('label');wrap.append(node('span',label),input);filters.append(wrap);return input;};
 const from=field('ตั้งแต่วันที่',Object.assign(node('input'),{type:'date'})),to=field('ถึงวันที่',Object.assign(node('input'),{type:'date'}));
 const search=field('ค้นหาชื่อ / อีเมล ในรายการที่โหลด',Object.assign(node('input'),{type:'search',placeholder:'ค้นหาผู้ใช้'}));
 const kind=field('ประเภท',node('select'));for(const [value,label]of [['','ทั้งหมด'],['login','เข้าใช้งาน'],['logout','ออกจากระบบ'],['action','เพิ่ม / แก้ไขข้อมูล']])kind.append(Object.assign(node('option',label),{value}));
 const refresh=node('button','โหลดข้อมูลล่าสุด','button secondary');refresh.type='button';filters.append(refresh);host.append(filters);
 const status=node('p','','usage-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');host.append(status);
 const wrap=node('div',undefined,'usage-table-wrap'),table=node('table'),head=node('thead'),tr=node('tr');for(const text of ['เวลา (ประเทศไทย)','ผู้ใช้','การดำเนินการ','ส่วนงาน','ผลการทำรายการ'])tr.append(node('th',text));head.append(tr);table.append(head);const body=node('tbody');table.append(body);wrap.append(table);host.append(wrap);
 const more=node('button','โหลดรายการก่อนหน้า','button secondary');more.type='button';more.hidden=true;host.append(more);
 let events=[],cursor=null,busy=false;
 function render(){
  const term=search.value.trim().toLowerCase(),visible=events.filter(v=>(!kind.value||(kind.value==='login'?['login','session'].includes(v.kind):v.kind===kind.value))&&(!term||(v.name+' '+v.email).toLowerCase().includes(term)));
  body.replaceChildren();for(const v of visible){const row=node('tr'),user=node('td');user.append(node('strong',v.name||'ผู้ใช้'),node('small',v.email||'บัญชีนักเรียน'));
   const action=node('td');action.append(node('strong',v.action));
   const area=node('td',modules[v.module]||v.module);if(v.section)area.append(node('small',sectionNames[v.section]||v.section));
   const result=node('td'),badge=node('span',v.source==='server'?(v.outcome==='success'?'ระบบยืนยันแล้ว':'ไม่สำเร็จ'):'เข้า / ออกจากบัญชี',v.outcome==='failed'?'usage-badge failed':'usage-badge');result.append(badge);
   row.append(node('td',date(v.createdAt)),user,action,area,result);body.append(row);
  }
  if(!visible.length){const row=node('tr'),cell=node('td',events.length?'ไม่พบรายการที่ตรงกับตัวกรอง':'ยังไม่มีประวัติในช่วงนี้ ระบบจะเริ่มเก็บตั้งแต่เปิดใช้งานฟังก์ชันนี้');cell.colSpan=5;row.append(cell);body.append(row);}
  status.textContent=`แสดง ${visible.length} รายการ จากที่โหลด ${events.length} รายการ`;more.hidden=!cursor;
 }
 async function load(append=false){
  if(busy)return;if(from.value&&to.value&&from.value>to.value){status.textContent='วันที่เริ่มต้นต้องไม่เกินวันสิ้นสุด';return;}
  busy=true;refresh.disabled=true;more.disabled=true;from.disabled=true;to.disabled=true;status.textContent='กำลังโหลดประวัติ…';
  try{const result=await call('schoolUsage',{method:'list',...(append&&cursor?{cursor}:{}),...(from.value?{from:from.value}:{}),...(to.value?{to:to.value}:{})});events=append?[...events,...result.events]:result.events;cursor=result.cursor;render();}
  catch(error){status.textContent='โหลดประวัติไม่สำเร็จ: '+error.message;}
  finally{busy=false;refresh.disabled=false;more.disabled=false;from.disabled=false;to.disabled=false;}
 }
 refresh.onclick=()=>load();more.onclick=()=>load(true);search.oninput=render;kind.onchange=render;from.onchange=()=>load();to.onchange=()=>load();void load();
 return {refresh:()=>load()};
}
