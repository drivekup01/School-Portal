'use strict';
function fail(message, code = 'invalid-argument') { throw Object.assign(new Error(message), {code}); }
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(value, key))) fail('รูปแบบข้อมูลไม่ถูกต้อง');
}
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail('ข้อความไม่ถูกต้องหรือยาวเกินกำหนด');
  return value.trim();
}
function url(value, image = false) {
  const result = text(value, 2000);
  if (!result) return '';
  if (image && /^assets\/home\/[a-z0-9_-]+\.(jpg|png|webp)$/i.test(result)) return result;
  try { const parsed = new URL(result); if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail('ลิงก์ต้องเป็น HTTPS'); } catch { fail('ลิงก์ต้องเป็น HTTPS ที่ถูกต้อง'); }
  return result;
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) fail('วันที่ไม่ถูกต้อง');
  return value;
}
function list(value, max, normalize) {
  if (!Array.isArray(value) || value.length > max) fail('จำนวนรายการเกินกำหนด');
  const result = value.map(normalize);
  if (new Set(result.map(item => item.id)).size !== result.length) fail('รหัสรายการซ้ำกัน');
  return result;
}
function id(value) { if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) fail('รหัสรายการไม่ถูกต้อง'); return value; }
function normalize(value) {
  object(value, ['schoolName','headline','motto','heroImage','sampleContent','announcements','news','contact']);
  if (typeof value.sampleContent !== 'boolean') fail('สถานะข้อมูลตัวอย่างไม่ถูกต้อง');
  object(value.contact, ['phone','email','address','mapUrl','facebookUrl']);
  const contact = {phone:text(value.contact.phone,80), email:text(value.contact.email,254), address:text(value.contact.address,1000), mapUrl:url(value.contact.mapUrl), facebookUrl:url(value.contact.facebookUrl)};
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) fail('อีเมลไม่ถูกต้อง');
  if (contact.phone && !/^[+0-9()\s.,-]+$/.test(contact.phone)) fail('หมายเลขโทรศัพท์ไม่ถูกต้อง');
  const result = {
    schoolName:text(value.schoolName,150,true), headline:text(value.headline,150,true), motto:text(value.motto,150,true), heroImage:url(value.heroImage,true), sampleContent:value.sampleContent, contact,
    announcements:list(value.announcements,30,item => { object(item,['id','title','date','body','link','pinned']); if(typeof item.pinned !== 'boolean') fail('สถานะปักหมุดไม่ถูกต้อง'); return {id:id(item.id),title:text(item.title,250,true),date:date(item.date),body:text(item.body,6000),link:url(item.link),pinned:item.pinned}; }),
    news:list(value.news,30,item => {item={pinned:false,...item};object(item,['id','title','date','category','summary','body','image','link','pinned']);if(typeof item.pinned !== 'boolean') fail('สถานะข่าวเด่นไม่ถูกต้อง');return {id:id(item.id),title:text(item.title,250,true),date:date(item.date),category:text(item.category,40,true),summary:text(item.summary,500),body:text(item.body,8000),image:url(item.image,true),link:url(item.link),pinned:item.pinned};})
  };
  if (Buffer.byteLength(JSON.stringify(result)) > 350000) fail('ข้อมูลรวมต้องไม่เกิน 350 KB');
  return result;
}
function assertAdmin(auth, profile) {
  if (!auth) fail('กรุณาเข้าสู่ระบบ', 'unauthenticated');
  if (auth.token?.firebase?.sign_in_provider !== 'google.com' || auth.token?.email_verified !== true || !profile || profile.active !== true || (profile.schoolRole ? profile.schoolRole !== 'admin' : profile.identityAdmin !== true)) fail('เฉพาะผู้ดูแลระบบเท่านั้น', 'permission-denied');
}
module.exports = {normalize, assertAdmin, fail};

