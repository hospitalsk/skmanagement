/**
 * ==============================================================================
 * HOSPITAL ASSET MANAGEMENT SYSTEM - SUPABASE REST API SERVICE LAYER
 * For GitHub / Web-native Deployment
 * ==============================================================================
 */

const SupabaseService = (() => {
  const STORAGE_KEY_URL = 'HAMS_SUPABASE_URL';
  const STORAGE_KEY_KEY = 'HAMS_SUPABASE_KEY';

  function getCredentials() {
    const url = localStorage.getItem(STORAGE_KEY_URL) || '';
    const key = localStorage.getItem(STORAGE_KEY_KEY) || '';
    return { url: url.replace(/\/+$/, ''), key: key };
  }

  function setCredentials(url, key) {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim().replace(/\/+$/, ''));
    if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  }

  function isConfigured() {
    const creds = getCredentials();
    return Boolean(creds.url && creds.key);
  }

  async function apiFetch(endpoint, method = 'GET', body = null, extraHeaders = {}) {
    const creds = getCredentials();
    if (!creds.url || !creds.key) {
      // If not configured, use local fallback database
      return fallbackMockHandler(endpoint, method, body);
    }

    const url = `${creds.url}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': creds.key,
      'Authorization': `Bearer ${creds.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extraHeaders
    };

    const options = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase Error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local dataset:', err.message);
      return fallbackMockHandler(endpoint, method, body);
    }
  }

  // ---------------------------------------------------------------------------
  // IN-MEMORY / LOCAL DATABASE ENGINE (OFFLINE & DEMO RESILIENT)
  // ---------------------------------------------------------------------------
  let localDb = null;

  function getLocalDb() {
    if (!localDb) {
      localDb = {
        users: [
          { UserID: 'usr_admin_001', Username: 'admin', PasswordHash: '1234', FullName: 'ผู้ดูแลระบบสูงสุด (Admin)', Role: 'ADMIN', DepartmentID: 'DEP-ADM', IsActive: true, IsDemoUser: false },
          { UserID: 'usr_demo_001', Username: 'demo', PasswordHash: '1234', FullName: 'ผู้ใช้งานโหมดทดลอง (Demo User)', Role: 'DEMO', DepartmentID: 'DEP-OPD', IsActive: true, IsDemoUser: true },
          { UserID: 'usr_mgr_001', Username: 'asset_mgr', PasswordHash: '1234', FullName: 'น.ส.วิภาดา งานพัสดุ', Role: 'ASSET_MANAGER', DepartmentID: 'DEP-SUP', IsActive: true, IsDemoUser: false },
          { UserID: 'usr_tech_001', Username: 'technician', PasswordHash: '1234', FullName: 'นายสมเกียรติ ช่างซ่อมบำรุง', Role: 'MAINTENANCE', DepartmentID: 'DEP-ENG', IsActive: true, IsDemoUser: false },
          { UserID: 'usr_dept_001', Username: 'nurse_opd', PasswordHash: '1234', FullName: 'พว.สุดารัตน์ พยาบาลวิชาชีพ', Role: 'DEPARTMENT', DepartmentID: 'DEP-OPD', IsActive: true, IsDemoUser: false },
          { UserID: 'usr_view_001', Username: 'director_view', PasswordHash: '1234', FullName: 'นพ.ผู้อำนวยการ (ดูรายงาน)', Role: 'VIEWER', DepartmentID: 'DEP-ADM', IsActive: true, IsDemoUser: false }
        ],
        settings: {
          ORGANIZATION_NAME: 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านสวนสมบูรณ์',
          ORGANIZATION_SHORT_NAME: 'รพ.สต.บ้านสวนสมบูรณ์',
          ORGANIZATION_TYPE: 'โรงพยาบาลส่งเสริมสุขภาพตำบล',
          SYSTEM_NAME: 'ระบบจัดการครุภัณฑ์และเครื่องมือแพทย์',
          SYSTEM_SHORT_NAME: 'H-AMS',
          ADMIN_NAME: 'นายแพทย์ประสิทธิ์ สุขเกษม',
          ADMIN_POSITION: 'ผู้อำนวยการโรงพยาบาล',
          ORGANIZATION_ADDRESS: 'เลขที่ 99 หมู่ 4 ต.บ้านสวน อ.เมือง จ.ชลบุรี 20000',
          ORGANIZATION_PHONE: '038-123456',
          ORGANIZATION_EMAIL: 'contact@baansuanhospital.go.th',
          FISCAL_YEAR: '2569',
          ASSET_PREFIX: 'AST-',
          TRANSFER_PREFIX: 'TRF-',
          REPAIR_PREFIX: 'REP-',
          INSPECTION_PREFIX: 'INS-',
          DISPOSAL_PREFIX: 'DSP-',
          MAINTENANCE_PREFIX: 'PM-',
          WARRANTY_WARNING_DAYS: '30',
          PM_WARNING_DAYS: '15',
          LOW_VALUE_THRESHOLD: '10000',
          DEMO_ENABLED: 'TRUE',
          SHOW_LOGO: 'TRUE',
          PRINT_HEADER_TEXT: 'แบบฟอร์มครุภัณฑ์ราชการ - รพ.สต.บ้านสวนสมบูรณ์',
          PRINT_FOOTER_TEXT: 'เอกสารควบคุมภายในระบบจัดการครุภัณฑ์อิเล็กทรอนิกส์'
        },
        departments: [
          { DepartmentID: 'DEP-ADM', DepartmentCode: 'ADM', DepartmentName: 'ฝ่ายบริหารงานทั่วไปและยุทธศาสตร์', Building: 'อาคารอำนวยการ', Floor: 'ชั้น 2' },
          { DepartmentID: 'DEP-OPD', DepartmentCode: 'OPD', DepartmentName: 'แผนกผู้ป่วยนอก (OPD)', Building: 'อาคารผู้ป่วยนอก', Floor: 'ชั้น 1' },
          { DepartmentID: 'DEP-ER', DepartmentCode: 'ER', DepartmentName: 'แผนกอุบัติเหตุและฉุกเฉิน (ER)', Building: 'อาคารผู้ป่วยนอก', Floor: 'ชั้น 1' },
          { DepartmentID: 'DEP-IPD', DepartmentCode: 'IPD', DepartmentName: 'หอผู้ป่วยใน (IPD)', Building: 'อาคารเฉลิมพระเกียรติ', Floor: 'ชั้น 3' },
          { DepartmentID: 'DEP-DENT', DepartmentCode: 'DENT', DepartmentName: 'กลุ่มงานทันตกรรม', Building: 'อาคารผู้ป่วยนอก', Floor: 'ชั้น 2' },
          { DepartmentID: 'DEP-LAB', DepartmentCode: 'LAB', DepartmentName: 'กลุ่มงานเทคนิคการแพทย์ (ชันสูตร)', Building: 'อาคารผู้ป่วยนอก', Floor: 'ชั้น 2' },
          { DepartmentID: 'DEP-ENG', DepartmentCode: 'ENG', DepartmentName: 'หน่วยซ่อมบำรุงและวิศวกรรมการแพทย์', Building: 'อาคารสนับสนุน', Floor: 'ชั้น 1' },
          { DepartmentID: 'DEP-SUP', DepartmentCode: 'SUP', DepartmentName: 'งานพัสดุและคลังครุภัณฑ์', Building: 'อาคารอำนวยการ', Floor: 'ชั้น 1' }
        ],
        locations: [
          { LocationID: 'LOC-OPD-01', LocationName: 'ห้องตรวจอายุรกรรม 1', DepartmentID: 'DEP-OPD', RoomNumber: '101' },
          { LocationID: 'LOC-OPD-02', LocationName: 'เคาน์เตอร์พยาบาลคัดกรอง OPD', DepartmentID: 'DEP-OPD', RoomNumber: '100' },
          { LocationID: 'LOC-ER-01', LocationName: 'ห้องช่วยฟื้นคืนชีพ (Resuscitation)', DepartmentID: 'DEP-ER', RoomNumber: 'ER-01' },
          { LocationID: 'LOC-ER-02', LocationName: 'ห้องทำแผลและผ่าตัดเล็ก', DepartmentID: 'DEP-ER', RoomNumber: 'ER-02' },
          { LocationID: 'LOC-IPD-01', LocationName: 'วอร์ดผู้ป่วยสามัญชาย-หญิง', DepartmentID: 'DEP-IPD', RoomNumber: '301' },
          { LocationID: 'LOC-DENT-01', LocationName: 'ห้องตรวจทันตกรรม ยูนิต 1-2', DepartmentID: 'DEP-DENT', RoomNumber: '201' },
          { LocationID: 'LOC-LAB-01', LocationName: 'ห้องตรวจวิเคราะห์โลหิตและเคมีคลินิก', DepartmentID: 'DEP-LAB', RoomNumber: '205' },
          { LocationID: 'LOC-ENG-01', LocationName: 'ห้องปฏิบัติการสอบเทียบและซ่อมบำรุง', DepartmentID: 'DEP-ENG', RoomNumber: 'B-01' }
        ],
        categories: [
          { AssetCategoryID: 'CAT-MED-01', CategoryCode: 'MED-LIFE', CategoryName: 'ครุภัณฑ์การแพทย์ช่วยชีวิตและวิกฤต', UsefulLifeYears: 5 },
          { AssetCategoryID: 'CAT-MED-02', CategoryCode: 'MED-DIAG', CategoryName: 'ครุภัณฑ์การแพทย์ตรวจวินิจฉัยและรักษา', UsefulLifeYears: 7 },
          { AssetCategoryID: 'CAT-MED-03', CategoryCode: 'MED-DENT', CategoryName: 'ครุภัณฑ์ทันตกรรม', UsefulLifeYears: 8 },
          { AssetCategoryID: 'CAT-MED-04', CategoryCode: 'MED-LAB', CategoryName: 'ครุภัณฑ์วิทยาศาสตร์และการแพทย์ชันสูตร', UsefulLifeYears: 7 },
          { AssetCategoryID: 'CAT-COM-01', CategoryCode: 'COM-SRV', CategoryName: 'ครุภัณฑ์คอมพิวเตอร์และแม่ข่าย', UsefulLifeYears: 3 },
          { AssetCategoryID: 'CAT-COM-02', CategoryCode: 'COM-PC', CategoryName: 'เครื่องคอมพิวเตอร์ลูกข่ายและอุปกรณ์ต่อพ่วง', UsefulLifeYears: 3 },
          { AssetCategoryID: 'CAT-OFF-01', CategoryCode: 'OFF-GEN', CategoryName: 'ครุภัณฑ์สำนักงานและเฟอร์นิเจอร์', UsefulLifeYears: 5 },
          { AssetCategoryID: 'CAT-VEH-01', CategoryCode: 'VEH-EMS', CategoryName: 'ครุภัณฑ์ยานพาหนะและรถพยาบาลฉุกเฉิน', UsefulLifeYears: 8 }
        ],
        assets: [
          {
            AssetID: 'DEMO-AST-001',
            AssetCode: 'AST-2569-00001',
            SerialNumber: 'DEF-SN-89011',
            Barcode: '885000100001',
            QRCode: 'QR-AST-00001',
            AssetName: 'เครื่องกระตุกหัวใจด้วยไฟฟ้าอัตโนมัติ (AED)',
            AssetCategoryID: 'CAT-MED-01',
            Brand: 'Philips',
            Model: 'HeartStart FRx',
            Specification: 'เครื่องกระตุกหัวใจแบบไบเฟสิกพร้อมแบตเตอรี่สำรองและแผ่นนำไฟฟ้า',
            Unit: 'เครื่อง',
            Quantity: 1,
            AcquisitionDate: '2024-10-15',
            AcquisitionMethod: 'ซื้อ',
            Vendor: 'บริษัท เมดิคอลโปรเกรส จำกัด',
            AcquisitionCost: 95000.00,
            CurrentValue: 76000.00,
            DepartmentID: 'DEP-ER',
            LocationID: 'LOC-ER-01',
            CustodianName: 'พว.มนัส ชัยชนะ',
            Condition: 'NORMAL',
            Status: 'ACTIVE',
            RiskLevel: 'CRITICAL',
            Criticality: 'LIFE_SUPPORT',
            LastInspectionDate: '2026-09-01',
            NextInspectionDate: '2027-03-01',
            LastPMDate: '2026-08-15',
            NextPMDate: '2027-02-15',
            IsDemo: true
          },
          {
            AssetID: 'DEMO-AST-002',
            AssetCode: 'AST-2569-00002',
            SerialNumber: 'MON-883210-TH',
            Barcode: '885000100002',
            QRCode: 'QR-AST-00002',
            AssetName: 'เครื่องติดตามการทำงานของหัวใจและสัญญาณชีพ (Patient Monitor)',
            AssetCategoryID: 'CAT-MED-01',
            Brand: 'Mindray',
            Model: 'ePM 12M',
            Specification: 'จอสัมผัส 12.1 นิ้ว วัด ECG, SpO2, NIBP, Temp, Resp',
            Unit: 'เครื่อง',
            Quantity: 1,
            AcquisitionDate: '2024-11-20',
            AcquisitionMethod: 'ซื้อ',
            Vendor: 'บริษัท อุปกรณ์การแพทย์สยาม จำกัด',
            AcquisitionCost: 145000.00,
            CurrentValue: 116000.00,
            DepartmentID: 'DEP-ER',
            LocationID: 'LOC-ER-01',
            CustodianName: 'พว.มนัส ชัยชนะ',
            Condition: 'NORMAL',
            Status: 'ACTIVE',
            RiskLevel: 'HIGH',
            Criticality: 'LIFE_SUPPORT',
            LastInspectionDate: '2026-08-20',
            NextInspectionDate: '2027-02-20',
            LastPMDate: '2026-08-20',
            NextPMDate: '2027-02-20',
            IsDemo: true
          },
          {
            AssetID: 'DEMO-AST-003',
            AssetCode: 'AST-2569-00003',
            SerialNumber: 'INF-PUMP-4421',
            Barcode: '885000100003',
            QRCode: 'QR-AST-00003',
            AssetName: 'เครื่องให้สารละลายทางหลอดเลือดดำ (Infusion Pump)',
            AssetCategoryID: 'CAT-MED-01',
            Brand: 'Terumo',
            Model: 'TE-LM700',
            Specification: 'ควบคุมอัตราการให้สารละลาย 0.1-1200 mL/h',
            Unit: 'เครื่อง',
            Quantity: 1,
            AcquisitionDate: '2025-01-10',
            AcquisitionMethod: 'ซื้อ',
            Vendor: 'บจก. เทอรูโม เฮลธ์แคร์',
            AcquisitionCost: 52000.00,
            CurrentValue: 41600.00,
            DepartmentID: 'DEP-IPD',
            LocationID: 'LOC-IPD-01',
            CustodianName: 'พว.อรุณี ศรีสุข',
            Condition: 'NORMAL',
            Status: 'ACTIVE',
            RiskLevel: 'HIGH',
            Criticality: 'DIAGNOSTIC',
            IsDemo: true
          },
          {
            AssetID: 'DEMO-AST-004',
            AssetCode: 'AST-2569-00004',
            SerialNumber: 'ECG-12C-5542',
            Barcode: '885000100004',
            QRCode: 'QR-AST-00004',
            AssetName: 'เครื่องตรวจคลื่นไฟฟ้าหัวใจ 12 ลีด (12-Lead ECG)',
            AssetCategoryID: 'CAT-MED-02',
            Brand: 'Nihon Kohden',
            Model: 'ECG-2350',
            Specification: 'เครื่องตรวจ ECG 12 ลีด พร้อมซอฟต์แวร์แปลผลอัตโนมัติ',
            Unit: 'เครื่อง',
            Quantity: 1,
            AcquisitionDate: '2023-08-15',
            AcquisitionMethod: 'ซื้อ',
            Vendor: 'บจก. เมดิเทค อินสตรูเมนท์',
            AcquisitionCost: 185000.00,
            CurrentValue: 105700.00,
            DepartmentID: 'DEP-OPD',
            LocationID: 'LOC-OPD-01',
            CustodianName: 'พว.สุดารัตน์ พยาบาลวิชาชีพ',
            Condition: 'REPAIRABLE',
            Status: 'IN_REPAIR',
            RiskLevel: 'MEDIUM',
            Criticality: 'DIAGNOSTIC',
            IsDemo: true
          },
          {
            AssetID: 'DEMO-AST-005',
            AssetCode: 'AST-2569-00005',
            SerialNumber: 'DENT-CHAIR-99',
            Barcode: '885000100005',
            QRCode: 'QR-AST-00005',
            AssetName: 'ยูนิตทำฟันพร้อมระบบดูดน้ำลายและโคมไฟส่องตรวจ (Dental Unit)',
            AssetCategoryID: 'CAT-MED-03',
            Brand: 'A-dec',
            Model: 'A-dec 300',
            Specification: 'ยูนิตทำฟันระบบไฮดรอลิก เก้าอี้ปรับระดับไฟฟ้า',
            Unit: 'ชุด',
            Quantity: 1,
            AcquisitionDate: '2022-05-10',
            AcquisitionMethod: 'ซื้อ',
            Vendor: 'บจก. เดนทัล สยาม อินเตอร์',
            AcquisitionCost: 480000.00,
            CurrentValue: 240000.00,
            DepartmentID: 'DEP-DENT',
            LocationID: 'LOC-DENT-01',
            CustodianName: 'ทพ.อนุชา รักฟัน',
            Condition: 'NORMAL',
            Status: 'ACTIVE',
            RiskLevel: 'MEDIUM',
            Criticality: 'STANDARD',
            IsDemo: true
          }
        ],
        repairs: [
          {
            RepairRequestID: 'REP-001',
            RepairCode: 'REP-2569-00001',
            AssetID: 'DEMO-AST-004',
            RequestDate: new Date(Date.now() - 3 * 86400000).toISOString(),
            Reporter: 'พว.สุดารัตน์',
            DepartmentID: 'DEP-OPD',
            Problem: 'คลื่นไฟฟ้าหัวใจมีสัญญาณรบกวนมากและกราฟหลุดที่ลีด V1-V3',
            Priority: 'URGENT',
            Status: 'IN_REPAIR',
            AssignedTo: 'นายสมเกียรติ ช่างซ่อมบำรุง',
            Vendor: 'บจก. เมดิเทค อินสตรูเมนท์',
            Diagnosis: 'สายเคเบิลลีดขาดในบริเวณข้อต่อหัวขั้วต่อ',
            LaborCost: 500,
            PartsCost: 4800,
            TotalCost: 5300,
            DowntimeHours: 48,
            IsDemo: true
          }
        ],
        pmPlans: [
          {
            PlanID: 'PM-001',
            PlanCode: 'PM-2569-00001',
            AssetID: 'DEMO-AST-001',
            PlanName: 'ทดสอบพลังงานและสอบเทียบเครื่องกระตุกหัวใจ AED ประจำ 6 เดือน',
            FrequencyMonths: 6,
            ScheduledDate: '2026-10-15',
            AssignedTo: 'ศูนย์วิศวกรรมการแพทย์',
            Status: 'SCHEDULED',
            EstimatedCost: 2500,
            IsDemo: true
          }
        ],
        transfers: [],
        transactions: [
          {
            TransactionID: 'TRX-001',
            AssetID: 'DEMO-AST-001',
            TransactionType: 'RECEIVE',
            TransactionDate: '2024-10-15',
            ToDepartmentID: 'DEP-ER',
            ResponsiblePerson: 'พว.มนัส ชัยชนะ',
            Reason: 'ตรวจรับเข้าประจำห้องฉุกเฉิน',
            PerformedBy: 'admin',
            IsDemo: true
          }
        ],
        auditLogs: [
          {
            LogID: 'LOG-001',
            CreatedAt: new Date().toISOString(),
            Username: 'admin',
            Role: 'ADMIN',
            Action: 'SYSTEM_INITIALIZATION',
            Module: 'SYSTEM',
            Details: 'ติดตั้งระบบและสร้างข้อมูลตัวอย่างบน GitHub Platform'
          }
        ]
      };
    }
    return localDb;
  }

  function fallbackMockHandler(endpoint, method, body) {
    const db = getLocalDb();
    const cleanEndpoint = endpoint.split('?')[0];

    if (cleanEndpoint === 'Users') {
      if (method === 'GET') {
        const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
        const username = urlParams.get('Username')?.replace('eq.', '');
        if (username) {
          return db.users.filter(u => u.Username === username);
        }
        return db.users;
      }
      if (method === 'POST') {
        if (!body.UserID) body.UserID = 'usr_' + Date.now();
        db.users.push(body);
        return [body];
      }
    }

    if (cleanEndpoint === 'Settings') {
      if (method === 'GET') {
        return Object.keys(db.settings).map(k => ({ SettingKey: k, SettingValue: db.settings[k] }));
      }
      if (method === 'POST') {
        db.settings[body.SettingKey] = body.SettingValue;
        return [body];
      }
    }

    if (cleanEndpoint === 'Departments') return db.departments;
    if (cleanEndpoint === 'Locations') return db.locations;
    if (cleanEndpoint === 'AssetCategories') return db.categories;

    if (cleanEndpoint === 'Assets') {
      if (method === 'GET') {
        const isDemo = endpoint.includes('IsDemo=eq.true');
        return db.assets.filter(a => a.IsDemo === isDemo);
      }
      if (method === 'POST') {
        if (!body.AssetID) body.AssetID = 'AST-' + Date.now();
        db.assets.unshift(body);
        return [body];
      }
      if (method === 'PATCH') {
        const id = endpoint.match(/AssetID=eq\.([^&]+)/)?.[1];
        const idx = db.assets.findIndex(a => a.AssetID === id);
        if (idx >= 0) Object.assign(db.assets[idx], body);
        return [db.assets[idx]];
      }
    }

    if (cleanEndpoint === 'RepairRequests') {
      if (method === 'GET') return db.repairs;
      if (method === 'POST') {
        if (!body.RepairRequestID) body.RepairRequestID = 'REP-' + Date.now();
        db.repairs.unshift(body);
        return [body];
      }
      if (method === 'PATCH') {
        const id = endpoint.match(/RepairRequestID=eq\.([^&]+)/)?.[1];
        const idx = db.repairs.findIndex(r => r.RepairRequestID === id);
        if (idx >= 0) Object.assign(db.repairs[idx], body);
        return [db.repairs[idx]];
      }
    }

    if (cleanEndpoint === 'MaintenancePlans') {
      if (method === 'GET') return db.pmPlans;
      if (method === 'POST') {
        if (!body.PlanID) body.PlanID = 'PM-' + Date.now();
        db.pmPlans.unshift(body);
        return [body];
      }
      if (method === 'PATCH') {
        const id = endpoint.match(/PlanID=eq\.([^&]+)/)?.[1];
        const idx = db.pmPlans.findIndex(p => p.PlanID === id);
        if (idx >= 0) Object.assign(db.pmPlans[idx], body);
        return [db.pmPlans[idx]];
      }
    }

    if (cleanEndpoint === 'AssetTransactions') {
      if (method === 'GET') return db.transactions;
      if (method === 'POST') {
        db.transactions.unshift(body);
        return [body];
      }
    }

    if (cleanEndpoint === 'Transfers') {
      if (method === 'GET') return db.transfers;
      if (method === 'POST') {
        db.transfers.unshift(body);
        return [body];
      }
    }

    if (cleanEndpoint === 'AuditLogs') {
      if (method === 'GET') return db.auditLogs;
      if (method === 'POST') {
        db.auditLogs.unshift(body);
        return [body];
      }
    }

    return [];
  }

  return {
    getCredentials,
    setCredentials,
    isConfigured,
    apiFetch,
    getLocalDb
  };
})();
