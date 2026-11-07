'use strict';
const {randomBytes}=require('node:crypto');
const {assertAdmin}=require('./content-model');
const {hash,fail}=require('./student-data');
const {digest}=require('./student-password');
const nameKey=v=>String(v||'').normalize('NFKC').replace(/[\s\u200b.]/g,'').replace(/^(เด็กชาย|เด็กหญิง|นางสาว|นาย|นาง|ดช|ดญ)/,'');
const roomKey=v=>String(v||'').normalize('NFKC').replace(/[\s\u200b.]/g,'').replace(/^มัธยมศึกษาปีที่/,'ม');
const {birthdayPassword}=require('./student-birthday');
function service(db,stamp,clock=()=>Date.now()){
 const credential=code=>db.doc('school_student_passwords/'+hash(code));
 async function admin(request,tx){if(!request.auth)fail('กรุณาเข้าสู่ระบบผู้ดูแล','unauthenticated');assertAdmin(request.auth,(await (tx?tx.get(db.doc('school_users/'+request.auth.uid)):db.doc('school_users/'+request.auth.uid).get())).data());}
 async function preview(request,i){
  if(!Number.isInteger(i.year)||i.year<2500||i.year>2700||![1,2].includes(i.term)||!['birthdates','passwords'].includes(i.mode)||!Array.isArray(i.rows)||!i.rows.length||i.rows.length>2000||typeof i.filename!=='string'||i.filename.length>200)fail('ข้อมูลนำเข้าไม่ถูกต้อง');
  const codes=new Set();for(const r of i.rows){if(!r||Object.keys(r).some(k=>!['row','code','name','className','birthDate'].includes(k))||!Number.isInteger(r.row)||typeof r.code!=='string'||!/^\d{5}$/.test(r.code)||codes.has(r.code)||typeof r.name!=='string'||!r.name.trim()||r.name.length>200||typeof r.className!=='string'||!/^ม\.[1-6]\/\d{1,2}$/.test(r.className))fail('รหัสนักเรียน ชื่อ หรือห้องไม่ถูกต้อง หรือมีรหัสซ้ำ');birthdayPassword(r.birthDate);codes.add(r.code);}
  const rooms=(await db.collection('attendance_classes').where('active','==',true).get()).docs.filter(d=>Number(d.data().academicYear)===i.year&&Number(d.data().term)===i.term);
  const roster=new Map();for(const room of rooms){const students=await db.collection(room.ref.path+'/students').get();for(const s of students.docs){if(s.data().active===false)continue;const code=String(s.data().code||'').trim();if(!codes.has(code))continue;const list=roster.get(code)||[];list.push({classId:room.id,studentId:s.id,name:s.data().name,className:room.data().name});roster.set(code,list);}}
  const eligible=[],review=[];
  for(const row of i.rows){const matches=roster.get(row.code)||[];let reason=matches.length===0?'ไม่พบรหัสในทะเบียนปี/ภาคเรียนที่เลือก':matches.length>1?'รหัสซ้ำในทะเบียน':nameKey(matches[0].name)!==nameKey(row.name)?'ชื่อไม่ตรงกับทะเบียน':roomKey(matches[0].className)!==roomKey(row.className)?'ห้องไม่ตรงกับทะเบียน':'';
   const old=reason?null:(await credential(row.code).get()).data();if(!reason&&old&&(old.classId!==matches[0].classId||old.studentId!==matches[0].studentId))reason='บัญชีเดิมผูกกับรายชื่ออื่น กรุณาตรวจสอบก่อน';
   if(!reason)eligible.push({...row,...matches[0],expectedVersion:old?.version||0});
   review.push({row:row.row,code:row.code,name:row.name,className:row.className,ready:!reason,message:reason|| (i.mode==='passwords'?(old?.active?'อัปเดตวันเกิดและรีเซ็ตรหัสผ่าน':'อัปเดตวันเกิดและเปิดใช้บัญชี'):'อัปเดตเฉพาะวันเกิด')});
  }
  if(Buffer.byteLength(JSON.stringify(eligible))>700000)fail('ชุดข้อมูลใหญ่เกินกำหนด');
  const ref=db.collection('school_student_imports').doc();await db.runTransaction(async tx=>{await admin(request,tx);tx.set(ref,{owner:request.auth.uid,filename:i.filename,year:i.year,term:i.term,mode:i.mode,rows:eligible,total:eligible.length,cursor:0,expiresAt:clock()+3600000,createdAt:stamp(),status:'review'});});
  return {jobId:ref.id,total:i.rows.length,ready:eligible.length,skipped:review.length-eligible.length,review};
 }
 async function apply(request,i){
  if(typeof i.jobId!=='string'||!/^\w{1,100}$/.test(i.jobId)||!Number.isInteger(i.cursor)||i.cursor<0)fail('ชุดนำเข้าไม่ถูกต้อง');
  const ref=db.doc('school_student_imports/'+i.jobId),job=(await ref.get()).data();
  if(!job||job.owner!==request.auth.uid)fail('ไม่พบชุดนำเข้า','permission-denied');if(job.expiresAt<clock())fail('ชุดนำเข้าหมดอายุ กรุณาตรวจไฟล์ใหม่','failed-precondition');
  if(i.cursor<job.cursor||job.status==='done')return {cursor:job.cursor,total:job.total,done:job.status==='done'};
  if(i.cursor!==job.cursor)fail('ลำดับนำเข้าเปลี่ยน กรุณาลองต่ออีกครั้ง','aborted');
  const chunk=job.rows.slice(i.cursor,i.cursor+15),hashes=[];
  for(const row of chunk){if(job.mode==='passwords'){const salt=randomBytes(24).toString('hex');hashes.push({salt,passwordHash:await digest(birthdayPassword(row.birthDate),salt)});}else hashes.push(null);}
  return db.runTransaction(async tx=>{
   await admin(request,tx);const live=(await tx.get(ref)).data();if(!live||live.owner!==request.auth.uid||live.expiresAt<clock())fail('ชุดนำเข้าไม่พร้อม','failed-precondition');
   if(live.cursor!==i.cursor)return {cursor:live.cursor,total:live.total,done:live.status==='done'};
   const records=[];for(const row of chunk){const room=await tx.get(db.doc('attendance_classes/'+row.classId)),student=await tx.get(db.doc('attendance_classes/'+row.classId+'/students/'+row.studentId)),prior=await tx.get(credential(row.code));records.push({row,room:room.data(),student:student.data(),old:prior.data()});}
   for(const {row,room,student,old}of records){if(room?.active!==true||Number(room.academicYear)!==job.year||Number(room.term)!==job.term||roomKey(room.name)!==roomKey(row.className)||!student||student.active===false||String(student.code).trim()!==row.code||nameKey(student.name)!==nameKey(row.name)||(old?.version||0)!==row.expectedVersion||old&&(old.classId!==row.classId||old.studentId!==row.studentId))fail('ทะเบียนหรือบัญชีเปลี่ยนหลังตรวจไฟล์ กรุณาตรวจไฟล์ใหม่','aborted');}
   records.forEach(({row,old},index)=>{const next={...old,code:row.code,classId:row.classId,studentId:row.studentId,birthDate:row.birthDate,active:old?.active===true,version:old?.version||0,birthDateImport:i.jobId,updatedBy:request.auth.uid,updatedAt:stamp()};if(job.mode==='passwords')Object.assign(next,hashes[index],{active:true,version:next.version+1,passwordMode:'birthday'});tx.set(credential(row.code),next);});
   const cursor=i.cursor+chunk.length,done=cursor===job.total;tx.update(ref,{cursor,status:done?'done':'importing',...(done?{rows:[],completedAt:stamp()}:{} )});
   tx.set(db.collection('school_student_audit').doc(),{action:'import-student-birthdates',jobId:i.jobId,mode:job.mode,count:chunk.length,uid:request.auth.uid,createdAt:stamp()});return {cursor,total:job.total,done};
  });
 }
 return {async handle(request){await admin(request);const i=request.data||{};if(i.method==='preview')return preview(request,i);if(i.method==='studentImportApply')return apply(request,i);fail('คำสั่งไม่ถูกต้อง');}};
}
module.exports={service,birthdayPassword,nameKey,roomKey};
