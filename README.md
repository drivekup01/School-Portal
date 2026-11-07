# School-Portal

หน้าแรกสำหรับเลือกระบบงานของโรงเรียนค่ายบางระจันวิทยาคม

Repository นี้มีหน้า Portal บัญชีผู้ใช้กลาง และ static UI เช็คชื่อที่เผยแพร่จาก repo School-Attendance ไม่เก็บข้อมูลเอกสาร งบประมาณ หรือนักเรียนใน GitHub

## ระบบที่เชื่อมต่อ

- ระบบงานงบประมาณและเอกสาร: https://drivekup01.github.io/School-Budget/
- ระบบจัดตารางสอน: https://drivekup01.github.io/School-OS/
- ระบบเช็คชื่อ: https://drivekup01.github.io/School-Portal/attendance/

ใช้ Firebase Google session เดียวกันบน origin drivekup01.github.io และ school_users ใน school-budget-3e69d
สิทธิ์แต่ละระบบแยกกัน ฝ่ายวิชาการไม่ได้รับสิทธิ์แก้ไขงบประมาณหรือเช็คชื่อโดยอัตโนมัติ
users.html ใช้จัดการบัญชีโดยผู้ดูแลกลาง และ migrate.html ใช้ตรวจการนำเข้าตารางสอน
schoolIdentity และ timetableApi อยู่ใน Functions codebase school-timetable ของ repo School-OS

School-Attendance เป็น repo ต้นฉบับสำหรับแก้หน้าเช็คชื่อ ไม่แก้ไฟล์ attendance/ ใน Portal โดยตรง
workflow sync-attendance.yml ใช้ scripts/sync-attendance.py คัดลอกเฉพาะ HTML/JS/CSS/รูปภาพทุก 15 นาทีหรือสั่งรันเอง
โฟลเดอร์ Functions, กฎ deploy, ข้อมูลส่วนตัวและสำรองข้อมูลไม่ถูกคัดลอกเข้าหน้าเว็บ

## ไฟล์

- `index.html` หน้าแรก
- `admin/index.html` ศูนย์ผู้ดูแลระบบ แยกจากหน้ารวมระบบและแสดงเฉพาะบัญชีผู้ดูแล
- ศูนย์ผู้ดูแลรวมทางเข้าระบบงบประมาณ วิชาการ ดูแลนักเรียน และบัญชีกลางไว้ใน shell เดียว โดยเปิดแต่ละหน้าภายในพื้นที่ทำงานเดียวกัน
- `users.html` จัดการบัญชีกลาง สิทธิ์ และสถานะการใช้งาน โดยใช้ระบบยืนยันตัวตนชุดเดิม
- `school-logo.svg` โลโก้โรงเรียน

เผยแพร่ผ่าน GitHub Pages จาก branch `main` ที่ root ของ repository

## แอปติดตั้งบนโทรศัพท์

ใช้ PWA ชื่อ KBW School จากหน้าหลักเดียวกัน มีปุ่มติดตั้งและคำแนะนำ Android/iPhone
รายละเอียดไฟล์ ขอบเขตแคช และวิธีทดสอบอยู่ใน [PWA.md](PWA.md)

UI หน้าจอใช้ shared/school-ui.css และฟอนต์ใน shared/fonts ร่วมกับระบบงานทั้งหมด ดู docs/unified-ui.md

## หน้าแรกโรงเรียน (พฤศจิกายน 2569)

หน้าแรกไม่ redirect ไป staff/ แล้ว และมีทางเข้าครูและบุคลากรเดิม
- index.html: โครงหน้าและข้อความประกาศ ปฏิทิน ข่าวสาร
- assets/home/home.css: รูปแบบ responsive แยกจาก CSS ระบบงาน
- assets/home/home.js: เมนูมือถือ รายละเอียดประกาศ และหน้าต่างข้อมูล
- assets/home/*.jpg: ภาพตัดจากภาพอ้างอิงที่ได้รับ เป็นภาพประกอบต้นแบบ
- ใช้ฟอนต์ใน shared/fonts และตราโรงเรียนเดิม ไม่เพิ่ม dependency

ข้อมูลประกาศ ปฏิทิน และข่าวจากภาพเป็นข้อมูลตัวอย่าง ไม่ใช่ประกาศปัจจุบัน
บริการนักเรียนและข้อมูลติดต่อยังต้องเติมข้อมูลจริง ไม่มีการสร้างระบบยืนยันตัวตนใหม่
ทดสอบในเครื่องโดยรัน npx --yes serve . แล้วเปิด URL ที่แสดง

## แก้ไขหน้าแรกสำหรับผู้ดูแล

เปิด admin/homepage.html หรือเลือก “แก้ไขหน้าแรก” ในศูนย์ผู้ดูแลระบบ
ใช้บัญชี Google และบทบาทผู้ดูแลกลางเดิม บัญชีครูและบุคลากรทั่วไปไม่สามารถอ่านฉบับร่างหรือบันทึกได้

1. เลือกส่วนที่ต้องการแก้ไขจากเมนูเดียว: ประกาศสำคัญ / ข่าวสารและกิจกรรม / ติดต่อโรงเรียน
2. เลือกรายการแล้วแก้ไขฟอร์ม เพิ่ม/ลบและจัดลำดับได้ (ประกาศที่ปักหมุดแสดงก่อน)
3. กดดูตัวอย่างเพื่อตรวจหน้าแรกก่อนเผยแพร่
4. บันทึกฉบับร่างเพื่อเก็บข้อมูล โดยยังไม่เปลี่ยนหน้าเว็บ
5. กดเผยแพร่หน้าแรกและยืนยัน เพื่อให้ผู้เข้าชมเห็นข้อมูลจากฉบับร่างล่าสุด

รูปข่าวและเอกสารแนบใช้ลิงก์ HTTPS ยังไม่มีการอัปโหลดไฟล์จากหน้านี้
ปฏิทินจะเชื่อมแหล่งข้อมูลเดียวกับระบบครูและบุคลากรในงานถัดไป ไม่มีชุดข้อมูลปฏิทินแยกใน CMS

### ข้อมูลและการตรวจสิทธิ์

- functions/ เป็น Functions codebase school-portal ใน repo นี้ แยกจาก school-timetable และ school-budget
- ใช้ Firebase project school-budget-3e69d และ Firestore (default) เดิม
- schoolHomepage callable: getPublished / getDraft / saveDraft / publish
- เอกสาร school_portal_content/homepage-draft และ homepage-published ใช้งานผ่าน Admin SDK เท่านั้น ภายใต้กฎ default deny เดิม ไม่เปิดสิทธิ์ client เข้าถึงโดยตรง
- getPublished ไม่ส่งฉบับร่าง UID หรือข้อมูลผู้แก้ไขออกสู่หน้าเว็บ
- คำสั่งผู้ดูแลตรวจ Google provider, verified email, active และ schoolRole=admin (หรือ identityAdmin=true สำหรับบัญชีเก่าที่ไม่มี schoolRole)
- บันทึก/เผยแพร่ตรวจสิทธิ์สดใน transaction และตรวจ revision เพื่อป้องกันเขียนทับข้อมูลจากผู้ดูแลคนอื่น
- เก็บ action, revision, updatedBy, updatedAt ใน school_portal_audit
- ไม่เก็บ token หรือรหัสผ่านลง repository

### พัฒนาและเผยแพร่

Frontend เป็น static files และเผยแพร่ผ่าน GitHub Pages จาก main ตามเดิม
Backend ใช้ Node.js 22 ติดตั้ง dependencies ใน functions/ ด้วย pnpm install
เรียก node --test functions/test/content.test.js เพื่อตรวจ validation, draft/public separation, role denial, revocation และ concurrent edits
เผยแพร่เฉพาะ backend นี้: firebase deploy --only functions:school-portal --project school-budget-3e69d
pnpm-workspace.yaml อนุญาต build scripts เฉพาะ @firebase/util และ protobufjs ที่ dependencies ต้องใช้

การเรียก schoolHomepage ผ่านเบราว์เซอร์ต้องให้ Cloud Run service schoolhomepage มี roles/run.invoker สำหรับ allUsers เช่นเดียวกับ callable schoolIdentity เดิม การอนุญาตนี้ทำให้ CORS และ Firebase callable handler รับคำขอได้ ส่วนการอ่านฉบับร่าง บันทึก และเผยแพร่ยังถูกตรวจสิทธิ์ผู้ดูแลใน handler ทุกครั้ง

## ระบบนักเรียน

- student/index.html: หน้าหลักส่วนตัว แสดงข้อมูลนักเรียน ครูที่ปรึกษา สรุปการมาเรียนรายเดือน ตารางเรียนวันนี้ และคะแนนความประพฤติ
- admin/students.html: ผู้ดูแลผูก/ยกเลิกอีเมล Google กับรายชื่อนักเรียน และตรวจคำขอแก้ไขข้อมูล
- ปุ่มนักเรียนบนหน้าแรกเชื่อมไป student/ แล้ว
- ก่อนใช้งานจริง ผู้ดูแลต้องเลือก “บัญชีนักเรียน” → เลือกห้อง/นักเรียน → ผูกอีเมล Google นักเรียน ไม่มีการเดารายชื่อจากชื่อ Google หรือให้นักเรียนเลือกรหัสของผู้อื่นเอง
- รูปใช้ photoUrl/photoURL จากทะเบียนถ้ามี มิฉะนั้นใช้รูปบัญชี Google พร้อมระบุที่มา หรือใช้อักษรชื่อเมื่อยังไม่มีรูป

### แหล่งข้อมูลเดิม

- อ่าน timetable_state/current และ timetable_versions/{version}/parts แบบตรวจ checksum จากระบบจัดตารางสอน เลือกห้องด้วยชื่อห้อง + ปีการศึกษา + ภาคเรียน ต้องตรงเพียงห้องเดียว
- ตารางวันนี้อ่านเฉพาะคาบของห้องนั้น รวม exchanges และ substitute ที่บันทึกในต้นทาง ไม่ส่งฐานตารางทั้งหมดให้นักเรียน
- ครูที่ปรึกษาอ้างอิง homeroom/homeroom2/homeroom3 ในห้องจากตารางสอน
- รายชื่ออ้างอิง attendance_classes/{classId}/students/{studentId} ของระบบดูแลนักเรียน
- เข้าแถวเช้ารวม attendance_morning_sessions กับ marks ของ assignment เก่า เลือกบันทึกล่าสุดต่อวัน และเลือก canonical เมื่อเวลาเท่ากัน
- รายคาบอ่าน marks เฉพาะ studentId ของเจ้าของบัญชี รวมรายการครูร่วมสอน/สอนแทนซ้ำเป็นหนึ่งวัน+คาบ+วิชา ไม่รวมกับจำนวนวันเข้าแถว
- เลือกดูการมาเรียนย้อนหลัง 12 เดือน นับเฉพาะรายการที่บันทึกจริง ไม่ถือว่าวันที่ไม่มีบันทึกเป็นขาด
- ความประพฤติอ่าน attendance_behavior ของ classId+studentId ใช้ 100 + ผลรวม delta เหมือนระบบดูแลนักเรียน ไม่คำนวณคะแนนจากจำนวนสาย/ลา/ขาดซ้ำอีกครั้ง
- การแจ้งเตือนส่วนบุคคลยังไม่เปิดใช้งาน มีเพียงข้อความแจ้งสถานะและลิงก์ข่าวโรงเรียน

### สิทธิ์และคำขอแก้ไข

Callable schoolStudent อยู่ใน Functions codebase school-portal และตรวจ Google provider + verified email
school_student_accounts/{sha256(email)} และ school_student_bindings/{sha256([classId,studentId])} ผูกแบบหนึ่งต่อหนึ่งโดยผู้ดูแลเท่านั้น ไม่มีสิทธิ์เพิ่มบทบาทครูให้นักเรียน
ทุกคำขอนักเรียนใช้ตัวตนจาก token และ mapping ฝั่งเซิร์ฟเวอร์ ไม่รับ classId/studentId จากหน้าจอ Dashboard และตรวจการผูกซ้ำก่อนคืนข้อมูล
school_student_corrections เก็บคำขอส่วนตัว เปิดค้างได้หนึ่งคำขอต่ออีเมล ผู้ดูแลตรวจแล้วแจ้งผลกลับได้ ระบบไม่แก้ทะเบียนหรือคะแนนโดยอัตโนมัติ
school_student_audit เก็บประวัติการผูก ยกเลิก และคำขอแก้ไข ใช้ Admin SDK ภายใต้ default deny เดิม ไม่เปิด collection ให้ client อ่านโดยตรง
ไม่มีข้อมูลนักเรียนจริงหรืออีเมลจริงในชุดทดสอบ และไม่มีโหมดจำลอง/ข้ามสิทธิ์อยู่ในหน้าเว็บ production
ทดสอบด้วย node --test functions/test/*.test.js
