import {settings} from './settings.js?v=20261025-firebase2';
export const isDemo=new URLSearchParams(location.search).get('demo')==='1';
export const demoAdmin=isDemo&&new URLSearchParams(location.search).get('view')==='admin';
export const url = page => `${page}.html${isDemo?'?demo=1'+(demoAdmin?'&view=admin':''):''}`;
async function loadContext(page){
 if(page==='index'&&!isDemo&&settings.databaseReady){const shared=await import('./school-auth.js?v=20261027-periods1');const p=await shared.profile();if(p&&!['admin','teacher','viewer'].includes(p.attendanceRole))return {provider:null,user:{...p,role:'viewer'},assignments:[]};}
 if(isDemo){const {demo}=await import('./demo.js?v=20261025-firebase2');return {provider:demo,user:{...await demo.profile(),role:new URLSearchParams(location.search).get('view')==='viewer'?'viewer':demoAdmin?'admin':'teacher'},assignments:await demo.assignments()};}
 if(!settings.databaseReady)return {provider:null,user:null,assignments:[]};
 const {real}=await import('./firebase-client.js?v=20261027-periods1');const user=await real.profile();if(page==='morning'&&user?.teacherId&&user.active)await (await import('./school-auth.js?v=20261027-periods1')).call('schoolIdentity',{method:'attendanceSchedule',teacherId:user.teacherId});return {provider:user?real:null,user,assignments:user?await real.assignments():[]};
}

export async function context(page){try{return await loadContext(page);}finally{if(!isDemo)import('../../shared/access-check.js?v=20261027-periods1').then(m=>m.run()).catch(()=>{});}}
