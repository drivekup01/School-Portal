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
- `system-home.css` รูปแบบพื้นฐานของ Portal
- `home-landing.css` การ์ด Bento และสีโรงเรียน
- `home-intro.css` / `home-intro.js` เอฟเฟกต์โลโก้ก่อนเปิดหน้า
- `school-logo.svg` โลโก้โรงเรียน

เผยแพร่ผ่าน GitHub Pages จาก branch `main` ที่ root ของ repository

## แอปติดตั้งบนโทรศัพท์

ใช้ PWA ชื่อ KBW School จากหน้าหลักเดียวกัน มีปุ่มติดตั้งและคำแนะนำ Android/iPhone
รายละเอียดไฟล์ ขอบเขตแคช และวิธีทดสอบอยู่ใน [PWA.md](PWA.md)
