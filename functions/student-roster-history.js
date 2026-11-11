'use strict';
const D=require('./student-data');
// Locations are written by the transfer transaction, never selected by a student.
async function locations(db,ctx){
 const history=ctx.student.rosterHistory||[];
 if(!Array.isArray(history)||history.length>30)D.fail('ประวัติห้องเรียนไม่ถูกต้อง','failed-precondition');
 const refs=[...history,{classId:ctx.link.classId,studentId:ctx.link.studentId}],seen=new Set(),result=[];
 for(const location of refs){
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(location.classId||'')||!/^[A-Za-z0-9_-]{1,128}$/.test(location.studentId||''))D.fail('ประวัติห้องเรียนไม่ถูกต้อง','failed-precondition');
  const key=location.classId+'/'+location.studentId;if(seen.has(key))continue;seen.add(key);
  const student=(await db.doc('attendance_classes/'+key.replace('/','/students/')).get()).data();
  if(!student||String(student.code).trim()!==String(ctx.student.code).trim())D.fail('ทะเบียนย้อนหลังไม่ตรงกับรหัสนักเรียน','failed-precondition');
  result.push(location);
 }
 return result;
}
async function attendance(db,ctx,range){
 const places=await locations(db,ctx),rows=[];
 for(const place of places){const r=await D.attendance(db,place.classId,place.studentId,range);rows.push(...r.history.map(h=>({...h,canonical:place.classId===ctx.link.classId&&place.studentId===ctx.link.studentId})));}
 return {...D.summarizeMarks(rows),...range};
}
async function behavior(db,ctx,detailed=false){
 const places=await locations(db,ctx),results=[];
 for(const place of places)results.push(await D.behavior(db,place.classId,place.studentId,true,true));
 const events=results.flatMap(r=>r.events).sort((a,b)=>String(b.recordedAt).localeCompare(String(a.recordedAt)));
 return {baseScore:100,score:100+results.reduce((n,r)=>n+r.score-100,0),count:results.reduce((n,r)=>n+r.count,0),events:events.slice(0,detailed?2000:10)};
}
module.exports={attendance,behavior};
