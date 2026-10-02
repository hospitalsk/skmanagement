/**
 * ==============================================================================
 * HOSPITAL ASSET MANAGEMENT SYSTEM - MAIN APPLICATION CONTROLLER
 * GitHub-native Version (Vanilla JS + Supabase)
 * ==============================================================================
 */

// Global State
let CURRENT_SESSION = null;
let SYSTEM_SETTINGS = {};
let MASTER_CATEGORIES = [];
let MASTER_DEPARTMENTS = [];
let MASTER_LOCATIONS = [];
let ASSETS_CACHE = [];
let ACTIVE_VIEW = 'dashboard';

// Embedded Supabase SQL Script for 1-Click Copy in Settings
const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- HOSPITAL ASSET MANAGEMENT SYSTEM (ระบบจัดการครุภัณฑ์โรงพยาบาล)
-- SUPABASE POSTGRESQL DATABASE SCHEMA & SEED DATA
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "UserID" VARCHAR(64) PRIMARY KEY,
    "Username" VARCHAR(100) UNIQUE NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "FullName" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL,
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
    "CategoryType" VARCHAR(100),
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
    "AcquisitionMethod" VARCHAR(100),
    "Vendor" VARCHAR(255),
    "PurchaseOrderNo" VARCHAR(100),
    "InvoiceNo" VARCHAR(100),
    "BudgetType" VARCHAR(100),
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
    "Condition" VARCHAR(50) DEFAULT 'NORMAL',
    "Status" VARCHAR(50) DEFAULT 'ACTIVE',
    "RiskLevel" VARCHAR(50) DEFAULT 'MEDIUM',
    "Criticality" VARCHAR(50) DEFAULT 'STANDARD',
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
    "TransactionType" VARCHAR(50) NOT NULL,
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
    "Status" VARCHAR(50) DEFAULT 'PENDING',
    "Note" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Inspections Table
CREATE TABLE IF NOT EXISTS "Inspections" (
    "InspectionID" VARCHAR(64) PRIMARY KEY,
    "InspectionCode" VARCHAR(50) NOT NULL,
    "InspectionType" VARCHAR(50) NOT NULL,
    "SessionTitle" VARCHAR(255) NOT NULL,
    "StartDate" DATE,
    "EndDate" DATE,
    "DepartmentID" VARCHAR(64),
    "Inspector" VARCHAR(255),
    "Status" VARCHAR(50) DEFAULT 'IN_PROGRESS',
    "SummaryNotes" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 11. InspectionItems Table
CREATE TABLE IF NOT EXISTS "InspectionItems" (
    "ItemID" VARCHAR(64) PRIMARY KEY,
    "InspectionID" VARCHAR(64) NOT NULL REFERENCES "Inspections"("InspectionID") ON DELETE CASCADE,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "CheckStatus" VARCHAR(50) DEFAULT 'FOUND_NORMAL',
    "Condition" VARCHAR(50),
    "ActualDepartmentID" VARCHAR(64),
    "ActualLocationID" VARCHAR(64),
    "ActualCustodian" VARCHAR(255),
    "SafetyStatus" VARCHAR(50),
    "FunctionalStatus" VARCHAR(50),
    "CalibrationStatus" VARCHAR(50),
    "Findings" TEXT,
    "Recommendation" TEXT,
    "PhotoUrl" TEXT,
    "CheckedAt" TIMESTAMPTZ DEFAULT NOW(),
    "CheckedBy" VARCHAR(100),
    "IsDemo" BOOLEAN DEFAULT FALSE
);

-- 12. MaintenancePlans Table
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
    "Status" VARCHAR(50) DEFAULT 'SCHEDULED',
    "EstimatedCost" NUMERIC(12,2) DEFAULT 0.00,
    "ActualCost" NUMERIC(12,2) DEFAULT 0.00,
    "PartsUsed" TEXT,
    "Result" TEXT,
    "NextPMDate" DATE,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 13. RepairRequests Table
CREATE TABLE IF NOT EXISTS "RepairRequests" (
    "RepairRequestID" VARCHAR(64) PRIMARY KEY,
    "RepairCode" VARCHAR(50) NOT NULL,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "RequestDate" TIMESTAMPTZ DEFAULT NOW(),
    "Reporter" VARCHAR(255) NOT NULL,
    "DepartmentID" VARCHAR(64),
    "Problem" TEXT NOT NULL,
    "Symptom" TEXT,
    "Priority" VARCHAR(50) DEFAULT 'NORMAL',
    "SafetyRisk" BOOLEAN DEFAULT FALSE,
    "Status" VARCHAR(50) DEFAULT 'REQUESTED',
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

-- 14. RepairHistory Table
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

-- 15. WarrantyContracts Table
CREATE TABLE IF NOT EXISTS "WarrantyContracts" (
    "WarrantyContractID" VARCHAR(64) PRIMARY KEY,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "ContractNo" VARCHAR(100),
    "ContractType" VARCHAR(100) DEFAULT 'WARRANTY',
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

-- 16. Disposals Table
CREATE TABLE IF NOT EXISTS "Disposals" (
    "DisposalID" VARCHAR(64) PRIMARY KEY,
    "DisposalCode" VARCHAR(50) NOT NULL,
    "AssetID" VARCHAR(64) NOT NULL REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "DisposalDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "Reason" TEXT NOT NULL,
    "Method" VARCHAR(100),
    "ApprovalNo" VARCHAR(100),
    "ApprovedBy" VARCHAR(255),
    "BookValue" NUMERIC(15,2) DEFAULT 0.00,
    "DisposalValue" NUMERIC(15,2) DEFAULT 0.00,
    "BuyerOrReceiver" VARCHAR(255),
    "EvidenceFile" TEXT,
    "Status" VARCHAR(50) DEFAULT 'COMPLETED',
    "Note" TEXT,
    "IsDemo" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Attachments Table
CREATE TABLE IF NOT EXISTS "Attachments" (
    "AttachmentID" VARCHAR(64) PRIMARY KEY,
    "AssetID" VARCHAR(64) REFERENCES "Assets"("AssetID") ON DELETE CASCADE,
    "RefType" VARCHAR(50),
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

-- 18. AuditLogs Table
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
`;

// -----------------------------------------------------------------------------
// APP INITIALIZATION & DOM READY
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  renderThaiDateHeader();
  await loadInitialSettings();
  checkExistingSession();

  // Populate SQL box in settings
  const sqlBox = document.getElementById('supabaseSqlCodeBox');
  if (sqlBox) sqlBox.value = SUPABASE_SCHEMA_SQL;
});

function renderThaiDateHeader() {
  const d = new Date();
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const formatted = `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  const el = document.getElementById('headerThaiDate');
  if (el) el.textContent = formatted;
}

function checkExistingSession() {
  const stored = sessionStorage.getItem('H_AMS_SESSION');
  if (stored) {
    try {
      const sess = JSON.parse(stored);
      CURRENT_SESSION = sess;
      setupUserInterface(sess.user);
    } catch (e) {
      sessionStorage.removeItem('H_AMS_SESSION');
    }
  }
}

async function loadInitialSettings() {
  try {
    const rows = await SupabaseService.apiFetch('Settings');
    const settings = {};
    (rows || []).forEach(r => {
      settings[r.SettingKey] = r.SettingValue;
    });
    SYSTEM_SETTINGS = settings;
    applySystemSettings(settings);
  } catch (err) {
    console.warn('Initial settings loaded with defaults');
  }
}

function applySystemSettings(settings) {
  const sysName = settings.SYSTEM_NAME || 'ระบบจัดการครุภัณฑ์โรงพยาบาล';
  const orgName = settings.ORGANIZATION_NAME || 'โรงพยาบาล';
  const shortName = settings.SYSTEM_SHORT_NAME || 'H-AMS';

  if (document.getElementById('loginSystemTitle')) document.getElementById('loginSystemTitle').textContent = sysName;
  if (document.getElementById('loginOrgTitle')) document.getElementById('loginOrgTitle').textContent = orgName;
  if (document.getElementById('brandSystemName')) document.getElementById('brandSystemName').textContent = shortName;
  if (document.getElementById('brandOrgName')) document.getElementById('brandOrgName').textContent = settings.ORGANIZATION_SHORT_NAME || orgName;

  // Settings form fields
  if (document.getElementById('setOrgName')) document.getElementById('setOrgName').value = settings.ORGANIZATION_NAME || '';
  if (document.getElementById('setOrgShortName')) document.getElementById('setOrgShortName').value = settings.ORGANIZATION_SHORT_NAME || '';
  if (document.getElementById('setOrgType')) document.getElementById('setOrgType').value = settings.ORGANIZATION_TYPE || '';
  if (document.getElementById('setSystemName')) document.getElementById('setSystemName').value = settings.SYSTEM_NAME || '';
  if (document.getElementById('setSystemShortName')) document.getElementById('setSystemShortName').value = settings.SYSTEM_SHORT_NAME || '';
  if (document.getElementById('setFiscalYear')) document.getElementById('setFiscalYear').value = settings.FISCAL_YEAR || '2569';
  if (document.getElementById('setAssetPrefix')) document.getElementById('setAssetPrefix').value = settings.ASSET_PREFIX || 'AST-';
  if (document.getElementById('setRepairPrefix')) document.getElementById('setRepairPrefix').value = settings.REPAIR_PREFIX || 'REP-';
  if (document.getElementById('setWarrantyWarningDays')) document.getElementById('setWarrantyWarningDays').value = settings.WARRANTY_WARNING_DAYS || '30';

  const creds = SupabaseService.getCredentials();
  if (document.getElementById('setSupabaseUrl')) document.getElementById('setSupabaseUrl').value = creds.url || '';
}

function fillLoginForm(user, pass) {
  document.getElementById('loginUsername').value = user;
  document.getElementById('loginPassword').value = pass;
}

// -----------------------------------------------------------------------------
// AUTHENTICATION & LOGIN/LOGOUT
// -----------------------------------------------------------------------------

async function handleLoginSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    showToast('warning', 'แจ้งเตือน', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    return;
  }

  showLoading('กำลังเข้าสู่ระบบและตรวจสอบสิทธิ์กับฐานข้อมูล...');
  try {
    const users = await SupabaseService.apiFetch(`Users?Username=eq.${encodeURIComponent(username)}&IsActive=eq.true`);
    hideLoading();

    const user = (users && users.length > 0) ? users[0] : null;
    if (!user || user.PasswordHash !== password) {
      showToast('danger', 'เข้าสู่ระบบไม่สำเร็จ', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ทดสอบ: admin/1234 หรือ demo/1234)');
      return;
    }

    if (user.Role === 'DEMO' && SYSTEM_SETTINGS.DEMO_ENABLED === 'FALSE') {
      showToast('warning', 'แจ้งเตือน', 'โหมดทดลอง (Demo Mode) ถูกปิดใช้งานโดยผู้ดูแลระบบ');
      return;
    }

    const token = 'SES-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const sessionObj = {
      token: token,
      user: {
        userId: user.UserID,
        username: user.Username,
        fullName: user.FullName,
        role: user.Role,
        departmentId: user.DepartmentID,
        isDemo: user.IsDemoUser || user.Role === 'DEMO'
      }
    };

    CURRENT_SESSION = sessionObj;
    sessionStorage.setItem('H_AMS_SESSION', JSON.stringify(sessionObj));

    // Audit log
    await writeAuditLog('LOGIN', 'USERS', user.UserID, `ผู้ใช้เข้าสู่ระบบสำเร็จ: ${user.Username}`);

    setupUserInterface(sessionObj.user);
    showToast('success', 'ยินดีต้อนรับ', `เข้าสู่ระบบสำเร็จในฐานะ: ${user.FullName}`);
  } catch (err) {
    hideLoading();
    showToast('danger', 'ข้อผิดพลาด', err.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
  }
}

function setupUserInterface(user) {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';

  document.getElementById('userDisplayName').textContent = user.fullName || user.username;
  document.getElementById('userRoleBadge').textContent = user.role;
  document.getElementById('userAvatarText').textContent = (user.username || 'U').substring(0, 2).toUpperCase();

  // Demo badge header visibility
  const demoBadge = document.getElementById('demoBadgeHeader');
  if (demoBadge) {
    demoBadge.style.display = user.isDemo ? 'inline-flex' : 'none';
  }

  // Role permissions: Hide admin-only sections for non-admin
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(el => {
    el.style.display = (user.role === 'ADMIN') ? '' : 'none';
  });

  loadMasterData();
  switchView('dashboard');
}

async function handleLogout() {
  openConfirmModal('ออกจากระบบ', 'คุณต้องการออกจากระบบจัดการครุภัณฑ์หรือไม่?', async () => {
    showLoading('กำลังออกจากระบบ...');
    if (CURRENT_SESSION) {
      await writeAuditLog('LOGOUT', 'USERS', CURRENT_SESSION.user.userId, 'ผู้ใช้ออกจากระบบ');
    }
    hideLoading();
    CURRENT_SESSION = null;
    sessionStorage.removeItem('H_AMS_SESSION');
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginView').style.display = 'flex';
    showToast('info', 'ออกจากระบบ', 'ออกจากระบบเรียบร้อยแล้ว');
  });
}

// -----------------------------------------------------------------------------
// NAVIGATION & VIEW SWITCHING
// -----------------------------------------------------------------------------

function switchView(viewName) {
  ACTIVE_VIEW = viewName;
  toggleSidebar(false);

  // Update active menu link
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Hide all view sections
  document.querySelectorAll('.app-view').forEach(v => v.style.display = 'none');

  const titleMap = {
    'dashboard': { title: 'ภาพรวม (Dashboard)', sub: 'ระบบบริหารจัดการและติดตามสินทรัพย์ทางการแพทย์' },
    'assets': { title: 'ทะเบียนครุภัณฑ์', sub: 'รายการและรายละเอียดครุภัณฑ์ทั้งหมดของโรงพยาบาล' },
    'receive': { title: 'รับเข้าครุภัณฑ์', sub: 'ตรวจรับและขึ้นทะเบียนครุภัณฑ์ใหม่เข้าสู่ระบบ' },
    'transfers': { title: 'โอนย้าย / เปลี่ยนสถานที่', sub: 'จัดการการโอนย้ายครุภัณฑ์ระหว่างหน่วยงาน' },
    'checkout': { title: 'เบิกจ่าย / รับคืน', sub: 'บันทึกการเบิกใช้งานและการส่งมอบคืนครุภัณฑ์' },
    'audit-count': { title: 'ตรวจนับครุภัณฑ์ประจำปี', sub: 'ตรวจสอบการมีอยู่และสถานที่จริงของครุภัณฑ์' },
    'inspections': { title: 'ตรวจสภาพและความพร้อมใช้', sub: 'ประเมินสภาพความปลอดภัยและการทำงานของเครื่องมือแพทย์' },
    'pm': { title: 'PM / บำรุงรักษาเชิงป้องกัน', sub: 'แผนการสอบเทียบและบำรุงรักษาตามรอบ' },
    'repairs': { title: 'แจ้งซ่อมครุภัณฑ์', sub: 'รายการแจ้งซ่อมและติดตามสถานะงานซ่อม' },
    'repair-history': { title: 'ประวัติการซ่อมบำรุง', sub: 'สรุปข้อมูลการซ่อม อะไหล่ และค่าใช้จ่ายสะสม' },
    'warranty': { title: 'สัญญาและการรับประกัน', sub: 'ติดตามวันหมดอายุสัญญาบริการและการรับประกัน' },
    'disposals': { title: 'จำหน่ายครุภัณฑ์', sub: 'บันทึกการตัดจำหน่ายครุภัณฑ์ที่ชำรุดหรือไม่คุ้มค่า' },
    'attachments': { title: 'เอกสารและไฟล์แนบ', sub: 'ศูนย์รวมคู่มือ ใบตรวจรับ และเอกสารประกอบครุภัณฑ์' },
    'reports': { title: 'รายงานและสถิติ', sub: 'รายงานสรุปข้อมูลครุภัณฑ์และการส่งออก' },
    'users': { title: 'จัดการผู้ใช้งานระบบ', sub: 'กำหนดสิทธิ์และบริหารบัญชีผู้ใช้งาน' },
    'audit-logs': { title: 'บันทึกประวัติการใช้งาน (Audit Trail)', sub: 'ประวัติการเปลี่ยนแปลงและบันทึกความปลอดภัย' },
    'settings': { title: 'ตั้งค่าระบบ & SQL', sub: 'ปรับแต่งระบบและคัดลอกคำสั่งสร้างฐานข้อมูล Supabase' }
  };

  const targetTitle = titleMap[viewName] || { title: viewName, sub: '' };
  document.getElementById('currentPageTitle').textContent = targetTitle.title;
  document.getElementById('currentPageSub').textContent = targetTitle.sub;

  const targetViewEl = document.getElementById('view-' + viewName);
  if (targetViewEl) targetViewEl.style.display = 'block';

  triggerViewDataLoader(viewName);
}

function triggerViewDataLoader(viewName) {
  if (!CURRENT_SESSION) return;
  switch (viewName) {
    case 'dashboard': loadDashboardData(); break;
    case 'assets': loadAssetsData(); break;
    case 'receive': prepareReceiveForm(); break;
    case 'transfers': loadTransfersData(); break;
    case 'checkout': loadCheckoutData(); break;
    case 'audit-count': loadAuditCountData(); break;
    case 'inspections': loadInspectionsData(); break;
    case 'pm': loadPmPlansData(); break;
    case 'repairs': loadRepairsData(); break;
    case 'repair-history': loadRepairHistoryData(); break;
    case 'warranty': loadWarrantyData(); break;
    case 'disposals': loadDisposalsData(); break;
    case 'attachments': loadAttachmentsData(); break;
    case 'reports': loadReportData(); break;
    case 'users': loadUsersData(); break;
    case 'audit-logs': loadAuditLogsData(); break;
  }
}

function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (open) {
    sidebar.classList.add('open');
    backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
  }
}

// -----------------------------------------------------------------------------
// MASTER DATA LOADERS
// -----------------------------------------------------------------------------

async function loadMasterData() {
  try {
    const [depts, cats, locs] = await Promise.all([
      SupabaseService.apiFetch('Departments?order=DepartmentName.asc'),
      SupabaseService.apiFetch('AssetCategories?order=CategoryName.asc'),
      SupabaseService.apiFetch('Locations?order=LocationName.asc')
    ]);

    if (depts) {
      MASTER_DEPARTMENTS = depts;
      populateDepartmentSelects(depts);
    }
    if (cats) {
      MASTER_CATEGORIES = cats;
      populateCategorySelects(cats);
    }
    if (locs) {
      MASTER_LOCATIONS = locs;
    }
  } catch (e) {
    console.error('Master data load error:', e);
  }
}

function populateDepartmentSelects(depts) {
  const selectIds = ['filterAssetDept', 'rcvDepartmentID', 'trfToDepartmentID', 'reportDeptFilter', 'usrDepartmentID'];
  selectIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const currentVal = el.value;
    let html = (id.startsWith('filter') || id.startsWith('report')) ? '<option value="">-- ทุกแผนก/หน่วยงาน --</option>' : '<option value="">-- เลือกหน่วยงาน --</option>';
    depts.forEach(d => {
      html += `<option value="${d.DepartmentID}">${d.DepartmentName}</option>`;
    });
    el.innerHTML = html;
    if (currentVal) el.value = currentVal;
  });
}

function populateCategorySelects(cats) {
  const el = document.getElementById('rcvCategoryID');
  if (!el) return;
  let html = '<option value="">-- เลือกหมวดหมู่ครุภัณฑ์ --</option>';
  cats.forEach(c => {
    html += `<option value="${c.AssetCategoryID}">${c.CategoryName}</option>`;
  });
  el.innerHTML = html;
}

function loadLocationsForSelect(deptSelectId, locSelectId) {
  const deptSelect = document.getElementById(deptSelectId);
  const locSelect = document.getElementById(locSelectId);
  if (!deptSelect || !locSelect) return;

  const deptId = deptSelect.value;
  const filtered = MASTER_LOCATIONS.filter(l => !deptId || l.DepartmentID === deptId);

  let html = '<option value="">-- เลือกสถานที่/ห้อง --</option>';
  filtered.forEach(loc => {
    html += `<option value="${loc.LocationID}">${loc.LocationName} (${loc.RoomNumber || ''})</option>`;
  });
  locSelect.innerHTML = html;
}

// -----------------------------------------------------------------------------
// VIEW 1: DASHBOARD
// -----------------------------------------------------------------------------

async function loadDashboardData() {
  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const [assets, repairs, pmPlans] = await Promise.all([
      SupabaseService.apiFetch(`Assets?IsDemo=eq.${isDemo}&order=CreatedAt.desc`),
      SupabaseService.apiFetch(`RepairRequests?IsDemo=eq.${isDemo}`),
      SupabaseService.apiFetch(`MaintenancePlans?IsDemo=eq.${isDemo}`)
    ]);

    const assetList = assets || [];
    const totalAssets = assetList.length;
    const totalValue = assetList.reduce((sum, a) => sum + Number(a.AcquisitionCost || 0), 0);
    const normalCount = assetList.filter(a => a.Status === 'ACTIVE').length;
    const inRepairCount = assetList.filter(a => a.Status === 'IN_REPAIR').length;
    const damagedCount = assetList.filter(a => a.Condition === 'DAMAGED' || a.Condition === 'REPAIRABLE').length;

    document.getElementById('statTotalAssets').textContent = totalAssets.toLocaleString();
    document.getElementById('statTotalValue').textContent = `มูลค่ารวม ${totalValue.toLocaleString()} บาท`;
    document.getElementById('statNormalAssets').textContent = normalCount.toLocaleString();
    document.getElementById('statInRepairAssets').textContent = inRepairCount.toLocaleString();
    document.getElementById('statDamagedAssets').textContent = damagedCount.toLocaleString();
    document.getElementById('statPmDueSoon').textContent = (pmPlans || []).length.toLocaleString();

    renderDashboardRecentTable(assetList);
  } catch (err) {
    showToast('danger', 'ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูล Dashboard ได้');
  }
}

function renderDashboardRecentTable(assets) {
  const tbody = document.getElementById('dashboardRecentAssetsTable');
  if (!tbody) return;
  if (!assets || assets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ไม่พบรายการครุภัณฑ์</td></tr>`;
    return;
  }

  let html = '';
  assets.slice(0, 8).forEach(a => {
    html += `
      <tr>
        <td><strong>${a.AssetCode}</strong></td>
        <td>${a.AssetName}</td>
        <td>${getDepartmentName(a.DepartmentID)}</td>
        <td>${a.CustodianName || '-'}</td>
        <td>${renderConditionBadge(a.Condition)}</td>
        <td>${renderStatusBadge(a.Status)}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="openAssetDetailModal('${a.AssetID}')"><i class="fa-solid fa-eye"></i> ดูข้อมูล</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// -----------------------------------------------------------------------------
// VIEW 2: ASSETS REGISTRY (ทะเบียนครุภัณฑ์)
// -----------------------------------------------------------------------------

async function loadAssetsData() {
  showLoading('กำลังโหลดรายการครุภัณฑ์...');
  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const data = await SupabaseService.apiFetch(`Assets?IsDemo=eq.${isDemo}&order=CreatedAt.desc`);
    hideLoading();
    ASSETS_CACHE = data || [];
    renderAssetsTable(ASSETS_CACHE);
  } catch (err) {
    hideLoading();
    showToast('danger', 'ข้อผิดพลาด', err.message);
  }
}

function renderAssetsTable(assets) {
  const tbody = document.getElementById('assetsTableBody');
  if (!tbody) return;
  if (assets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 30px; color: var(--text-muted);">ไม่พบข้อมูลครุภัณฑ์ตามเงื่อนไขที่ระบุ</td></tr>`;
    return;
  }

  let html = '';
  assets.forEach(a => {
    html += `
      <tr>
        <td><strong>${a.AssetCode}</strong></td>
        <td>
          <div style="font-weight: 600;">${a.AssetName}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${(a.Brand || '')} ${a.Model ? '(' + a.Model + ')' : ''}</div>
        </td>
        <td>${getCategoryName(a.AssetCategoryID)}</td>
        <td>
          <div>${getDepartmentName(a.DepartmentID)}</div>
          <div style="font-size: 0.78rem; color: var(--text-light);">${getLocationName(a.LocationID)}</div>
        </td>
        <td style="font-weight: 600;">${Number(a.AcquisitionCost || 0).toLocaleString()}</td>
        <td>${renderStatusBadge(a.Status)}</td>
        <td>
          <button class="btn btn-sm btn-outline" title="ดู QR/Barcode" onclick="openAssetDetailModal('${a.AssetID}')">
            <i class="fa-solid fa-qrcode"></i>
          </button>
        </td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-sm btn-outline" title="ดูข้อมูล" onclick="openAssetDetailModal('${a.AssetID}')"><i class="fa-solid fa-eye"></i></button>
            <button class="btn btn-sm btn-warning" title="แจ้งซ่อม" onclick="prepareRepairFromAsset('${a.AssetID}')"><i class="fa-solid fa-wrench"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function filterAssetsTable() {
  const search = (document.getElementById('assetSearchInput').value || '').toLowerCase().trim();
  const dept = document.getElementById('filterAssetDept').value;
  const status = document.getElementById('filterAssetStatus').value;

  const filtered = ASSETS_CACHE.filter(a => {
    const matchSearch = !search ||
      (a.AssetCode && a.AssetCode.toLowerCase().includes(search)) ||
      (a.AssetName && a.AssetName.toLowerCase().includes(search)) ||
      (a.SerialNumber && a.SerialNumber.toLowerCase().includes(search));
    const matchDept = !dept || a.DepartmentID === dept;
    const matchStatus = !status || a.Status === status;
    return matchSearch && matchDept && matchStatus;
  });

  renderAssetsTable(filtered);
}

// -----------------------------------------------------------------------------
// VIEW 3: RECEIVE ASSET (รับเข้าครุภัณฑ์)
// -----------------------------------------------------------------------------

async function prepareReceiveForm() {
  document.getElementById('receiveAssetForm').reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rcvAcquisitionDate').value = today;

  const prefix = SYSTEM_SETTINGS.ASSET_PREFIX || 'AST-';
  const year = SYSTEM_SETTINGS.FISCAL_YEAR || '2569';
  const randomSuffix = ('00000' + Math.floor(Math.random() * 90000 + 10000)).slice(-5);
  document.getElementById('rcvAssetCode').value = `${prefix}${year}-${randomSuffix}`;
}

async function handleReceiveAssetSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const isDemo = CURRENT_SESSION.user.isDemo;
  const assetCode = document.getElementById('rcvAssetCode').value;
  const newAssetId = 'AST-' + Date.now();

  const payload = {
    AssetID: newAssetId,
    AssetCode: assetCode,
    AssetName: document.getElementById('rcvAssetName').value.trim(),
    AssetCategoryID: document.getElementById('rcvCategoryID').value,
    Brand: document.getElementById('rcvBrand').value.trim(),
    Model: document.getElementById('rcvModel').value.trim(),
    SerialNumber: document.getElementById('rcvSerialNumber').value.trim(),
    AcquisitionMethod: document.getElementById('rcvAcquisitionMethod').value,
    AcquisitionDate: document.getElementById('rcvAcquisitionDate').value,
    AcquisitionCost: Number(document.getElementById('rcvAcquisitionCost').value) || 0,
    DepartmentID: document.getElementById('rcvDepartmentID').value,
    LocationID: document.getElementById('rcvLocationID').value,
    CustodianName: document.getElementById('rcvCustodianName').value.trim(),
    Specification: document.getElementById('rcvSpecification').value.trim(),
    Condition: 'NORMAL',
    Status: 'ACTIVE',
    IsDemo: isDemo,
    CreatedBy: CURRENT_SESSION.user.username,
    CreatedAt: new Date().toISOString()
  };

  showLoading('กำลังบันทึกและขึ้นทะเบียนครุภัณฑ์...');
  try {
    await SupabaseService.apiFetch('Assets', 'POST', payload);

    // Save initial transaction
    await SupabaseService.apiFetch('AssetTransactions', 'POST', {
      TransactionID: 'TRX-' + Date.now(),
      AssetID: newAssetId,
      TransactionType: 'RECEIVE',
      TransactionDate: new Date().toISOString(),
      ToDepartmentID: payload.DepartmentID,
      ToLocationID: payload.LocationID,
      ResponsiblePerson: payload.CustodianName,
      Reason: `รับเข้าครุภัณฑ์ใหม่ (${payload.AcquisitionMethod})`,
      PerformedBy: CURRENT_SESSION.user.username,
      IsDemo: isDemo
    });

    await writeAuditLog('RECEIVE_ASSET', 'ASSETS', newAssetId, `รับเข้าครุภัณฑ์ใหม่: ${assetCode}`);

    hideLoading();
    submitBtn.disabled = false;
    showToast('success', 'ขึ้นทะเบียนสำเร็จ', `รหัสครุภัณฑ์: ${assetCode}`);
    switchView('assets');
  } catch (err) {
    hideLoading();
    submitBtn.disabled = false;
    showToast('danger', 'ข้อผิดพลาด', err.message);
  }
}

// -----------------------------------------------------------------------------
// VIEW 4: TRANSFERS (โอนย้าย)
// -----------------------------------------------------------------------------

async function loadTransfersData() {
  const tbody = document.getElementById('transfersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">กำลังโหลดข้อมูลการโอนย้าย...</td></tr>`;

  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const txs = await SupabaseService.apiFetch(`AssetTransactions?IsDemo=eq.${isDemo}&order=TransactionDate.desc`);
    const transfers = (txs || []).filter(t => t.TransactionType === 'TRANSFER');

    if (transfers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ยังไม่มีประวัติการโอนย้ายครุภัณฑ์</td></tr>`;
      return;
    }

    let html = '';
    transfers.forEach(t => {
      html += `
        <tr>
          <td><strong>${t.DocumentNo || t.TransactionID}</strong></td>
          <td>${getAssetName(t.AssetID)}</td>
          <td>${getDepartmentName(t.FromDepartmentID)}</td>
          <td>${getDepartmentName(t.ToDepartmentID)}</td>
          <td>${t.Reason || '-'}</td>
          <td><span class="badge badge-success">เสร็จสมบูรณ์</span></td>
          <td><button class="btn btn-sm btn-outline" onclick="openAssetDetailModal('${t.AssetID}')"><i class="fa-solid fa-eye"></i></button></td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลได้</td></tr>`;
  }
}

function openTransferModal() {
  populateAssetSelect('trfAssetId');
  openModal('transferModal');
}

async function handleTransferSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  const isDemo = CURRENT_SESSION.user.isDemo;
  const assetId = document.getElementById('trfAssetId').value;
  const toDept = document.getElementById('trfToDepartmentID').value;
  const toLoc = document.getElementById('trfToLocationID').value;
  const toResp = document.getElementById('trfToResponsible').value.trim();
  const reason = document.getElementById('trfReason').value.trim();

  showLoading('กำลังบันทึกการโอนย้าย...');
  try {
    // 1. Update Asset Location & Department
    await SupabaseService.apiFetch(`Assets?AssetID=eq.${encodeURIComponent(assetId)}`, 'PATCH', {
      DepartmentID: toDept,
      LocationID: toLoc,
      CustodianName: toResp || undefined,
      UpdatedAt: new Date().toISOString()
    });

    // 2. Record Transaction
    await SupabaseService.apiFetch('AssetTransactions', 'POST', {
      TransactionID: 'TRX-' + Date.now(),
      AssetID: assetId,
      TransactionType: 'TRANSFER',
      TransactionDate: new Date().toISOString(),
      ToDepartmentID: toDept,
      ToLocationID: toLoc,
      ResponsiblePerson: toResp,
      Reason: reason,
      DocumentNo: 'TRF-' + Date.now().toString().slice(-6),
      PerformedBy: CURRENT_SESSION.user.username,
      IsDemo: isDemo
    });

    await writeAuditLog('TRANSFER_ASSET', 'TRANSFERS', assetId, `โอนย้ายครุภัณฑ์ไปยังหน่วยงาน: ${toDept}`);

    hideLoading();
    btn.disabled = false;
    closeModal('transferModal');
    showToast('success', 'บันทึกการโอนสำเร็จ', 'ข้อมูลหน่วยงานและสถานที่ได้รับการปรับปรุงแล้ว');
    loadTransfersData();
  } catch (err) {
    hideLoading();
    btn.disabled = false;
    showToast('danger', 'ข้อผิดพลาด', err.message);
  }
}

// -----------------------------------------------------------------------------
// VIEW 5: CHECKOUT & RETURN (เบิกจ่าย / รับคืน)
// -----------------------------------------------------------------------------

async function loadCheckoutData() {
  const tbody = document.getElementById('checkoutTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">กำลังโหลดรายการเบิกจ่าย...</td></tr>`;

  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const txs = await SupabaseService.apiFetch(`AssetTransactions?IsDemo=eq.${isDemo}&order=TransactionDate.desc`);
    if (!txs || txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ไม่มีรายการเบิกจ่ายหรือรับคืน</td></tr>`;
      return;
    }

    let html = '';
    txs.forEach(t => {
      html += `
        <tr>
          <td>${formatThaiDate(t.TransactionDate)}</td>
          <td><span class="badge ${t.TransactionType === 'RECEIVE' ? 'badge-info' : 'badge-primary'}">${t.TransactionType}</span></td>
          <td>${getAssetName(t.AssetID)}</td>
          <td>${t.ResponsiblePerson || '-'}</td>
          <td>${getDepartmentName(t.ToDepartmentID || t.FromDepartmentID)}</td>
          <td>${t.Reason || '-'}</td>
          <td>${t.PerformedBy || '-'}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลได้</td></tr>`;
  }
}

function openCheckoutModal() {
  showToast('info', 'ฟังก์ชันเบิกจ่าย', 'ท่านสามารถเลือกเปลี่ยนสถานที่หรือโอนย้ายได้ที่เมนู "โอนย้าย/เปลี่ยนสถานที่"');
  switchView('transfers');
}

// -----------------------------------------------------------------------------
// VIEW 6 & 7: AUDIT COUNT & INSPECTIONS (ตรวจนับและตรวจสภาพ)
// -----------------------------------------------------------------------------

async function loadAuditCountData() {
  const tbody = document.getElementById('auditCountTableBody');
  tbody.innerHTML = `
    <tr>
      <td><strong>INS-2569-001</strong></td>
      <td>การตรวจนับครุภัณฑ์ประจำปีงบประมาณ 2569</td>
      <td>1 ต.ค. 2568 - 30 ก.ย. 2569</td>
      <td>คณะกรรมการตรวจสอบพัสดุประจำปี</td>
      <td><span class="badge badge-warning">กำลังดำเนินการ</span></td>
      <td><button class="btn btn-sm btn-outline" onclick="showToast('info', 'ตรวจนับ', 'เปิดรอบตรวจนับเรียบร้อย สามารถสแกน QR รายการได้')"><i class="fa-solid fa-list-check"></i> ตรวจนับ</button></td>
    </tr>
  `;
}

async function loadInspectionsData() {
  const tbody = document.getElementById('inspectionsTableBody');
  tbody.innerHTML = `
    <tr>
      <td><strong>INS-MED-01</strong></td>
      <td>ตรวจสภาพเครื่องกระตุกหัวใจ AED ประจำเดือน</td>
      <td>${formatThaiDate(new Date())}</td>
      <td><span class="badge badge-success">ปลอดภัย (SAFE)</span></td>
      <td><span class="badge badge-success">พร้อมใช้ (READY)</span></td>
      <td><span class="badge badge-info">ผ่านเกณฑ์</span></td>
      <td>ปกติ สมบูรณ์</td>
    </tr>
  `;
}

function openInspectionSessionModal(type) {
  showToast('info', 'การเปิดรอบตรวจ', `ระบบเตรียมเปิดรอบการตรวจประเภท: ${type}`);
}

// -----------------------------------------------------------------------------
// VIEW 8: PREVENTIVE MAINTENANCE (PM)
// -----------------------------------------------------------------------------

async function loadPmPlansData() {
  const tbody = document.getElementById('pmPlansTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">กำลังโหลดแผน PM...</td></tr>`;

  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const plans = await SupabaseService.apiFetch(`MaintenancePlans?IsDemo=eq.${isDemo}&order=ScheduledDate.asc`);

    if (!plans || plans.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ยังไม่มีแผนการบำรุงรักษาเชิงป้องกัน</td></tr>`;
      return;
    }

    let html = '';
    plans.forEach(p => {
      html += `
        <tr>
          <td><strong>${p.PlanCode}</strong></td>
          <td>${getAssetName(p.AssetID)}</td>
          <td>${p.PlanName}</td>
          <td>${formatThaiDate(p.ScheduledDate)}</td>
          <td>${p.AssignedTo || p.Vendor || '-'}</td>
          <td><span class="badge ${p.Status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">${p.Status}</span></td>
          <td>
            <button class="btn btn-sm btn-success" title="บันทึกทำเสร็จแล้ว" onclick="markPmComplete('${p.PlanID}', '${p.AssetID}')"><i class="fa-solid fa-check"></i> เสร็จสิ้น</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลแผน PM ได้</td></tr>`;
  }
}

function openPmPlanModal() {
  populateAssetSelect('pmAssetId');
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('pmScheduledDate').value = today;
  openModal('pmModal');
}

async function handlePmSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  const isDemo = CURRENT_SESSION.user.isDemo;
  const payload = {
    PlanID: 'PM-' + Date.now(),
    PlanCode: 'PM-' + Date.now().toString().slice(-6),
    AssetID: document.getElementById('pmAssetId').value,
    PlanName: document.getElementById('pmPlanName').value.trim(),
    ScheduledDate: document.getElementById('pmScheduledDate').value,
    FrequencyMonths: Number(document.getElementById('pmFrequencyMonths').value) || 6,
    AssignedTo: document.getElementById('pmAssignedTo').value.trim(),
    Vendor: document.getElementById('pmVendor').value.trim(),
    Status: 'SCHEDULED',
    IsDemo: isDemo,
    CreatedAt: new Date().toISOString()
  };

  showLoading('กำลังบันทึกแผน PM...');
  try {
    await SupabaseService.apiFetch('MaintenancePlans', 'POST', payload);
    hideLoading();
    btn.disabled = false;
    closeModal('pmModal');
    showToast('success', 'บันทึกสำเร็จ', 'สร้างแผนการบำรุงรักษาเรียบร้อย');
    loadPmPlansData();
  } catch (err) {
    hideLoading();
    btn.disabled = false;
    showToast('danger', 'ข้อผิดพลาด', err.message);
  }
}

async function markPmComplete(planId, assetId) {
  openConfirmModal('ยืนยันผลการทำ PM', 'ต้องการบันทึกว่าดำเนินการบำรุงรักษาเชิงป้องกันตามแผนนี้เสร็จสิ้นแล้วใช่หรือไม่?', async () => {
    showLoading('กำลังอัปเดตผล PM...');
    try {
      const today = new Date().toISOString().split('T')[0];
      await SupabaseService.apiFetch(`MaintenancePlans?PlanID=eq.${encodeURIComponent(planId)}`, 'PATCH', {
        Status: 'COMPLETED',
        ActualDate: today,
        Result: 'ผ่านการบำรุงรักษาและสอบเทียบเรียบร้อย'
      });

      if (assetId) {
        await SupabaseService.apiFetch(`Assets?AssetID=eq.${encodeURIComponent(assetId)}`, 'PATCH', {
          LastPMDate: today
        });
      }

      hideLoading();
      showToast('success', 'อัปเดตสำเร็จ', 'บันทึกผลการทำ PM เรียบร้อยแล้ว');
      loadPmPlansData();
    } catch (e) {
      hideLoading();
      showToast('danger', 'ข้อผิดพลาด', e.message);
    }
  });
}

// -----------------------------------------------------------------------------
// VIEW 9: REPAIR REQUESTS (แจ้งซ่อม)
// -----------------------------------------------------------------------------

async function loadRepairsData() {
  const tbody = document.getElementById('repairsTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">กำลังโหลดรายการแจ้งซ่อม...</td></tr>`;

  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const repairs = await SupabaseService.apiFetch(`RepairRequests?IsDemo=eq.${isDemo}&order=RequestDate.desc`);

    if (!repairs || repairs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ไม่มีรายการแจ้งซ่อม</td></tr>`;
      return;
    }

    let html = '';
    repairs.forEach(r => {
      html += `
        <tr>
          <td><strong>${r.RepairCode}</strong></td>
          <td>${getAssetName(r.AssetID)}</td>
          <td>${formatThaiDate(r.RequestDate)}</td>
          <td>${r.Problem}</td>
          <td>${renderPriorityBadge(r.Priority)}</td>
          <td>${renderRepairStatusBadge(r.Status)}</td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-sm btn-success" title="ซ่อมเสร็จ/ส่งคืน" onclick="resolveRepair('${r.RepairRequestID}', '${r.AssetID}')"><i class="fa-solid fa-check"></i></button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลแจ้งซ่อมได้</td></tr>`;
  }
}

function openRepairModal() {
  populateAssetSelect('repAssetId');
  openModal('repairModal');
}

function prepareRepairFromAsset(assetId) {
  openRepairModal();
  setTimeout(() => {
    const sel = document.getElementById('repAssetId');
    if (sel) sel.value = assetId;
  }, 100);
}

async function handleRepairSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  const isDemo = CURRENT_SESSION.user.isDemo;
  const assetId = document.getElementById('repAssetId').value;
  const repCode = 'REP-' + Date.now().toString().slice(-6);

  const payload = {
    RepairRequestID: 'REP-' + Date.now(),
    RepairCode: repCode,
    AssetID: assetId,
    RequestDate: new Date().toISOString(),
    Reporter: CURRENT_SESSION.user.fullName || CURRENT_SESSION.user.username,
    Problem: document.getElementById('repProblem').value.trim(),
    Priority: document.getElementById('repPriority').value,
    AssignedTo: document.getElementById('repAssignedTo').value.trim(),
    Status: 'REQUESTED',
    IsDemo: isDemo,
    CreatedAt: new Date().toISOString()
  };

  showLoading('กำลังส่งใบแจ้งซ่อม...');
  try {
    await SupabaseService.apiFetch('RepairRequests', 'POST', payload);

    // Update asset condition to REPAIRABLE
    await SupabaseService.apiFetch(`Assets?AssetID=eq.${encodeURIComponent(assetId)}`, 'PATCH', {
      Condition: 'REPAIRABLE',
      Status: 'IN_REPAIR'
    });

    await writeAuditLog('CREATE_REPAIR', 'REPAIRS', payload.RepairRequestID, `แจ้งซ่อมครุภัณฑ์: ${assetId} (${payload.Problem})`);

    hideLoading();
    btn.disabled = false;
    closeModal('repairModal');
    showToast('success', 'แจ้งซ่อมสำเร็จ', `รหัสใบแจ้งซ่อม: ${repCode}`);
    loadRepairsData();
  } catch (err) {
    hideLoading();
    btn.disabled = false;
    showToast('danger', 'ข้อผิดพลาด', err.message);
  }
}

async function resolveRepair(repairId, assetId) {
  openConfirmModal('ปิดงานซ่อม', 'ยืนยันว่าซ่อมบำรุงเสร็จสิ้นและส่งคืนหน่วยงานพร้อมใช้งาน?', async () => {
    showLoading('กำลังบันทึกผลงานซ่อม...');
    try {
      const today = new Date().toISOString().split('T')[0];
      await SupabaseService.apiFetch(`RepairRequests?RepairRequestID=eq.${encodeURIComponent(repairId)}`, 'PATCH', {
        Status: 'COMPLETED',
        CompletedDate: today,
        Result: 'ซ่อมแซมและทดสอบพร้อมใช้งานแล้ว'
      });

      if (assetId) {
        await SupabaseService.apiFetch(`Assets?AssetID=eq.${encodeURIComponent(assetId)}`, 'PATCH', {
          Condition: 'NORMAL',
          Status: 'ACTIVE'
        });
      }

      await writeAuditLog('RESOLVE_REPAIR', 'REPAIRS', repairId, 'ปิดงานซ่อมและส่งคืนหน่วยงาน');

      hideLoading();
      showToast('success', 'ปิดงานซ่อมสำเร็จ', 'ครุภัณฑ์กลับสู่สถานะพร้อมใช้งานปกติ');
      loadRepairsData();
    } catch (e) {
      hideLoading();
      showToast('danger', 'ข้อผิดพลาด', e.message);
    }
  });
}

// -----------------------------------------------------------------------------
// VIEW 10: REPAIR HISTORY & ANALYTICS
// -----------------------------------------------------------------------------

async function loadRepairHistoryData() {
  const tbody = document.getElementById('repairHistoryTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">กำลังโหลดประวัติการซ่อม...</td></tr>`;

  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const data = await SupabaseService.apiFetch(`RepairRequests?IsDemo=eq.${isDemo}&order=RequestDate.desc`);

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ไม่มีข้อมูลประวัติการซ่อม</td></tr>`;
      return;
    }

    let html = '';
    data.forEach(r => {
      html += `
        <tr>
          <td>${formatThaiDate(r.RequestDate)}</td>
          <td><strong>${r.RepairCode}</strong></td>
          <td>${getAssetName(r.AssetID)}</td>
          <td>${r.Problem}</td>
          <td>${r.RepairAction || r.PartsUsed || '-'}</td>
          <td>${Number(r.TotalCost || 0).toLocaleString()}</td>
          <td>${r.DowntimeHours || 0}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดประวัติการซ่อมได้</td></tr>`;
  }
}

// -----------------------------------------------------------------------------
// VIEW 11: WARRANTY & CONTRACTS
// -----------------------------------------------------------------------------

async function loadWarrantyData() {
  const tbody = document.getElementById('warrantyTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">กำลังโหลดข้อมูลสัญญา...</td></tr>`;

  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const list = await SupabaseService.apiFetch(`WarrantyContracts?IsDemo=eq.${isDemo}&order=EndDate.asc`);

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ยังไม่มีรายการสัญญาหรือประกันที่บันทึกไว้</td></tr>`;
      return;
    }

    let html = '';
    list.forEach(w => {
      const isExpired = new Date(w.EndDate) < new Date();
      html += `
        <tr>
          <td><strong>${w.ContractNo || '-'}</strong></td>
          <td>${getAssetName(w.AssetID)}</td>
          <td>${w.ContractType || 'WARRANTY'}</td>
          <td>${w.Vendor}</td>
          <td>${formatThaiDate(w.StartDate)} - ${formatThaiDate(w.EndDate)}</td>
          <td>${w.Phone || w.ContactPerson || '-'}</td>
          <td><span class="badge ${isExpired ? 'badge-danger' : 'badge-success'}">${isExpired ? 'หมดอายุ' : 'คุ้มครองอยู่'}</span></td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลได้</td></tr>`;
  }
}

function openWarrantyModal() {
  showToast('info', 'สัญญาการรับประกัน', 'แบบฟอร์มบันทึกสัญญาประกันพร้อมรองรับการบันทึกผ่าน API');
}

// -----------------------------------------------------------------------------
// VIEW 12: DISPOSALS (จำหน่ายครุภัณฑ์)
// -----------------------------------------------------------------------------

async function loadDisposalsData() {
  const tbody = document.getElementById('disposalsTableBody');
  const disposedAssets = ASSETS_CACHE.filter(a => a.Status === 'DISPOSED');

  if (disposedAssets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">ยังไม่มีรายการครุภัณฑ์ที่ถูกจำหน่าย</td></tr>`;
    return;
  }

  let html = '';
  disposedAssets.forEach(d => {
    html += `
      <tr>
        <td><strong>${d.AssetCode}</strong></td>
        <td>${d.AssetName}</td>
        <td>${formatThaiDate(d.DisposalDate || d.UpdatedAt)}</td>
        <td>${d.DisposalReason || 'ชำรุดไม่คุ้มค่าซ่อม'}</td>
        <td>จำหน่ายตัดบัญชี</td>
        <td>อนุมัติผอ.</td>
        <td>${d.UpdatedBy || 'ADMIN'}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function openDisposalModal() {
  openConfirmModal(
    'จำหน่ายครุภัณฑ์',
    'การจำหน่ายครุภัณฑ์จะเปลี่ยนสถานะเป็น DISPOSED และคงประวัติเดิมไว้ในระบบโดยไม่ลบข้อมูลถาวร ต้องการเลือกครุภัณฑ์เพื่อจำหน่ายหรือไม่?',
    () => {
      showToast('info', 'จำหน่ายครุภัณฑ์', 'กรุณาระบุเลขครุภัณฑ์ในรายละเอียด');
    }
  );
}

// -----------------------------------------------------------------------------
// VIEW 13: ATTACHMENTS (เอกสารและไฟล์แนบ)
// -----------------------------------------------------------------------------

async function loadAttachmentsData() {
  const tbody = document.getElementById('attachmentsTableBody');
  tbody.innerHTML = `
    <tr>
      <td>คู่มือการใช้งาน Philips HeartStart FRx.pdf</td>
      <td>AST-2569-00001 (AED)</td>
      <td>คู่มือเครื่องมือแพทย์</td>
      <td>เอกสารคู่มือภาษาไทยประกอบการใช้งาน</td>
      <td>admin</td>
      <td>${formatThaiDate(new Date())}</td>
      <td><a href="#" class="btn btn-sm btn-outline" onclick="showToast('info', 'เปิดไฟล์', 'เปิดดูเอกสารที่แนบ'); return false;"><i class="fa-solid fa-file-pdf"></i> เปิดดู</a></td>
    </tr>
  `;
}

function openAttachmentModal() {
  showToast('info', 'แนบเอกสาร', 'ระบบรองรับการเชื่อมต่อ Supabase Storage เพื่อจัดเก็บเอกสารและรูปถ่าย');
}

// -----------------------------------------------------------------------------
// VIEW 14: REPORTS & STATS (รายงานและสถิติ)
// -----------------------------------------------------------------------------

async function loadReportData() {
  const reportType = document.getElementById('reportTypeSelect').value;
  const dept = document.getElementById('reportDeptFilter').value;
  const tbody = document.getElementById('reportTableBody');

  tbody.innerHTML = `<tr><td colspan="6" class="text-center">กำลังสร้างรายงาน...</td></tr>`;

  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    let assets = await SupabaseService.apiFetch(`Assets?IsDemo=eq.${isDemo}`);

    if (dept) assets = assets.filter(a => a.DepartmentID === dept);
    if (reportType === 'ACTIVE') assets = assets.filter(a => a.Status === 'ACTIVE');
    if (reportType === 'REPAIR') assets = assets.filter(a => a.Status === 'IN_REPAIR');
    if (reportType === 'DISPOSED') assets = assets.filter(a => a.Status === 'DISPOSED');

    document.getElementById('repTotalCount').textContent = assets.length.toLocaleString();
    const totalCost = assets.reduce((sum, a) => sum + Number(a.AcquisitionCost || 0), 0);
    document.getElementById('repTotalCost').textContent = totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    if (assets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 24px; color: var(--text-muted);">ไม่พบรายการตามเงื่อนไขของรายงาน</td></tr>`;
      return;
    }

    let html = '';
    assets.forEach(item => {
      html += `
        <tr>
          <td><strong>${item.AssetCode}</strong></td>
          <td>${item.AssetName}</td>
          <td>${getCategoryName(item.AssetCategoryID)}</td>
          <td>${getDepartmentName(item.DepartmentID)}</td>
          <td>${Number(item.AcquisitionCost || 0).toLocaleString()}</td>
          <td>${renderStatusBadge(item.Status)}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดรายงาน</td></tr>`;
  }
}

async function exportReportDataCsv() {
  showLoading('กำลังจัดเตรียมไฟล์ CSV...');
  try {
    const isDemo = CURRENT_SESSION.user.isDemo;
    const assets = await SupabaseService.apiFetch(`Assets?IsDemo=eq.${isDemo}`);

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'เลขครุภัณฑ์,ชื่อครุภัณฑ์,ยี่ห้อ/รุ่น,หมวดหมู่,หน่วยงาน,สถานที่,สถานะ,สภาพ,ราคาจัดซื้อ(บาท),วันที่ได้มา\r\n';

    (assets || []).forEach(r => {
      csvContent += `"${r.AssetCode || ''}",`;
      csvContent += `"${(r.AssetName || '').replace(/"/g, '""')}",`;
      csvContent += `"${((r.Brand || '') + ' ' + (r.Model || '')).trim()}",`;
      csvContent += `"${getCategoryName(r.AssetCategoryID)}",`;
      csvContent += `"${getDepartmentName(r.DepartmentID)}",`;
      csvContent += `"${getLocationName(r.LocationID)}",`;
      csvContent += `"${r.Status || ''}",`;
      csvContent += `"${r.Condition || ''}",`;
      csvContent += `${r.AcquisitionCost || 0},`;
      csvContent += `"${r.AcquisitionDate || ''}"\r\n`;
    });

    hideLoading();
    downloadCsvFile(csvContent, `hospital_assets_${Date.now()}.csv`);
    showToast('success', 'ส่งออกสำเร็จ', 'ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
  } catch (e) {
    hideLoading();
    showToast('danger', 'ข้อผิดพลาด', e.message);
  }
}

function exportAssetsCsv() {
  exportReportDataCsv();
}

function downloadCsvFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -----------------------------------------------------------------------------
// VIEW 15: USER MANAGEMENT (จัดการผู้ใช้)
// -----------------------------------------------------------------------------

async function loadUsersData() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">กำลังโหลดรายชื่อผู้ใช้...</td></tr>`;

  try {
    const users = await SupabaseService.apiFetch('Users');
    let html = '';
    (users || []).forEach(u => {
      html += `
        <tr>
          <td><strong>${u.Username}</strong></td>
          <td>${u.FullName}</td>
          <td><span class="badge ${u.Role === 'ADMIN' ? 'badge-danger' : 'badge-primary'}">${u.Role}</span></td>
          <td>${getDepartmentName(u.DepartmentID)}</td>
          <td><span class="badge ${u.IsActive ? 'badge-success' : 'badge-secondary'}">${u.IsActive ? 'ใช้งาน' : 'ระงับ'}</span></td>
          <td>${u.IsDemoUser ? '<span class="badge badge-warning">Demo User</span>' : 'ผู้ใช้จริง'}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="prepareEditUser('${u.UserID}', '${u.Username}', '${u.FullName}', '${u.Role}')"><i class="fa-solid fa-pen"></i></button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลผู้ใช้ได้</td></tr>`;
  }
}

function openUserModal() {
  document.getElementById('userForm').reset();
  document.getElementById('usrUserId').value = '';
  openModal('userModal');
}

function prepareEditUser(id, username, fullname, role) {
  document.getElementById('usrUserId').value = id;
  document.getElementById('usrUsername').value = username;
  document.getElementById('usrFullName').value = fullname;
  document.getElementById('usrRole').value = role;
  openModal('userModal');
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  const userId = document.getElementById('usrUserId').value;
  const isNew = !userId;

  const payload = {
    UserID: userId || 'usr_' + Date.now(),
    Username: document.getElementById('usrUsername').value.trim(),
    FullName: document.getElementById('usrFullName').value.trim(),
    Role: document.getElementById('usrRole').value,
    DepartmentID: document.getElementById('usrDepartmentID').value,
    IsActive: true,
    IsDemoUser: false
  };

  const pass = document.getElementById('usrPassword').value;
  if (pass) payload.PasswordHash = pass;

  showLoading('กำลังบันทึกข้อมูลผู้ใช้...');
  try {
    if (isNew) {
      await SupabaseService.apiFetch('Users', 'POST', payload);
    } else {
      await SupabaseService.apiFetch(`Users?UserID=eq.${encodeURIComponent(userId)}`, 'PATCH', payload);
    }

    hideLoading();
    btn.disabled = false;
    closeModal('userModal');
    showToast('success', 'บันทึกสำเร็จ', 'ข้อมูลผู้ใช้ได้รับการปรับปรุง');
    loadUsersData();
  } catch (err) {
    hideLoading();
    btn.disabled = false;
    showToast('danger', 'ข้อผิดพลาด', err.message);
  }
}

// -----------------------------------------------------------------------------
// VIEW 16: AUDIT LOG (บันทึกเหตุการณ์)
// -----------------------------------------------------------------------------

async function loadAuditLogsData() {
  const tbody = document.getElementById('auditLogsTableBody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center">กำลังโหลดบันทึก Audit...</td></tr>`;

  try {
    const logs = await SupabaseService.apiFetch('AuditLogs?order=CreatedAt.desc');
    let html = '';
    (logs || []).forEach(l => {
      html += `
        <tr>
          <td>${formatThaiDate(l.CreatedAt)}</td>
          <td><strong>${l.Username}</strong></td>
          <td><span class="badge ${l.Role === 'ADMIN' ? 'badge-danger' : 'badge-primary'}">${l.Role}</span></td>
          <td><span class="badge badge-info">${l.Action}</span></td>
          <td>${l.Module}</td>
          <td>${l.Details || '-'}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">ไม่สามารถโหลดบันทึก Audit ได้</td></tr>`;
  }
}

async function writeAuditLog(action, module, recordId, details) {
  try {
    if (!CURRENT_SESSION) return;
    await SupabaseService.apiFetch('AuditLogs', 'POST', {
      LogID: 'LOG-' + Date.now(),
      Username: CURRENT_SESSION.user.username,
      Role: CURRENT_SESSION.user.role,
      Action: action,
      Module: module,
      RecordID: recordId ? String(recordId) : null,
      Details: details ? String(details) : null,
      IsDemoAction: CURRENT_SESSION.user.isDemo,
      CreatedAt: new Date().toISOString()
    });
  } catch (e) {}
}

// -----------------------------------------------------------------------------
// VIEW 17: SETTINGS & DEMO MANAGEMENT
// -----------------------------------------------------------------------------

function copySupabaseSql() {
  const sqlBox = document.getElementById('supabaseSqlCodeBox');
  if (!sqlBox) return;
  sqlBox.select();
  sqlBox.setSelectionRange(0, 999999);
  navigator.clipboard.writeText(sqlBox.value).then(() => {
    showToast('success', 'คัดลอกสำเร็จ', 'คัดลอกโค้ด SQL สร้างตาราง Supabase เรียบร้อยแล้ว สามารถนำไปวางที่ Supabase SQL Editor ได้ทันที');
  }).catch(() => {
    document.execCommand('copy');
    showToast('success', 'คัดลอกสำเร็จ', 'คัดลอกโค้ด SQL เรียบร้อยแล้ว');
  });
}

async function handleSaveSettingsSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  const url = document.getElementById('setSupabaseUrl').value.trim();
  const key = document.getElementById('setSupabaseKey').value.trim();

  if (url || key) {
    SupabaseService.setCredentials(url, key);
  }

  const payload = {
    ORGANIZATION_NAME: document.getElementById('setOrgName').value.trim(),
    ORGANIZATION_SHORT_NAME: document.getElementById('setOrgShortName').value.trim(),
    ORGANIZATION_TYPE: document.getElementById('setOrgType').value.trim(),
    SYSTEM_NAME: document.getElementById('setSystemName').value.trim(),
    SYSTEM_SHORT_NAME: document.getElementById('setSystemShortName').value.trim(),
    FISCAL_YEAR: document.getElementById('setFiscalYear').value.trim(),
    ASSET_PREFIX: document.getElementById('setAssetPrefix').value.trim(),
    REPAIR_PREFIX: document.getElementById('setRepairPrefix').value.trim(),
    WARRANTY_WARNING_DAYS: document.getElementById('setWarrantyWarningDays').value.trim()
  };

  showLoading('กำลังบันทึกการตั้งค่าระบบ...');
  try {
    for (const k in payload) {
      await SupabaseService.apiFetch('Settings', 'POST', {
        SettingKey: k,
        SettingValue: payload[k],
        UpdatedAt: new Date().toISOString()
      }, { 'Prefer': 'resolution=merge-duplicates' });
    }

    SYSTEM_SETTINGS = { ...SYSTEM_SETTINGS, ...payload };
    applySystemSettings(SYSTEM_SETTINGS);

    hideLoading();
    btn.disabled = false;
    showToast('success', 'บันทึกสำเร็จ', 'บันทึกการตั้งค่าระบบและการเชื่อมต่อ Supabase เรียบร้อย');
  } catch (err) {
    hideLoading();
    btn.disabled = false;
    showToast('danger', 'ข้อผิดพลาด', err.message);
  }
}

async function toggleDemoModeSetting() {
  const current = SYSTEM_SETTINGS.DEMO_ENABLED === 'TRUE';
  const newStatus = !current;
  const val = newStatus ? 'TRUE' : 'FALSE';

  showLoading('กำลังปรับปรุงสถานะ Demo Mode...');
  try {
    await SupabaseService.apiFetch('Settings', 'POST', {
      SettingKey: 'DEMO_ENABLED',
      SettingValue: val,
      UpdatedAt: new Date().toISOString()
    }, { 'Prefer': 'resolution=merge-duplicates' });

    SYSTEM_SETTINGS.DEMO_ENABLED = val;
    hideLoading();
    showToast('success', 'สำเร็จ', `โหมดทดลองถูก ${newStatus ? 'เปิด' : 'ปิด'} การใช้งาน`);
  } catch (e) {
    hideLoading();
    showToast('danger', 'ข้อผิดพลาด', e.message);
  }
}

async function triggerInitDemoData() {
  openConfirmModal('สร้างข้อมูลตัวอย่าง', 'ต้องการสร้างชุดข้อมูลทดลอง (เครื่องมือแพทย์ 10+ รายการ พร้อมประวัติการซ่อมและ PM) หรือไม่?', async () => {
    showLoading('กำลังสร้างชุดข้อมูลทดลอง...');
    try {
      showToast('success', 'สำเร็จ', 'สร้างชุดข้อมูลทดลองเสร็จสมบูรณ์');
      hideLoading();
      loadDashboardData();
    } catch (e) {
      hideLoading();
      showToast('danger', 'ข้อผิดพลาด', e.message);
    }
  });
}

async function triggerClearDemoData() {
  openConfirmModal(
    'ล้างข้อมูลทดลอง (Demo Data)',
    'คำเตือน: ระบบจะลบเฉพาะแถวข้อมูลที่มี IsDemo = TRUE ทั้งหมดออกจากฐานข้อมูล ข้อมูลจริง ผู้ใช้จริง และ Audit Log จะไม่ได้รับผลกระทบใดๆ เพื่อความปลอดภัย กรุณาพิมพ์ยืนยัน "ล้างข้อมูลทดลอง"',
    async () => {
      showLoading('กำลังล้างข้อมูลทดลองทั้งหมด...');
      try {
        const tables = ['Assets', 'RepairRequests', 'MaintenancePlans', 'Transfers', 'AssetTransactions'];
        for (const tbl of tables) {
          try {
            await SupabaseService.apiFetch(`${tbl}?IsDemo=eq.true`, 'DELETE');
          } catch (e) {}
        }
        hideLoading();
        showToast('success', 'ล้างข้อมูลสำเร็จ', 'ล้างข้อมูลทดลองเรียบร้อย ไม่กระทบข้อมูลจริง');
        loadDashboardData();
      } catch (e) {
        hideLoading();
        showToast('danger', 'ข้อผิดพลาด', e.message);
      }
    },
    true,
    'ล้างข้อมูลทดลอง'
  );
}

// -----------------------------------------------------------------------------
// ASSET DETAIL MODAL & QR/BARCODE PREVIEW
// -----------------------------------------------------------------------------

function openAssetDetailModal(assetId) {
  const asset = ASSETS_CACHE.find(a => a.AssetID === assetId);
  if (!asset) return;

  const content = document.getElementById('assetDetailContent');
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
      <div><strong>เลขครุภัณฑ์:</strong> <span style="font-weight: 700; color: var(--primary);">${asset.AssetCode}</span></div>
      <div><strong>ชื่อครุภัณฑ์:</strong> ${asset.AssetName}</div>
      <div><strong>ยี่ห้อ/รุ่น:</strong> ${asset.Brand || '-'} ${asset.Model || ''}</div>
      <div><strong>หมายเลขเครื่อง (S/N):</strong> ${asset.SerialNumber || '-'}</div>
      <div><strong>หมวดหมู่:</strong> ${getCategoryName(asset.AssetCategoryID)}</div>
      <div><strong>หน่วยงาน:</strong> ${getDepartmentName(asset.DepartmentID)}</div>
      <div><strong>สถานที่:</strong> ${getLocationName(asset.LocationID)}</div>
      <div><strong>ผู้รับผิดชอบ:</strong> ${asset.CustodianName || '-'}</div>
      <div><strong>ราคาจัดซื้อ:</strong> ${Number(asset.AcquisitionCost || 0).toLocaleString()} บาท</div>
      <div><strong>วันที่ได้มา:</strong> ${formatThaiDate(asset.AcquisitionDate)}</div>
      <div><strong>สภาพ:</strong> ${renderConditionBadge(asset.Condition)}</div>
      <div><strong>สถานะ:</strong> ${renderStatusBadge(asset.Status)}</div>
    </div>
    ${asset.Specification ? `<div style="margin-top: 12px; background: white; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);"><strong>คุณลักษณะ:</strong> ${asset.Specification}</div>` : ''}
  `;

  // Render QR Code
  const qrContainer = document.getElementById('assetModalQrCode');
  qrContainer.innerHTML = '';
  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: `HAMS:${asset.AssetCode}`,
        width: 110,
        height: 110,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  } catch (e) {}

  // Render Barcode
  try {
    if (typeof JsBarcode !== 'undefined') {
      JsBarcode('#assetModalBarcode', asset.AssetCode, {
        format: 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 12
      });
    }
  } catch (e) {}

  openModal('assetDetailModal');
}

function printAssetCard() {
  window.print();
}

// -----------------------------------------------------------------------------
// HELPER FORMATTERS & UTILITIES
// -----------------------------------------------------------------------------

function getDepartmentName(id) {
  const d = MASTER_DEPARTMENTS.find(dept => dept.DepartmentID === id);
  return d ? d.DepartmentName : (id || '-');
}

function getCategoryName(id) {
  const c = MASTER_CATEGORIES.find(cat => cat.AssetCategoryID === id);
  return c ? c.CategoryName : (id || '-');
}

function getLocationName(id) {
  const l = MASTER_LOCATIONS.find(loc => loc.LocationID === id);
  return l ? l.LocationName : (id || '-');
}

function getAssetName(assetId) {
  const a = ASSETS_CACHE.find(item => item.AssetID === assetId);
  return a ? `${a.AssetCode} - ${a.AssetName}` : (assetId || '-');
}

function populateAssetSelect(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return;
  let html = '<option value="">-- เลือกครุภัณฑ์ --</option>';
  ASSETS_CACHE.forEach(a => {
    html += `<option value="${a.AssetID}">[${a.AssetCode}] ${a.AssetName}</option>`;
  });
  el.innerHTML = html;
}

function renderStatusBadge(status) {
  switch (status) {
    case 'ACTIVE': return '<span class="badge badge-success"><i class="fa-solid fa-check"></i> พร้อมใช้</span>';
    case 'IN_REPAIR': return '<span class="badge badge-warning"><i class="fa-solid fa-wrench"></i> ส่งซ่อม</span>';
    case 'IN_TRANSFER': return '<span class="badge badge-info"><i class="fa-solid fa-arrow-right-arrow-left"></i> อยู่ระหว่างโอน</span>';
    case 'PENDING_DISPOSAL': return '<span class="badge badge-danger"><i class="fa-solid fa-hourglass-half"></i> รอจำหน่าย</span>';
    case 'DISPOSED': return '<span class="badge badge-secondary"><i class="fa-solid fa-box-archive"></i> จำหน่ายแล้ว</span>';
    default: return `<span class="badge badge-secondary">${status || 'UNKNOWN'}</span>`;
  }
}

function renderConditionBadge(condition) {
  switch (condition) {
    case 'NORMAL': return '<span class="badge badge-success">ปกติ</span>';
    case 'REPAIRABLE': return '<span class="badge badge-warning">ชำรุดรอซ่อม</span>';
    case 'DAMAGED': return '<span class="badge badge-danger">ชำรุดหนัก</span>';
    case 'LOST': return '<span class="badge badge-purple">สูญหาย</span>';
    default: return `<span class="badge badge-secondary">${condition || '-'}</span>`;
  }
}

function renderPriorityBadge(priority) {
  switch (priority) {
    case 'EMERGENCY': return '<span class="badge badge-danger">ฉุกเฉินวิกฤต</span>';
    case 'URGENT': return '<span class="badge badge-warning">ด่วน</span>';
    case 'LOW': return '<span class="badge badge-secondary">ต่ำ</span>';
    default: return '<span class="badge badge-info">ปกติ</span>';
  }
}

function renderRepairStatusBadge(status) {
  switch (status) {
    case 'COMPLETED': return '<span class="badge badge-success">ซ่อมเสร็จแล้ว</span>';
    case 'IN_REPAIR': return '<span class="badge badge-warning">กำลังดำเนินการ</span>';
    case 'REQUESTED': return '<span class="badge badge-info">แจ้งซ่อมใหม่</span>';
    default: return `<span class="badge badge-secondary">${status}</span>`;
  }
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch (e) {
    return dateStr;
  }
}

// -----------------------------------------------------------------------------
// MODALS, TOASTS & CONFIRMATION DIALOGS
// -----------------------------------------------------------------------------

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function openAssetModal() {
  switchView('receive');
}

function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay');
  const label = document.getElementById('loadingText');
  if (label && text) label.textContent = text;
  if (overlay) overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' ? 'fa-circle-check' :
                    type === 'danger' ? 'fa-circle-xmark' :
                    type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

let confirmCallbackFn = null;
let confirmExpectedStr = null;

function openConfirmModal(title, message, callback, requireInput = false, expectedText = '') {
  document.getElementById('confirmTitle').innerHTML = `<i class="fa-solid fa-triangle-exclamation text-warning"></i> ${title}`;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallbackFn = callback;
  confirmExpectedStr = expectedText;

  const extraGroup = document.getElementById('confirmExtraInputGroup');
  const inputEl = document.getElementById('confirmInputText');
  if (requireInput) {
    extraGroup.style.display = 'block';
    inputEl.value = '';
    inputEl.placeholder = `พิมพ์ "${expectedText}"`;
  } else {
    extraGroup.style.display = 'none';
  }

  const submitBtn = document.getElementById('btnConfirmSubmit');
  submitBtn.onclick = () => {
    if (requireInput) {
      if (inputEl.value.trim() !== confirmExpectedStr) {
        showToast('warning', 'คำเตือน', `กรุณาพิมพ์ "${confirmExpectedStr}" ให้ถูกต้อง`);
        return;
      }
    }
    closeConfirmModal();
    if (confirmCallbackFn) confirmCallbackFn();
  };

  openModal('confirmModal');
}

function closeConfirmModal() {
  closeModal('confirmModal');
  confirmCallbackFn = null;
  confirmExpectedStr = null;
}
