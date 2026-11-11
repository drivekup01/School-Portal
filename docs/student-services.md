# ขอลานักเรียนและย้ายห้อง

เข้าเมนูในระบบครู/บุคลากรหรือศูนย์ผู้ดูแลเดิม ไม่ต้องมีบัญชีใหม่

- ดูแลนักเรียน → **แจ้งขอออกนอกโรงเรียน**: ครูที่ถูกผูก `teacherId` และเป็น homeroom/homeroom2/homeroom3 ของห้องในตารางสอนปัจจุบันเท่านั้นที่ส่งคำขอได้ เลือกนักเรียน วันเวลา เหตุผล การเดินทางกลับ ชื่อผู้ปกครอง และวันที่ติดต่อ ยืนยันทางโทรศัพท์พร้อมบันทึกเวลา/ข้อความ หรือแนบภาพแชท ระบบย่อ JPEG ก่อนส่ง สูงสุด 256 KB หลังย่อ
- ฝ่ายปกครอง (`student_support`) และผู้ดูแลพิจารณาคำขอได้ อนุมัติ / ไม่อนุมัติ / ส่งกลับแก้ไข การไม่อนุมัติและส่งกลับต้องระบุเหตุผล ผู้ส่งไม่อนุมัติคำขอของตนเอง
- คำขอที่ส่งกลับแก้ไขให้ครูผู้ส่งแก้แล้วติ๊กยืนยันผู้ปกครองใหม่ การพิจารณาตรวจ revision เพื่อป้องกันเขียนทับ
- งานวิชาการ → **ทะเบียนนักเรียน → ย้ายห้องนักเรียน**: ฝ่ายวิชาการเต็มรูปแบบ (`timetable` ยกเว้น `academicScope=scheduler`) และผู้ดูแลเลือกนักเรียน ห้องใหม่ เลขที่ใหม่ และเหตุผล มีผลทันทีในวันที่ปัจจุบัน ภายในปี/ภาคเรียนเดียวกัน ยังไม่รองรับการตั้งเวลาหรือย้อนหลัง
- การย้ายเป็น transaction เดียว: ปิด active รายชื่อเดิม สร้าง/เปิดรายชื่อปลายทาง อัปเดตจำนวนนักเรียนและบัญชี Google/รหัสนักเรียน คง password hash เดิม เพิ่ม session version ให้นักเรียนเข้าสู่ระบบใหม่ด้วยรหัสผ่านเดิม ป้องกันเลขที่และรหัสซ้ำในห้องปลายทาง
- คงรายการเช็กชื่อ คะแนน และคำขอลาเดิมในห้องเดิม มี `rosterHistory` สำหรับหน้านักเรียนรวมประวัติเช็กชื่อและคะแนนก่อนย้าย ยอดคะแนนยกมาถูกบันทึกเป็นรายการ `transferBalance` สำหรับหน้าความประพฤติเดิม การรวมประวัติข้ามห้องไม่นับรายการยกมาซ้ำ
- ไม่มีการส่งข้อความถึงผู้ปกครองอัตโนมัติ ครูต้องติดต่อก่อนส่งคำขอ การอนุมัติยังไม่เปลี่ยนสถานะเช็กชื่ออัตโนมัติ

## ข้อมูลและการเผยแพร่

ใช้ Firestore Standard `(default)` ใน `school-budget-3e69d` และ callable `schoolStudentWorkflow` ใน codebase `school-portal` ข้อมูล `school_student_leaves` (private evidence/history เป็น subcollections) และ `school_student_transfers` เข้าผ่าน Admin SDK ภายใต้กฎ default deny เดิมเท่านั้น ไม่มี public URL ของภาพแชท ไม่เปิด client rules ใหม่ รวมไว้ใน scope สำรองทะเบียนนักเรียน

ตัวหน้าเว็บอยู่ `student-services/` แยกจาก `attendance/` ซึ่งยัง sync จาก School-Attendance ตามเดิม

ตรวจสอบ: `node --test functions/test/*.test.js tests/access-check.test.cjs tests/period-core.test.cjs tests/staff-route-refresh.test.cjs tests/today-lessons.test.cjs`

เผยแพร่ backend เฉพาะที่เกี่ยวข้อง:
`firebase deploy --only functions:school-portal:schoolStudentWorkflow,functions:school-portal:schoolStudent,functions:school-portal:schoolBackup,functions:school-portal:schoolUsage --project school-budget-3e69d`

GitHub Pages เผยแพร่ frontend จาก main ตามเดิม
