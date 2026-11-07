import {call} from '../shared/school-auth.js?v=20261027-roles1';
import {node,caseList,detailDialog} from '../shared/remedial-ui.js?v=20261107-remedial1';
export function mountStudentRemedial(host){const status=node('p',null,'remedial-status'),reload=node('button','โหลดรายการใหม่'),listHost=node('div',null,'remedial-cases'),dialog=detailDialog({student:true});host.append(node('h2','ผลการเรียน 0 ร มส มผ'),node('p','รายวิชาที่ยังไม่ผ่าน แยกตามปีและภาคเรียน เมื่อฝ่ายวิชาการยืนยันแก้ผลแล้ว รายการจะหายจากหน้านี้'),reload,status,listHost);let epoch=0;const list=caseList(listHost,open,{student:true});
 const api=data=>call('schoolStudentRemedial',data);
 async function load(){const e=++epoch;reload.disabled=true;status.textContent='กำลังโหลด…';try{const r=await api({method:'list'});if(e!==epoch)return;list.set(r.cases);status.textContent=r.cases.length?'เลือกวิชาเพื่อดูรายละเอียด':'ยังไม่มีรายการที่ฝ่ายวิชาการเผยแพร่สำหรับบัญชีนี้';}catch(error){if(e===epoch)status.textContent=error.message;}finally{if(e===epoch)reload.disabled=false;}}
 async function open(id){const e=epoch;status.textContent='กำลังโหลดรายละเอียด…';try{const detail=await api({method:'detail',caseId:id});if(e!==epoch)return;dialog.show(detail);status.textContent='';}catch(error){if(e===epoch)status.textContent=error.message;}}

 function clear(){epoch++;dialog.clear();list.clear();status.textContent='';}reload.onclick=load;return {load,clear};}
