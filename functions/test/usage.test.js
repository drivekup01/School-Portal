'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {service,validateBrowser,moduleFor}=require('../usage-audit');
const auth={uid:'teacher',token:{email:'teacher@example.invalid',email_verified:true,name:'Token name',firebase:{sign_in_provider:'google.com'}}};
function memory(profile={active:true,schoolRole:'teacher',name:'ครูทดสอบ'}){
 const values=new Map([['school_users/teacher',profile]]);let serial=0;
 const snapshot=path=>({id:path.split('/').at(-1),exists:values.has(path),data:()=>values.get(path)});
 const doc=path=>({path,get:async()=>snapshot(path),create:async v=>{if(values.has(path))throw Error('exists');values.set(path,v);}});
 const query={orderBy(){return this;},where(){return this;},startAfter(){return this;},limit(){return this;},async get(){return {docs:[...values.keys()].filter(p=>p.startsWith('school_usage_events/')).map(snapshot)};}};
 return {values,doc,collection:path=>({...query,doc:()=>doc(path+'/event'+(++serial))}),async runTransaction(work){const writes=[];const result=await work({get:ref=>ref.get(),set:(ref,v)=>writes.push([ref.path,v]),create:(ref,v)=>writes.push([ref.path,v])});for(const [p,v]of writes)values.set(p,v);return result;}};
}
const input=()=>({method:'record',kind:'login',eventId:'event-id-123456789',path:'/School-Portal/staff/',section:'student-behavior'});
const stamp=()=>({toDate:()=>new Date('2026-11-07T05:00:00Z')});
test('browser reports use verified identity, reject spoofing and duplicate IDs do not add rows',async()=>{
 const db=memory(),api=service(db,stamp);await api.handle({auth,data:input()});await api.handle({auth,data:input()});
 const rows=[...db.values.entries()].filter(([p])=>p.startsWith('school_usage_events/'));assert.equal(rows.length,1);assert.equal(rows[0][1].uid,'teacher');assert.equal(rows[0][1].name,'ครูทดสอบ');assert.equal(rows[0][1].module,'behavior');assert.equal(rows[0][1].source,'browser');
 await assert.rejects(api.handle({auth,data:{...input(),uid:'admin'}}),{code:'invalid-argument'});
 await assert.rejects(api.handle({data:input()}),{code:'unauthenticated'});
});
test('only active real admins can read combined history; stale legacy flags cannot elevate',async()=>{
 for(const p of [{active:true,schoolRole:'teacher',identityAdmin:true},{active:false,schoolRole:'admin'}])await assert.rejects(service(memory(p),stamp).handle({auth,data:{method:'list'}}),{code:'permission-denied'});
 assert.deepEqual((await service(memory({active:true,schoolRole:'admin'}),stamp).handle({auth,data:{method:'list'}})).events,[]);
});
test('server records contain method metadata only, never passwords, tokens or payload text',async()=>{
 const db=memory(),api=service(db,stamp),secret='NEVER-LOG-ME';
 assert.equal(await api.track('schoolStudentLogin',{auth,data:{method:'adminReset',password:secret,message:secret,token:secret}},async()=>42),42);
 const row=[...db.values.entries()].find(([p])=>p.startsWith('school_usage_events/'))[1];assert.equal(row.source,'server');assert.equal(row.outcome,'success');assert(!JSON.stringify(row).includes(secret));
});
test('failed calls preserve the error and are not labeled successful; logging failure does not rerun a mutation',async()=>{
 const db=memory(),api=service(db,stamp),request={auth,data:{method:'updateUser'}};
 await assert.rejects(api.track('schoolIdentity',request,async()=>{throw Error('denied');}),/denied/);
 assert.equal([...db.values.values()].find(v=>v.source==='server').outcome,'failed');
 db.collection=()=>({doc:()=>({create:async()=>{throw Object.assign(Error('unavailable'),{code:'unavailable'});}})});let writes=0;
 const old=console.error;console.error=()=>{};try{assert.equal(await api.track('schoolIdentity',request,async()=>++writes),1);assert.equal(writes,1);}finally{console.error=old;}
});
test('unsafe URLs, query strings and oversized paths are rejected and modules are classified',()=>{
 for(const path of ['https://evil.invalid','/School-Portal/?token=secret','/School-Portal/../private','/School-Portal/'+ 'a'.repeat(251)])assert.throws(()=>validateBrowser({...input(),path}),{code:'invalid-argument'});
 assert.equal(moduleFor('/School-Portal/admin/','budget-procurement'),'budget');assert.equal(moduleFor('/School-OS/'),'academic');assert.equal(moduleFor('/School-Portal/admin/students.html'),'students');
});
test('suspended accounts cannot append browser history and student claims cannot impersonate other UIDs',async()=>{
 await assert.rejects(service(memory({active:false,schoolRole:'teacher'}),stamp).record({auth,data:input()}),{code:'permission-denied'});
 const student={uid:'wrong',token:{studentLogin:true,studentCode:'123',studentSession:1,firebase:{sign_in_provider:'custom'}}};await assert.rejects(service(memory(),stamp).record({auth:student,data:input()}),{code:'unauthenticated'});
});

test('opening pages and read-only API calls do not create usage history',async()=>{const db=memory(),api=service(db,stamp);await api.track('schoolIdentity',{auth,data:{method:'listUsers'}},async()=>({users:[]}));assert.equal([...db.values.keys()].filter(p=>p.startsWith('school_usage_events/')).length,0);assert.throws(()=>validateBrowser({...input(),kind:'visit'}),{code:'invalid-argument'});});

test('administrator history includes permanent remedial deletion metadata without document content',async()=>{const db=memory({active:true,schoolRole:'admin',name:'ผู้ดูแล'}),api=service(db,stamp);for(const method of ['remedialPurgeBatch','remedialPurgeCase'])await api.track('schoolRemedial',{auth,data:{method,pdf:'PRIVATE-DOCUMENT',studentName:'PRIVATE-STUDENT'}},async()=>({ok:true}));const result=await api.handle({auth,data:{method:'list'}});assert.equal(result.events.length,2);assert(result.events.every(e=>e.module==='academic'&&e.action.includes('ถาวร')));assert(!JSON.stringify(result).includes('PRIVATE-'));});
