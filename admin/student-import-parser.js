// SGS exports may contain two identically labelled ID columns. Only the
// five-digit school ID column is eligible; national identity numbers are excluded.
const clean=v=>String(v??'').normalize('NFC').replace(/[\s\u200b]/g,'');
function iso(y,m,d){if(y>2400)y-=543;const value=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,date=new Date(value+'T00:00:00Z');if(y<1900||y>new Date().getFullYear()||!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)throw Error('วันเกิดไม่ถูกต้อง');return value;}
export function birthDate(value,XLSX){
 if(value instanceof Date)return iso(value.getFullYear(),value.getMonth()+1,value.getDate());
 if(typeof value==='number'){const d=XLSX.SSF.parse_date_code(value);if(!d)throw Error('วันเกิดไม่ถูกต้อง');return iso(d.y,d.m,d.d);}
 const text=clean(value);let m=text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);if(m)return iso(+m[3],+m[2],+m[1]);
 m=text.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(m)return iso(+m[1],+m[2],+m[3]);throw Error('ไม่พบวันเกิดรูปแบบ วัน/เดือน/ปี');
}
export function parseStudentWorkbook(workbook,XLSX){
 const candidates=[];
 for(const sheetName of workbook.SheetNames){const sheet=workbook.Sheets[sheetName];if(!sheet['!ref'])continue;const bounds=XLSX.utils.decode_range(sheet['!ref']);if(bounds.e.r>10000||bounds.e.c>150)throw Error('ชีตมีขนาดเกินกำหนด (10,000 แถว / 150 คอลัมน์)');
 const rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:true,defval:'',blankrows:true});
 const header=rows.findIndex((row,i)=>i<20&&row.some(v=>['วันเกิด','วันเดือนปีเกิด','วัน/เดือน/ปีเกิด'].includes(clean(v)))&&row.some(v=>/^(เลขประจำตัวนักเรียน|รหัสนักเรียน|รหัสประจำตัวนักเรียน)$/.test(clean(v))));
 if(header<0)continue;const heads=rows[header].map(clean),data=rows.slice(header+1).map((row,i)=>({row,rowNumber:header+i+2})).filter(({row})=>row.some(v=>v!==''&&v!=null));
 const find=names=>heads.findIndex(h=>names.includes(h));
 const idColumns=heads.map((h,i)=>/^(เลขประจำตัวนักเรียน|รหัสนักเรียน|รหัสประจำตัวนักเรียน)$/.test(h)?i:-1).filter(i=>i>=0).filter(i=>data.length&&data.every(({row})=>/^\d{1,5}$/.test(clean(row[i]))));
 if(idColumns.length!==1)throw Error('ระบุคอลัมน์รหัสนักเรียน 5 หลักไม่ได้ชัดเจน กรุณาตรวจหัวตารางและรหัสนักเรียน');
 const codeCol=idColumns[0],first=find(['ชื่อ','ชื่อนักเรียน']),last=find(['นามสกุล','ชื่อสกุล']),prefix=find(['คำนำหน้าชื่อ','คำนำหน้า']),full=find(['ชื่อ-นามสกุล','ชื่อ–นามสกุล','ชื่อสกุลนักเรียน']),level=find(['ชั้น','ระดับชั้น']),room=find(['ห้อง','ห้องเรียน']),dob=find(['วันเกิด','วันเดือนปีเกิด','วัน/เดือน/ปีเกิด']);
 if((first<0||last<0)&&full<0||level<0||room<0)throw Error('ต้องมีคอลัมน์ชื่อ นามสกุล ชั้น และห้อง');
 const records=[],errors=[];
 for(const {row,rowNumber}of data){try{const code=clean(row[codeCol]).padStart(5,'0'),name=full>=0?String(row[full]).trim():[prefix>=0?row[prefix]:'',row[first],row[last]].filter(Boolean).join(' ').trim();
 if(!/^\d{5}$/.test(code)||!name)throw Error('รหัสหรือชื่อไม่ครบ');const levelMatch=clean(row[level]).match(/^(?:ม\.?|มัธยมศึกษาปีที่)?([1-6])$/),roomText=clean(row[room]);if(!levelMatch||!/^\d{1,2}$/.test(roomText))throw Error('ชั้นหรือห้องไม่ถูกต้อง');
 records.push({row:rowNumber,code,name,className:`ม.${levelMatch[1]}/${Number(roomText)}`,birthDate:birthDate(row[dob],XLSX)});
 }catch(error){errors.push({row:rowNumber,message:error.message});}}
 candidates.push({sheetName,records,errors,codeColumn:XLSX.utils.encode_col(codeCol)});
 }
 if(candidates.length!==1)throw Error(candidates.length?'พบหลายชีตที่เป็นรายชื่อนักเรียน กรุณาแยกไฟล์ให้เหลือชีตรายชื่อเดียว':'ไม่พบหัวตารางรูปแบบ SGS ที่รองรับ');
 const result=candidates[0],counts=new Map();for(const r of result.records)counts.set(r.code,(counts.get(r.code)||0)+1);for(const r of result.records)if(counts.get(r.code)>1)result.errors.push({row:r.row,message:'รหัสนักเรียนซ้ำในไฟล์'});
 if(!result.records.length||result.records.length>2000)throw Error('รองรับรายชื่อ 1–2,000 คนต่อไฟล์');return result;
}
