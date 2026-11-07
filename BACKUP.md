# ส่งออก Backup แยกระบบ

หน้า admin/backup.html และ callable schoolBackup เฉพาะผู้ดูแลระบบที่ active, schoolRole=admin และ Google verified ทุกคำขอ ตรวจสิทธิ์ซ้ำก่อนส่งข้อมูลกลับ งานสำรองเจ้าของอื่น/ผู้ใช้ทั่วไป/วิชาการ #1 ใช้ไม่ได้ ไม่มีการเปลี่ยนกฎ Firestore หรือเปิดไฟล์สาธารณะ

เลือกทีละชุด: งบประมาณ/เอกสาร, พัสดุ, ตารางสอน, ผลการเรียน, ทะเบียนนักเรียน, การมาเรียน, ความประพฤติ, บัญชี/สิทธิ์, หน้าแรก, ประวัติการใช้งาน รากคอลเลกชันถูกกำหนดจาก allowlist ใน functions/backup-service.js ไม่รวมข้อมูลระบบอื่นอัตโนมัติ dependencies อยู่ใน manifest ไม่สำรอง rate-limit/session ชั่วคราวหรือ cloud secrets

## ข้อมูล

- ใช้ Firestore REST readTime เดียวตลอดชุด (ทั้ง listDocuments และ listCollectionIds) รักษา native Value fields เช่น timestamp, reference, bytes, geo point และ integer string ไม่แปลงเป็นตัวเลข JavaScript จนเสียความแม่นยำ
- showMissing=true และค้น subcollection ของ missing parent เพื่อไม่ตกหล่นเอกสารที่ไม่มี parent document
- รากคอลเลกชันและ path ทุกหน้าถูกตรวจด้วยข้อมูล job ที่เก็บ server-side ตำแหน่ง pageToken ไม่อนุญาตให้เลือก URL หรือโครงการเอง
- ผลการเรียนรวม live PDF ใน bucket school-budget-3e69d-student-reports เฉพาะ batches/ และ remedial/ ดาวน์โหลดตาม generation ตรวจ CRC32C และ SHA256 ก่อนบันทึก ZIP ตรวจ original/pages ที่ batch snapshot อ้างอิง ถ้าไฟล์ขาดหรือกำลังนำเข้า/ลบ ให้หยุด ไม่บอกว่าสำรองสำเร็จ
- Firebase Auth metadata อยู่ในชุดบัญชี เก็บ uid/providers/customClaims/status เพื่อประกอบการกู้คืน เป็นข้อมูลสดระหว่างสำรอง ไม่ใช่ Auth point-in-time snapshot ไม่มี OAuth credentials, refresh token หรือ secret signing keys บัญชีนักเรียนมี password hash ใน Firestore จึงบังคับเข้ารหัสชุดบัญชี
- ไฟล์ลิงก์ภายนอก, โค้ด GitHub, deployment/configuration, Storage/Firestore Rules, Cloud Secrets ไม่รวมอยู่ในชุดข้อมูลนี้ ไม่คัดลอก URL ภายนอกอัตโนมัติ

## ไฟล์ที่ได้

ZIP custom schemaVersion=1: manifest.json, documents-index.csv, README.txt, documents/{encoded-path}.json, attachments/{encoded-path}. แต่ละเอกสารมี original path + native fields + createTime/updateTime ค่า SHA256/ขนาดใน manifest ใช้ตรวจความครบถ้วน รหัส path ถูก encode เพื่อป้องกัน ZIP path traversal ZIP นี้ไม่ใช่ managed Firestore export จึงใช้ gcloud firestore import โดยตรงไม่ได้ รุ่นนี้ยังไม่เปิดตัวกู้คืน

เลือกเข้ารหัสใน browser ได้ (.kbwbackup): AES-256-GCM, PBKDF2-SHA256 310000 รอบ, random salt16/iv12, authenticated header รหัสผ่านไม่ส่ง server ดาวน์โหลด backup-open.html เป็นเครื่องมือออฟไลน์ไฟล์เดียว ถอดรหัสเป็น ZIP ได้โดยไม่ส่งข้อมูลออกเครื่อง ชุดบัญชีบังคับเข้ารหัส ชุดอื่นปิดได้

## การทำงานและขอบเขต

- ไม่ลบ/แก้ไขข้อมูลต้นฉบับ และไม่เก็บ ZIP สำเนาไว้ใน Firestore/Storage ไฟล์สร้างใน browser และดาวน์โหลดลงเครื่อง
- school_backup_jobs เก็บเพียง owner, scope, roots, readTime, expiry (50 นาที) งานเสร็จหรือกดยกเลิกจะลบทิ้ง หากปิด browser กลางทางอาจเหลือ metadata หมดอายุแต่เรียกอ่านข้อมูลต่อไม่ได้
- school_backup_history เก็บ receipt ชื่อไฟล์ เวลา ผู้ทำ จำนวน ขนาดและ SHA256 ไม่มีข้อมูลเอกสารหรือรหัสผ่าน History หมายถึงสร้างไฟล์ส่งออก ไม่ใช่หลักฐานว่าผู้ใช้บันทึกไฟล์ลงดิสก์แล้ว
- page max25 docs / responseประมาณ5MB ถ้าหน้าใหญ่ browser ลด pageSize แล้วลองหน้าเดิม ไม่ข้ามข้อมูล PDF chunk3MB ตรวจช่วงและ generation
- ข้อมูลรวมต่อชุดจำกัด256MB ใน browser เพื่อไม่ให้หน่วยความจำล้น และ session50นาที ไฟล์แนบไม่ใช่ GCS point-in-time snapshot จึงควรงดนำเข้า/แก้ไข/ลบระหว่างสำรอง
- มีค่าอ่านข้อมูลตาม Firebase ไม่ใช่ขั้นตอนลดขนาดฐานข้อมูล

## ตรวจสอบ

node --test functions/test/*.test.js: สิทธิ์/แยก scope, missing parents, native integers, readTime เดียว, session/expiry, encryption, PDF generation/ranges, metadata-only receipts และปฏิเสธการแก้ไขต้นฉบับ

QA ภายนอก repository: virtual DOM สร้าง ZIP จริง เปิด ZIP และเทียบ manifest/native typed values, retry large page ไม่ตกหล่น, PDF ขาดไม่สร้างชุดสำเร็จ, role/session เปลี่ยนไม่ส่ง private output, offline crypto round-trip/wrong password/tampering ทดสอบ REST readTime กับฐานจริงแบบ read-only ไม่ลบหรือแก้ไขข้อมูลโรงเรียน

รวมข้อมูลเดิม procurement_* ในชุดงบประมาณ (procurement_users อยู่ชุดบัญชี), attendance_imports ในชุดทะเบียน และ attendance_teacher_records ในชุดตารางสอน ตรวจเทียบชื่อคอลเลกชันจริงแล้ว ยกเว้น rate-limit ชั่วคราว school_student_login_limits / school_usage_limits
