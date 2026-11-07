'use strict';
const {onCall,HttpsError} = require('firebase-functions/v2/https');
const {initializeApp,getApps} = require('firebase-admin/app');
const {getFirestore,FieldValue} = require('firebase-admin/firestore');
const {getAuth} = require('firebase-admin/auth');
if (!getApps().length) initializeApp();
const content = require('./content-service').service(getFirestore(), () => FieldValue.serverTimestamp());
exports.schoolHomepage=audited('schoolHomepage',{region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:30,cors:['https://drivekup01.github.io','http://127.0.0.1:4173','http://localhost:4173']}, async request => {
  try { return await content.handle(request); }
  catch(error) {
    const allowed = ['invalid-argument','unauthenticated','permission-denied','aborted','failed-precondition'];
    if (allowed.includes(error.code)) throw new HttpsError(error.code,error.message);
    console.error('schoolHomepage failed',error.code || 'unknown');
    throw new HttpsError('internal','เชื่อมต่อข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง');
  }
});
const passwords = require('./student-password').service(getFirestore(),()=>FieldValue.serverTimestamp(),(uid,claims)=>getAuth().createCustomToken(uid,claims));
exports.schoolStudentLogin=audited('schoolStudentLogin',{region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:120,cors:['https://drivekup01.github.io','http://127.0.0.1:4173','http://localhost:4173']},async request=>{
 try{return await passwords.handle(request);}catch(error){const allowed=['invalid-argument','unauthenticated','permission-denied','aborted','failed-precondition','already-exists','resource-exhausted'];if(allowed.includes(error.code))throw new HttpsError(error.code,error.message);console.error('schoolStudentLogin failed',error.code||'unknown');throw new HttpsError('internal','เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแล');}
});
const students = require('./student-service').service(getFirestore(), () => FieldValue.serverTimestamp());
exports.schoolStudent=audited('schoolStudent',{region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:90,cors:['https://drivekup01.github.io','http://127.0.0.1:4173','http://localhost:4173']}, async request => {
  try { return await students.handle(request); }
  catch(error) {
    const allowed = ['invalid-argument','unauthenticated','permission-denied','aborted','failed-precondition','already-exists','not-found','resource-exhausted'];
    if (allowed.includes(error.code)) throw new HttpsError(error.code,error.message);
    console.error('schoolStudent failed',error.code || 'unknown');
    throw new HttpsError('internal','เชื่อมต่อข้อมูลนักเรียนไม่สำเร็จ กรุณาลองใหม่');
  }
});

function audited(name,options,handler){const db=require('firebase-admin/firestore').getFirestore(),stamp=()=>require('firebase-admin/firestore').FieldValue.serverTimestamp();const audit=require('./usage-audit').service(db,stamp);return onCall(options,request=>audit.track(name,request,()=>handler(request)));}

exports.schoolUsage=onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:30,cors:['https://drivekup01.github.io','http://127.0.0.1:4173']},async request=>{try{return await require('./usage-audit').service(getFirestore(),()=>FieldValue.serverTimestamp()).handle(request);}catch(error){const codes=['invalid-argument','unauthenticated','permission-denied','resource-exhausted'];throw new HttpsError(codes.includes(error.code)?error.code:'internal',codes.includes(error.code)?error.message:'โหลดประวัติไม่สำเร็จ กรุณาลองใหม่');}});

const studentReports=require('./student-reports').service(getFirestore(),require('firebase-admin/storage').getStorage(),students.own);
exports.schoolStudentReports=onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:90,cors:['https://drivekup01.github.io','http://127.0.0.1:4173']},async request=>{try{return await studentReports.handle(request);}catch(error){const codes=['invalid-argument','unauthenticated','permission-denied','not-found','failed-precondition','aborted'];throw new HttpsError(codes.includes(error.code)?error.code:'internal',codes.includes(error.code)?error.message:'โหลดผลการเรียนไม่สำเร็จ กรุณาลองใหม่');}});

const studentRemedial=require('./student-remedial').service(getFirestore(),()=>FieldValue.serverTimestamp(),students.own);
exports.schoolStudentRemedial=onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:90,cors:['https://drivekup01.github.io','http://127.0.0.1:4173']},async request=>{try{return await studentRemedial.handle(request);}catch(error){const codes=['invalid-argument','unauthenticated','permission-denied','not-found','failed-precondition','aborted','already-exists','resource-exhausted'];throw new HttpsError(codes.includes(error.code)?error.code:'internal',codes.includes(error.code)?error.message:'โหลดรายการผลการเรียนไม่สำเร็จ กรุณาลองใหม่');}});
