'use strict';
const {onCall,HttpsError} = require('firebase-functions/v2/https');
const {initializeApp,getApps} = require('firebase-admin/app');
const {getFirestore,FieldValue} = require('firebase-admin/firestore');
if (!getApps().length) initializeApp();
const content = require('./content-service').service(getFirestore(), () => FieldValue.serverTimestamp());
exports.schoolHomepage = onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:30,cors:['https://drivekup01.github.io','http://127.0.0.1:4173','http://localhost:4173']}, async request => {
  try { return await content.handle(request); }
  catch(error) {
    const allowed = ['invalid-argument','unauthenticated','permission-denied','aborted','failed-precondition'];
    if (allowed.includes(error.code)) throw new HttpsError(error.code,error.message);
    console.error('schoolHomepage failed',error.code || 'unknown');
    throw new HttpsError('internal','เชื่อมต่อข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง');
  }
});
const students = require('./student-service').service(getFirestore(), () => FieldValue.serverTimestamp());
exports.schoolStudent = onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:90,cors:['https://drivekup01.github.io','http://127.0.0.1:4173','http://localhost:4173']}, async request => {
  try { return await students.handle(request); }
  catch(error) {
    const allowed = ['invalid-argument','unauthenticated','permission-denied','aborted','failed-precondition','already-exists','not-found','resource-exhausted'];
    if (allowed.includes(error.code)) throw new HttpsError(error.code,error.message);
    console.error('schoolStudent failed',error.code || 'unknown');
    throw new HttpsError('internal','เชื่อมต่อข้อมูลนักเรียนไม่สำเร็จ กรุณาลองใหม่');
  }
});
