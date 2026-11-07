'use strict';
const {hash}=require('../student-data');
const now=new Date('2026-11-06T05:00:00Z');
const T=value=>({toDate:()=>new Date(value),toMillis:()=>new Date(value).getTime()});
const auth=(email='one@example.invalid',uid='s1')=>({uid,token:{email,email_verified:true,firebase:{sign_in_provider:'google.com'},picture:''}});
const teacher={id:'t1',prefix:'ครู',first:'ตัวอย่าง',last:'หนึ่ง',privatePhone:'PRIVATE-TEACHER-PHONE'};
const table={school:{name:'โรงเรียนตัวอย่าง',year:'2569',semester:'2'},teachers:[teacher,{id:'t2',prefix:'ครู',first:'ตัวอย่าง',last:'สอง'}],rooms:[{id:'r1',label:'ม.1/1',homeroom:'t1',baseRoom:'อาคาร 1 ห้อง 101'},{id:'r2',label:'ม.1/2',baseRoom:'102'}],days:['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์'],slots:[{id:'1',label:'คาบ 1',start:'08:30',end:'09:20'},{id:'2',label:'คาบ 2',start:'09:20',end:'10:10'},{id:'3',label:'พัก',isBreak:true},{id:'4',label:'กิจกรรมครู',teacherOnly:true}],sched:{'r1_1_ศุกร์':{subject:'ภาษาไทย',teacher:'ครูตัวอย่าง หนึ่ง'},'r1_2_ศุกร์':{subject:'คณิตศาสตร์',teacher:'ครูตัวอย่าง สอง',learnRoom:'ห้องคณิตศาสตร์'},'r2_1_ศุกร์':{subject:'PRIVATE-OTHER-CLASS',teacher:'PRIVATE-NAME'}},substitute:{},exchanges:{}};
function seed(){
const email='one@example.invalid',account=hash(email),json=JSON.stringify(table);
return {
['school_student_accounts/'+account]:{email,active:true,classId:'c1',studentId:'s1'},
['school_student_bindings/'+hash(JSON.stringify(['c1','s1']))]:{accountId:account},
'school_users/admin':{active:true,schoolRole:'admin'},
'school_users/teacher':{active:true,schoolRole:'teacher',identityAdmin:true},
'attendance_classes/c1':{name:'ม.1/1',academicYear:2569,term:2,active:true},
'attendance_classes/c2':{name:'ม.1/2',academicYear:2569,term:2,active:true},
'attendance_classes/c1/students/s1':{name:'นักเรียนทดสอบ หนึ่ง',code:'00001',number:1,active:true},
'attendance_classes/c1/students/s2':{name:'PRIVATE-OTHER-STUDENT',code:'00002',number:2,active:true},
'timetable_state/current':{version:'v1'},
'timetable_versions/v1':{status:'ready',partCount:1,hash:hash(json)},
'timetable_versions/v1/parts/0':{json},
'attendance_assignments/m1':{classId:'c1',kind:'morning',period:0},
'attendance_assignments/a1':{classId:'c1',kind:'subject',period:1,subject:'ภาษาไทย',weekday:5,from:'2026-11-01',to:'2026-11-30'},
'attendance_assignments/a2':{classId:'c1',kind:'subject',period:1,subject:'ภาษาไทย',weekday:5,from:'2026-11-01',to:'2026-11-30'},
'attendance_morning_sessions/c1_20261106/marks/s1':{classId:'c1',studentId:'s1',status:'late',note:'',updatedAt:T('2026-11-06T02:00:00Z')},
'attendance_assignments/m1/days/20261106/marks/s1':{classId:'c1',studentId:'s1',status:'present',note:'',updatedAt:T('2026-11-06T01:00:00Z')},
'attendance_assignments/a1/days/20261106/marks/s1':{classId:'c1',studentId:'s1',status:'present',note:'',updatedAt:T('2026-11-06T01:00:00Z')},
'attendance_assignments/a2/days/20261106/marks/s1':{classId:'c1',studentId:'s1',status:'leave',note:'ลาที่บันทึกไว้',updatedAt:T('2026-11-06T03:00:00Z')},
'attendance_morning_sessions/c1_20261106/marks/s2':{classId:'c1',studentId:'s2',status:'absent',note:'PRIVATE-OTHER-NOTE'},
'attendance_behavior/e1':{classId:'c1',studentId:'s1',delta:-5,reason:'รายการทดสอบ',category:'late',day:T('2026-11-04'),createdAt:T('2026-11-04')},
'attendance_behavior/e2':{classId:'c1',studentId:'s1',delta:2,reason:'รายการเพิ่มที่อนุมัติแล้ว',day:T('2026-11-05'),createdAt:T('2026-11-05')},
'attendance_behavior/e3':{classId:'c1',studentId:'s2',delta:-40,reason:'PRIVATE-BEHAVIOR'}
};}
function memory(initial=seed()){
const docs=new Map(Object.entries(initial));let serial=0,transactionHook=null,queryHook=null;
const snap=path=>({id:path.split('/').at(-1),exists:docs.has(path),data:()=>docs.get(path),ref:ref(path)});
const ref=path=>({path,id:path.split('/').at(-1),get:async()=>snap(path),collection:name=>collection(path+'/'+name)});
const collection=(path,predicate=()=>true,cap=Infinity)=>({doc:(id='auto'+ ++serial)=>ref(path+'/'+id),where:(key,operator,value)=>collection(path,data=>predicate(data)&&data[key]===value,cap),limit:n=>collection(path,predicate,n),get:async()=>{queryHook?.(path);return {docs:[...docs.keys()].filter(key=>key.startsWith(path+'/')&&key.split('/').length===path.split('/').length+1&&predicate(docs.get(key))).slice(0,cap).map(snap)};}});
const db={docs,doc:ref,collection,getAll:async(...refs)=>refs.map(r=>snap(r.path)),onTransaction:fn=>transactionHook=fn,onQuery:fn=>queryHook=fn,runTransaction:async fn=>{transactionHook?.();const writes=[];const result=await fn({get:async r=>r.get(),set:(r,data)=>writes.push(()=>docs.set(r.path,data)),update:(r,data)=>writes.push(()=>docs.set(r.path,{...docs.get(r.path),...data})),delete:r=>writes.push(()=>docs.delete(r.path))});writes.forEach(write=>write());return result;}};
return db;
}
module.exports={now,T,auth,table,seed,memory};
