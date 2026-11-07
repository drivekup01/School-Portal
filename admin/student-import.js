import {parseStudentWorkbook} from './student-import-parser.js?v=20261107-sgs1';
export function installStudentImport({auth,status,lock,isBusy,refresh}){
 const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 let generation=0,job=null;
 const sync=()=>{$('import-apply').disabled=!job||job.ready===0||job.done;};
 function clear(){generation++;job=null;$('import-rows').replaceChildren();$('import-summary').textContent='';$('import-file').value='';sync();}
 function invalidate(){generation++;job=null;$('import-rows').replaceChildren();$('import-summary').textContent='เลือก “ตรวจไฟล์และเทียบทะเบียน” อีกครั้ง';sync();}
 for(const id of ['import-file','import-year','import-term','import-mode'])$(id).addEventListener('change',invalidate);
 $('import-preview').addEventListener('click',async()=>{
  if(isBusy())return;job=null;sync();const own=++generation,file=$('import-file').files[0];if(!file){status('กรุณาเลือกไฟล์ Excel ก่อน','error');return;}if(!/\.xlsx$/i.test(file.name)||file.size>6*1024*1024){status('ใช้ไฟล์ .xlsx ขนาดไม่เกิน 6 MB','error');return;}
  lock(true);$('import-rows').replaceChildren();status('กำลังอ่านไฟล์และเทียบทะเบียนนักเรียน…');
  try{
   const book=globalThis.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true,cellFormula:false,cellHTML:false,bookVBA:false});
   const parsed=parseStudentWorkbook(book,globalThis.XLSX);if(own!==generation)return;
   if(parsed.errors.length){$('import-summary').textContent='พบข้อมูลที่ต้องแก้ '+parsed.errors.length+' แถว ยังไม่ส่งข้อมูลเข้าระบบ';for(const item of parsed.errors.slice(0,100)){const tr=el('tr'),td=el('td',`แถว ${item.row}: ${item.message}`);td.colSpan=5;tr.append(td);$('import-rows').append(tr);}status('กรุณาแก้ข้อมูลในไฟล์แล้วตรวจใหม่','error');return;}
   const result=await auth.call('schoolStudentImport',{method:'preview',filename:file.name,year:Number($('import-year').value),term:Number($('import-term').value),mode:$('import-mode').value,rows:parsed.records});if(own!==generation)return;
   job={...result,cursor:0,mode:$('import-mode').value};const birthByRow=new Map(parsed.records.map(r=>[r.row,r.birthDate]));
   $('import-summary').textContent=`ชีต ${parsed.sheetName} · รหัสนักเรียนคอลัมน์ ${parsed.codeColumn} · ${result.total} คน · พร้อมอัปเดต ${result.ready} · ต้องตรวจสอบ ${result.skipped}`;
   for(const item of result.review){const tr=el('tr');tr.className=item.ready?'import-ready':'import-warning';const d=birthByRow.get(item.row),date=d?d.slice(8)+'/'+d.slice(5,7)+'/'+(Number(d.slice(0,4))+543):'—';for(const text of [item.code,item.name,item.className,date,item.message])tr.append(el('td',text));$('import-rows').append(tr);}
   status('ตรวจไฟล์แล้ว ยังไม่มีการเปลี่ยนข้อมูล กรุณาตรวจรายการก่อนยืนยัน','success');
  }catch(error){if(own===generation)status(error.message,'error');}finally{if(own===generation){lock(false);sync();}}
 });
 $('import-apply').addEventListener('click',async()=>{
  if(isBusy()||!job||!job.ready||job.done)return;
  const message=job.mode==='passwords'?`อัปเดตวันเกิดและตั้งรหัสผ่านเป็น DDMMพ.ศ. ให้ ${job.ready} คน? บัญชีที่ยังไม่เปิดใช้จะเปิดใช้ และการเข้าสู่ระบบเดิมจะสิ้นสุด`:`อัปเดตเฉพาะวันเกิด ${job.ready} คน? รหัสผ่านและสถานะบัญชีเดิมจะคงเดิม`;
  if(!window.confirm(message))return;
  const own=generation;lock(true);try{
   while(!job.done){const result=await auth.call('schoolStudentImport',{method:'studentImportApply',jobId:job.jobId,cursor:job.cursor});if(own!==generation)return;Object.assign(job,result);status(`กำลังอัปเดต ${job.cursor}/${job.total} คน…`);}
   await refresh();if(own!==generation)return;status(`อัปเดตสำเร็จ ${job.total} คน`+(job.mode==='passwords'?' · ใช้รหัสนักเรียนและวันเกิด DDMMพ.ศ. เข้าระบบได้แล้ว':''),'success');$('import-summary').textContent+= ' · อัปเดตเรียบร้อยแล้ว';
  }catch(error){if(own===generation)status(`อัปเดตแล้ว ${job.cursor} คน · ${error.message} · กดยืนยันอีกครั้งเพื่อทำต่อได้โดยไม่ทำซ้ำ`,'error');}finally{if(own===generation){lock(false);sync();}}
 });
 return {clear,sync,setPeriod(year,term){$('import-year').value=year;$('import-term').value=term;}};
}
