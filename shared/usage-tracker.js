// Track session entry/actual sign-out only. Page views and clicks are not recorded.
import {firebase} from './school-auth.js?v=20261027-roles1';
const endpoint='https://asia-southeast1-school-budget-3e69d.cloudfunctions.net/schoolUsage';
const demo=new URLSearchParams(location.search).get('demo')==='1';
let active=null,epoch=0;
function session(key,value){try{if(value===null)sessionStorage.removeItem(key);else if(value!==undefined)sessionStorage.setItem(key,value);else return sessionStorage.getItem(key);}catch{}return null;}
async function send(kind,token,eventId=crypto.randomUUID()){
 if(!token||!location.pathname.startsWith('/School-'))return;
 try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data:{method:'record',kind,eventId,path:location.pathname,section:''}}),keepalive:true});return response.ok;}catch{return false;}
}
if(!demo)firebase().then(c=>c.A.onIdTokenChanged(c.auth,async user=>{
 const own=++epoch,previous=active;
 if(previous&&(!user||previous.uid!==user.uid)){
  active=null;session('school-usage-session-'+previous.uid,null);
  // The cached token identifies the user after the SDK has cleared its session.
  // A stable event ID deduplicates sign-out notifications from embedded frames.
  void send('logout',previous.token,'logout_'+previous.uid.replace(/[^A-Za-z0-9_-]/g,'_').slice(0,45)+'_'+previous.signedIn);
 }
 if(!user)return;
 const token=await user.getIdToken().catch(()=>null);if(own!==epoch||!token)return;
 const signedIn=String(Date.parse(user.metadata.lastSignInTime||'')||0);
 active={uid:user.uid,token,signedIn};
 const key='school-usage-session-'+user.uid;
 if(!session(key)){
  session(key,'1');
  const fresh=Date.now()-Number(signedIn)<120000;
  if(user.uid.startsWith('student_')&&fresh)return;
  if(!await send(fresh?'login':'session',token)){session(key,null);setTimeout(()=>{if(active?.uid===user.uid&&!session(key)){session(key,'1');void send(fresh?'login':'session',active.token);}},4000);}
 }
})).catch(()=>{});
