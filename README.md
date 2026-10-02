# ระบบจัดการครุภัณฑ์โรงพยาบาล (Hospital Asset Management System)
**Hospital Clinical Asset & Medical Equipment Management System**
**Architecture: Backend: GitHub | Frontend: HTML, CSS, Vanilla JavaScript | Database: Supabase**

ระบบบริหารจัดการครุภัณฑ์และเครื่องมือแพทย์สำหรับโรงพยาบาล, โรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.), ศูนย์บริการสาธารณสุข และศูนย์การแพทย์ ออกแบบตามสถาปัตยกรรม **GitHub-Native Web Application** ทำงานร่วมกับฐานข้อมูลหลัก **Supabase (PostgreSQL)** โดยตรง ไม่ต้องพึ่งพา Framework หรือ Backend อื่น ๆ เพิ่มเติม

---

## 1. จุดเด่นของสถาปัตยกรรม (Architecture Highlights)

* **Backend: GitHub**
  * โฮสต์และให้บริการผ่าน **GitHub Pages** หรือ GitHub Repository ได้ทันที 100%
  * ไม่ต้องเช่าเซิร์ฟเวอร์หรือดูแลรักษาระบบ Node.js/PHP/Python
  * รองรับ HTTPS อัตโนมัติและมีความเสถียรสูงระดับ Global CDN
* **Database: Supabase (PostgreSQL)**
  * จัดการฐานข้อมูลผ่าน Supabase REST API โดยตรง (`supabase.js`)
  * ปลอดภัยด้วย Row Level Security (RLS) และระบบ Session Token
  * มีโค้ด SQL สำหรับสร้างตาราง ดัชนี และข้อมูลเริ่มต้นในตัว
* **Frontend: HTML5 + CSS3 + Vanilla JavaScript**
  * ไม่มี Framework ภายนอก (No React, No Vue, No Angular, No Build step)
  * ใช้ฟอนต์ภาษาไทย **Bai Jamjuree** และ **Kanit**
  * โทนสีเขียวอมฟ้าโรงพยาบาล (Clinical Teal `#0d9488` / `#0f766e`)
  * รองรับ Desktop, Tablet, และ Mobile (Responsive & Mobile Drawer)

---

## 2. โครงสร้างไฟล์ในโครงการ

```text
/
├── index.html       # จุดเข้าใช้งานหลัก (Root Entry Point สำหรับ GitHub Pages)
├── styles.css       # สไตล์ชีตหลัก ธีมสีเขียวอมฟ้า สะอาด อ่านง่าย พร้อม Print Style
├── supabase.js      # ตัวเชื่อมต่อ Supabase REST API พร้อมระบบแคชและออฟไลน์โหมด
├── app.js           # ตรรกะหลักของระบบ (Router, Modals, Forms, QR/Barcode, CSV)
├── schema.sql       # โค้ด SQL สร้างตารางทั้ง 18 ตารางใน Supabase พร้อม Seed Data
├── .gitignore       # กำหนดไฟล์ที่ไม่ต้องติดตามใน Git
└── README.md        # คู่มือการติดตั้งและใช้งานระบบ
```

---

## 3. ขั้นตอนการติดตั้งใช้งานบน GitHub (ใน 3 ขั้นตอน)

### ขั้นตอนที่ 1: ติดตั้งฐานข้อมูล Supabase
1. สมัครใช้งานและสร้างโปรเจกต์ใหม่ที่ [supabase.com](https://supabase.com)
2. เข้าไปที่เมนู **SQL Editor** ที่แถบด้านซ้าย
3. คัดลอกโค้ดทั้งหมดจากไฟล์ `schema.sql` (หรือเข้าไปคัดลอกผ่านหน้า **"ตั้งค่าระบบ & SQL"** ในเว็บแอป) ไปวางในช่อง SQL Editor แล้วกด **Run**
4. ตารางทั้ง 18 ตาราง, ดัชนี และข้อมูลทดลองจะถูกสร้างเสร็จสมบูรณ์ทันที
5. ไปที่ **Project Settings** > **API** เพื่อคัดลอก:
   * **Project URL** (เช่น `https://xyzproject.supabase.co`)
   * **anon public key** หรือ **service_role key**

### ขั้นตอนที่ 2: นำโค้ดขึ้น GitHub Repository
1. สร้าง Repository ใหม่บน GitHub (เช่น `hospital-asset-management`)
2. นำไฟล์ทั้งหมดในโฟลเดอร์นี้อัปโหลดขึ้น GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Hospital Asset Management System"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
   *(หรือใช้โปรแกรม GitHub Desktop / อัปโหลดไฟล์ผ่านหน้าเว็บ GitHub ได้โดยตรง)*

### ขั้นตอนที่ 3: เปิดใช้งาน GitHub Pages
1. ในหน้า Repository บน GitHub ให้ไปที่แถบ **Settings**
2. เลือกเมนู **Pages** ที่แถบด้านซ้าย
3. ในส่วน **Build and deployment** > **Branch**:
   * เลือก Branch: `main`
   * เลือก Folder: `/ (root)`
   * กดปุ่ม **Save**
4. รอ 1-2 นาที GitHub จะสร้าง URL ของเว็บแอปให้ (เช่น `https://<username>.github.io/<repo-name>/`)
5. เปิด URL ใช้งานเว็บแอปได้ทันที!

---

## 4. บัญชีผู้ใช้งานเริ่มต้นสำหรับทดสอบ

| Username | Password | Role | สิทธิ์การเข้าถึง |
|---|---|---|---|
| `admin` | `1234` | **ADMIN** | เข้าถึงได้ทุกเมนู, จัดการผู้ใช้, จัดการ Demo, ตั้งค่าระบบ |
| `demo` | `1234` | **DEMO** | โหมดทดลอง เข้าถึงเฉพาะข้อมูล `IsDemo = TRUE` เท่านั้น |
| `asset_mgr` | `1234` | **ASSET_MANAGER** | ทะเบียนครุภัณฑ์, รับเข้า, โอนย้าย, ตรวจนับ, รายงาน |
| `technician` | `1234` | **MAINTENANCE** | รับแจ้งซ่อม, บันทึกการซ่อม, ดำเนินการแผน PM |
| `nurse_opd` | `1234` | **DEPARTMENT** | ดูครุภัณฑ์ในแผนก, ส่งใบแจ้งซ่อม, ขอโอนย้าย |
| `director_view` | `1234` | **VIEWER** | ดู Dashboard สรุปภาพรวมและสถิติ (อ่านอย่างเดียว) |

---

## 5. การตั้งค่าเชื่อมต่อ Supabase ในตัวเว็บแอป

เมื่อเข้าใช้งานระบบครั้งแรกผ่าน GitHub Pages:
1. เข้าสู่ระบบด้วยบัญชี `admin` (รหัสผ่าน `1234`)
2. ไปที่เมนูด้านซ้าย: **"ตั้งค่าระบบ & SQL"**
3. เลื่อนลงไปที่ส่วน **"การตั้งค่าข้อมูลหน่วยงานและระบบ"**
4. กรอก **Supabase Project URL** และ **Supabase Key** ที่ได้จาก Supabase Dashboard
5. กดปุ่ม **"บันทึกการตั้งค่า"**
6. ระบบจะเชื่อมต่อและซิงก์ข้อมูลกับ Supabase PostgreSQL ของท่านทันที

---

## 6. ฟังก์ชันและการจัดการโหมดทดลอง (Demo Mode)

* **ความปลอดภัยของข้อมูล:** ข้อมูลจริงจะมี `IsDemo = FALSE` ส่วนข้อมูลทดลองจะมี `IsDemo = TRUE` เสมอ
* **สัญลักษณ์โหมดทดลอง:** เมื่อเข้าสู่ระบบด้วยบัญชี `demo` จะมี Badge สีส้ม **`โหมดทดลอง (DEMO MODE)`** แสดงเด่นชัดที่แถบด้านบน
* **การล้างข้อมูลทดลอง:**
  * เข้าสู่ระบบด้วยบัญชี `admin`
  * ไปที่เมนู **ตั้งค่าระบบ & SQL**
  * กดปุ่ม **"ล้างข้อมูลทดลอง"**
  * พิมพ์คำยืนยัน **`ล้างข้อมูลทดลอง`** แล้วกดยืนยัน
  * ระบบจะลบเฉพาะแถวที่มี `IsDemo = TRUE` โดยไม่ส่งผลกระทบต่อบัญชีผู้ใช้ ข้อมูลจริง หรือประวัติ Audit Log
