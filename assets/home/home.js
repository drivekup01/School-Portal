'use strict';
const details = {
student: ['สำหรับนักเรียน', 'ส่วนบริการนักเรียนอยู่ระหว่างจัดเตรียม สามารถติดตามประกาศและปฏิทินได้จากหน้าแรกนี้'],
exam: ['กำหนดการสอบปลายภาคเรียนที่ 2', 'ข้อมูลตัวอย่างจากภาพอ้างอิง: ปีการศึกษา 2567 ประกาศวันที่ 12 มีนาคม 2568 ยังไม่มีตารางสอบหรือเอกสารแนบจริง กรุณารอประกาศที่ยืนยันจากโรงเรียน'],
uniform: ['การแต่งกายนักเรียนในช่วงฤดูร้อน', 'ข้อมูลตัวอย่างจากภาพอ้างอิง: ประกาศวันที่ 5 มีนาคม 2568 รายละเอียดแนวปฏิบัติจริงจะเพิ่มเติมเมื่อได้รับข้อมูลจากโรงเรียน'],
contact: ['ช่องทางติดต่อโรงเรียน', 'ยังไม่ได้เพิ่มหมายเลขโทรศัพท์ ที่อยู่ และแผนที่ที่ยืนยันแล้ว ส่วนนี้พร้อมสำหรับใส่ข้อมูลติดต่อจริงของโรงเรียน'],
classroom: ['บรรยากาศการเรียนการสอน', 'ตัวอย่างข่าวและภาพประกอบจากแบบอ้างอิง แสดงแนวทางนำเสนอการเรียนรู้ในห้องเรียน การลงมือปฏิบัติ และการคิดวิเคราะห์ รอข้อมูลกิจกรรมจริงก่อนเผยแพร่เป็นข่าวของโรงเรียน'],
sports: ['กิจกรรมกีฬาสี สร้างความสามัคคี', 'ตัวอย่างข่าวและภาพประกอบจากแบบอ้างอิง แสดงแนวทางนำเสนอกิจกรรมที่ส่งเสริมความสามัคคีและน้ำใจนักกีฬา รอรายละเอียดกิจกรรมจริงจากโรงเรียน']
};
const dialog = document.querySelector('#detail');
document.querySelectorAll('[data-detail]').forEach(button => button.addEventListener('click', () => {
const [title, body] = details[button.dataset.detail];
document.querySelector('#detail-title').textContent = title;
document.querySelector('#detail-body').textContent = body;
dialog.showModal();
}));
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
const menu = document.querySelector('.menu'), nav = document.querySelector('nav');
menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู'); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
document.querySelector('#all-news').addEventListener('click', event => { const note = document.querySelector('#news-note'); note.hidden = !note.hidden; event.currentTarget.setAttribute('aria-expanded', String(!note.hidden)); });
