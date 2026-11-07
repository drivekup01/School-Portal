'use strict';
const M=require('./remedial-model');
function service(db,stamp,own){
 const ref=id=>db.doc('school_remedial_cases/'+id);
 async function verify(request,ctx){const live=await own(request);if(live.link.classId!==ctx.link.classId||live.link.studentId!==ctx.link.studentId||String(live.student.code)!==String(ctx.student.code)||M.ownerKey(live.student.code,live.student.name)!==M.ownerKey(ctx.student.code,ctx.student.name))M.fail('การผูกบัญชีเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่','permission-denied');}
 const owned=(d,c)=>d?.published===true&&!['archived','completed'].includes(d.state)&&d.studentKey===M.hash(String(c.student.code))&&d.ownerKey===M.ownerKey(c.student.code,c.student.name);
 const view=(id,d,c)=>{const out={id,studentName:c.student.name,currentClassName:c.room.name};for(const k of ['code','originalClassName','year','term','courseCode','courseName','teacherName','originalGrade'])out[k]=d[k]??null;return out;};
 async function handle(request){const i=request.data||{},fields={list:[],detail:['caseId']};if(!Object.hasOwn(fields,i.method)||Object.keys(i).some(k=>k!=='method'&&!fields[i.method].includes(k)))M.fail('คำขอไม่ถูกต้อง');if(i.method!=='list'&&!/^[a-f0-9]{64}$/.test(i.caseId||''))M.fail('รหัสรายการไม่ถูกต้อง');const ctx=await own(request);
  if(i.method==='list'){const result=await db.collection('school_remedial_cases').where('studentKey','==',M.hash(String(ctx.student.code))).limit(501).get();await verify(request,ctx);if(result.docs.length>500)M.fail('มีรายการจำนวนมาก กรุณาติดต่อฝ่ายวิชาการ','resource-exhausted');return {cases:result.docs.filter(d=>owned(d.data(),ctx)).map(d=>view(d.id,d.data(),ctx))};}
  if(i.method==='detail'){const snap=await ref(i.caseId).get();if(!owned(snap.data(),ctx))M.fail('ไม่พบผลการเรียนสำหรับบัญชีนี้','not-found');await verify(request,ctx);const live=(await ref(i.caseId).get()).data();if(!owned(live,ctx))M.fail('รายการเปลี่ยนแปลง กรุณาโหลดใหม่','aborted');return {case:view(i.caseId,live,ctx)};}

 }
 return {handle};
}
module.exports={service};
