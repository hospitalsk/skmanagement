-- ==============================================================================
-- HOSPITAL ASSET MANAGEMENT SYSTEM (ระบบจัดการครุภัณฑ์โรงพยาบาล)
-- SUPABASE POSTGRESQL DATABASE SCHEMA & SEED DATA
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "UserID" VARCHAR(64) PRIMARY KEY,
    "Username" VARCHAR(100) UNIQUE NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "FullName" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL, -- ADMIN, ASSET_MANAGER, MAINTENANCE, DEPARTMENT, VIEWER, DEMO
    "DepartmentID" VARCHAR(64),
    "Email" VARCHAR(255),
    "Phone" VARCHAR(50),
    "IsActive" BOOLEAN DEFAULT TRUE,
    "IsDemoUser" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS "Sessions" (
    "SessionToken" VARCHAR(128) PRIMARY KEY,
    "UserID" VARCHAR(64) NOT NULL REFERENCES "Users"("UserID") ON DELETE CASCADE,
    "Username" VARCHAR(100) NOT NULL,
    "Role" VARCHAR(50) NOT NULL,
    "IsDemoUser" BOOLEAN DEFAULT FALSE,
    "ExpiresAt" TIMESTAMPTZ NOT NULL,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Settings Table
CREATE TABLE IF NOT EXISTS "Settings" (
    "SettingKey" VARCHAR(100) PRIMARY KEY,
    "SettingValue" TEXT,
    "Description" TEXT,
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS "Departments" (
    "DepartmentID" VARCHAR(64) PRIMARY KEY,
    "DepartmentCode" VARCHAR(50),
    "DepartmentName" VARCHAR(255) NOT NULL,
    "Building" VARCHAR(100),
    "Floor" VARCHAR(50),
    "ContactPerson" VARCHAR(255),
    "Phone" VARCHAR(50),
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Locations Table
CREATE TABLE IF NOT EXISTS "Locations" (
    "LocationID" VARCHAR(64) PRIMARY KEY,
    "LocationCode" VARCHAR(50),
    "LocationName" VARCHAR(255) NOT NULL,
    "DepartmentID" VARCHAR(64) REFERENCES "Departments"("DepartmentID") ON DELETE SET NULL,
    "RoomNumber" VARCHAR(50),
    "Building" VARCHAR(100),
    "Floor" VARCHAR(50),
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AssetCategories Table
CREATE TABLE IF NOT EXISTS "AssetCategories" (
    "AssetCategoryID" VARCHAR(64) PRIMARY KEY,
    "CategoryCode" VARCHAR(50),
    "CategoryName" VARCHAR(255) NOT NULL,
    "CategoryType" VARCHAR(100), -- ครุภัณฑ์การแพทย์, ครุภัณฑ์สำนักงาน, ครุภัณฑ์คอมพิวเตอร์, ครุภัณฑ์ยานพาหนะ, ครุภัณฑ์งานบ้านงานครัว ฯลฯ
    "UsefulLifeYears" INTEGER DEFAULT 5,
    "DepreciationRate" NUMERIC(5,2) DEFAULT 20.00,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Assets Table
CREATE TABLE IF NOT EXISTS "Assets" (
    "AssetID" VARCHAR(64) PRIMARY KEY,
    "AssetCode" VARCHAR(100) NOT NULL,
    "SerialNumber" VARCHAR(100),
    "Barcode" VARCHAR(100),
    "QRCode" VARCHAR(255),
    "AssetName" VARCHAR(255) NOT NULL,
    "AssetCategoryID" VARCHAR(64) REFERENCES "AssetCategories"("AssetCategoryID") ON DELETE SET NULL,
    "AssetType" VARCHAR(100),
    "Brand" VARCHAR(100),
    "Model" VARCHAR(100),
    "Specification" TEXT,
    "Unit" VARCHAR(50) DEFAULT 'เครื่อง',
    "Quantity" INTEGER DEFAULT 1,
    "AcquisitionDate" DATE,
    "AcquisitionMethod" VARCHAR(100), -- ซื้อ, บริจาค, โอน, รับมอบ
    "Vendor" VARCHAR(255),
    "PurchaseOrderNo" VARCHAR(100),
    "InvoiceNo" VARCHAR(100),
    "BudgetType" VARCHAR(100), -- เงินงบประมาณ, เงินบำรุง, เงินบริจาค
    "BudgetYear" VARCHAR(10),
    "AcquisitionCost" NUMERIC(15,2) DEFAULT 0.00,
    "UsefulLife" INTEGER DEFAULT 5,
    "ResidualValue" NUMERIC(15,2) DEFAULT 1.00,
    "CurrentValue" NUMERIC(15,2) DEFAULT 0.00,
    "WarrantyStartDate" DATE,
    "WarrantyEndDate" DATE,
    "DepartmentID" VARCHAR(64) REFERENCES "Departments"("DepartmentID") ON DELETE SET NULL,
    "LocationID" VARCHAR(64) REFERENCES "Locations"("LocationID") ON DELETE SET NULL,
    "ResponsibleUserID" VARCHAR(64),
    "CustodianName" VARCHAR(255),
    "Condition" VARCHAR(50) DEFAULT 'NORMAL', -- NORMAL (ปกติ), REPAIRABLE (ชำรุดรอซ่อม), DAMAGED (ชำรุดหนัก), LOST (สูญหาย)
    "Status" VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE (ใช้งานอยู่), IN_REPAIR (ส่งซ่อม), IN_TRANSFER (อยู่ระหว่างโอน), PENDING_DISPOSAL (รอจำหน่าย), DISPOSED (จำหน่ายแล้ว)
    "RiskLevel" VARCHAR(50) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    "Criticality" VARCHAR(50) DEFAULT 'STANDARD', -- LIFE_SUPPORT, DIAGNOSTIC, GENERAL, STANDARD
    "LastInspectionDate" DATE,
    "NextInspectionDate" DATE,
    "LastPMDate" DATE,
    "NextPMDate" DATE,
    "DisposalDate" DATE,
    "DisposalReason" TEXT,
    "Note" TEXT,
    "ImageUrl" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "CreatedBy" VARCHAR(100),
    "UpdatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "UpdatedBy" VARCHAR(100)
);

-- 8. AssetTransactions Table
CREATE TABLE IF NOT EXISTS "AssetTransactions" (
    "TransactionID" VARCHAR(64) PRIMARY KEY,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "TransactionType" VARCHAR(50) NOT NULL, -- RECEIVE, TRANSFER, CHECKOUT, RETURN, REPAIR, PM, INSPECT, DISPOSE
    "TransactionDate" TIMESTAMPTZ DEFAULT NOW(),
    "FromDepartmentID" VARCHAR(64),
    "ToDepartmentID" VARCHAR(64),
    "FromLocationID" VARCHAR(64),
    "ToLocationID" VARCHAR(64),
    "ResponsiblePerson" VARCHAR(255),
    "Reason" TEXT,
    "DocumentNo" VARCHAR(100),
    "PerformedBy" VARCHAR(100),
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Transfers Table
CREATE TABLE IF NOT EXISTS "Transfers" (
    "TransferID" VARCHAR(64) PRIMARY KEY,
    "TransferCode" VARCHAR(50) NOT NULL,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "FromDepartmentID" VARCHAR(64),
    "FromLocationID" VARCHAR(64),
    "ToDepartmentID" VARCHAR(64),
    "ToLocationID" VARCHAR(64),
    "FromResponsible" VARCHAR(255),
    "ToResponsible" VARCHAR(255),
    "TransferDate" DATE DEFAULT CURRENT_DATE,
    "Reason" TEXT,
    "RequestedBy" VARCHAR(100),
    "ApprovedBy" VARCHAR(100),
    "Status" VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, COMPLETED, CANCELLED
    "Note" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Inspections Table (รอบตรวจนับ / ตรวจสภาพ)
CREATE TABLE IF NOT EXISTS "Inspections" (
    "InspectionID" VARCHAR(64) PRIMARY KEY,
    "InspectionCode" VARCHAR(50) NOT NULL,
    "InspectionType" VARCHAR(50) NOT NULL, -- AUDIT_COUNT (ตรวจนับประจำปี), CONDITION (ตรวจสภาพความพร้อมใช้)
    "SessionTitle" VARCHAR(255) NOT NULL,
    "StartDate" DATE,
    "EndDate" DATE,
    "DepartmentID" VARCHAR(64),
    "Inspector" VARCHAR(255),
    "Status" VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED
    "SummaryNotes" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 11. InspectionItems Table (รายการผลการตรวจนับ)
CREATE TABLE IF NOT EXISTS "InspectionItems" (
    "ItemID" VARCHAR(64) PRIMARY KEY,
    "InspectionID" VARCHAR(64) NOT NULL REFERENCES "Inspections"("InspectionID") ON DELETE CASCADE,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "CheckStatus" VARCHAR(50) DEFAULT 'FOUND_NORMAL', -- FOUND_NORMAL, FOUND_DISCREPANCY, NOT_FOUND, DAMAGED, WRONG_LOCATION, PENDING
    "Condition" VARCHAR(50),
    "ActualDepartmentID" VARCHAR(64),
    "ActualLocationID" VARCHAR(64),
    "ActualCustodian" VARCHAR(255),
    "SafetyStatus" VARCHAR(50), -- SAFE, RISK, UNSAFE
    "FunctionalStatus" VARCHAR(50), -- READY, PARTIAL, NOT_WORKING
    "CalibrationStatus" VARCHAR(50), -- VALID, EXPIRED, NOT_REQUIRED
    "Findings" TEXT,
    "Recommendation" TEXT,
    "PhotoUrl" TEXT,
    "CheckedAt" TIMESTAMPTZ DEFAULT NOW(),
    "CheckedBy" VARCHAR(100),
    "IsDemo" BOOLEAN DEFAULT FALSE
);

-- 12. MaintenancePlans Table (แผน PM)
CREATE TABLE IF NOT EXISTS "MaintenancePlans" (
    "PlanID" VARCHAR(64) PRIMARY KEY,
    "PlanCode" VARCHAR(50) NOT NULL,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "PlanName" VARCHAR(255) NOT NULL,
    "FrequencyMonths" INTEGER DEFAULT 6,
    "ScheduledDate" DATE NOT NULL,
    "ActualDate" DATE,
    "AssignedTo" VARCHAR(255),
    "Vendor" VARCHAR(255),
    "Status" VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
    "EstimatedCost" NUMERIC(12,2) DEFAULT 0.00,
    "ActualCost" NUMERIC(12,2) DEFAULT 0.00,
    "PartsUsed" TEXT,
    "Result" TEXT,
    "NextPMDate" DATE,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 13. RepairRequests Table (ใบแจ้งซ่อม)
CREATE TABLE IF NOT EXISTS "RepairRequests" (
    "RepairRequestID" VARCHAR(64) PRIMARY KEY,
    "RepairCode" VARCHAR(50) NOT NULL,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "RequestDate" TIMESTAMPTZ DEFAULT NOW(),
    "Reporter" VARCHAR(255) NOT NULL,
    "DepartmentID" VARCHAR(64),
    "Problem" TEXT NOT NULL,
    "Symptom" TEXT,
    "Priority" VARCHAR(50) DEFAULT 'NORMAL', -- LOW, NORMAL, URGENT, EMERGENCY
    "SafetyRisk" BOOLEAN DEFAULT FALSE,
    "Status" VARCHAR(50) DEFAULT 'REQUESTED', -- REQUESTED, ACCEPTED, INVESTIGATING, WAITING_PARTS, WAITING_VENDOR, IN_REPAIR, COMPLETED, RETURNED, CANCELLED, UNREPAIRABLE
    "AssignedTo" VARCHAR(255),
    "Vendor" VARCHAR(255),
    "StartDate" DATE,
    "CompletedDate" DATE,
    "Diagnosis" TEXT,
    "RepairAction" TEXT,
    "PartsUsed" TEXT,
    "LaborCost" NUMERIC(12,2) DEFAULT 0.00,
    "PartsCost" NUMERIC(12,2) DEFAULT 0.00,
    "OtherCost" NUMERIC(12,2) DEFAULT 0.00,
    "TotalCost" NUMERIC(12,2) DEFAULT 0.00,
    "DowntimeHours" NUMERIC(8,1) DEFAULT 0.0,
    "Result" VARCHAR(100),
    "WarrantyClaim" BOOLEAN DEFAULT FALSE,
    "Note" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 14. RepairHistory Table (ประวัติการซ่อมสรุป)
CREATE TABLE IF NOT EXISTS "RepairHistory" (
    "HistoryID" VARCHAR(64) PRIMARY KEY,
    "RepairRequestID" VARCHAR(64) REFERENCES "RepairRequests"("RepairRequestID") ON DELETE SET NULL,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "RepairDate" DATE,
    "RepairCode" VARCHAR(50),
    "Problem" TEXT,
    "ActionTaken" TEXT,
    "TotalCost" NUMERIC(12,2) DEFAULT 0.00,
    "Technician" VARCHAR(255),
    "Vendor" VARCHAR(255),
    "DowntimeHours" NUMERIC(8,1) DEFAULT 0.0,
    "Result" VARCHAR(100),
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 15. WarrantyContracts Table (สัญญาและการรับประกัน)
CREATE TABLE IF NOT EXISTS "WarrantyContracts" (
    "WarrantyContractID" VARCHAR(64) PRIMARY KEY,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "ContractNo" VARCHAR(100),
    "ContractType" VARCHAR(100) DEFAULT 'WARRANTY', -- WARRANTY, SERVICE_CONTRACT, PM_CONTRACT
    "Vendor" VARCHAR(255) NOT NULL,
    "StartDate" DATE NOT NULL,
    "EndDate" DATE NOT NULL,
    "SLA" VARCHAR(100),
    "ContactPerson" VARCHAR(255),
    "Phone" VARCHAR(50),
    "Email" VARCHAR(255),
    "CoverageDetails" TEXT,
    "ContractAmount" NUMERIC(12,2) DEFAULT 0.00,
    "Note" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Disposals Table (การจำหน่ายครุภัณฑ์)
CREATE TABLE IF NOT EXISTS "Disposals" (
    "DisposalID" VARCHAR(64) PRIMARY KEY,
    "DisposalCode" VARCHAR(50) NOT NULL,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "DisposalDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "Reason" TEXT NOT NULL, -- ชำรุดจนใช้งานไม่ได้, สูญหาย, เทคโนโลยีล้าสมัย, สิ้นสุดอายุการใช้งาน
    "Method" VARCHAR(100), -- ขายทอดตลาด, โอนให้หน่วยงานอื่น, ทำลาย, บริจาค
    "ApprovalNo" VARCHAR(100),
    "ApprovedBy" VARCHAR(255),
    "BookValue" NUMERIC(15,2) DEFAULT 0.00,
    "DisposalValue" NUMERIC(15,2) DEFAULT 0.00,
    "BuyerOrReceiver" VARCHAR(255),
    "EvidenceFile" TEXT,
    "Status" VARCHAR(50) DEFAULT 'COMPLETED', -- PENDING_APPROVAL, APPROVED, COMPLETED, CANCELLED
    "Note" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Attachments Table (เอกสารและไฟล์แนบ)
CREATE TABLE IF NOT EXISTS "Attachments" (
    "AttachmentID" VARCHAR(64) PRIMARY KEY,
    "AssetID" VARCHAR(64) REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "RefType" VARCHAR(50), -- ASSET, REPAIR, DISPOSAL, INSPECTION, WARRANTY
    "RefID" VARCHAR(64),
    "FileName" VARCHAR(255) NOT NULL,
    "FileType" VARCHAR(50),
    "FileSize" BIGINT,
    "FileUrl" TEXT NOT NULL,
    "Description" TEXT,
    "UploadedBy" VARCHAR(100),
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 18. AuditLogs Table (บันทึก Audit การเปลี่ยนแปลง)
CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "LogID" VARCHAR(64) PRIMARY KEY,
    "UserID" VARCHAR(64),
    "Username" VARCHAR(100) NOT NULL,
    "Role" VARCHAR(50),
    "Action" VARCHAR(100) NOT NULL,
    "Module" VARCHAR(100) NOT NULL,
    "RecordID" VARCHAR(64),
    "Details" TEXT,
    "IPAddress" VARCHAR(50),
    "IsDemoAction" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_code ON "Assets"("AssetCode");
CREATE INDEX IF NOT EXISTS idx_assets_dept ON "Assets"("DepartmentID");
CREATE INDEX IF NOT EXISTS idx_assets_cat ON "Assets"("AssetCategoryID");
CREATE INDEX IF NOT EXISTS idx_assets_status ON "Assets"("Status");
CREATE INDEX IF NOT EXISTS idx_assets_isdemo ON "Assets"("IsDemo");
CREATE INDEX IF NOT EXISTS idx_repairs_asset ON "RepairRequests"("AssetID");
CREATE INDEX IF NOT EXISTS idx_transfers_asset ON "Transfers"("AssetID");
CREATE INDEX IF NOT EXISTS idx_audit_created ON "AuditLogs"("CreatedAt");

-- ==============================================================================
-- DEFAULT SETTINGS SEED DATA
-- ==============================================================================
INSERT INTO "Settings" ("SettingKey", "SettingValue", "Description") VALUES
('ORGANIZATION_NAME', 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านสวนสมบูรณ์', 'ชื่อหน่วยงานเต็ม'),
('ORGANIZATION_SHORT_NAME', 'รพ.สต.บ้านสวนสมบูรณ์', 'ชื่อย่อหน่วยงาน'),
('ORGANIZATION_TYPE', 'โรงพยาบาลส่งเสริมสุขภาพตำบล', 'ประเภทหน่วยงานบริการสุขภาพ'),
('SYSTEM_NAME', 'ระบบจัดการครุภัณฑ์และเครื่องมือแพทย์', 'ชื่อระบบ'),
('SYSTEM_SHORT_NAME', 'H-AMS', 'ชื่อย่อระบบ'),
('ADMIN_NAME', 'นายแพทย์ประสิทธิ์ สุขเกษม', 'ชื่อผู้ดูแลระบบหลัก'),
('ADMIN_POSITION', 'ผู้อำนวยการโรงพยาบาล', 'ตำแหน่งผู้ดูแลระบบ'),
('ORGANIZATION_ADDRESS', 'เลขที่ 99 หมู่ 4 ต.บ้านสวน อ.เมือง จ.ชลบุรี 20000', 'ที่อยู่หน่วยงาน'),
('ORGANIZATION_PHONE', '038-123456', 'เบอร์โทรศัพท์'),
('ORGANIZATION_EMAIL', 'contact@baansuanhospital.go.th', 'อีเมลหน่วยงาน'),
('FISCAL_YEAR', '2569', 'ปีงบประมาณปัจจุบัน'),
('ASSET_PREFIX', 'AST-', 'คำนำหน้าเลขครุภัณฑ์'),
('TRANSFER_PREFIX', 'TRF-', 'คำนำหน้าเลขโอนย้าย'),
('REPAIR_PREFIX', 'REP-', 'คำนำหน้าเลขแจ้งซ่อม'),
('INSPECTION_PREFIX', 'INS-', 'คำนำหน้าเลขตรวจนับ/ตรวจสภาพ'),
('DISPOSAL_PREFIX', 'DSP-', 'คำนำหน้าเลขจำหน่าย'),
('MAINTENANCE_PREFIX', 'PM-', 'คำนำหน้าเลขบำรุงรักษา'),
('WARRANTY_WARNING_DAYS', '30', 'เตือนก่อนประกันหมดอายุ (วัน)'),
('PM_WARNING_DAYS', '15', 'เตือนก่อนถึงรอบ PM (วัน)'),
('LOW_VALUE_THRESHOLD', '10000', 'เกณฑ์มูลค่าครุภัณฑ์ต่ำกว่าเกณฑ์ (บาท)'),
('DEMO_ENABLED', 'TRUE', 'สถานะเปิดใช้งานโหมดทดลอง (TRUE/FALSE)'),
('SHOW_LOGO', 'TRUE', 'แสดงโลโก้ระบบ'),
('PRINT_HEADER_TEXT', 'แบบฟอร์มครุภัณฑ์ราชการ - รพ.สต.บ้านสวนสมบูรณ์', 'หัวกระดาษพิมพ์'),
('PRINT_FOOTER_TEXT', 'เอกสารควบคุมภายในระบบจัดการครุภัณฑ์อิเล็กทรอนิกส์', 'ท้ายกระดาษพิมพ์')
ON CONFLICT ("SettingKey") DO UPDATE SET "SettingValue" = EXCLUDED."SettingValue";

-- ==============================================================================
-- DEFAULT USERS SEED DATA
-- Password for admin: 1234
-- Password for demo: 1234
-- ==============================================================================
INSERT INTO "Users" ("UserID", "Username", "PasswordHash", "FullName", "Role", "DepartmentID", "Email", "Phone", "IsActive", "IsDemoUser") VALUES
('usr_admin_001', 'admin', '1234', 'ผู้ดูแลระบบสูงสุด (Admin)', 'ADMIN', 'DEP-ADM', 'admin@hospital.local', '081-111-2222', TRUE, FALSE),
('usr_demo_001', 'demo', '1234', 'ผู้ใช้งานโหมดทดลอง (Demo User)', 'DEMO', 'DEP-OPD', 'demo@hospital.local', '089-999-8888', TRUE, TRUE),
('usr_mgr_001', 'asset_mgr', '1234', 'น.ส.วิภาดา งานพัสดุ', 'ASSET_MANAGER', 'DEP-SUP', 'wiphada@hospital.local', '082-222-3333', TRUE, FALSE),
('usr_tech_001', 'technician', '1234', 'นายสมเกียรติ ช่างซ่อมบำรุง', 'MAINTENANCE', 'DEP-ENG', 'somkiat@hospital.local', '083-333-4444', TRUE, FALSE),
('usr_dept_001', 'nurse_opd', '1234', 'พว.สุดารัตน์ พยาบาลวิชาชีพ', 'DEPARTMENT', 'DEP-OPD', 'sudarat@hospital.local', '084-444-5555', TRUE, FALSE),
('usr_view_001', 'director_view', '1234', 'นพ.ผู้อำนวยการ (ดูรายงาน)', 'VIEWER', 'DEP-ADM', 'director@hospital.local', '085-555-6666', TRUE, FALSE)
ON CONFLICT ("Username") DO NOTHING;

-- ==============================================================================
-- DEFAULT MASTER DATA (Departments, Locations, Categories)
-- ==============================================================================
INSERT INTO "Departments" ("DepartmentID", "DepartmentCode", "DepartmentName", "Building", "Floor", "ContactPerson", "Phone", "IsDemo") VALUES
('DEP-ADM', 'ADM', 'ฝ่ายบริหารงานทั่วไปและยุทธศาสตร์', 'อาคารอำนวยการ', 'ชั้น 2', 'หัวหน้าฝ่ายบริหาร', '038-123451', FALSE),
('DEP-OPD', 'OPD', 'แผนกผู้ป่วยนอก (OPD)', 'อาคารผู้ป่วยนอก', 'ชั้น 1', 'พว.สุดารัตน์', '038-123452', FALSE),
('DEP-ER', 'ER', 'แผนกอุบัติเหตุและฉุกเฉิน (ER)', 'อาคารผู้ป่วยนอก', 'ชั้น 1', 'พว.มนัส', '038-123453', FALSE),
('DEP-IPD', 'IPD', 'หอผู้ป่วยใน (IPD)', 'อาคารเฉลิมพระเกียรติ', 'ชั้น 3', 'พว.อรุณี', '038-123454', FALSE),
('DEP-DENT', 'DENT', 'กลุ่มงานทันตกรรม', 'อาคารผู้ป่วยนอก', 'ชั้น 2', 'ทพ.อนุชา', '038-123455', FALSE),
('DEP-LAB', 'LAB', 'กลุ่มงานเทคนิคการแพทย์ (ชันสูตร)', 'อาคารผู้ป่วยนอก', 'ชั้น 2', 'ทนพ.กิตติศักดิ์', '038-123456', FALSE),
('DEP-ENG', 'ENG', 'หน่วยซ่อมบำรุงและวิศวกรรมการแพทย์', 'อาคารสนับสนุน', 'ชั้น 1', 'นายสมเกียรติ', '038-123457', FALSE),
('DEP-SUP', 'SUP', 'งานพัสดุและคลังครุภัณฑ์', 'อาคารอำนวยการ', 'ชั้น 1', 'น.ส.วิภาดา', '038-123458', FALSE)
ON CONFLICT ("DepartmentID") DO NOTHING;

INSERT INTO "Locations" ("LocationID", "LocationCode", "LocationName", "DepartmentID", "RoomNumber", "Building", "Floor", "IsDemo") VALUES
('LOC-OPD-01', 'OPD-EX1', 'ห้องตรวจอายุรกรรม 1', 'DEP-OPD', '101', 'อาคารผู้ป่วยนอก', 'ชั้น 1', FALSE),
('LOC-OPD-02', 'OPD-NUR', 'เคาน์เตอร์พยาบาลคัดกรอง OPD', 'DEP-OPD', '100', 'อาคารผู้ป่วยนอก', 'ชั้น 1', FALSE),
('LOC-ER-01', 'ER-RESUS', 'ห้องช่วยฟื้นคืนชีพ (Resuscitation)', 'DEP-ER', 'ER-01', 'อาคารผู้ป่วยนอก', 'ชั้น 1', FALSE),
('LOC-ER-02', 'ER-SURG', 'ห้องทำแผลและผ่าตัดเล็ก', 'DEP-ER', 'ER-02', 'อาคารผู้ป่วยนอก', 'ชั้น 1', FALSE),
('LOC-IPD-01', 'IPD-W1', 'วอร์ดผู้ป่วยสามัญชาย-หญิง', 'DEP-IPD', '301', 'อาคารเฉลิมพระเกียรติ', 'ชั้น 3', FALSE),
('LOC-DENT-01', 'DENT-U1', 'ห้องตรวจทันตกรรม ยูนิต 1-2', 'DEP-DENT', '201', 'อาคารผู้ป่วยนอก', 'ชั้น 2', FALSE),
('LOC-LAB-01', 'LAB-MAIN', 'ห้องตรวจวิเคราะห์โลหิตและเคมีคลินิก', 'DEP-LAB', '205', 'อาคารผู้ป่วยนอก', 'ชั้น 2', FALSE),
('LOC-ENG-01', 'ENG-WS', 'ห้องปฏิบัติการสอบเทียบและซ่อมบำรุง', 'DEP-ENG', 'B-01', 'อาคารสนับสนุน', 'ชั้น 1', FALSE)
ON CONFLICT ("LocationID") DO NOTHING;

INSERT INTO "AssetCategories" ("AssetCategoryID", "CategoryCode", "CategoryName", "CategoryType", "UsefulLifeYears", "DepreciationRate", "IsDemo") VALUES
('CAT-MED-01', 'MED-LIFE', 'ครุภัณฑ์การแพทย์ช่วยชีวิตและวิกฤต', 'ครุภัณฑ์การแพทย์', 5, 20.00, FALSE),
('CAT-MED-02', 'MED-DIAG', 'ครุภัณฑ์การแพทย์ตรวจวินิจฉัยและรักษา', 'ครุภัณฑ์การแพทย์', 7, 14.28, FALSE),
('CAT-MED-03', 'MED-DENT', 'ครุภัณฑ์ทันตกรรม', 'ครุภัณฑ์การแพทย์', 8, 12.50, FALSE),
('CAT-MED-04', 'MED-LAB', 'ครุภัณฑ์วิทยาศาสตร์และการแพทย์ชันสูตร', 'ครุภัณฑ์การแพทย์', 7, 14.28, FALSE),
('CAT-COM-01', 'COM-SRV', 'ครุภัณฑ์คอมพิวเตอร์และแม่ข่าย', 'ครุภัณฑ์คอมพิวเตอร์', 3, 33.33, FALSE),
('CAT-COM-02', 'COM-PC', 'เครื่องคอมพิวเตอร์ลูกข่ายและอุปกรณ์ต่อพ่วง', 'ครุภัณฑ์คอมพิวเตอร์', 3, 33.33, FALSE),
('CAT-OFF-01', 'OFF-GEN', 'ครุภัณฑ์สำนักงานและเฟอร์นิเจอร์', 'ครุภัณฑ์สำนักงาน', 5, 20.00, FALSE),
('CAT-VEH-01', 'VEH-EMS', 'ครุภัณฑ์ยานพาหนะและรถพยาบาลฉุกเฉิน', 'ครุภัณฑ์ยานพาหนะ', 8, 12.50, FALSE)
ON CONFLICT ("AssetCategoryID") DO NOTHING;

-- ==============================================================================
-- SAMPLE DEMO DATA (10+ Medical & Hospital Assets with IsDemo = TRUE)
-- ==============================================================================
INSERT INTO "Assets" (
    "AssetID", "AssetCode", "SerialNumber", "Barcode", "QRCode", "AssetName",
    "AssetCategoryID", "AssetType", "Brand", "Model", "Specification", "Unit", "Quantity",
    "AcquisitionDate", "AcquisitionMethod", "Vendor", "PurchaseOrderNo", "InvoiceNo",
    "BudgetType", "BudgetYear", "AcquisitionCost", "UsefulLife", "ResidualValue", "CurrentValue",
    "WarrantyStartDate", "WarrantyEndDate", "DepartmentID", "LocationID",
    "ResponsibleUserID", "CustodianName", "Condition", "Status", "RiskLevel", "Criticality",
    "LastInspectionDate", "NextInspectionDate", "LastPMDate", "NextPMDate",
    "Note", "IsDemo", "CreatedBy", "UpdatedBy"
) VALUES
('DEMO-AST-001', 'AST-2569-00001', 'DEF-SN-89011', '885000100001', 'QR-AST-00001',
 'เครื่องกระตุกหัวใจด้วยไฟฟ้าอัตโนมัติ (Automated External Defibrillator - AED)',
 'CAT-MED-01', 'เครื่องกระตุกหัวใจ', 'Philips', 'HeartStart FRx', 'เครื่องกระตุกหัวใจแบบไบเฟสิกพร้อมแบตเตอรี่สำรองและแผ่นนำไฟฟ้า', 'เครื่อง', 1,
 '2024-10-15', 'ซื้อ', 'บริษัท เมดิคอลโปรเกรส จำกัด', 'PO-68-0112', 'INV-68-984',
 'เงินงบประมาณ', '2568', 95000.00, 5, 1.00, 76000.00,
 '2024-10-15', '2026-10-14', 'DEP-ER', 'LOC-ER-01',
 'usr_dept_001', 'พว.มนัส ชัยชนะ', 'NORMAL', 'ACTIVE', 'CRITICAL', 'LIFE_SUPPORT',
 '2026-09-01', '2027-03-01', '2026-08-15', '2027-02-15',
 'ประจำห้องฉุกเฉินพร้อมใช้งานตลอด 24 ชม.', TRUE, 'admin', 'admin'),

('DEMO-AST-002', 'AST-2569-00002', 'MON-883210-TH', '885000100002', 'QR-AST-00002',
 'เครื่องติดตามการทำงานของหัวใจและสัญญาณชีพ (Patient Monitor 5-Lead)',
 'CAT-MED-01', 'Patient Monitor', 'Mindray', 'ePM 12M', 'จอสัมผัส 12.1 นิ้ว วัด ECG, SpO2, NIBP, Temp, Resp', 'เครื่อง', 1,
 '2024-11-20', 'ซื้อ', 'บริษัท อุปกรณ์การแพทย์สยาม จำกัด', 'PO-68-0205', 'INV-68-1201',
 'เงินบำรุง', '2568', 145000.00, 5, 1.00, 116000.00,
 '2024-11-20', '2026-11-19', 'DEP-ER', 'LOC-ER-01',
 'usr_dept_001', 'พว.มนัส ชัยชนะ', 'NORMAL', 'ACTIVE', 'HIGH', 'LIFE_SUPPORT',
 '2026-08-20', '2027-02-20', '2026-08-20', '2027-02-20',
 'เชื่อมต่อระบบมอนิเตอร์กลางห้องฉุกเฉิน', TRUE, 'admin', 'admin'),

('DEMO-AST-003', 'AST-2569-00003', 'INF-PUMP-4421', '885000100003', 'QR-AST-00003',
 'เครื่องให้สารละลายทางหลอดเลือดดำ (Infusion Pump)',
 'CAT-MED-01', 'Infusion Pump', 'Terumo', 'TE-LM700', 'ควบคุมอัตราการให้สารละลาย 0.1-1200 mL/h ระบบตรวจจับฟองอากาศ', 'เครื่อง', 1,
 '2025-01-10', 'ซื้อ', 'บจก. เทอรูโม เฮลธ์แคร์', 'PO-68-0341', 'INV-68-1502',
 'เงินบำรุง', '2568', 52000.00, 5, 1.00, 41600.00,
 '2025-01-10', '2027-01-09', 'DEP-IPD', 'LOC-IPD-01',
 'usr_dept_001', 'พว.อรุณี ศรีสุข', 'NORMAL', 'ACTIVE', 'HIGH', 'DIAGNOSTIC',
 '2026-07-10', '2027-01-10', '2026-07-10', '2027-01-10',
 'ใช้งานวอร์ดผู้ป่วยใน', TRUE, 'admin', 'admin'),

('DEMO-AST-004', 'AST-2569-00004', 'ECG-12C-5542', '885000100004', 'QR-AST-00004',
 'เครื่องตรวจคลื่นไฟฟ้าหัวใจ 12 ลีด (12-Lead Electrocardiograph)',
 'CAT-MED-02', 'ECG Machine', 'Nihon Kohden', 'ECG-2350', 'เครื่องตรวจ ECG 12 ลีด พร้อมซอฟต์แวร์แปลผลอัตโนมัติและพิมพ์ผล', 'เครื่อง', 1,
 '2023-08-15', 'ซื้อ', 'บจก. เมดิเทค อินสตรูเมนท์', 'PO-66-0789', 'INV-66-3342',
 'เงินงบประมาณ', '2566', 185000.00, 7, 1.00, 105700.00,
 '2023-08-15', '2025-08-14', 'DEP-OPD', 'LOC-OPD-01',
 'usr_dept_001', 'พว.สุดารัตน์ พยาบาลวิชาชีพ', 'REPAIRABLE', 'IN_REPAIR', 'MEDIUM', 'DIAGNOSTIC',
 '2026-05-15', '2026-11-15', '2026-05-15', '2026-11-15',
 'สาย Lead V1-V3 มีสัญญาณรบกวน ส่งช่างตรวจสอบ', TRUE, 'admin', 'admin'),

('DEMO-AST-005', 'AST-2569-00005', 'DENT-CHAIR-99', '885000100005', 'QR-AST-00005',
 'ยูนิตทำฟันพร้อมระบบดูดน้ำลายและโคมไฟส่องตรวจ (Dental Unit)',
 'CAT-MED-03', 'Dental Unit', 'A-dec', 'A-dec 300', 'ยูนิตทำฟันระบบไฮดรอลิก เก้าอี้ปรับระดับไฟฟ้า พร้อมหัวกรอความเร็วสูง', 'ชุด', 1,
 '2022-05-10', 'ซื้อ', 'บจก. เดนทัล สยาม อินเตอร์', 'PO-65-0450', 'INV-65-2100',
 'เงินงบประมาณ', '2565', 480000.00, 8, 1.00, 240000.00,
 '2022-05-10', '2024-05-09', 'DEP-DENT', 'LOC-DENT-01',
 'usr_dept_001', 'ทพ.อนุชา รักฟัน', 'NORMAL', 'ACTIVE', 'MEDIUM', 'STANDARD',
 '2026-06-01', '2026-12-01', '2026-06-01', '2026-12-01',
 'บำรุงรักษาเปลี่ยนซีลกระบอกสูบตามรอบแล้ว', TRUE, 'admin', 'admin'),

('DEMO-AST-006', 'AST-2569-00006', 'CBC-LAB-33100', '885000100006', 'QR-AST-00006',
 'เครื่องตรวจวิเคราะห์เม็ดเลือดอัตโนมัติ (Automated Hematology Analyzer)',
 'CAT-MED-04', 'CBC Analyzer', 'Sysmex', 'XN-350', 'วิเคราะห์ความสมบูรณ์ของเม็ดเลือด CBC 5-Part Diff อัตราเร็ว 60 ตัวอย่าง/ชม.', 'เครื่อง', 1,
 '2023-03-25', 'ซื้อ', 'บจก. ซิสเมกซ์ ไทยแลนด์', 'PO-66-0211', 'INV-66-1045',
 'เงินบำรุง', '2566', 650000.00, 7, 1.00, 371400.00,
 '2023-03-25', '2026-03-24', 'DEP-LAB', 'LOC-LAB-01',
 'usr_dept_001', 'ทนพ.กิตติศักดิ์ ชันสูตร', 'NORMAL', 'ACTIVE', 'HIGH', 'DIAGNOSTIC',
 '2026-09-10', '2027-03-10', '2026-09-10', '2027-03-10',
 'สอบเทียบ Calibrate กับมาตรฐานประจำเดือนผ่านเกณฑ์', TRUE, 'admin', 'admin'),

('DEMO-AST-007', 'AST-2569-00007', 'SRV-DL380-GEN10', '885000100007', 'QR-AST-00007',
 'เครื่องคอมพิวเตอร์แม่ข่ายระบบฐานข้อมูลโรงพยาบาล (Hospital HIS Server)',
 'CAT-COM-01', 'Server Rack 2U', 'HPE', 'ProLiant DL380 Gen10', 'Xeon Silver 4214R 2.4GHz, RAM 64GB, SAS SSD 1.92TB RAID5', 'เครื่อง', 1,
 '2024-02-14', 'ซื้อ', 'บจก. ไอที เมดิคอล ซิสเต็มส์', 'PO-67-0105', 'INV-67-0899',
 'เงินบำรุง', '2567', 220000.00, 3, 1.00, 73333.00,
 '2024-02-14', '2027-02-13', 'DEP-ADM', 'LOC-ENG-01',
 'usr_tech_001', 'นายสมเกียรติ ช่างซ่อมบำรุง', 'NORMAL', 'ACTIVE', 'CRITICAL', 'STANDARD',
 '2026-08-01', '2027-02-01', '2026-08-01', '2027-02-01',
 'แม่ข่ายฐานข้อมูล HIS สำรองข้อมูลทุกวันเวลา 01:00 น.', TRUE, 'admin', 'admin'),

('DEMO-AST-008', 'AST-2569-00008', 'AMB-VAN-TOYOTA', '885000100008', 'QR-AST-00008',
 'รถพยาบาลฉุกเฉินระดับสูง (Advanced EMS Ambulance Van)',
 'CAT-VEH-01', 'Ambulance', 'Toyota', 'Commuter D4D 2.8', 'รถตู้พยาบาลฉุกเฉินพร้อมระบบไฟไซเรน วิทยุสื่อสาร และอุปกรณ์กู้ชีพขั้นสูง', 'คัน', 1,
 '2023-01-18', 'ซื้อ', 'บจก. สยาม โตโยต้า เมดิคอล ทรานสปอร์ต', 'PO-66-0033', 'INV-66-0155',
 'เงินงบประมาณ', '2566', 2450000.00, 8, 1.00, 1531250.00,
 '2023-01-18', '2026-01-17', 'DEP-ER', 'LOC-ER-01',
 'usr_dept_001', 'นายวินัย ขับรถส่งต่อ', 'NORMAL', 'ACTIVE', 'HIGH', 'STANDARD',
 '2026-07-20', '2027-01-20', '2026-07-20', '2027-01-20',
 'ตรวจสภาพและเปลี่ยนน้ำมันเครื่องตามระยะ 50,000 กม.', TRUE, 'admin', 'admin'),

('DEMO-AST-009', 'AST-2569-00009', 'AUTOCLAVE-85L', '885000100009', 'QR-AST-00009',
 'หม้อนึ่งฆ่าเชื้อด้วยแรงดันไอน้ำ (Vertical Autoclave 85L)',
 'CAT-MED-04', 'Autoclave', 'Tomy', 'SX-700', 'ความจุ 85 ลิตร อุณหภูมิฆ่าเชื้อ 105-135 องศาเซลเซียส พร้อมระบบล็อกฝานิรภัย', 'เครื่อง', 1,
 '2021-09-05', 'ซื้อ', 'บจก. สเตอริไลซ์ ซัพพลาย', 'PO-64-0812', 'INV-64-3991',
 'เงินบำรุง', '2564', 310000.00, 7, 1.00, 88571.00,
 '2021-09-05', '2023-09-04', 'DEP-LAB', 'LOC-LAB-01',
 'usr_dept_001', 'ทนพ.กิตติศักดิ์ ชันสูตร', 'NORMAL', 'ACTIVE', 'HIGH', 'STANDARD',
 '2026-09-15', '2027-03-15', '2026-09-15', '2027-03-15',
 'ผ่านการตรวจความปลอดภัยแรงดันหม้อต้มประจำปี', TRUE, 'admin', 'admin'),

('DEMO-AST-010', 'AST-2569-00010', 'MICROSCOPE-CX23', '885000100010', 'QR-AST-00010',
 'กล้องจุลทรรศน์สองตาสำหรับห้องปฏิบัติการ (Binocular Microscope)',
 'CAT-MED-04', 'Microscope', 'Olympus', 'CX23', 'กล้องจุลทรรศน์เลนส์ Plan Achromat กำลังขยาย 40x - 1000x หลอดไฟ LED', 'กล้อง', 1,
 '2020-04-12', 'ซื้อ', 'บจก. นานาแล็บ เซ็นเตอร์', 'PO-63-0301', 'INV-63-1122',
 'เงินงบประมาณ', '2563', 45000.00, 7, 1.00, 6428.00,
 '2020-04-12', '2022-04-11', 'DEP-LAB', 'LOC-LAB-01',
 'usr_dept_001', 'ทนพ.กิตติศักดิ์ ชันสูตร', 'DAMAGED', 'PENDING_DISPOSAL', 'LOW', 'STANDARD',
 '2026-01-10', '2026-07-10', '2025-06-10', '2025-12-10',
 'เลนส์ปริซึมเสื่อมสภาพ ขึ้นรา และปุ่มปรับโฟกัสชำรุด เสนอคณะกรรมการรอจำหน่าย', TRUE, 'admin', 'admin')
ON CONFLICT ("AssetID") DO NOTHING;

-- Demo Transactions
INSERT INTO "AssetTransactions" ("TransactionID", "AssetID", "TransactionType", "FromDepartmentID", "ToDepartmentID", "Reason", "DocumentNo", "PerformedBy", "IsDemo") VALUES
('DEMO-TRX-001', 'DEMO-AST-001', 'RECEIVE', NULL, 'DEP-ER', 'ตรวจรับเข้าประจำห้องฉุกเฉิน', 'RCV-68-001', 'admin', TRUE),
('DEMO-TRX-002', 'DEMO-AST-004', 'REPAIR', 'DEP-OPD', 'DEP-ENG', 'ส่งซ่อมสายเคเบิล ECG มีสัญญาณแทรก', 'REP-2569-001', 'nurse_opd', TRUE)
ON CONFLICT ("TransactionID") DO NOTHING;

-- Demo Repair Request
INSERT INTO "RepairRequests" (
    "RepairRequestID", "RepairCode", "AssetID", "RequestDate", "Reporter",
    "DepartmentID", "Problem", "Symptom", "Priority", "SafetyRisk", "Status",
    "AssignedTo", "Vendor", "StartDate", "Diagnosis", "RepairAction",
    "PartsUsed", "LaborCost", "PartsCost", "TotalCost", "DowntimeHours", "Result", "IsDemo"
) VALUES (
    'DEMO-REP-001', 'REP-2569-00001', 'DEMO-AST-004', NOW() - INTERVAL '3 days', 'พว.สุดารัตน์',
    'DEP-OPD', 'คลื่นไฟฟ้าหัวใจมีสัญญาณรบกวนมากและกราฟหลุดที่ลีด V1-V3', 'สัญญาณ Noise สวิง ไม่สามารถแปลผลแพทย์ได้',
    'URGENT', FALSE, 'IN_REPAIR', 'นายสมเกียรติ ช่างซ่อมบำรุง', 'บจก. เมดิเทค อินสตรูเมนท์',
    CURRENT_DATE - 2, 'สายเคเบิลลีดขาดในบริเวณข้อต่อหัวขั้วต่อ', 'กำลังสั่งอะไหล่สาย Lead Wire ชุดใหม่ของ Nihon Kohden',
    'ECG Patient Cable 10-Lead Set', 500.00, 4800.00, 5300.00, 48.0, 'รออะไหล่ทดแทน', TRUE
) ON CONFLICT ("RepairRequestID") DO NOTHING;

-- Demo Maintenance Plan (PM)
INSERT INTO "MaintenancePlans" (
    "PlanID", "PlanCode", "AssetID", "PlanName", "FrequencyMonths", "ScheduledDate",
    "AssignedTo", "Vendor", "Status", "EstimatedCost", "IsDemo"
) VALUES
('DEMO-PM-001', 'PM-2569-00001', 'DEMO-AST-001', 'ทดสอบพลังงานและสอบเทียบเครื่องกระตุกหัวใจ AED ประจำ 6 เดือน', 6, CURRENT_DATE + 10, 'นายสมเกียรติ ช่างซ่อมบำรุง', 'ศูนย์วิศวกรรมการแพทย์', 'SCHEDULED', 2500.00, TRUE),
('DEMO-PM-002', 'PM-2569-00002', 'DEMO-AST-006', 'สอบเทียบระบบวัดความถ่วงจำเพาะและทำความสะอาดระบบท่อ CBC Analyzer', 6, CURRENT_DATE + 5, 'ทนพ.กิตติศักดิ์', 'Sysmex Thailand', 'SCHEDULED', 8000.00, TRUE)
ON CONFLICT ("PlanID") DO NOTHING;

-- Demo Warranty Contract
INSERT INTO "WarrantyContracts" (
    "WarrantyContractID", "AssetID", "ContractNo", "ContractType", "Vendor",
    "StartDate", "EndDate", "SLA", "ContactPerson", "Phone", "Email", "CoverageDetails", "IsDemo"
) VALUES
('DEMO-WAR-001', 'DEMO-AST-001', 'WAR-PH-2024-88', 'WARRANTY', 'บริษัท เมดิคอลโปรเกรส จำกัด',
 '2024-10-15', '2026-10-14', 'บริการเข้าซ่อมภายใน 24 ชม.', 'นายธีรพล ผู้จัดการฝ่ายบริการ', '02-888-9999', 'service@medicalprogress.co.th', 'ครอบคลุมอะไหล่ แบตเตอรี่ และการสอบเทียบฟรีปีละ 1 ครั้ง', TRUE),
('DEMO-WAR-002', 'DEMO-AST-006', 'WAR-SYS-2023-11', 'SERVICE_CONTRACT', 'บจก. ซิสเมกซ์ ไทยแลนด์',
 '2023-03-25', '2026-03-24', 'เข้าตรวจซ่อมฉุกเฉินภายใน 4 ชม.', 'วิศวกรประจำเขตตะวันออก', '02-777-6655', 'hotline@sysmex.co.th', 'สัญญาบริการเต็มรูปแบบ (Full Comprehensive Contract) พร้อมน้ำยาสอบเทียบ', TRUE)
ON CONFLICT ("WarrantyContractID") DO NOTHING;

-- Demo Audit Log
INSERT INTO "AuditLogs" ("LogID", "UserID", "Username", "Role", "Action", "Module", "RecordID", "Details", "IsDemoAction") VALUES
('DEMO-LOG-001', 'usr_admin_001', 'admin', 'ADMIN', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'SYS', 'เริ่มต้นติดตั้งระบบจัดการครุภัณฑ์โรงพยาบาลและสร้างชุดข้อมูลสาธิต', TRUE);
