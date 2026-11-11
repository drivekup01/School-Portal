'use strict';
const {createHash}=require('node:crypto');
const CHAT_ID='-1003991858341',TOPIC_ID=23;
function eventFor(id,before,after){
 if(!after)return null;
 const approved=after.status==='approved'&&before?.status!=='approved',cancelled=before?.status==='approved'&&after.status!=='approved';
 if(!approved&&!cancelled)return null;
 const d=approved?after:before,clean=v=>String(v||'').replace(/[\r\n]+/g,' ').slice(0,200);
 return {requestId:id,revision:after.revision,action:approved?'approved':'cancelled',status:after.status,text:[approved?'✅ อนุมัติออกนอกโรงเรียน':'🔴 ยกเลิกใบอนุญาตออกนอกโรงเรียนฉบับเดิม','นักเรียน: '+clean(d.studentName)+' · ห้อง '+clean(d.className),'วันที่ '+clean(d.date)+(d.endDate!==d.date?' ถึง '+clean(d.endDate):'')+' เวลา '+clean(d.start)+'–'+clean(d.end)+' น.','ครูประจำชั้น: '+clean(d.teacherName),approved?'ผู้อนุมัติ: '+clean(d.reviewerName):after.status==='pending'?'มีการแก้ไขคำขอ ต้องรอฝ่ายปกครองอนุมัติใหม่':'คำขอนี้ถูกยกเลิกหรือลบแล้ว','เลขที่คำขอ '+clean(id)+' · ฉบับ '+(approved?after.revision:before.revision),'ครูประจำวิชาโปรดรับทราบ · รายละเอียดในระบบตามสิทธิ์'].join('\n')};
}
async function send(event,token,fetchImpl=fetch){
 if(typeof token!=='string'||!/^\d+:[A-Za-z0-9_-]+$/.test(token))return {status:'failed'};
 try{const r=await fetchImpl('https://api.telegram.org/bot'+token+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:CHAT_ID,message_thread_id:TOPIC_ID,text:event.text,link_preview_options:{is_disabled:true},reply_markup:{inline_keyboard:[[{text:'เปิดระบบโรงเรียน',url:'https://drivekup01.github.io/School-Portal/staff/#student-leave'}]]}}),signal:AbortSignal.timeout(15000)});const d=await r.json();if(r.ok&&d.ok&&Number.isSafeInteger(d.result?.message_id))return {status:'sent',messageId:d.result.message_id};return {status:r.status>=500?'uncertain':'failed'};}catch{return {status:'uncertain'};}
}
function service(db,stamp,token,transport=send){
 return {async handle(id,before,after){const event=eventFor(id,before,after);if(!event)return {status:'ignored'};const key=createHash('sha256').update('student-exit:'+id+':'+event.revision+':'+event.action).digest('hex'),ref=db.doc('school_notification_deliveries/'+key),source=db.doc('school_student_leaves/'+id);
  const claim=await db.runTransaction(async tx=>{const [prior,live]=await Promise.all([tx.get(ref),tx.get(source)]);if(prior.exists)return false;const d=live.data();if(!d||(event.action==='approved'?(d.revision!==event.revision||d.status!=='approved'):(d.status==='approved'||d.revision<event.revision))){tx.set(ref,{topic:'studentExit',requestId:id,revision:event.revision,status:'superseded',createdAt:stamp()});return false;}tx.set(ref,{topic:'studentExit',requestId:id,revision:event.revision,action:event.action,status:'sending',createdAt:stamp()});return true;});
  if(!claim)return {status:'skipped'};let result;try{result=await transport(event,token());}catch{result={status:'uncertain'};}
  // Telegram has no idempotency key. An uncertain send is retained for review, not resent automatically.
  await db.runTransaction(async tx=>{const old=await tx.get(ref);if(old.exists)tx.update(ref,{...result,updatedAt:stamp()});});return result;
 }};
}
module.exports={service,eventFor,send,CHAT_ID,TOPIC_ID};
