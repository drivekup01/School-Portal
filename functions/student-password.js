'use strict';
const {scrypt,randomBytes,timingSafeEqual}=require('node:crypto'),{promisify}=require('node:util');
const {hash,fail}=require('./student-data'),{assertAdmin}=require('./content-model');
const {birthdayPassword}=require('./student-birthday');
const derive=promisify(scrypt),validCode=v=>typeof v==='string'&&/^\d{1,20}$/.test(v),validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const uidFor=code=>'student_'+hash(code);
async function digest(password,salt){return (await derive(password,salt,64,{N:16384,r:8,p:1,maxmem:33554432})).toString('hex');}
function service(db,stamp,createToken,clock=()=>Date.now()){
 const ref=code=>db.doc('school_student_passwords/'+hash(code));
 async function admin(request,tx){assertAdmin(request.auth,(await tx.get(db.doc('school_users/'+request.auth?.uid))).data());}
 async function throttle(code,ip){
  const now=clock(),keys=[['code',hash(code),6],['ip',hash(ip||'unknown'),2000]];
  return db.runTransaction(async tx=>{const rows=await Promise.all(keys.map(async([kind,key,max])=>{const target=db.doc('school_student_login_limits/'+kind+'_'+key),old=(await tx.get(target)).data();return {target,max,count:old&&old.until>now?old.count:0,until:old&&old.until>now?old.until:now+900000};}));if(rows.some(r=>r.count>=r.max))return false;for(const row of rows)tx.set(row.target,{count:row.count+1,until:row.until});return true;});
 }
 async function login(request,input){
  if(Object.keys(input).some(k=>!['method','code','password'].includes(k))||!validCode(input.code)||typeof input.password!=='string'||!input.password||input.password.length>128)fail('รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง','unauthenticated');
  if(!(await throttle(input.code,request.rawRequest?.ip)))fail('ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที','resource-exhausted');
  const snap=await ref(input.code).get(),account=snap.data(),salt=account?.salt||'unregistered-account-constant',actual=await digest(input.password,salt),expected=account?.passwordHash||'0'.repeat(128);
  const matches=/^[a-f0-9]{128}$/.test(expected)&&timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'));
  if(!matches||!account?.active||account.code!==input.code)fail('รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง','unauthenticated');
  const [room,student]=await Promise.all([db.doc('attendance_classes/'+account.classId).get(),db.doc('attendance_classes/'+account.classId+'/students/'+account.studentId).get()]);
  if(!room.exists||room.data().active!==true||!student.exists||student.data().active===false||String(student.data().code).trim()!==input.code)fail('บัญชีนักเรียนยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแล','permission-denied');
  const live=(await ref(input.code).get()).data();if(!live?.active||live.version!==account.version||live.classId!==account.classId||live.studentId!==account.studentId)fail('บัญชีเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่','aborted');
  const token=await createToken(uidFor(input.code),{studentLogin:true,studentCode:input.code,studentSession:account.version});return {token};
 }
 async function provision(request,input){
  if(!request.auth)fail('กรุณาเข้าสู่ระบบผู้ดูแล','unauthenticated');
  assertAdmin(request.auth,(await db.doc('school_users/'+request.auth.uid).get()).data());
  const bulk=input.method==='adminEnableClass',allowed=bulk?['method','classId']:['method','classId','studentId'];
  if(!['adminEnable','adminEnableClass','adminReset','adminDisable'].includes(input.method)||Object.keys(input).some(k=>!allowed.includes(k))||!validId(input.classId)||!bulk&&!validId(input.studentId))fail('คำขอไม่ถูกต้อง');
  const roster=bulk?(await db.collection('attendance_classes/'+input.classId+'/students').get()).docs.filter(d=>d.data().active!==false):[await db.doc('attendance_classes/'+input.classId+'/students/'+input.studentId).get()];
  if(!roster.length||roster.length>100||roster.some(d=>!d.exists||!validCode(String(d.data().code).trim())))fail('รายชื่อนักเรียนหรือรหัสประจำตัวยังไม่พร้อม');
  if(new Set(roster.map(d=>String(d.data().code).trim())).size!==roster.length)fail('มีรหัสประจำตัวซ้ำในห้อง กรุณาแก้ไขข้อมูลต้นทางก่อน');
  // Hash the temporary password separately for every account. No plaintext password is stored.
  const hashes=[];for(const d of roster){const code=String(d.data().code).trim(),previous=(await ref(code).get()).data(),salt=randomBytes(24).toString('hex'),birthDate=previous?.birthDate||null;hashes.push({studentId:d.id,code,salt,birthDate,expectedVersion:previous?.version||0,passwordHash:await digest(birthDate?birthdayPassword(birthDate):'123456',salt)});}
  return db.runTransaction(async tx=>{
   await admin(request,tx);const room=await tx.get(db.doc('attendance_classes/'+input.classId));if(!room.exists||room.data().active!==true)fail('ห้องเรียนปิดใช้งานแล้ว','failed-precondition');
   const rows=await Promise.all(hashes.map(async h=>({h,student:await tx.get(db.doc('attendance_classes/'+input.classId+'/students/'+h.studentId)),old:await tx.get(ref(h.code))})));
   for(const {h,student,old}of rows){if(!student.exists||student.data().active===false||String(student.data().code).trim()!==h.code)fail('ทะเบียนนักเรียนเปลี่ยนแล้ว กรุณาโหลดใหม่','aborted');const previous=old.data();if((previous?.version||0)!==h.expectedVersion||(previous?.birthDate||null)!==h.birthDate)fail('ข้อมูลบัญชีเปลี่ยน กรุณาโหลดใหม่','aborted');if(previous?.active&&(previous.classId!==input.classId||previous.studentId!==h.studentId))fail('รหัสนักเรียนนี้ใช้งานกับรายชื่ออื่นอยู่ กรุณาตรวจสอบบัญชีเดิม','already-exists');if(['adminReset','adminDisable'].includes(input.method)&&(!previous||previous.classId!==input.classId||previous.studentId!==h.studentId))fail('ยังไม่เปิดบัญชีนักเรียนคนนี้','failed-precondition');}
   let count=0;for(const {h,old}of rows){const previous=old.data();if(['adminEnable','adminEnableClass'].includes(input.method)&&previous?.active)continue;const next={code:h.code,classId:input.classId,studentId:h.studentId,active:input.method!=='adminDisable',version:(previous?.version||0)+1,updatedBy:request.auth.uid,updatedAt:stamp()};tx.set(ref(h.code),input.method==='adminDisable'?{...previous,...next}:{...previous,...next,salt:h.salt,passwordHash:h.passwordHash,passwordMode:h.birthDate?'birthday':'temporary'});count++;}
   tx.set(db.collection('school_student_audit').doc(),{action:input.method,classId:input.classId,studentIds:hashes.map(h=>h.studentId),count,uid:request.auth.uid,createdAt:stamp()});return {ok:true,count};
  });
 }
 async function passwordHelp(request,input){
  if(!request.auth)fail('กรุณาเข้าสู่ระบบผู้ดูแล','unauthenticated');
  assertAdmin(request.auth,(await db.doc('school_users/'+request.auth.uid).get()).data());
  const setting=input.method==='adminSetPassword',allowed=['method','classId','studentId',...(setting?['password','version']:[])];
  if(Object.keys(input).some(k=>!allowed.includes(k))||!validId(input.classId)||!validId(input.studentId))fail('คำขอไม่ถูกต้อง');
  if(setting&&(typeof input.password!=='string'||input.password.trim().length<6||input.password.length>128||/[\u0000-\u001f\u007f]/.test(input.password)||!Number.isInteger(input.version)||input.version<1))fail('รหัสผ่านใหม่ต้องมี 6–128 ตัวอักษร และไม่มีอักขระควบคุม');
  const studentRef=db.doc('attendance_classes/'+input.classId+'/students/'+input.studentId),roomRef=db.doc('attendance_classes/'+input.classId),student=(await studentRef.get()).data();
  const code=String(student?.code||'').trim();if(!student||student.active===false||!validCode(code))fail('ทะเบียนนักเรียนไม่พร้อมใช้งาน','failed-precondition');
  const accountRef=ref(code),prior=(await accountRef.get()).data();
  if(prior&&(prior.classId!==input.classId||prior.studentId!==input.studentId))fail('บัญชีผูกกับรายชื่ออื่น กรุณาตรวจสอบทะเบียน','failed-precondition');
  let knownPassword=null,salt,passwordHash;
  if(setting){salt=randomBytes(24).toString('hex');passwordHash=await digest(input.password,salt);}
  else if(prior?.active&&typeof prior.salt==='string'&&/^[a-f0-9]{128}$/.test(prior.passwordHash||'')){
   const candidate=prior.birthDate?birthdayPassword(prior.birthDate):'123456',actual=await digest(candidate,prior.salt);
   if(timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(prior.passwordHash,'hex')))knownPassword=candidate;
  }
  return db.runTransaction(async tx=>{
   await admin(request,tx);
   const [liveStudent,room,account]=await Promise.all([tx.get(studentRef),tx.get(roomRef),tx.get(accountRef)]),old=account.data();
   if(!room.data()?.active||!liveStudent.exists||liveStudent.data().active===false||String(liveStudent.data().code).trim()!==code)fail('ทะเบียนนักเรียนเปลี่ยน กรุณาโหลดใหม่','aborted');
   if((old?.version||0)!==(prior?.version||0)||old?.passwordHash!==prior?.passwordHash||old?.active!==prior?.active||old&&(old.classId!==input.classId||old.studentId!==input.studentId))fail('บัญชีเปลี่ยนแปลง กรุณาเลือกนักเรียนใหม่','aborted');
   if(!setting)return {version:old?.version||0,canSet:old?.active===true,knownPassword:old?.active?knownPassword:null,mode:old?.passwordMode||null};
   if(!old?.active)fail('เปิดใช้บัญชีนักเรียนก่อนตั้งรหัสผ่าน','failed-precondition');
   if(old.version!==input.version)fail('รหัสผ่านถูกเปลี่ยนโดยผู้ดูแลอื่นแล้ว กรุณาเลือกนักเรียนใหม่','aborted');
   const version=old.version+1;
   tx.set(accountRef,{...old,salt,passwordHash,passwordMode:'custom',version,updatedBy:request.auth.uid,updatedAt:stamp()});
   tx.delete(db.doc('school_student_login_limits/code_'+hash(code)));
   tx.set(db.collection('school_student_audit').doc(),{action:'adminSetPassword',classId:input.classId,studentId:input.studentId,uid:request.auth.uid,createdAt:stamp()});
   return {ok:true,version};
  });
 }
 return {async handle(request){const input=request.data||{};return input.method==='login'?login(request,input):['adminPasswordInfo','adminSetPassword'].includes(input.method)?passwordHelp(request,input):provision(request,input);}};
}
module.exports={service,digest,uidFor,validCode};
