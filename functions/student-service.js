'use strict';
const D=require('./student-data'),{assertAdmin}=require('./content-model');
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const emailOf=value=>{if(typeof value!=='string'||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value.trim()))D.fail('อีเมลไม่ถูกต้อง');return value.trim().toLowerCase();};
const photo=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&url.href.length<=2000?url.href:'';}catch{return '';}};
function authenticated(request){const a=request.auth;if(!a||typeof a.uid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(a.uid))D.fail('กรุณาเข้าสู่ระบบนักเรียน','unauthenticated');if(a.token?.firebase?.sign_in_provider==='custom'&&a.token.studentLogin===true&&/^\d{1,20}$/.test(a.token.studentCode||'')&&a.uid===require('./student-password').uidFor(a.token.studentCode)&&Number.isInteger(a.token.studentSession))return {uid:a.uid,email:'',code:a.token.studentCode,mode:'password',key:D.hash('student-code:'+a.token.studentCode),version:a.token.studentSession};if(a.token?.email_verified!==true||a.token?.firebase?.sign_in_provider!=='google.com')D.fail('กรุณาเข้าสู่ระบบนักเรียน','unauthenticated');const email=emailOf(a.token.email);return {uid:a.uid,email,mode:'google',key:D.hash(email)};}
function validate(input){
  const fields={dashboard:['method','month'],requestCorrection:['method','message','requestId'],adminClasses:['method'],adminRoster:['method','classId'],adminLink:['method','classId','studentId','email'],adminUnlink:['method','classId','studentId','email'],adminRequests:['method'],reviewCorrection:['method','id','reply']};
  if(!input||!Object.hasOwn(fields,input.method)||Object.keys(input).some(k=>!fields[input.method].includes(k)))D.fail('คำขอไม่ถูกต้อง');
  if(['adminRoster','adminLink','adminUnlink'].includes(input.method)&&!id(input.classId))D.fail('รหัสห้องไม่ถูกต้อง');
  if(['adminLink','adminUnlink'].includes(input.method)){if(!id(input.studentId))D.fail('รหัสนักเรียนไม่ถูกต้อง');emailOf(input.email);}
  if(input.method==='requestCorrection'&&(!id(input.requestId)||typeof input.message!=='string'||!input.message.trim()||input.message.length>1000))D.fail('ระบุรายละเอียดที่ต้องการแก้ไข 1–1,000 ตัวอักษร');
  if(input.method==='reviewCorrection'&&(!/^[a-f0-9]{64}$/.test(input.id||'')||typeof input.reply!=='string'||!input.reply.trim()||input.reply.length>1000))D.fail('ระบุผลการตรวจสอบ 1–1,000 ตัวอักษร');
}
function service(db,stamp,clock=()=>new Date()){
  const accountRef=email=>db.doc('school_student_accounts/'+D.hash(email));
  const targetRef=(classId,studentId)=>db.doc('school_student_bindings/'+D.hash(JSON.stringify([classId,studentId])));
  const correctionRef=actor=>db.doc('school_student_corrections/'+actor.key);
  const ownRef=actor=>actor.mode==='password'?db.doc('school_student_passwords/'+D.hash(actor.code)):accountRef(actor.email);
  const validAccount=(actor,link)=>link?.active===true&&id(link.classId)&&id(link.studentId)&&(actor.mode==='password'?link.code===actor.code&&link.version===actor.version:link.email===actor.email);
  async function liveAdmin(request,tx){const snap=await tx.get(db.doc('school_users/'+request.auth.uid));assertAdmin(request.auth,snap.data());}
  async function own(request){
    const actor=authenticated(request),[account,central]=await Promise.all([ownRef(actor).get(),db.doc('school_users/'+actor.uid).get()]),link=account.data();
    if(central.exists&&central.data().active!==true)D.fail('บัญชีนี้ถูกระงับ','permission-denied');
    if(!account.exists||!validAccount(actor,link))D.fail('กรุณาเข้าสู่ระบบด้วยรหัสนักเรียน หากยังเข้าไม่ได้ให้ติดต่อผู้ดูแลเปิดใช้บัญชี','permission-denied');
    const [room,student,binding]=await Promise.all([db.doc('attendance_classes/'+link.classId).get(),db.doc('attendance_classes/'+link.classId+'/students/'+link.studentId).get(),actor.mode==='password'?ownRef(actor).get():targetRef(link.classId,link.studentId).get()]);
    if(!room.exists||room.data().active!==true||!student.exists||student.data().active===false||(actor.mode==='password'?String(student.data().code).trim()!==actor.code:binding.data()?.accountId!==D.hash(actor.email)))D.fail('รายชื่อนักเรียนหรือการผูกบัญชีเปลี่ยนแปลง กรุณาติดต่อผู้ดูแล','permission-denied');
    return {actor,link,room:room.data(),student:student.data()};
  }
  async function dashboard(request,input){
    const ctx=await own(request),today=D.dayAt(clock()),month=input.month||today.slice(0,7),range=D.monthRange(month,clock());
    const [table,marks,points,correction]=await Promise.allSettled([D.readTimetable(db),D.attendance(db,ctx.link.classId,ctx.link.studentId,range),D.behavior(db,ctx.link.classId,ctx.link.studentId),correctionRef(ctx.actor).get()]);
    // Recheck mapping after reading private sources; an in-flight revoked binding must not return data.
    const live=await own(request);if(live.link.classId!==ctx.link.classId||live.link.studentId!==ctx.link.studentId)D.fail('การผูกบัญชีเปลี่ยนแล้ว กรุณาโหลดใหม่','aborted');
    const data=table.status==='fulfilled'?table.value?.data:null,plan=data?D.schedule(data,ctx.room,today):{ready:false,reason:'ยังโหลดข้อมูลจากระบบจัดตารางสอนไม่ได้',lessons:[],homeroomTeachers:[]};
    const correctionValue=correction.status==='fulfilled'?correction.value.data():null,ownCorrection=correctionValue?.classId===ctx.link.classId&&correctionValue?.studentId===ctx.link.studentId?{status:correctionValue.status,message:correctionValue.message,reply:correctionValue.reply||''}:null;
    return {date:today,month,school:{name:data?.school?.name||'โรงเรียนค่ายบางระจันวิทยาคม',year:ctx.room.academicYear,term:ctx.room.term},student:{name:ctx.student.name||'',code:ctx.student.code||'',number:ctx.student.number??null,className:ctx.room.name,photoUrl:photo(ctx.student.photoUrl||ctx.student.photoURL||request.auth.token.picture),photoSource:ctx.student.photoUrl||ctx.student.photoURL?'roster':'google',email:ctx.actor.email},schedule:plan,attendance:marks.status==='fulfilled'?{ready:true,...marks.value}:{ready:false,reason:'ยังโหลดข้อมูลการมาเรียนไม่ได้ กรุณาลองใหม่'},behavior:points.status==='fulfilled'?{ready:true,...points.value}:{ready:false,reason:'ยังโหลดคะแนนความประพฤติไม่ได้ กรุณาลองใหม่'},correction:ownCorrection,notifications:{ready:false}};
  }
  async function requestCorrection(request,input){
    const ctx=await own(request),ref=correctionRef(ctx.actor),message=input.message.trim();
    return db.runTransaction(async tx=>{
      const [account,target,student,central,prior,room]=await Promise.all([tx.get(ownRef(ctx.actor)),tx.get(ctx.actor.mode==='password'?ownRef(ctx.actor):targetRef(ctx.link.classId,ctx.link.studentId)),tx.get(db.doc('attendance_classes/'+ctx.link.classId+'/students/'+ctx.link.studentId)),tx.get(db.doc('school_users/'+ctx.actor.uid)),tx.get(ref),tx.get(db.doc('attendance_classes/'+ctx.link.classId))]);
      const link=account.data();if(!validAccount(ctx.actor,link)||link.classId!==ctx.link.classId||link.studentId!==ctx.link.studentId||(ctx.actor.mode==='password'?String(student.data()?.code).trim()!==ctx.actor.code:target.data()?.accountId!==D.hash(ctx.actor.email))||!student.exists||student.data().active===false||!room.exists||room.data().active!==true||central.exists&&central.data().active!==true)D.fail('สิทธิ์นักเรียนเปลี่ยนแล้ว','permission-denied');
      const old=prior.data();if(old?.requestId===input.requestId){if(old.message!==message)D.fail('รหัสคำขอนี้ถูกใช้กับข้อความอื่นแล้ว','already-exists');return {ok:true,replayed:true};}if(old?.status==='pending')D.fail('มีคำขอที่กำลังรอตรวจสอบอยู่แล้ว','already-exists');
      const next={uid:ctx.actor.uid,email:ctx.actor.email,classId:ctx.link.classId,studentId:ctx.link.studentId,className:ctx.room.name,studentName:ctx.student.name,code:ctx.student.code||'',message,requestId:input.requestId,status:'pending',reply:'',createdAt:stamp()};
      tx.set(ref,next);tx.set(db.collection('school_student_audit').doc(),{action:'request-correction',uid:ctx.actor.uid,accountId:D.hash(ctx.actor.email),message,createdAt:stamp()});return {ok:true};
    });
  }
  async function admin(request,input){
    const actor=authenticated(request);assertAdmin(request.auth,(await db.doc('school_users/'+actor.uid).get()).data());
    if(input.method==='adminClasses'){
      const [classes,table]=await Promise.all([db.collection('attendance_classes').where('active','==',true).get(),D.readTimetable(db)]);
      return {classes:classes.docs.map(d=>({id:d.id,...d.data()})).filter(c=>!table||D.roomFor(table.data,c)).map(c=>({id:c.id,name:c.name,year:c.academicYear,term:c.term})).sort((a,b)=>a.name.localeCompare(b.name,'th',{numeric:true}))};
    }
    if(input.method==='adminRoster'){
      const [room,students,accounts,passwords]=await Promise.all([db.doc('attendance_classes/'+input.classId).get(),db.collection('attendance_classes/'+input.classId+'/students').get(),db.collection('school_student_accounts').where('classId','==',input.classId).get(),db.collection('school_student_passwords').where('classId','==',input.classId).get()]);
      if(!room.exists||room.data().active!==true)D.fail('ไม่พบห้องที่เปิดใช้งาน','not-found');
      return {students:students.docs.filter(d=>d.data().active!==false).map(d=>({id:d.id,name:d.data().name,code:d.data().code||'',number:d.data().number??null,loginEnabled:passwords.docs.some(a=>a.data().active===true&&a.data().studentId===d.id&&a.data().code===d.data().code),email:accounts.docs.find(a=>a.data().active===true&&a.data().studentId===d.id)?.data().email||''})).sort((a,b)=>a.number-b.number)};
    }
    if(input.method==='adminRequests'){
      const records=await db.collection('school_student_corrections').where('status','==','pending').limit(101).get();
      return {requests:records.docs.slice(0,100).map(d=>({id:d.id,name:d.data().studentName,className:d.data().className,code:d.data().code,email:d.data().email,message:d.data().message})),hasMore:records.docs.length>100};
    }
    if(input.method==='reviewCorrection')return db.runTransaction(async tx=>{await liveAdmin(request,tx);const ref=db.doc('school_student_corrections/'+input.id),snap=await tx.get(ref);if(!snap.exists||snap.data().status!=='pending')D.fail('คำขอนี้ได้รับการตรวจสอบแล้ว','aborted');tx.update(ref,{status:'resolved',reply:input.reply.trim(),reviewedAt:stamp(),reviewedBy:actor.uid});tx.set(db.collection('school_student_audit').doc(),{action:'review-correction',id:input.id,uid:actor.uid,reply:input.reply.trim(),createdAt:stamp()});return {ok:true};});
    const email=emailOf(input.email),ref=accountRef(email),target=targetRef(input.classId,input.studentId);
    return db.runTransaction(async tx=>{
      await liveAdmin(request,tx);
      const [room,student,account,binding]=await Promise.all([tx.get(db.doc('attendance_classes/'+input.classId)),tx.get(db.doc('attendance_classes/'+input.classId+'/students/'+input.studentId)),tx.get(ref),tx.get(target)]);
      if(!room.exists||!room.data().active||!student.exists||student.data().active===false)D.fail('รายชื่อนักเรียนไม่พร้อมใช้งาน','failed-precondition');
      const old=account.data(),bound=binding.data();
      if(input.method==='adminUnlink'){
        if(!old?.active||old.classId!==input.classId||old.studentId!==input.studentId||bound?.accountId!==D.hash(email))D.fail('การผูกบัญชีเปลี่ยนแล้ว กรุณาโหลดใหม่','aborted');
        tx.update(ref,{active:false,updatedAt:stamp(),updatedBy:actor.uid});tx.delete(target);
      }else{
        if(old?.active&&(old.classId!==input.classId||old.studentId!==input.studentId))D.fail('อีเมลนี้ผูกกับนักเรียนคนอื่นอยู่ กรุณายกเลิกการผูกเดิมก่อน','already-exists');
        if(bound&&bound.accountId!==D.hash(email))D.fail('นักเรียนคนนี้ผูกกับอีกอีเมลอยู่ กรุณายกเลิกการผูกเดิมก่อน','already-exists');
        tx.set(ref,{email,active:true,classId:input.classId,studentId:input.studentId,updatedAt:stamp(),updatedBy:actor.uid});tx.set(target,{accountId:D.hash(email),updatedAt:stamp()});
      }
      tx.set(db.collection('school_student_audit').doc(),{action:input.method,email,classId:input.classId,studentId:input.studentId,uid:actor.uid,createdAt:stamp()});return {ok:true};
    });
  }
  async function handle(request){const input=request.data||{};authenticated(request);validate(input);if(input.method==='dashboard')return dashboard(request,input);if(input.method==='requestCorrection')return requestCorrection(request,input);return admin(request,input);}
  return {handle};
}
module.exports={service,validate,authenticated};
