import * as shared from './school-auth.js?v=20261027-roles1';
let running;
export function run(){if(running)return running;running=check().catch(()=>null).finally(()=>{running=null});return running;}
async function check(){const c=await shared.firebase(),user=c.auth.currentUser;if(!user)return;const key='school-access-check-v1:'+user.uid;try{if(Date.now()-Number(sessionStorage.getItem(key)||0)<60000)return;}catch{}const p=await shared.profile();if(!p?.active||p.registered===false)return;
 const probe=async(module,fn)=>{try{await fn();return {module,status:'ok',code:''};}catch(e){return {module,status:'error',code:String(e.code||'unknown').replace(/[^a-zA-Z0-9_./-]/g,'').slice(0,80)};}};
 const checks=await Promise.all([
  probe('attendance',async()=>{const jobs=await c.F.getDocsFromServer(c.F.query(c.F.collection(c.db,'attendance_assignments'),c.F.where('active','==',true)));const morning=await shared.call('schoolIdentity',{method:'morningClasses'});const classes=[...new Set([...jobs.docs.filter(d=>d.data().teacherUid===user.uid).map(d=>d.data().classId),...(morning.assignments||[]).filter(a=>a.canWrite).map(a=>a.classId)])];await Promise.all(classes.map(id=>c.F.getDocsFromServer(c.F.query(c.F.collection(c.db,'attendance_classes',id,'students'),c.F.limit(1)))));}),
  probe('timetable',()=>shared.call('timetableApi',{method:'bootstrap'})),
  probe('budget',()=>shared.call('budgetApi',{method:'getBudgetUser',args:[]})),
  probe('procurement',()=>c.F.getDocsFromServer(c.F.query(c.F.collection(c.db,'procurement_projects'),c.F.limit(1))))
 ]);
 if(c.auth.currentUser?.uid!==user.uid)return;
 await shared.call('schoolIdentity',{method:'reportReadiness',checks});try{sessionStorage.setItem(key,String(Date.now()));}catch{}
 return checks;
}
