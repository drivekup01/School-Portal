import {firebase,logout,call} from '../shared/school-auth.js?v=20261027-roles1';
const $=id=>document.getElementById(id),el=(tag,text,className)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;if(className)node.className=className;return node;};
const labels={present:'มาเรียน',late:'สาย',leave:'ลา',absent:'ขาด'},thaiDate=value=>new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(value+'T12:00:00+07:00'));
let data=null,kind='morning',uid=null,sequence=0,sending=false,correctionId=null;
function clearPrivate(){data=null;$('correction-dialog').close();$('correction-message').value='';for(const id of ['account-email','profile-heading','student-code','student-room','student-number','student-advisor','student-initial','correction-state','behavior-score','term','schedule-room','attendance-note','behavior-note','schedule-note','photo-note','count-present','count-late','count-leave','count-absent'])$(id).textContent='';for(const id of ['lessons','behavior-events','attendance-history'])$(id).replaceChildren();$('student-photo').removeAttribute('src');}
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
function render(){
const student=data.student;$('profile-heading').textContent=student.name;$('student-initial').textContent=student.name.trim().charAt(0)||'น';$('student-code').textContent=student.code||'ยังไม่ระบุ';$('student-room').textContent=student.className;$('student-number').textContent=student.number??'ยังไม่ระบุ';$('student-advisor').textContent=data.schedule.homeroomTeachers.join(' / ')||'ยังไม่พบข้อมูลครูที่ปรึกษา';
const img=$('student-photo');img.hidden=!student.photoUrl;$('student-initial').hidden=Boolean(student.photoUrl);if(student.photoUrl)img.src=student.photoUrl;else img.removeAttribute('src');
$('photo-note').textContent=student.photoUrl&&student.photoSource==='google'?'รูปจากบัญชี Google':'';$('term').textContent='ปีการศึกษา '+data.school.year+' · ภาคเรียนที่ '+data.school.term;$('account-email').textContent='รหัสนักเรียน '+student.code;$('today').textContent=new Intl.DateTimeFormat('th-TH',{dateStyle:'full',timeZone:'Asia/Bangkok'}).format(new Date(data.date+'T12:00:00+07:00'));
$('month').value=data.month;$('month').max=data.date.slice(0,7);const min=new Date(data.date.slice(0,7)+'-01T00:00:00Z');min.setUTCMonth(min.getUTCMonth()-11);$('month').min=min.toISOString().slice(0,7);
renderAttendance();renderCorrection();$('schedule-room').textContent=student.className;
const lessons=$('lessons');lessons.replaceChildren();
for(const lesson of data.schedule.lessons){const row=el('article',null,'lesson'),period=el('div',null,'lesson-period');period.append(el('span',lesson.period),el('small','คาบ'));const info=el('div',null,'lesson-info');info.append(el('strong',lesson.subject),el('p',(lesson.teachers.join(' / ')||'ยังไม่ระบุครู')+' · '+lesson.room));const time=el('div',lesson.start+'–'+lesson.end,'lesson-time');if(lesson.change)time.append(el('small',lesson.change));row.append(period,info,time);lessons.append(row);}
if(!data.schedule.lessons.length)lessons.append(el('div',data.schedule.ready?'วันนี้ไม่มีคาบเรียนตามตาราง':data.schedule.reason,'empty'));
$('schedule-note').textContent=data.schedule.ready?'ตารางของ '+student.className+' · รวมการแลกคาบและสอนแทนที่บันทึกในระบบต้นทางแล้ว':'กรุณาติดต่อผู้ดูแลหากห้องเรียนยังไม่ตรงกับระบบจัดตารางสอน';
$('behavior-score').textContent=data.behavior.ready?data.behavior.score:'—';$('behavior-note').textContent=data.behavior.ready?'คะแนนตั้งต้น '+data.behavior.baseScore+' คะแนน · คำนวณจากรายการในระบบดูแลนักเรียน':data.behavior.reason;
const events=$('behavior-events');events.replaceChildren();if(data.behavior.ready){for(const item of data.behavior.events){const row=el('div',null,'behavior-event'),detail=el('div',item.reason),delta=el('b',(item.delta>0?'+':'')+item.delta,item.delta>0?'positive':'');detail.append(el('span',item.date?thaiDate(item.date):''));row.append(detail,delta);events.append(row);}if(!data.behavior.count)events.append(el('p','ยังไม่มีรายการเพิ่มหรือลดคะแนน','source-note'));}
$('gate').hidden=true;$('app').hidden=false;
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
document.querySelectorAll('nav a[href^="#"]').forEach(link=>link.addEventListener('click',()=>document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a===link))));
$('request-correction').addEventListener('click',()=>{correctionId=crypto.randomUUID();$('correction-result').textContent='';$('correction-message').value='';$('correction-dialog').showModal();});
$('cancel-correction').addEventListener('click',()=>$('correction-dialog').close());
$('correction-form').addEventListener('submit',async event=>{event.preventDefault();if(sending)return;const message=$('correction-message').value.trim();if(!message){$('correction-message').setCustomValidity('กรุณาระบุรายละเอียด');$('correction-message').reportValidity();return;}const ownUid=uid;sending=true;$('send-correction').disabled=true;$('correction-result').textContent='กำลังส่งคำขอ…';try{await call('schoolStudent',{method:'requestCorrection',message,requestId:correctionId});if(uid!==ownUid)return;$('correction-dialog').close();data.correction={status:'pending',message,reply:''};renderCorrection();status('ส่งคำขอแก้ไขข้อมูลแล้ว รอผู้ดูแลตรวจสอบ');}catch(error){if(uid===ownUid)$('correction-result').textContent=error.message;}finally{sending=false;$('send-correction').disabled=false;}});
$('correction-message').addEventListener('input',()=>$('correction-message').setCustomValidity(''));
try{const c=await firebase();c.A.onAuthStateChanged(c.auth,user=>{sequence++;uid=user?.uid||null;clearPrivate();if(user){$('app').hidden=true;$('gate').hidden=false;$('gate-title').textContent='กำลังโหลดข้อมูลของฉัน';$('gate-message').textContent='เชื่อมข้อมูลจากระบบโรงเรียน';$('login-form').hidden=true;$('retry').hidden=true;load();}else gate('ยินดีต้อนรับสู่ระบบนักเรียน','เข้าสู่ระบบด้วยรหัสประจำตัวนักเรียนและรหัสผ่าน');});}catch(error){gate('เชื่อมต่อระบบไม่ได้',error.message);}
