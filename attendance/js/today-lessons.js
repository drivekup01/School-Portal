import {assignmentsOn} from './core.js?v=20261025-firebase2';
export function teachingToday(assignments,user,date){
 const owned=user?.role==='teacher'?assignments.filter(a=>a.teacherUid===user.uid):assignments;
 return assignmentsOn(owned.filter(a=>a.active!==false),date,'subject');
}
