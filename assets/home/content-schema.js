export const sections = {
banner:{label:'แบนเนอร์',fields:[['schoolName','ชื่อโรงเรียน','text',150,true],['heroLabel','ข้อความเหนือหัวเรื่อง','text',100],['headline','หัวเรื่องหลัก','text',150,true],['motto','คำขวัญ / ข้อความรอง','text',150,true],['heroImage','ภาพแบนเนอร์','image',2000]]},
schoolInfo:{label:'ข้อมูลโรงเรียน',fields:[['summary','แนะนำโรงเรียน','textarea',2000],['history','ประวัติโรงเรียน','textarea',6000],['vision','วิสัยทัศน์','textarea',3000],['mission','พันธกิจ','textarea',6000]]},
staff:{label:'บุคลากร',max:100,fields:[['name','ชื่อ–นามสกุล','text',160,true],['position','ตำแหน่ง','text',160],['department','กลุ่มสาระ / ฝ่ายงาน','text',160],['image','รูปบุคลากร','image',2000]]},
announcements: {label:'ประกาศ', max:30, fields:[['title','หัวข้อประกาศ','text',250,true],['date','วันที่ประกาศ','date',10,true],['body','รายละเอียด','textarea',6000],['link','ลิงก์เอกสารแนบ (HTTPS)','url',2000],['pinned','ปักหมุดประกาศ','checkbox']]},
news: {label:'ข่าวสาร', max:30, fields:[['title','หัวข้อข่าว','text',250,true],['date','วันที่ข่าว','date',10,true],['category','หมวดหมู่','text',40,true],['summary','คำอธิบายย่อ','textarea',500],['body','เนื้อหาข่าว','textarea',8000],['image','ลิงก์รูปข่าว','image',2000],['link','ลิงก์โพสต์ Facebook / อ่านต่อ (HTTPS)','url',2000],['pinned','เลือกแสดงในรายการข่าวหน้าแรก','checkbox']]},
contact: {label:'ติดต่อโรงเรียน', fields:[['phone','โทรศัพท์','tel',80],['email','อีเมล','email',254],['address','ที่อยู่','textarea',1000],['mapUrl','ลิงก์แผนที่ (HTTPS)','url',2000],['facebookUrl','ลิงก์ Facebook (HTTPS)','url',2000]]}
};
export async function loadDefaults() {
const response = await fetch(new URL('./default-content.json',import.meta.url));
if(!response.ok) throw Error('โหลดข้อมูลตั้งต้นไม่สำเร็จ');
return upgradeContent(await response.json());
}

export function upgradeContent(value){return {heroLabel:'พื้นที่แห่งการเรียนรู้',staff:[],...value,schoolInfo:{summary:'',history:'',vision:'',mission:'',...value.schoolInfo}};}
