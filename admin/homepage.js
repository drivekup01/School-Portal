import {mountHomeCalendarEditor} from './home-calendar-editor.js?v=20261108-home2';
import * as auth from '../shared/school-auth.js?v=20261027-roles1';
import {sections,loadDefaults,upgradeContent} from '../assets/home/content-schema.js?v=20261108-home2';
import {safeUrl} from '../assets/home/home-renderer.js?v=20261108-live-content1';
const $=id=>document.getElementById(id);
const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;if(className)node.className=className;return node;};
const single=name=>['banner','schoolInfo','contact'].includes(name),calendarSection=()=>['calendarAnnouncements','calendarActivities'].includes(section);let calendarEditor=null;
let content=null, revision=0, publishedRevision=0, section='banner', selected=0, dirty=false, busy=false, epoch=0, observerStarted=false, activeUid=null, pendingConfirm=null;
const canEdit=profile=>profile?.active===true&&(profile.schoolRole?profile.schoolRole==='admin':profile.identityAdmin===true);
function status(message,kind='info'){$('status').textContent=message;$('status').dataset.kind=kind;}
function updateRevision(){$('revision').textContent='ฉบับร่างรุ่น '+revision+' · เผยแพร่แล้วรุ่น '+publishedRevision+(dirty?' · มีการแก้ไขที่ยังไม่บันทึก':revision!==publishedRevision?' · มีฉบับร่างที่ยังไม่เผยแพร่':' · ไม่มีการแก้ไขค้าง');}
function markDirty(){dirty=true;updateRevision();}
function lock(value){busy=value;document.querySelectorAll('#workspace button,#workspace input,#workspace textarea,#workspace select').forEach(node=>node.disabled=value||(!content&&!['reload','logout'].includes(node.id)));if(!value&&content)renderItems();}
function gate(title,message,login=false,retry=false){epoch++;content=null;activeUid=null;dirty=false;$('workspace').hidden=true;$('gate').hidden=false;$('gate-title').textContent=title;$('gate-message').textContent=message;$('login').hidden=!login;$('retry').hidden=!retry;$('fields').replaceChildren();$('items').replaceChildren();$('calendar-editor').replaceChildren();$('preview-dialog').close();$('confirm').close();}
function confirmAction(title,body,label,action){pendingConfirm=action;$('confirm-title').textContent=title;$('confirm-body').textContent=body;$('accept-confirm').textContent=label;$('confirm').showModal();}
$('cancel-confirm').addEventListener('click',()=>{$('confirm').close();pendingConfirm=null;});
$('accept-confirm').addEventListener('click',()=>{const action=pendingConfirm;pendingConfirm=null;$('confirm').close();action?.();});
async function loadDraft(){const ownEpoch=epoch;lock(true);status('กำลังโหลดข้อมูลล่าสุด…');try{const result=await auth.call('schoolHomepage',{method:'getDraft'});const next=result.content||await loadDefaults();if(ownEpoch!==epoch||!activeUid)return;content=upgradeContent(structuredClone(next));revision=result.revision;publishedRevision=result.publishedRevision;dirty=false;selected=0;$('sample').checked=content.sampleContent;render();status(result.content?'โหลดข้อมูลเรียบร้อยแล้ว':'ยังไม่มีฉบับร่าง เริ่มต้นจากข้อมูลหน้าเว็บตัวอย่าง');}catch(error){if(ownEpoch===epoch){content=null;$('fields').replaceChildren();status('โหลดข้อมูลไม่สำเร็จ: '+error.message,'error');}}finally{if(ownEpoch===epoch)lock(false);}}
async function boot(){
try{const profile=await auth.profile();if(!profile){gate('เข้าสู่ระบบผู้ดูแล','ใช้บัญชี Google ที่ได้รับสิทธิ์ผู้ดูแลระบบ',true);return;}if(!canEdit(profile)){gate('ไม่มีสิทธิ์เข้าถึง','หน้านี้สำหรับผู้ดูแลระบบเท่านั้น กรุณาเลือกบัญชีที่ได้รับสิทธิ์',true);return;}
activeUid=profile.uid;epoch++;$('gate').hidden=true;$('workspace').hidden=false;$('account-name').textContent=profile.name||profile.email||'ผู้ดูแลระบบ';await loadDraft();
if(!observerStarted){observerStarted=true;await auth.observeProfile((next,error)=>{if(error||!canEdit(next)){gate('สิทธิ์การใช้งานเปลี่ยนแปลง','กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลอีกครั้ง',true);}});}
}catch(error){gate('เชื่อมต่อระบบไม่ได้',error.message,false,true);}
}
$('login').addEventListener('click',async()=>{try{$('login').disabled=true;await auth.login();await boot();}catch(error){gate('เข้าสู่ระบบไม่สำเร็จ',error.message,true);}finally{$('login').disabled=false;}});
$('retry').addEventListener('click',boot);
$('logout').addEventListener('click',()=>{const run=async()=>{try{await auth.logout();gate('ออกจากระบบแล้ว','เข้าสู่ระบบด้วยบัญชีผู้ดูแลเพื่อแก้ไขหน้าแรก',true);}catch(error){status(error.message,'error');}};if(dirty)confirmAction('ออกจากระบบ?','มีการแก้ไขที่ยังไม่บันทึก ข้อมูลส่วนนี้จะไม่ถูกเก็บ','ออกจากระบบ',run);else run();});
$('section').addEventListener('change',()=>{section=$('section').value;selected=0;render();});
function renderItems(){const host=$('items');host.replaceChildren();if(!content||single(section)||calendarSection())return;
const list=content[section];$('add').disabled=busy||list.length>=sections[section].max;
list.forEach((item,index)=>{const row=element('div',null,'item-row'+(index===selected?' selected':'')),choose=element('button',null,'choose');choose.type='button';choose.append(element('strong',(item.pinned?'📌 ':'')+(item.title||item.name||'รายการใหม่')),element('small',item.date||item.position||'ข้อมูลบุคลากร'));choose.addEventListener('click',()=>{selected=index;render();});const order=element('div',null,'order');for(const [step,label] of [[-1,'↑'],[1,'↓']]){const button=element('button',label);button.type='button';button.setAttribute('aria-label',(step<0?'เลื่อนขึ้น ':'เลื่อนลง ')+(item.title||item.name||'รายการใหม่'));button.disabled=busy||index+step<0||index+step>=list.length;button.addEventListener('click',()=>{[list[index],list[index+step]]=[list[index+step],list[index]];selected=index+step;markDirty();render();});order.append(button);}row.append(choose,order);host.append(row);});
if(!list.length)host.append(element('p','ยังไม่มีรายการ','empty'));}
function render(){if(!content)return;const calendar=calendarSection(),singleton=single(section);$('editor-layout').hidden=calendar;$('calendar-editor').hidden=!calendar;document.querySelector('.settings').hidden=calendar;$('revision').hidden=calendar;for(const id of ['save','publish','preview'])$(id).hidden=calendar;$('section').value=section;if(calendar){calendarEditor=mountHomeCalendarEditor($('calendar-editor'),{mode:section==='calendarAnnouncements'?'announcements':'activities',call:auth.call});status('เลือกกิจกรรมที่ต้องการเผยแพร่บนหน้าแรก');return;}
 $('items-panel').hidden=singleton;$('editor-layout').classList.toggle('contact-only',singleton);$('items-title').textContent='รายการ'+sections[section].label;$('editor-kicker').textContent=$('section').selectedOptions[0].textContent;
 const item=section==='banner'?content:singleton?content[section]:content[section][selected];$('editor-title').textContent=singleton?sections[section].label:item?.title||item?.name||'ข้อมูลที่ต้องการแก้ไข';$('delete').hidden=singleton||!item;$('empty').hidden=Boolean(item);$('fields').replaceChildren();if(item)for(const definition of sections[section].fields)renderField(item,definition);renderItems();updateRevision();}
function renderField(item,[key,label,type,max,required]){
const wrapper=element('label',null,'field'+(type==='checkbox'?' checkbox':'')),caption=element('span',label+(required?' *':'')),input=element(type==='textarea'?'textarea':'input');
if(type!=='textarea')input.type=type==='image'?'text':type;input.id='field-'+key;input.name=key;if(max)input.maxLength=max;input.required=Boolean(required);if(type==='checkbox'){input.checked=Boolean(item[key]);wrapper.append(input,caption);}else{input.value=item[key]||'';wrapper.append(caption,input);}
if(type==='url')input.pattern='https://.*';
input.addEventListener(type==='checkbox'?'change':'input',()=>{item[key]=type==='checkbox'?input.checked:input.value;input.setCustomValidity('');markDirty();if(key==='title'||key==='name'){$('editor-title').textContent=item[key]||'รายการใหม่';renderItems();}});
if(type==='image'){wrapper.append(element('small','วางลิงก์ภาพ HTTPS หรือใช้ assets/home/campus.jpg สำหรับภาพแบนเนอร์'));const preview=element('img',null,'image-preview');preview.alt='ตัวอย่างรูปประกอบ';const refresh=()=>{const url=safeUrl(input.value,true);preview.hidden=!url;if(url)preview.src=url;};input.addEventListener('change',refresh);refresh();wrapper.append(preview);}
if(type==='textarea')wrapper.append(element('small','ข้อความล้วน • สูงสุด '+max.toLocaleString('th-TH')+' ตัวอักษร'));
$('fields').append(wrapper);
}
$('add').addEventListener('click',()=>{const list=content[section];if(!list||list.length>=sections[section].max)return;const item={id:crypto.randomUUID()};for(const [key,,type] of sections[section].fields)item[key]=type==='checkbox'?false:type==='date'?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()):key==='category'?'ข่าวสาร':'';list.push(item);selected=list.length-1;markDirty();render();($('field-title')||$('field-name'))?.focus();});
$('delete').addEventListener('click',()=>{const item=content[section][selected];confirmAction('ลบรายการนี้?','“'+(item.title||item.name||'รายการใหม่')+'” จะถูกนำออกจากฉบับร่าง หน้าเว็บจะเปลี่ยนเมื่อคุณกดเผยแพร่','ลบรายการ',()=>{content[section].splice(selected,1);selected=Math.max(0,selected-1);markDirty();render();});});
$('sample').addEventListener('change',()=>{content.sampleContent=$('sample').checked;markDirty();});
$('reload').addEventListener('click',()=>{if(calendarSection()){calendarEditor?.load();return;}if(dirty)confirmAction('โหลดข้อมูลล่าสุด?','การแก้ไขที่ยังไม่บันทึกจะถูกแทนที่ด้วยฉบับร่างล่าสุด','โหลดข้อมูล',loadDraft);else loadDraft();});
function validateAll(){
for(const name of ['banner','schoolInfo','staff','announcements','news','contact']){const entries=name==='banner'?[content]:single(name)?[content[name]]:content[name];for(let index=0;index<entries.length;index++){for(const [key,label,type,max,required] of sections[name].fields){const value=entries[index][key];let invalid=required&&!String(value||'').trim();invalid ||= typeof value==='string'&&max&&value.length>max;
if(type==='date')invalid ||= !/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value;
if((type==='url'||type==='image')&&value)invalid ||= !safeUrl(value,type==='image');
if(type==='email'&&value)invalid ||= !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
if(type==='tel'&&value)invalid ||= !/^[+0-9()\s.,-]+$/.test(value);
if(invalid){section=name;selected=index;$('section').value=name;render();const input=$('field-'+key);input.setCustomValidity('กรุณาตรวจสอบ'+label);input.reportValidity();status('กรุณาตรวจสอบ'+label+' ใน'+sections[name].label,'error');return false;}
}}}return true;
}
async function saveDraft(){if(!content||!validateAll())return false;const ownEpoch=epoch;lock(true);status('กำลังบันทึกฉบับร่าง…');try{const result=await auth.call('schoolHomepage',{method:'saveDraft',revision,content});if(ownEpoch!==epoch)return false;revision=result.revision;dirty=false;updateRevision();status('บันทึกฉบับร่างแล้ว ข้อมูลบนหน้าเว็บยังไม่เปลี่ยน','success');return true;}catch(error){if(ownEpoch===epoch)status(error.message,'error');return false;}finally{if(ownEpoch===epoch)lock(false);}}
$('save').addEventListener('click',saveDraft);
$('editor-form').addEventListener('submit',event=>event.preventDefault());
$('publish').addEventListener('click',()=>{if(!content||!validateAll())return;confirmAction('เผยแพร่หน้าแรก?','ประกาศ '+content.announcements.length+' รายการ · ข่าวและกิจกรรม '+content.news.length+' รายการ\nพร้อมข้อมูลหน้าแรกและบุคลากร จะปรากฏต่อผู้เข้าชมเว็บไซต์ หากมีการแก้ไข ระบบจะบันทึกฉบับร่างก่อนเผยแพร่','ยืนยันเผยแพร่',async()=>{if((dirty||revision===0)&&!(await saveDraft()))return;const ownEpoch=epoch;lock(true);status('กำลังเผยแพร่…');try{const result=await auth.call('schoolHomepage',{method:'publish',revision});if(ownEpoch!==epoch)return;publishedRevision=result.publishedRevision;updateRevision();status('เผยแพร่เรียบร้อยแล้ว เปิดหน้าเว็บไซต์เพื่อดูข้อมูลล่าสุดได้ทันที','success');}catch(error){if(ownEpoch===epoch)status(error.message,'error');}finally{if(ownEpoch===epoch)lock(false);}});});
$('preview').addEventListener('click',()=>{if(!content||!validateAll())return;$('preview-dialog').showModal();const frame=$('preview-frame');if(!frame.getAttribute('src'))frame.src='../?preview=1';else frame.contentWindow.postMessage({type:'school-homepage-preview',content},location.origin);});
window.addEventListener('message',event=>{if(content&&event.origin===location.origin&&event.source===$('preview-frame').contentWindow&&event.data?.type==='school-homepage-preview-ready')$('preview-frame').contentWindow.postMessage({type:'school-homepage-preview',content},location.origin);});
$('close-preview').addEventListener('click',()=>$('preview-dialog').close());
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
boot();
