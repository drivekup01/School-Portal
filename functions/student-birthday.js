'use strict';
const {fail}=require('./student-data');
function birthdayPassword(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail('วันเกิดไม่ถูกต้อง');
 const date=new Date(value+'T00:00:00Z'),year=Number(value.slice(0,4));
 if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value||year<1900||date>Date.now())fail('วันเกิดไม่ถูกต้อง');
 return value.slice(8,10)+value.slice(5,7)+String(year+543);
}
module.exports={birthdayPassword};
