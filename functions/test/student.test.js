'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../student-data'),{service}=require('../student-service'),F=require('./student-fixtures');
const request=(method,fields={},auth=F.auth())=>({auth,data:{method,...fields}});
const api=db=>service(db,()=>123,()=>F.now);
test('dashboard uses bound student only, source timetable room, canonical attendance and behavior ledger',async()=>{
const result=await api(F.memory()).handle(request('dashboard'));
assert.equal(result.student.code,'00001');assert.equal(result.student.className,'ม.1/1');assert.equal(result.schedule.lessons.length,2);assert.equal(result.schedule.lessons[1].room,'ห้องคณิตศาสตร์');assert.deepEqual(result.schedule.homeroomTeachers,['ครูตัวอย่าง หนึ่ง']);
assert.equal(result.attendance.morning.late,1);assert.equal(result.attendance.morning.present,0);assert.equal(result.attendance.subject.leave,1);assert.equal(result.attendance.subject.recorded,1);assert.equal(result.behavior.score,97);assert.equal(result.behavior.count,2);assert.equal(result.notifications.ready,false);assert.equal(JSON.stringify(result).includes('PRIVATE-'),false);
});
test('unauthenticated, unlinked, inactive and mismatched bindings cannot read private data',async()=>{
await assert.rejects(api(F.memory()).handle(request('dashboard',{},null)),{code:'unauthenticated'});
await assert.rejects(api(F.memory()).handle(request('dashboard',{},F.auth('unlinked@example.invalid'))),{code:'permission-denied'});
for(const edit of [db=>db.docs.get('school_student_accounts/'+D.hash('one@example.invalid')).active=false,db=>db.docs.get('attendance_classes/c1/students/s1').active=false,db=>db.docs.set('school_users/s1',{active:false}),db=>db.docs.get('school_student_bindings/'+D.hash(JSON.stringify(['c1','s1']))).accountId='other']){const db=F.memory();edit(db);await assert.rejects(api(db).handle(request('dashboard')),{code:'permission-denied'});}
});
test('client cannot choose another student/class, invoke admin methods or impersonate a Google identity',async()=>{
for(const fields of [{studentId:'s2'},{classId:'c2'},{uid:'admin'}])await assert.rejects(api(F.memory()).handle(request('dashboard',fields)),{code:'invalid-argument'});
for(const identity of [F.auth(),F.auth('teacher@example.invalid','teacher')])await assert.rejects(api(F.memory()).handle(request('adminClasses',{},identity)),{code:'permission-denied'});
const bad=F.auth();bad.token.firebase.sign_in_provider='password';await assert.rejects(api(F.memory()).handle(request('dashboard',{},bad)),{code:'unauthenticated'});
});
test('mapping revoked during source reads blocks the entire response',async()=>{
const db=F.memory();db.onQuery(path=>{if(path==='attendance_behavior')db.docs.get('school_student_accounts/'+D.hash('one@example.invalid')).active=false;});
await assert.rejects(api(db).handle(request('dashboard')),{code:'permission-denied'});
});
test('timetable projections honor swaps and substitute teachers; weekend is a valid empty timetable',()=>{
const data=structuredClone(F.table);data.exchanges={x:{active:true,year:2569,term:2,a:{date:'2026-11-06',roomId:'r1',slotId:'1'},b:{date:'2026-11-09',roomId:'r1',slotId:'2',lesson:{subject:'วิทยาศาสตร์',teacher:'ครูแลกคาบ'}}}};data.exchanges.x.a.lesson={subject:'ภาษาไทย',teacher:'ครูเดิม'};data.substitute={'2026-11-06':{absentList:[{periods:[{roomId:'r1',slotId:'2',subject:'คณิตศาสตร์',subTeacher:'ครูสอนแทน'}]}]}};
const room={name:'ม.1/1',academicYear:2569,term:2},result=D.schedule(data,room,'2026-11-06');assert.equal(result.lessons[0].subject,'วิทยาศาสตร์');assert.equal(result.lessons[0].change,'แลกคาบ');assert.deepEqual(result.lessons[1].teachers,['ครูสอนแทน']);assert.equal(D.schedule(data,room,'2026-11-07').lessons.length,0);assert.equal(D.schedule(data,{...room,term:1},'2026-11-06').ready,false);
});
test('month range is bounded; missing marks are not absences; missing source is shown as unavailable',async()=>{
assert.throws(()=>D.monthRange('2026-13',F.now),{code:'invalid-argument'});assert.throws(()=>D.monthRange('2026-12',F.now),{code:'invalid-argument'});assert.throws(()=>D.monthRange('2025-11',F.now),{code:'invalid-argument'});
const db=F.memory();db.docs.delete('timetable_state/current');const result=await api(db).handle(request('dashboard'));assert.equal(result.schedule.ready,false);assert.equal(result.attendance.morning.absent,0);assert.equal(result.behavior.score,97);
});
test('only admin can link; email and roster target stay one-to-one; revoke cuts off access',async()=>{
const db=F.memory(),s=api(db),admin=F.auth('admin@example.invalid','admin');
await s.handle(request('adminLink',{classId:'c1',studentId:'s2',email:'TWO@example.invalid'},admin));
await assert.rejects(s.handle(request('adminLink',{classId:'c1',studentId:'s1',email:'two@example.invalid'},admin)),{code:'already-exists'});
await assert.rejects(s.handle(request('adminLink',{classId:'c1',studentId:'s2',email:'three@example.invalid'},admin)),{code:'already-exists'});
assert.equal((await s.handle(request('dashboard',{},F.auth('two@example.invalid','s2')))).student.code,'00002');
await s.handle(request('adminUnlink',{classId:'c1',studentId:'s2',email:'two@example.invalid'},admin));
await assert.rejects(s.handle(request('dashboard',{},F.auth('two@example.invalid','s2'))),{code:'permission-denied'});
});
test('correction is private, idempotent, single pending and cannot directly change roster; admin can reply',async()=>{
const db=F.memory(),s=api(db),input={message:'ขอแก้ไขชื่อเป็นข้อมูลที่ถูกต้อง',requestId:'request123456'};
await s.handle(request('requestCorrection',input));assert.equal((await s.handle(request('requestCorrection',input))).replayed,true);
await assert.rejects(s.handle(request('requestCorrection',{...input,requestId:'another123456'})),{code:'already-exists'});
assert.equal(db.docs.get('attendance_classes/c1/students/s1').name,'นักเรียนทดสอบ หนึ่ง');
const admin=F.auth('admin@example.invalid','admin'),list=await s.handle(request('adminRequests',{},admin));assert.equal(list.requests.length,1);
await s.handle(request('reviewCorrection',{id:list.requests[0].id,reply:'ตรวจสอบกับครูที่ปรึกษาแล้ว'},admin));
const own=await s.handle(request('dashboard'));assert.equal(own.correction.status,'resolved');assert.equal(own.correction.reply,'ตรวจสอบกับครูที่ปรึกษาแล้ว');
});
test('live admin revocation inside transaction prevents account linking',async()=>{
const db=F.memory();db.onTransaction(()=>db.docs.set('school_users/admin',{active:false,schoolRole:'admin'}));await assert.rejects(api(db).handle(request('adminLink',{classId:'c1',studentId:'s2',email:'two@example.invalid'},F.auth('admin@example.invalid','admin'))),{code:'permission-denied'});assert.equal(db.docs.has('school_student_accounts/'+D.hash('two@example.invalid')),false);
});
