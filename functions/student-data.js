'use strict';
const {createHash}=require('node:crypto');
const fail=(message,code='invalid-argument')=>{throw Object.assign(Error(message),{code});};
const dayAt=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
const dateOf=value=>value?.toDate?dayAt(value.toDate()):typeof value==='string'?value.slice(0,10):'';
const epoch=value=>value?.toMillis?.()||value?.toDate?.().getTime()||0;
const norm=value=>String(value||'').replace(/\s+/g,'');
const teacherName=value=>((value.prefix||'')+(value.first||'')+' '+(value.last||'')).trim();
const hash=value=>createHash('sha256').update(value).digest('hex');
function monthRange(month,now=new Date()){
  const today=dayAt(now),min=new Date(today.slice(0,7)+'-01T00:00:00Z');min.setUTCMonth(min.getUTCMonth()-11);
  if(typeof month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month>today.slice(0,7)||month<min.toISOString().slice(0,7))fail('เลือกเดือนได้ย้อนหลัง 12 เดือน และไม่เกินเดือนปัจจุบัน');
  const end=new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate();
  return {from:month+'-01',to:[month+'-'+end,today].sort()[0]};
}
async function readTimetable(db){
  const pointer=await db.doc('timetable_state/current').get();if(!pointer.exists)return null;
  const version=pointer.data().version;if(typeof version!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(version))fail('เวอร์ชันตารางเรียนไม่ถูกต้อง','failed-precondition');
  const ref=db.doc('timetable_versions/'+version),snap=await ref.get(),meta=snap.data();
  if(!snap.exists||meta.status!=='ready'||!Number.isInteger(meta.partCount)||meta.partCount<1||meta.partCount>100)fail('ตารางเรียนต้นทางยังไม่พร้อม','failed-precondition');
  const parts=await ref.collection('parts').get(),chunks=[];
  for(const part of parts.docs){const i=Number(part.id);if(!Number.isInteger(i)||i<0||i>=meta.partCount||typeof part.data().json!=='string')fail('ข้อมูลตารางเรียนไม่ครบ','failed-precondition');chunks[i]=part.data().json;}
  const json=chunks.join('');if(chunks.filter(v=>typeof v==='string').length!==meta.partCount||hash(json)!==meta.hash)fail('ข้อมูลตารางเรียนไม่ครบ','failed-precondition');
  return {data:JSON.parse(json),version};
}
function roomFor(data,room){
  if(!data||Number(data.school.year)!==room.academicYear||Number(data.school.semester)!==room.term)return null;
  const rooms=data.rooms.filter(r=>norm(r.label)===norm(room.name));return rooms.length===1?rooms[0]:null;
}
function schedule(data,room,date){
  const source=roomFor(data,room);if(!source)return {ready:false,reason:'ยังไม่พบห้องเรียนที่ตรงกันในตารางสอนภาคเรียนปัจจุบัน',lessons:[],homeroomTeachers:[]};
  const weekday=new Date(date+'T12:00:00+07:00').getUTCDay(),day=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'][weekday];
  const homeroomTeachers=[source.homeroom,source.homeroom2,source.homeroom3].filter(Boolean).map(id=>data.teachers.find(t=>t.id===id)).filter(Boolean).map(teacherName);
  const lessons=[];
  if(data.days.includes(day))for(const [index,slot] of data.slots.entries()){
    if(slot.isBreak||slot.teacherOnly)continue;
    let cell=data.sched[source.id+'_'+slot.id+'_'+day],changed='';
    for(const exchange of Object.values(data.exchanges||{})){
      if(!exchange.active||Number(exchange.year)!==room.academicYear||Number(exchange.term)!==room.term)continue;
      for(const key of ['a','b']){const side=exchange[key],other=exchange[key==='a'?'b':'a'];if(side?.date===date&&side.roomId===source.id&&String(side.slotId)===String(slot.id)){cell=other.lesson;changed='แลกคาบ';}}
    }
    if(!cell?.subject)continue;
    let teachers=[cell.teacher,cell.teacher2,cell.teacher3].filter(Boolean);
    if(!changed)for(const absence of data.substitute?.[date]?.absentList||[])for(const item of absence.periods||[]){if(item.roomId===source.id&&String(item.slotId)===String(slot.id)&&item.subject===cell.subject&&item.subTeacher){teachers=[item.subTeacher];changed='สอนแทน';}}
    lessons.push({period:Number(String(slot.label).match(/\d+/)?.[0]||index+1),label:slot.label,start:slot.start||'',end:slot.end||'',subject:cell.subject,teachers,room:cell.learnRoom||source.baseRoom||source.label,change:changed});
  }
  return {ready:true,date,homeroomTeachers,lessons};
}
function scheduleWeek(data,room,today){
 const start=new Date(today+'T12:00:00+07:00'),weekday=start.getUTCDay();start.setUTCDate(start.getUTCDate()-(weekday===0?6:weekday-1));
 return Array.from({length:5},(_,i)=>{const d=new Date(start);d.setUTCDate(start.getUTCDate()+i);const date=d.toISOString().slice(0,10);return {weekday:i+1,label:['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์'][i],...schedule(data,room,date),date};});
}
  const zero=()=>({present:0,late:0,leave:0,absent:0,recorded:0});
function summarizeMarks(rows){
  const latest=new Map();
  for(const row of rows){if(!['present','late','leave','absent'].includes(row.status))continue;const key=row.kind==='morning'?row.date:row.date+'|'+row.period+'|'+row.subject,old=latest.get(row.kind+'|'+key);if(!old||epoch(row.updatedAt)>epoch(old.updatedAt)||epoch(row.updatedAt)===epoch(old.updatedAt)&&row.canonical&&!old.canonical)latest.set(row.kind+'|'+key,row);}
  const morning=zero(),subject=zero(),history=[...latest.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.period-b.period);
  for(const row of history){const target=row.kind==='morning'?morning:subject;target[row.status]++;target.recorded++;}
  return {morning,subject,history:history.map(({updatedAt,canonical,...row})=>row)};
}
async function attendance(db,classId,studentId,range){
  const jobs=(await db.collection('attendance_assignments').where('classId','==',classId).get()).docs.map(d=>({id:d.id,...d.data()}));
  if(jobs.length>250)fail('รายการเช็คชื่อห้องนี้มีจำนวนมาก กรุณาติดต่อผู้ดูแล','resource-exhausted');
  const reads=[];
  for(let day=new Date(range.from+'T00:00:00Z');day<=new Date(range.to+'T00:00:00Z');day.setUTCDate(day.getUTCDate()+1)){
    const date=day.toISOString().slice(0,10),key=date.replaceAll('-','');
    reads.push({ref:db.doc('attendance_morning_sessions/'+classId+'_'+key+'/marks/'+studentId),date,kind:'morning',period:0,subject:'เข้าแถวเช้า',canonical:true});
    for(const job of jobs){
      const morning=job.kind==='morning';if(!morning&&(!['subject','substitute'].includes(job.kind)||date<dateOf(job.from)||date>dateOf(job.to)||(job.kind==='substitute'?dateOf(job.date)!==date:job.weekday!==day.getUTCDay())))continue;
      reads.push({ref:db.doc('attendance_assignments/'+job.id+'/days/'+key+'/marks/'+studentId),date,kind:morning?'morning':'subject',period:job.period||0,subject:morning?'เข้าแถวเช้า':job.subject||''});
    }
  }
  if(reads.length>2500)fail('รายการเช็คชื่อมากเกินขอบเขต กรุณาติดต่อผู้ดูแล','resource-exhausted');
  const rows=[];
  for(let offset=0;offset<reads.length;offset+=200){const slice=reads.slice(offset,offset+200),snaps=await db.getAll(...slice.map(r=>r.ref));for(let i=0;i<snaps.length;i++){const value=snaps[i].data();if(!value||value.classId!==classId||value.studentId!==studentId)continue;const {ref,...source}=slice[i];rows.push({...source,status:value.status,note:String(value.note||'').slice(0,300),updatedAt:value.updatedAt});}}
  return {...summarizeMarks(rows),...range};
}
async function behavior(db,classId,studentId,detailed=false){
  const result=await db.collection('attendance_behavior').where('classId','==',classId).where('studentId','==',studentId).limit(2001).get();
  if(result.docs.length>2000)fail('รายการคะแนนมีจำนวนมาก กรุณาติดต่อฝ่ายดูแลนักเรียน','resource-exhausted');
  const rows=result.docs.map(d=>d.data()).filter(d=>d.classId===classId&&d.studentId===studentId);
  if(rows.some(d=>!Number.isFinite(d.delta)))fail('ข้อมูลคะแนนต้นทางไม่ถูกต้อง','failed-precondition');
  return {baseScore:100,score:100+rows.reduce((sum,row)=>sum+row.delta,0),count:rows.length,events:rows.sort((a,b)=>epoch(b.createdAt)-epoch(a.createdAt)).slice(0,detailed?2000:10).map(row=>({date:dateOf(row.day),delta:row.delta,reason:(row.sourceRequestId?String(row.reason||'').replace(row.sourceRequestId,''):String(row.reason||'')).replace(/\s+/g,' ').trim().slice(0,300),category:row.category||'other',kind:row.requestRevision!==undefined||/^(แก้ไข|ยกเลิก)คำร้อง/.test(row.reason||'')?'correction':'record',author:String(row.authorName||'ครูผู้บันทึก').slice(0,150),recordedAt:row.createdAt?.toDate?.().toISOString()||''}))};
}
module.exports={scheduleWeek,fail,dayAt,dateOf,hash,monthRange,readTimetable,roomFor,schedule,summarizeMarks,attendance,behavior};
