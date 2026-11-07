'use strict';
const {createHash}=require('node:crypto');
const hash=v=>createHash('sha256').update(v).digest('hex');
const name=v=>String(v||'').normalize('NFKC').replace(/\s/g,'').replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นางสาว|น\.ส\.)/,'');
const ownerKey=(code,studentName)=>hash(JSON.stringify([String(code),name(studentName)]));
const caseId=r=>hash(JSON.stringify([String(r.code),Number(r.year),Number(r.term),r.courseCode]));
const fail=(message,code='invalid-argument')=>{throw Object.assign(Error(message),{code});};
const token=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const states={open:'รอดำเนินการ',approval:'รออนุมัติจากฝ่ายวิชาการ',delete_requested:'รอพิจารณาลบรายการ',completed:'ดำเนินการแล้ว',returned:'ส่งกลับแก้ไข',archived:'นำออกจากรายการ'};
const faculty=p=>p?.active===true&&(p.schoolRole?['admin','timetable'].includes(p.schoolRole):p.identityAdmin===true||p.timetableRole==='academic');
function publicCase(id,v){const fields=['code','studentNumber','originalNumber','studentName','currentClassName','originalClassName','year','term','courseCode','courseName','teacherName','originalGrade','state','revision','teacherNote','deleteReason','proposedResult','finalResult','academicNote','proposedAt','completedAt'];const out={id};for(const k of fields)out[k]=v[k]?.toDate?.().toISOString()??v[k]??null;return out;}
function resultValid(v,c){return c.originalGrade==='มผ'||c.courseCode.startsWith('ก')?v==='ผ':['1','1.5','2','2.5','3','3.5','4'].includes(v);}
function validateCase(r){if(!/^\d{1,20}$/.test(r.code)||!Number.isInteger(r.year)||r.year<2500||r.year>2700||![1,2].includes(r.term)||!/^ม\.[1-6]\/\d+$/.test(r.originalClassName)||!/^[ก-ฮ]\d{5}$/.test(r.courseCode)||!['0','ร','มส','มผ'].includes(r.originalGrade))fail('อ่านข้อมูลนักเรียน ปี ภาค ห้อง รหัสวิชา หรือผลการเรียนไม่ครบ');}
module.exports={hash,name,ownerKey,caseId,fail,token,states,faculty,publicCase,resultValid,validateCase};
