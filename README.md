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

## ## ระบบนักเรียน

- student/index.html: หน้าหลักนักเรียน ข้อมูลส่วนตัว ตารางเรียนวันนี้ สรุปการมาเรียน คะแนนความประพฤติ และคำขอแก้ไขข้อมูล
- เข้าด้วย ID = รหัสประจำตัวจาก attendance_classes/{classId}/students/{studentId}.code ในระบบดูแลนักเรียน ไม่สร้างทะเบียนใหม่ ไม่ตัดเลขศูนย์ด้านหน้า
- PASS เริ่มต้น = 123456 ชั่วคราว ยังไม่ใช้วันเกิดจนกว่าจะมีข้อมูลจริงและกำหนดรูปแบบวันที่
- ผู้ดูแลไป admin/students.html เลือกห้องและกดเปิดใช้ทั้งห้อง หรือเลือกนักเรียนรายคน สามารถรีเซ็ตรหัสและปิดบัญชีได้
- บัญชีที่เปิดใช้อยู่แล้วจะไม่ถูกรีเซ็ตรหัสจากการเปิดใช้ทั้งห้องซ้ำ
- รหัสผ่านเก็บเป็น scrypt hash พร้อม random salt ไม่เก็บ plaintext และไม่ส่ง hash ให้ browser
- ลองเข้าสู่ระบบได้สูงสุด 6 ครั้งต่อรหัสนักเรียนใน 15 นาที พร้อมจำกัดระดับ IP แบบรองรับเครือข่ายโรงเรียน
- schoolStudentLogin ตรวจรหัสแล้วสร้าง Firebase custom token ส่วน schoolStudent ตรวจ custom claims + บัญชีปัจจุบัน + ทะเบียนทุกครั้ง
- การรีเซ็ตหรือปิดบัญชีเพิ่ม version ทำให้ session เดิมเปิดข้อมูลไม่ได้ ไม่รับ studentId/classId จากนักเรียนในคำขอ dashboard
- บัญชีผู้ดูแลยังใช้ Google และสิทธิ์ผู้ดูแลกลางเดิม ส่วน mapping อีเมลแบบเดิมคง API ไว้สำหรับการเปลี่ยนผ่าน ไม่มีปุ่ม Google บนหน้า login นักเรียนใหม่

### แหล่งข้อมูล

ตารางอ่าน timetable_state/current และ timetable_versions/{version}/parts พร้อมตรวจ checksum เลือกห้องด้วยชื่อ ปี และภาคเรียน ต้องตรงเพียงห้องเดียว รวม exchanges/substitute และครูที่ปรึกษา homeroom/homeroom2/homeroom3
การมาเรียนอ่านเฉพาะ marks ของนักเรียนคนนั้นจาก attendance_morning_sessions และ attendance_assignments แยกเข้าแถวเช้าเป็นวันกับรายคาบเป็นคาบ เลือกบันทึกล่าสุดเมื่อซ้ำ ไม่ถือว่าวันที่ไม่มีบันทึกเป็นขาด เลือกย้อนหลัง 12 เดือนได้
คะแนนใช้ 100 + ผลรวม delta จาก attendance_behavior ของ classId/studentId เดียวกัน ไม่คำนวณลดจากการสาย/ขาดซ้ำ
แจ้งเตือนส่วนบุคคลยังไม่เปิดใช้งาน รูปใช้ทะเบียนถ้ามีหรืออักษรชื่อ (รูป Google ใช้ได้เฉพาะ session เดิม)
คำขอแก้ไขข้อมูลเก็บส่วนตัว ผู้ดูแลตรวจและแจ้งผล ไม่แก้ทะเบียนหรือคะแนนอัตโนมัติ

### Backend และสิทธิ์

Functions codebase school-portal ใน repo นี้: schoolStudent, schoolStudentLogin, schoolHomepage
school_student_passwords, school_student_login_limits, school_student_corrections และ school_student_audit ใช้ผ่าน Admin SDK ภายใต้ default deny เดิม ไม่เปิด client access
Firebase custom tokens ลงนามด้วย service account ของ runtime ผ่าน IAM โดยให้ Service Account Token Creator เฉพาะบัญชีนั้นลงนามเป็นตัวเอง ไม่สร้างหรือเก็บ service-account key
ชุดทดสอบทั้งหมดใช้ข้อมูลสังเคราะห์ ไม่เก็บข้อมูลนักเรียนจริงหรือเพิ่มโหมดข้ามสิทธิ์ใน production
ทดสอบด้วย node --test functions/test/*.test.js
