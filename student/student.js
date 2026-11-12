import {mountShowcase} from '../shared/showcase.js?v=20261112-1';
import {mountStudentExit} from './exit-passes.js?v=20261111-exit1';
import {mountStudentRemedial} from './remedial.js?v=20261107-layout1';
import {mountStudentReports} from './reports.js?v=20261107-period3';
import {firebase,logout,call} from '../shared/school-auth.js?v=20261027-roles1';
const $=id=>document.getElementById(id),el=(tag,text,className)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;if(className)node.className=className;return node;};
const labels={present:'มาเรียน',late:'สาย',leave:'ลา',absent:'ขาด'},thaiDate=value=>new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(value+'T12:00:00+07:00'));
// Keep older cached student pages compatible with the new navigation entry.
if(!$('exit-passes')){const section=el('section',null,'student-view');section.id='exits-view';section.hidden=true;const panel=el('section',null,'panel');panel.id='exit-passes';section.append(panel);$('main').append(section);const link=el('a','↗ อนุญาตออกนอกโรงเรียน');link.href='#exits';document.querySelector('.sidebar nav')?.append(link);}
if(!$('showcase')){const section=el('section',null,'student-view');section.id='showcase-view';section.hidden=true;const panel=el('section',null,'panel');panel.id='showcase';section.append(panel);$('main').append(section);const link=el('a','▧ เกียรติบัตร / ผลงาน');link.href='#showcase';document.querySelector('.sidebar nav')?.append(link);const css=document.createElement('link');css.rel='stylesheet';css.href='../shared/showcase.css?v=20261112-1';document.head.append(css);}
const studentShowcase=mountShowcase($('showcase'));
const exitPasses=mountStudentExit($('exit-passes'));
const gradeReports=mountStudentReports($('grades'));
const remedialReports=mountStudentRemedial($('remedial'));
let data=null,kind='morning',uid=null,sequence=0,sending=false,correctionId=null,view=null,scheduleDate=null,behaviorData=null,detailSequence=0;
function clearPrivate(){studentShowcase.clear();exitPasses.clear();remedialReports.clear();gradeReports.clear();data=null;behaviorData=null;detailSequence++;scheduleDate=null;view=null;for(const id of ['behavior-detail-score','behavior-detail-summary','behavior-detail-status','schedule-date'])$(id).textContent='';$('behavior-detail-events').replaceChildren();$('schedule-day').replaceChildren();$('correction-dialog').close();$('correction-message').value='';for(const id of ['account-email','profile-heading','student-code','student-room','student-number','student-advisor','student-initial','correction-state','behavior-score','term','schedule-room','attendance-note','behavior-note','schedule-note','photo-note','count-present','count-late','count-leave','count-absent'])$(id).textContent='';for(const id of ['lessons','behavior-events','attendance-history'])$(id).replaceChildren();$('student-photo').removeAttribute('src');}
function gate(title,message,canLogin=true){$('app').hidden=true;$('gate').hidden=false;$('gate-title').textContent=title;$('gate-message').textContent=message;$('login-form').hidden=!canLogin;$('retry').hidden=false;$('login-password').value='';clearPrivate();}
function status(message){$('status').textContent=message;}
function renderCorrection(){
const pending=data.correction?.status==='pending';$('request-correction').disabled=pending;$('correction-state').textContent=pending?'คำขอแก้ไขข้อมูลกำลังรอตรวจสอบ':data.correction?.status==='resolved'?'ผลการตรวจสอบ: '+data.correction.reply:'';
}
function renderAttendance(){
const source=data.attendance,summary=source.ready?source[kind]:null;
for(const name of Object.keys(labels))$('count-'+name).textContent=summary?summary[name].toLocaleString('th-TH'):'—';
document.querySelectorAll('.unit').forEach(node=>node.textContent=kind==='morning'?'วัน':'คาบ');
for(const name of ['morning','subject']){const selected=kind===name;$(name+'-tab').classList.toggle('selected',selected);$(name+'-tab').setAttribute('aria-pressed',String(selected));}
$('attendance-caption').textContent='ข้อมูลจากระบบดูแลนักเรียน · '+(kind==='morning'?'เข้าแถวเช้า':'เข้าเรียนรายคาบ');
$('attendance-note').textContent=source.ready?'ช่วง '+thaiDate(source.from)+' – '+thaiDate(source.to)+' · บันทึกแล้ว '+summary.recorded+' '+(kind==='morning'?'วัน':'คาบ')+' · นับเฉพาะรายการที่ครูบันทึก วันที่ยังไม่บันทึกไม่ถือว่าขาด':source.reason;
const body=$('attendance-history');body.replaceChildren();const rows=source.ready?source.history.filter(row=>row.kind===kind):[];
for(const row of rows){const tr=el('tr');tr.append(el('td',thaiDate(row.date)),el('td',row.subject+(row.kind==='subject'?' · คาบ '+row.period:'')),el('td',labels[row.status]),el('td',row.note||'—'));body.append(tr);}
if(!rows.length){const tr=el('tr'),td=el('td',source.ready?'ยังไม่มีรายการที่ครูบันทึกในเดือนนี้':'ยังโหลดข้อมูลไม่ได้');td.colSpan=4;tr.append(td);body.append(tr);}
}
function renderSchedule(){
 const plan=(data.schedule.week||[]).find(p=>p.date===scheduleDate)||data.schedule;
 $('schedule-date').textContent=(plan.date===data.date?'วันนี้ · ':'')+thaiDate(plan.date||data.date);
 const lessons=$('lessons');lessons.replaceChildren();
for(const lesson of plan.lessons){const row=el('article',null,'lesson'),period=el('div',null,'lesson-period');period.append(el('span',lesson.period),el('small','คาบ'));const info=el('div',null,'lesson-info');info.append(el('strong',lesson.subject),el('p',(lesson.teachers.join(' / ')||'ยังไม่ระบุครู')+' · '+lesson.room));const time=el('div',lesson.start+'–'+lesson.end,'lesson-time');if(lesson.change)time.append(el('small',lesson.change));row.append(period,info,time);lessons.append(row);}
if(!plan.lessons.length)lessons.append(el('div',plan.ready?'ไม่มีคาบเรียนในวันที่เลือกตามตาราง':plan.reason,'empty'));
$('schedule-note').textContent=plan.ready?'ตารางของ '+data.student.className+' · รวมการแลกคาบและสอนแทนที่บันทึกในระบบต้นทางแล้ว':'กรุณาติดต่อผู้ดูแลหากห้องเรียนยังไม่ตรงกับระบบจัดตารางสอน';
 }
function drawBehaviorDetails(){
 if(!behaviorData)return;const b=behaviorData,filter=$('behavior-filter').value||'all',rows=b.events.filter(r=>filter==='all'||filter==='positive'&&r.delta>0||filter==='negative'&&r.delta<0||filter==='correction'&&r.kind==='correction');
 $('behavior-detail-score').textContent=b.score;const positive=b.events.reduce((n,r)=>n+Math.max(r.delta,0),0),negative=b.events.reduce((n,r)=>n+Math.min(r.delta,0),0);$('behavior-detail-summary').textContent=`คะแนนตั้งต้น ${b.baseScore} · เพิ่มสะสม ${positive} · ลดสะสม ${Math.abs(negative)} · ทั้งหมด ${b.count} รายการ`;
 const host=$('behavior-detail-events');host.replaceChildren();for(const row of rows){const card=el('article',null,'behavior-event'),info=el('div'),label=row.kind==='correction'?'ปรับแก้คะแนน':row.delta>0?'เพิ่มคะแนน':'หักคะแนน';info.append(el('strong',label+' · '+(row.reason||'ไม่ได้ระบุเหตุผล')),el('p',(row.date?thaiDate(row.date):'ไม่ระบุวันที่')+' · '+row.author,'source-note'));if(row.kind==='correction'&&row.recordedAt)info.append(el('small','บันทึกแก้ไข '+new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(row.recordedAt))));card.append(info,el('b',(row.delta>0?'+':'')+row.delta,row.delta>0?'positive':''));host.append(card);}if(!rows.length)host.append(el('p','ยังไม่มีรายการประเภทนี้','empty'));$('behavior-detail-status').textContent=`แสดง ${rows.length} รายการ · ข้อมูลจากระบบดูแลนักเรียน`;
}
async function loadBehaviorDetails(){
 const ownUid=uid,r=++detailSequence;behaviorData=null;$('behavior-detail-events').replaceChildren();$('behavior-detail-score').textContent='—';$('behavior-detail-summary').textContent='';$('behavior-detail-status').textContent='กำลังโหลดประวัติคะแนน…';$('behavior-refresh').disabled=true;
 try{const result=await call('schoolStudent',{method:'behaviorDetails'});if(r!==detailSequence||uid!==ownUid)return;behaviorData=result;drawBehaviorDetails();}catch(error){if(r===detailSequence&&uid===ownUid)$('behavior-detail-status').textContent=error.message;}finally{if(r===detailSequence)$('behavior-refresh').disabled=false;}
}
function setView(force=false){
 if(!data)return;const hash=location.hash.slice(1),next=({showcase:'showcase',exits:'exits',attendance:'attendance',behavior:'behavior',documents:'documents',reports:'reports',grades:'reports',remedial:'remedial'})[hash]||'home',changed=next!==view;view=next;
 const titles={showcase:['เกียรติบัตร / ผลงาน','เลือกหัวข้อ ค้นชื่อ และเปิดหรือดาวน์โหลดเอกสารรายหน้า'],exits:['อนุญาตออกนอกโรงเรียน','เปิดรายการที่อนุมัติแล้วเพื่อแสดงต่อเจ้าหน้าที่ก่อนออกนอกโรงเรียน'],home:['หน้าหลักของฉัน','ข้อมูลนักเรียน การมาเรียน ความประพฤติ และตารางเรียน'],attendance:['สรุปการมาเรียน','ประวัติการเข้าแถวเช้าและเข้าเรียนรายคาบของฉัน'],behavior:['ความประพฤติ','เหตุผลการหักคะแนน การเพิ่มคะแนน และบันทึกการปรับแก้'],documents:['เอกสารอื่น ๆ','เอกสารสำหรับนักเรียน'],reports:['รายงานผลการเรียน','ตารางคะแนนและ PDF รายบุคคลที่วิชาการเผยแพร่'],remedial:['ผลการเรียน 0 ร มส มผ','รายวิชาที่ยังไม่ผ่าน แยกตามปีและภาคเรียน']};
 $('view-title').textContent=titles[view][0];$('view-description').textContent=titles[view][1];$('view-crumb').textContent=titles[view][0];document.title=titles[view][0]+' · ระบบนักเรียน';
 for(const key of Object.keys(titles))$(key+'-view').hidden=key!==view;document.querySelectorAll('nav a').forEach(a=>{const active=a.getAttribute('href')==='#'+view;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $(view==='attendance'?'attendance-detail-slot':'home-attendance-slot').append($('attendance'));$('attendance').classList.toggle('compact-summary',view!=='attendance');$('attendance').querySelector('.history').open=view==='attendance';if(changed)window.scrollTo?.({top:0,behavior:'auto'});if(view==='home'){kind='morning';renderAttendance();}
 if(view==='showcase'&&(changed||force))void studentShowcase.load();if(view==='exits'&&(changed||force))void exitPasses.load();if(view==='reports'&&(changed||force))void gradeReports.load();if(view==='remedial'&&(changed||force))void remedialReports.load();if(['reports','remedial'].includes(view)){$('results-subnav').hidden=false;$('results-toggle').setAttribute('aria-expanded','true');}if(view==='behavior'){if(changed||force||!behaviorData)void loadBehaviorDetails();else drawBehaviorDetails();}
}
function render(){
const student=data.student;$('profile-heading').textContent=student.name;$('student-initial').textContent=student.name.trim().charAt(0)||'น';$('student-code').textContent=student.code||'ยังไม่ระบุ';$('student-room').textContent=student.className;$('student-number').textContent=student.number??'ยังไม่ระบุ';$('student-advisor').textContent=data.schedule.homeroomTeachers.join(' / ')||'ยังไม่พบข้อมูลครูที่ปรึกษา';
const img=$('student-photo');img.hidden=!student.photoUrl;$('student-initial').hidden=Boolean(student.photoUrl);if(student.photoUrl)img.src=student.photoUrl;else img.removeAttribute('src');
$('photo-note').textContent=student.photoUrl&&student.photoSource==='google'?'รูปจากบัญชี Google':'';$('term').textContent='ปีการศึกษา '+data.school.year+' · ภาคเรียนที่ '+data.school.term;$('account-email').textContent='รหัสนักเรียน '+student.code;$('today').textContent=new Intl.DateTimeFormat('th-TH',{dateStyle:'full',timeZone:'Asia/Bangkok'}).format(new Date(data.date+'T12:00:00+07:00'));
$('month').value=data.month;$('month').max=data.date.slice(0,7);const min=new Date(data.date.slice(0,7)+'-01T00:00:00Z');min.setUTCMonth(min.getUTCMonth()-11);$('month').min=min.toISOString().slice(0,7);
renderAttendance();renderCorrection();$('schedule-room').textContent=student.className;
renderSchedule();
$('behavior-score').textContent=data.behavior.ready?data.behavior.score:'—';$('behavior-note').textContent=data.behavior.ready?'คะแนนตั้งต้น '+data.behavior.baseScore+' คะแนน · คำนวณจากรายการในระบบดูแลนักเรียน':data.behavior.reason;
const events=$('behavior-events');events.replaceChildren();if(data.behavior.ready){for(const item of data.behavior.events){const row=el('div',null,'behavior-event'),detail=el('div',item.reason),delta=el('b',(item.delta>0?'+':'')+item.delta,item.delta>0?'positive':'');detail.append(el('span',item.date?thaiDate(item.date):''));row.append(detail,delta);events.append(row);}if(!data.behavior.count)events.append(el('p','ยังไม่มีรายการเพิ่มหรือลดคะแนน','source-note'));}
$('gate').hidden=true;$('app').hidden=false;
 const picker=$('schedule-day');picker.replaceChildren();const plans=data.schedule.week||[];if(!plans.some(p=>p.date===data.date)){const option=el('option','วันนี้ · '+thaiDate(data.date));option.value=data.date;picker.append(option);}for(const plan of plans){const option=el('option',plan.label+(plan.date===data.date?' · วันนี้':'')+' · '+thaiDate(plan.date));option.value=plan.date;picker.append(option);}scheduleDate=data.date;picker.value=scheduleDate;renderSchedule();setView(true);
status([!data.attendance.ready&&data.attendance.reason,!data.behavior.ready&&data.behavior.reason].filter(Boolean).join('\n'));
}
async function load(month){
const ownUid=uid,request=++sequence;$('refresh').disabled=true;$('month').disabled=true;
try{const result=await call('schoolStudent',{method:'dashboard',...(month?{month}:{})});if(request!==sequence||uid!==ownUid)return;data=result;render();}
catch(error){if(request!==sequence||uid!==ownUid)return;if(data&&!['functions/permission-denied','functions/unauthenticated'].includes(error.code)){status(error.message);$('month').value=data.month;}else gate('เข้าสู่ระบบนักเรียน',error.message);}
finally{if(request===sequence){$('refresh').disabled=false;$('month').disabled=false;}}
}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();$('login').disabled=true;$('login-result').textContent='กำลังตรวจสอบรหัสนักเรียน…';try{const code=$('login-code').value.trim(),password=$('login-password').value;const result=await call('schoolStudentLogin',{method:'login',code,password});$('login-password').value='';const c=await firebase();await c.A.signInWithCustomToken(c.auth,result.token);$('login-result').textContent='';}catch(error){$('login-password').value='';$('login-result').textContent=error.message;}finally{$('login').disabled=false;}});
$('logout').addEventListener('click',async()=>{try{await logout();}catch(error){status(error.message);}});
$('retry').addEventListener('click',()=>{if(uid)load();else location.reload();});
$('refresh').addEventListener('click',()=>load(data?.month));$('month').addEventListener('change',()=>{if($('month').value)load($('month').value);});
$('morning-tab').addEventListener('click',()=>{kind='morning';renderAttendance();});$('subject-tab').addEventListener('click',()=>{kind='subject';renderAttendance();});
$('student-photo').addEventListener('error',()=>{$('student-photo').hidden=true;$('student-initial').hidden=false;});
$('results-toggle').onclick=()=>{const hidden=!$('results-subnav').hidden;$('results-subnav').hidden=hidden;$('results-toggle').setAttribute('aria-expanded',String(!hidden));};
window.addEventListener('hashchange',()=>setView());
$('schedule-day').onchange=()=>{scheduleDate=$('schedule-day').value;renderSchedule();};
$('behavior-filter').onchange=drawBehaviorDetails;$('behavior-refresh').onclick=loadBehaviorDetails;
$('request-correction').addEventListener('click',()=>{correctionId=crypto.randomUUID();$('correction-result').textContent='';$('correction-message').value='';$('correction-dialog').showModal();});
$('cancel-correction').addEventListener('click',()=>$('correction-dialog').close());
$('correction-form').addEventListener('submit',async event=>{event.preventDefault();if(sending)return;const message=$('correction-message').value.trim();if(!message){$('correction-message').setCustomValidity('กรุณาระบุรายละเอียด');$('correction-message').reportValidity();return;}const ownUid=uid;sending=true;$('send-correction').disabled=true;$('correction-result').textContent='กำลังส่งคำขอ…';try{await call('schoolStudent',{method:'requestCorrection',message,requestId:correctionId});if(uid!==ownUid)return;$('correction-dialog').close();data.correction={status:'pending',message,reply:''};renderCorrection();status('ส่งคำขอแก้ไขข้อมูลแล้ว รอผู้ดูแลตรวจสอบ');}catch(error){if(uid===ownUid)$('correction-result').textContent=error.message;}finally{sending=false;$('send-correction').disabled=false;}});
$('correction-message').addEventListener('input',()=>$('correction-message').setCustomValidity(''));
try{const c=await firebase();c.A.onAuthStateChanged(c.auth,user=>{sequence++;uid=user?.uid||null;clearPrivate();if(user){$('app').hidden=true;$('gate').hidden=false;$('gate-title').textContent='กำลังโหลดข้อมูลของฉัน';$('gate-message').textContent='เชื่อมข้อมูลจากระบบโรงเรียน';$('login-form').hidden=true;$('retry').hidden=true;load();}else gate('ยินดีต้อนรับสู่ระบบนักเรียน','เข้าสู่ระบบด้วยรหัสประจำตัวนักเรียนและรหัสผ่าน');});}catch(error){gate('เชื่อมต่อระบบไม่ได้',error.message);}
