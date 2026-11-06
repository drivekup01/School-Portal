export const sections = {
announcements: {label:'ประกาศ', max:30, fields:[['title','หัวข้อประกาศ','text',250,true],['date','วันที่ประกาศ','date',10,true],['body','รายละเอียด','textarea',6000],['link','ลิงก์เอกสารแนบ (HTTPS)','url',2000],['pinned','ปักหมุดประกาศ','checkbox']]},
news: {label:'ข่าวสาร', max:30, fields:[['title','หัวข้อข่าว','text',250,true],['date','วันที่ข่าว','date',10,true],['category','หมวดหมู่','text',40,true],['summary','คำอธิบายย่อ','textarea',500],['body','เนื้อหาข่าว','textarea',8000],['image','ลิงก์รูปข่าว','image',2000],['link','ลิงก์อ่านต่อ (HTTPS)','url',2000]]},
contact: {label:'ติดต่อโรงเรียน', fields:[['phone','โทรศัพท์','tel',80],['email','อีเมล','email',254],['address','ที่อยู่','textarea',1000],['mapUrl','ลิงก์แผนที่ (HTTPS)','url',2000],['facebookUrl','ลิงก์ Facebook (HTTPS)','url',2000]]}
};
export async function loadDefaults() {
const response = await fetch(new URL('./default-content.json',import.meta.url));
if(!response.ok) throw Error('โหลดข้อมูลตั้งต้นไม่สำเร็จ');
return response.json();
}
