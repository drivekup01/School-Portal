import {call,moduleRole} from '../shared/school-auth.js?v=20261027-roles1';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export async function renderToday(host,profile,openRoute,loadUrl){
 host.innerHTML=`<div class="today-heading"><span id="todayTerm">ข้อมูลตามวันที่ปัจจุบัน</span><button type="button" id="refreshToday">↻ อัปเดตข้อมูล</button></div><section class="today-stats" id="todayStats" aria-live="polite"></section><div class="today-grid"><section class="panel today-lessons"><div class="panel-heading"><h2>ตารางสอนวันนี้</h2><button data-go="academic-teacher-view">ดูตารางสอน →</button></div><div id="todayLessons" aria-live="polite">กำลังโหลดข้อมูล…</div></section><section class="panel"><h2>งานที่ต้องทำ</h2><div id="todayTasks">กำลังโหลดข้อมูล…</div></section><section class="panel"><div class="panel-heading"><h2>ประกาศภายใน</h2><button data-go="academic-announcements">ดูทั้งหมด →</button></div><div id="todayNews">กำลังโหลดข้อมูล…</div></section><section class="panel"><h2>กำหนดการใกล้ถึง</h2><div id="todayEvents">กำลังโหลดข้อมูล…</div></section></div>`;
 const $=id=>host.querySelector('#'+id);
 host.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>openRoute(b.dataset.go));
 $('refreshToday').onclick=()=>renderToday(host,profile,openRoute,loadUrl);
 const tasks=[];
 const permitted=moduleRole(profile,'attendance')!=='none';
 const [attendance,academic]=await Promise.allSettled([
   permitted?call('schoolIdentity',{method:'attendanceHome',date:day()}):Promise.reject(Error('บัญชีนี้ไม่มีสิทธิ์ดูข้อมูลการเช็กชื่อ')),
   moduleRole(profile,'timetable')!=='none'?call('timetableApi',{method:'bootstrap'}):Promise.reject(Error('บัญชีนี้ไม่มีสิทธิ์ดูข้อมูลวิชาการ'))
 ]);
 if(!host.isConnected)return;
 if(attendance.status==='fulfilled'){
   const data=attendance.value,school=data.scope==='school',lessons=data.lessons||[];
   $('todayTerm').textContent=`ปีการศึกษา ${data.school?.year||'—'} · ภาคเรียน ${data.school?.semester||'—'} · ${school?'ข้อมูลทั้งโรงเรียน':'ข้อมูลของฉัน'}`;
   $('todayStats').innerHTML=[['คาบสอนวันนี้',data.counts?.subject,'คาบ'],['คาบสอนแทน',data.counts?.substitute,'คาบ'],['ห้องประจำชั้น',data.counts?.homerooms,'ห้อง']].map(([label,value,unit])=>`<article><span>${label}</span><strong>${e(value??'—')} <small>${unit}</small></strong></article>`).join('');
   $('todayLessons').innerHTML=lessons.length?lessons.map((lesson,i)=>`<article class="today-lesson"><div class="today-period">${e(lesson.period)}<small>คาบ</small></div><div><strong>${e([...new Set(lesson.cells.map(c=>c.subject))].join(' / '))}</strong><p>${e(lesson.time)}${school?' · '+e(lesson.teacherName):''}</p><span class="today-tag">${lesson.kind==='substitute'?'สอนแทน':'ตามตาราง'}</span><div class="today-rooms">${lesson.cells.map((cell,j)=>`<button data-lesson="${i}" data-cell="${j}">${e(cell.className)} ${cell.assignmentId?'· เช็กชื่อ →':'· ดูรายละเอียด →'}</button>`).join('')}</div></div></article>`).join(''):'<p class="today-empty">ไม่มีคาบสอนตามตารางในวันนี้</p>';
   host.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{const cell=lessons[Number(b.dataset.lesson)].cells[Number(b.dataset.cell)];const url=new URL('../attendance/subject.html',location.href);url.searchParams.set('date',day());if(cell.assignmentId)url.searchParams.set('assignment',cell.assignmentId);loadUrl(url.href,'attendance','เช็กชื่อรายคาบ');});
   if(data.counts?.homerooms)tasks.push(['เช็กชื่อเข้าแถวเช้า',`${data.counts.homerooms} ห้องประจำชั้น · เปิดเพื่อตรวจสอบและบันทึก`,'student-morning']);
   if(lessons.length)tasks.push(['ตรวจสอบการเช็กชื่อรายคาบ','เปิดดูสถานะการบันทึกของคาบที่รับผิดชอบ','student-subject']);
 }else{
   $('todayStats').innerHTML='<article><span>ข้อมูลวันนี้</span><strong>—</strong><small>โหลดข้อมูลไม่สำเร็จ</small></article>';
   $('todayLessons').textContent=attendance.reason?.message||'โหลดตารางสอนไม่สำเร็จ กดอัปเดตข้อมูลเพื่อลองใหม่';
 }
 $('todayTasks').innerHTML=tasks.map(([title,detail,route])=>`<button class="today-task" data-task="${route}"><strong>${e(title)} →</strong><small>${e(detail)}</small></button>`).join('')+'<p class="today-empty">สถานะงานค้างและงานอนุมัติยังไม่ได้เชื่อม จึงยังไม่แสดงจำนวนงานค้าง</p>';
 host.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>openRoute(b.dataset.task));
 if(academic.status==='fulfilled'){
   const news=(academic.value.data?.announcements||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
   $('todayNews').innerHTML=news.slice(0,5).map(n=>`<button class="today-task" data-news><small>${e(n.date)} · ${e(n.type||'ทั่วไป')}</small><strong>${e(n.title||'ประกาศ')}</strong></button>`).join('')||'<p class="today-empty">ยังไม่มีประกาศในระบบวิชาการ</p>';
   host.querySelectorAll('[data-news]').forEach(b=>b.onclick=()=>openRoute('academic-announcements'));
 }else $('todayNews').textContent='ยังโหลดประกาศไม่ได้ · '+(academic.reason?.message||'ลองอัปเดตข้อมูลอีกครั้ง');
 $('todayEvents').innerHTML='<p class="today-empty">ยังไม่มีแหล่งข้อมูลปฏิทินกิจกรรมกลางที่เชื่อมกับหน้านี้</p><p class="today-empty">เมื่อเชื่อมแล้ว จะแสดงประชุม กิจกรรม วันสอบ และกำหนดส่งงานที่ใกล้ถึง</p>';
}
