const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {service}=require('../student-reports');
const hash=s=>createHash('sha256').update(s).digest('hex');
function fixture(){
 let currentCode='00123',published=true;const reads=[];
 const report={year:2569,term:1,kind:'final',code:'00123',ownerKey:hash(JSON.stringify(['00123','นักเรียนทดสอบ'])),batchId:'a'.repeat(64),page:1,className:'ม.2/3',publishedAt:{toDate:()=>new Date('2026-11-07')},courses:[{code:'ท22101',name:'ภาษาไทย',score:77,rawName:'PRIVATE RAW TEXT'}]};
 const snapshot=()=>({exists:true,data:()=>({...report,published})});
 const db={doc:path=>({get:async()=>{reads.push(path);return snapshot();}}),collection:path=>({orderBy(){reads.push(path);return this;},limit(){return this;},get:async()=>({docs:[{id:'2569_1_final',data:()=>({...report,published})}]})})};
 const storage={bucket:()=>({file:path=>({download:async()=>{reads.push(path);return [Buffer.from('%PDF-one-page-only')];}})})};
 const own=async()=>({student:{code:currentCode,name:'นักเรียนทดสอบ'},link:{classId:'class',studentId:'student'}});
 return {api:service(db,storage,own),reads,revoke:()=>published=false,changeCode:()=>currentCode='99999'};
}
test('students cannot supply another student/class and all paths derive from their validated own mapping',async()=>{const f=fixture();await assert.rejects(f.api.handle({data:{method:'list',code:'99999'}}),{code:'invalid-argument'});const result=await f.api.handle({data:{method:'list'}});assert.equal(result.reports.length,1);assert(f.reads[0].includes(hash('00123')));assert(!JSON.stringify(result).includes('batchId'));});
test('own course response omits source IDs and raw extraction; unpublished reports cannot be opened',async()=>{const f=fixture();const result=await f.api.handle({data:{method:'get',id:'2569_1_final'}});assert.equal(result.courses[0].score,77);assert(!JSON.stringify(result).includes('PRIVATE'));assert(!JSON.stringify(result).includes('batchId'));f.revoke();await assert.rejects(f.api.handle({data:{method:'pdf',id:'2569_1_final'}}),{code:'not-found'});});
test('PDF reads are one private page, not the uploaded class-wide original, and path injection is rejected',async()=>{const f=fixture();const result=await f.api.handle({data:{method:'pdf',id:'2569_1_final'}});assert.equal(Buffer.from(result.base64,'base64').toString(),'%PDF-one-page-only');assert(f.reads.some(p=>p.endsWith('/pages/1.pdf')));assert(!f.reads.some(p=>p.endsWith('/original.pdf')));await assert.rejects(f.api.handle({data:{method:'pdf',id:'../../another'}}),{code:'invalid-argument'});});
