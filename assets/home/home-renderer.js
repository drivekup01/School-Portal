import {loadDefaults} from './content-schema.js';
const $ = selector => document.querySelector(selector);
const element = (tag, text, className) => {const node=document.createElement(tag); if(text!=null)node.textContent=text; if(className)node.className=className; return node;};
export function safeUrl(value, image=false) {
if(typeof value!=='string'||!value)return '';
if(image && /^assets\/home\/[a-z0-9_-]+\.(jpg|png|webp)$/i.test(value))return new URL('../../'+value,import.meta.url).href;
try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
const fullDate = value => {const date=new Date(value+'T12:00:00+07:00');return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Bangkok'}).format(date):'';};
let current, allNews=false;
export function showDetail(title, body, link='') {
$('#detail-title').textContent=title;$('#detail-body').textContent=body;
let actions=$('#detail-actions');if(!actions){actions=element('div',null,'detail-actions');actions.id='detail-actions';$('#detail').append(actions);}actions.replaceChildren();
if(safeUrl(link)){const a=element('a','เปิดลิงก์แนบ ↗','detail-link');a.href=safeUrl(link);a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}
$('#detail').showModal();
}
function bindDetail(button,item){button.addEventListener('click',()=>showDetail(item.title,item.body||'ยังไม่มีรายละเอียดเพิ่มเติม',item.link));}
function renderNews(){
const grid=$('.news-grid');grid.replaceChildren();
const items=allNews?current.news:current.news.slice(0,2);
for(const item of items){const card=element('button',null,'news-card');card.type='button';
const image=safeUrl(item.image,true);if(image){const img=element('img');img.src=image;img.alt=item.title;img.loading='lazy';card.append(img);}
const copy=element('span',null,'news-copy');copy.append(element('span',item.category,'tag'),element('strong',item.title),element('span',item.summary),element('small',fullDate(item.date)));card.append(copy);bindDetail(card,item);grid.append(card);}
if(!items.length)grid.append(element('p','ยังไม่มีข่าวสารในขณะนี้','empty-content'));
$('#all-news').textContent=allNews?'แสดงน้อยลง ↑':'ดูทั้งหมด →';$('#all-news').setAttribute('aria-expanded',String(allNews));$('#all-news').hidden=current.news.length<=2;
$('#news-note').hidden=!current.sampleContent;$('#news-note').textContent='ข้อมูลและภาพประกอบตัวอย่างจากแบบอ้างอิง';
}
export function renderHomepage(content){
current=content;
document.title=content.schoolName;
$('.brand span').textContent=content.schoolName;$('.school-name').textContent=content.schoolName;$('h1').textContent=content.headline;$('.motto').textContent=content.motto;
$('footer>span').textContent=content.schoolName;$('#detail>.tag').textContent=content.schoolName;
const hero=safeUrl(content.heroImage,true);$('.campus').hidden=!hero;if(hero){$('.campus').src=hero;$('.campus').alt='อาคารเรียน '+content.schoolName;}
const announcements=$('.announcements');announcements.querySelectorAll('.announcement,small,.empty-content').forEach(node=>node.remove());
const sorted=[...content.announcements].sort((a,b)=>Number(b.pinned)-Number(a.pinned));
for(const item of sorted){const button=element('button',null,'announcement');button.type='button';button.append(element('i'),element('span',(item.pinned?'📌 ':'')+item.title));const time=element('time',fullDate(item.date));time.dateTime=item.date;button.append(time);bindDetail(button,item);announcements.append(button);}
if(!sorted.length)announcements.append(element('p','ยังไม่มีประกาศในขณะนี้','empty-content'));
if(content.sampleContent)announcements.append(element('small','ข้อมูลตัวอย่างจากภาพอ้างอิง'));
const list=$('.calendar ol');list.replaceChildren();
list.append(element('li','กำลังเตรียมเชื่อมปฏิทินจากระบบครูและบุคลากร'));
const sample=$('.calendar small');sample.hidden=true;
const contact=$('.contact');contact.querySelectorAll('p').forEach(node=>node.remove());
const phone=element('p');phone.append(element('span','☎'),element('span',content.contact.phone||'สอบถามข้อมูลทั่วไปของโรงเรียน'));phone.lastChild.className='contact-text';
const address=element('p');address.append(element('span','⌖'),element('span',content.contact.address||'แผนที่และเส้นทางมาโรงเรียน'));address.lastChild.className='contact-text';contact.insertBefore(phone,contact.lastElementChild);contact.insertBefore(address,contact.lastElementChild);
renderNews();
}
export function initializeInteractions(){
$('.close').addEventListener('click',()=>$('#detail').close());
$('#detail').addEventListener('click',event=>{if(event.target!==$('#detail'))return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();});
const menu=$('.menu'),nav=$('nav');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'ปิดเมนู':'เปิดเมนู');});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','เปิดเมนู');}));
$('[data-detail="student"]').addEventListener('click',()=>showDetail('สำหรับนักเรียน','ส่วนบริการนักเรียนอยู่ระหว่างจัดเตรียม สามารถติดตามประกาศและปฏิทินได้จากหน้าแรกนี้'));
$('[data-detail="contact"]').addEventListener('click',()=>{
const c=current.contact;showDetail('ติดต่อ'+current.schoolName,[c.phone&&'โทรศัพท์: '+c.phone,c.email&&'อีเมล: '+c.email,c.address&&'ที่อยู่: '+c.address].filter(Boolean).join('\n')||'ยังไม่มีข้อมูลติดต่อที่ยืนยันแล้ว');
const actions=$('#detail-actions');
for(const [label,href] of [['แผนที่ ↗',safeUrl(c.mapUrl)],['Facebook ↗',safeUrl(c.facebookUrl)],['โทรศัพท์',c.phone?'tel:'+c.phone.replace(/[^+0-9]/g,''):''],['อีเมล',c.email?'mailto:'+c.email:'']]){if(!href)continue;const a=element('a',label,'detail-link');a.href=href;if(href.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}actions.append(a);}
});
$('#all-news').addEventListener('click',()=>{allNews=!allNews;renderNews();});
}
export {loadDefaults};

