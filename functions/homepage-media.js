 'use strict';
const {randomUUID}=require('node:crypto');
const {fail}=require('./content-model');
const BUCKET='school-budget-3e69d-student-reports',PREFIX='homepage/staff/';
function service(storage){
 const bucket=storage.bucket(BUCKET);
 return {
 async upload(request,authorize){
  const i=request.data;
  if(Object.keys(i).some(k=>!['method','base64'].includes(k))||typeof i.base64!=='string'||i.base64.length>410000||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(i.base64))fail('รูปภาพไม่ถูกต้องหรือใหญ่เกิน 300 KB');
  const bytes=Buffer.from(i.base64,'base64');if(bytes.length<20||bytes.length>300*1024||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)fail('รองรับรูป JPEG ที่แปลงจากช่องอัปโหลดเท่านั้น');
  await authorize();const id=randomUUID(),file=bucket.file(PREFIX+id+'.jpg');
  await file.save(bytes,{resumable:false,metadata:{contentType:'image/jpeg',cacheControl:'public,max-age=86400'}});
  try{await authorize();}catch(error){await file.delete().catch(()=>{});throw error;}
  return {url:'https://asia-southeast1-school-budget-3e69d.cloudfunctions.net/schoolHomepagePhoto?id='+id};
 },
 async serve(req,res){
  if(!['GET','HEAD'].includes(req.method)){res.status(405).end();return;}
  const id=req.query.id;if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)){res.status(404).end();return;}
  try{const [bytes]=await bucket.file(PREFIX+id+'.jpg').download();res.set('Content-Type','image/jpeg');res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','public,max-age=86400,immutable');res.status(200).send(req.method==='HEAD'?'':bytes);}catch(error){res.set('Cache-Control','no-store');res.status(error.code===404?404:503).end();}
 }
 };
}
module.exports={service};
