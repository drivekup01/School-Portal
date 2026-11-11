'use strict';
const {fail}=require('./student-data');
function object(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(value,k)))fail('รูปแบบข้อมูลไม่ถูกต้อง');}
function text(value,max,required=false){if(typeof value!=='string'||value.length>max||required&&!value.trim()||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail('ข้อความไม่ถูกต้องหรือยาวเกินกำหนด');return value.trim();}
function date(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)fail('วันที่ไม่ถูกต้อง');return value;}
module.exports={object,text,date};
