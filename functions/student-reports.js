'use strict';
const {createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const personName=s=>String(s||'').normalize('NFKC').replace(/\s/g,'').replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นางสาว|น\.ส\.)/,'');
const ownerKey=(code,name)=>hash(JSON.stringify([code,personName(name)]));
const fail=(message,code='permission-denied')=>{throw Object.assign(Error(message),{code});};
function service(db,storage,own){
 const bucket=storage.bucket('school-budget-3e69d-student-reports');
 const root=code=>'school_grade_students/'+hash(code)+'/reports';
 const time=v=>v?.toDate?.().toISOString()||'';
 const summary=(id,v)=>({id,year:v.year,term:v.term,kind:v.kind,className:v.className||'',publishedAt:time(v.publishedAt)});
 async function handle(request){
  const input=request.data||{},fields={list:['method'],get:['method','id'],pdf:['method','id']};
  if(!Object.hasOwn(fields,input.method)||Object.keys(input).some(k=>!fields[input.method].includes(k))||input.method!=='list'&&!/^\d{4}_[12]_(final|midterm)$/.test(input.id||''))fail('คำขอผลการเรียนไม่ถูกต้อง','invalid-argument');
  const context=await own(request),code=String(context.student.code||'').trim();const ownership=ownerKey(code,context.student.name);if(!/^\d{1,20}$/.test(code))fail('ยังไม่พบรหัสนักเรียนที่พร้อมใช้งาน');
  const verify=async()=>{const live=await own(request);if(String(live.student.code).trim()!==code||ownerKey(code,live.student.name)!==ownership||live.link.classId!==context.link.classId||live.link.studentId!==context.link.studentId)fail('การผูกบัญชีเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่');};
  if(input.method==='list'){const snap=await db.collection(root(code)).orderBy('__name__','desc').limit(50).get();await verify();return {reports:snap.docs.filter(d=>d.data().published===true&&d.data().ownerKey===ownership).map(d=>summary(d.id,d.data()))};}
  const ref=db.doc(root(code)+'/'+input.id),snap=await ref.get(),report=snap.data();if(!snap.exists||!report.published||report.code!==code||report.ownerKey!==ownership)fail('ยังไม่มีผลการเรียนที่เผยแพร่สำหรับบัญชีนี้','not-found');
  if(input.method==='get'){
   await verify();const live=(await ref.get()).data();if(!live?.published||live.batchId!==report.batchId)fail('ผลการเรียนเปลี่ยนแปลง กรุณาโหลดใหม่','aborted');
   return {...summary(input.id,report),gpa:report.gpa??null,cumulativeGpa:report.cumulativeGpa??null,courses:report.courses.map(c=>({code:c.code,name:c.name,group:c.group,credits:c.credits,maximum:c.maximum,score:c.score,grade:c.grade,retake:c.retake,attributes:c.attributes,analysis:c.analysis}))};
  }
  if(!/^[a-f0-9]{64}$/.test(report.batchId)||!Number.isInteger(report.page)||report.page<1||report.page>100)fail('ไฟล์ผลการเรียนยังไม่พร้อม','failed-precondition');
  const [bytes]=await bucket.file('batches/'+report.batchId+'/pages/'+report.page+'.pdf').download();
  await verify();const live=(await ref.get()).data();if(!live?.published||live.batchId!==report.batchId||live.page!==report.page)fail('ผลการเรียนเปลี่ยนแปลง กรุณาโหลดใหม่','aborted');
  return {base64:bytes.toString('base64'),filename:'ผลการเรียน_'+report.year+'_'+report.term+'_'+report.kind+'.pdf'};
 }
 return {handle};
}
module.exports={service};
