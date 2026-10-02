/**
 * ==============================================================================
 * HOSPITAL ASSET MANAGEMENT SYSTEM (ระบบจัดการครุภัณฑ์โรงพยาบาล)
 * BACKEND CONTROLLER - GOOGLE APPS SCRIPT & SUPABASE REST INTEGRATION
 * ==============================================================================
 */

/**
 * Web App Entry Point
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('ระบบจัดการครุภัณฑ์โรงพยาบาล (Hospital Asset Management)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include helper for modular HTML files (Styles, Scripts)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// -----------------------------------------------------------------------------
// SYSTEM & PROPERTIES INITIALIZATION
// -----------------------------------------------------------------------------

function getProperty(key, defaultValue) {
  var props = PropertiesService.getScriptProperties();
  var val = props.getProperty(key);
  return val !== null && val !== undefined ? val : defaultValue;
}

function setProperty(key, value) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(key, String(value));
}

function getSupabaseConfig() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL') || '';
  var key = props.getProperty('SUPABASE_KEY') || '';
  return { url: url.replace(/\/+$/, ''), key: key };
}

/**
 * Call Supabase REST API from GAS with UrlFetchApp
 */
function supabaseFetch(endpoint, method, payload, headers) {
  var config = getSupabaseConfig();
  if (!config.url || !config.key) {
    throw new Error('กรุณากำหนดค่า SUPABASE_URL และ SUPABASE_KEY ในการตั้งค่าระบบก่อนใช้งาน');
  }

  var url = config.url + '/rest/v1/' + endpoint;
  var requestHeaders = {
    'apikey': config.key,
    'Authorization': 'Bearer ' + config.key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  if (headers) {
    for (var h in headers) {
      requestHeaders[h] = headers[h];
    }
  }

  var options = {
    method: method || 'get',
    headers: requestHeaders,
    muteHttpExceptions: true
  };

  if (payload && (method === 'post' || method === 'patch' || method === 'put')) {
    options.payload = JSON.stringify(payload);
  }

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();
  var responseText = response.getContentText();

  if (statusCode >= 200 && statusCode < 300) {
    return responseText ? JSON.parse(responseText) : [];
  } else {
    Logger.log('Supabase API Error (' + statusCode + '): ' + responseText);
    throw new Error('Supabase Error (' + statusCode + '): ' + responseText);
  }
}

/**
 * Setup System
 */
function setupSystem(supabaseUrl, supabaseKey) {
  try {
    if (supabaseUrl && supabaseKey) {
      setProperty('SUPABASE_URL', supabaseUrl.trim());
      setProperty('SUPABASE_KEY', supabaseKey.trim());
    }
    initializeDefaultSettings();
    initializeAdminUser();
    return { success: true, message: 'ติดตั้งและตั้งค่าระบบเริ่มต้นเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาดในการติดตั้ง: ' + err.message };
  }
}

function initializeSheets() {
  return setupSystem();
}

function initializeDefaultSettings() {
  var defaults = {
    'ORGANIZATION_NAME': 'โรงพยาบาลส่งเสริมสุขภาพตำบลบ้านสวนสมบูรณ์',
    'ORGANIZATION_SHORT_NAME': 'รพ.สต.บ้านสวนสมบูรณ์',
    'ORGANIZATION_TYPE': 'โรงพยาบาลส่งเสริมสุขภาพตำบล',
    'SYSTEM_NAME': 'ระบบจัดการครุภัณฑ์และเครื่องมือแพทย์',
    'SYSTEM_SHORT_NAME': 'H-AMS',
    'ADMIN_NAME': 'นายแพทย์ประสิทธิ์ สุขเกษม',
    'ADMIN_POSITION': 'ผู้อำนวยการโรงพยาบาล',
    'ORGANIZATION_ADDRESS': 'เลขที่ 99 หมู่ 4 ต.บ้านสวน อ.เมือง จ.ชลบุรี 20000',
    'ORGANIZATION_PHONE': '038-123456',
    'ORGANIZATION_EMAIL': 'contact@baansuanhospital.go.th',
    'FISCAL_YEAR': '2569',
    'ASSET_PREFIX': 'AST-',
    'TRANSFER_PREFIX': 'TRF-',
    'REPAIR_PREFIX': 'REP-',
    'INSPECTION_PREFIX': 'INS-',
    'DISPOSAL_PREFIX': 'DSP-',
    'MAINTENANCE_PREFIX': 'PM-',
    'WARRANTY_WARNING_DAYS': '30',
    'PM_WARNING_DAYS': '15',
    'LOW_VALUE_THRESHOLD': '10000',
    'DEMO_ENABLED': 'TRUE',
    'SHOW_LOGO': 'TRUE',
    'PRINT_HEADER_TEXT': 'แบบฟอร์มครุภัณฑ์ราชการ - รพ.สต.บ้านสวนสมบูรณ์',
    'PRINT_FOOTER_TEXT': 'เอกสารควบคุมภายในระบบจัดการครุภัณฑ์อิเล็กทรอนิกส์'
  };

  var config = getSupabaseConfig();
  if (config.url && config.key) {
    try {
      for (var k in defaults) {
        var row = {
          SettingKey: k,
          SettingValue: defaults[k],
          UpdatedAt: new Date().toISOString()
        };
        try {
          supabaseFetch('Settings', 'post', row, { 'Prefer': 'resolution=merge-duplicates' });
        } catch (e) {
          Logger.log('Setting save skipped: ' + k);
        }
      }
    } catch (e) {
      Logger.log('Supabase setting error: ' + e.message);
    }
  }

  var props = PropertiesService.getScriptProperties();
  for (var key in defaults) {
    if (!props.getProperty(key)) {
      props.setProperty(key, defaults[key]);
    }
  }
}

function initializeAdminUser() {
  ensureDemoUser();
}

function ensureDemoUser() {
  var config = getSupabaseConfig();
  if (!config.url || !config.key) return;
  try {
    var users = [
      {
        UserID: 'usr_admin_001',
        Username: 'admin',
        PasswordHash: '1234',
        FullName: 'ผู้ดูแลระบบสูงสุด (Admin)',
        Role: 'ADMIN',
        DepartmentID: 'DEP-ADM',
        IsActive: true,
        IsDemoUser: false
      },
      {
        UserID: 'usr_demo_001',
        Username: 'demo',
        PasswordHash: '1234',
        FullName: 'ผู้ใช้งานโหมดทดลอง (Demo User)',
        Role: 'DEMO',
        DepartmentID: 'DEP-OPD',
        IsActive: true,
        IsDemoUser: true
      }
    ];
    for (var i = 0; i < users.length; i++) {
      supabaseFetch('Users', 'post', users[i], { 'Prefer': 'resolution=merge-duplicates' });
    }
  } catch (err) {
    Logger.log('ensureDemoUser error: ' + err.message);
  }
}

// -----------------------------------------------------------------------------
// AUTHENTICATION & SESSION MANAGEMENT
// -----------------------------------------------------------------------------

function loginUser(username, password) {
  try {
    username = sanitizeInput(username);
    if (!username || !password) {
      return { success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' };
    }

    var config = getSupabaseConfig();
    var user = null;

    if (config.url && config.key) {
      var res = supabaseFetch('Users?Username=eq.' + encodeURIComponent(username) + '&IsActive=eq.true&select=*');
      if (res && res.length > 0) {
        user = res[0];
      }
    } else {
      // Local fallback for quick evaluation
      if (username === 'admin' && password === '1234') {
        user = {
          UserID: 'usr_admin_001',
          Username: 'admin',
          PasswordHash: '1234',
          FullName: 'ผู้ดูแลระบบสูงสุด (Admin)',
          Role: 'ADMIN',
          DepartmentID: 'DEP-ADM',
          IsActive: true,
          IsDemoUser: false
        };
      } else if (username === 'demo' && password === '1234') {
        user = {
          UserID: 'usr_demo_001',
          Username: 'demo',
          PasswordHash: '1234',
          FullName: 'ผู้ใช้งานโหมดทดลอง (Demo User)',
          Role: 'DEMO',
          DepartmentID: 'DEP-OPD',
          IsActive: true,
          IsDemoUser: true
        };
      }
    }

    if (!user) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้ หรือบัญชีถูกระงับการใช้งาน' };
    }

    if (user.PasswordHash !== password) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }

    if (user.Role === 'DEMO' && !isDemoEnabled()) {
      return { success: false, message: 'โหมดทดลอง (Demo Mode) ถูกปิดการใช้งานโดยผู้ดูแลระบบ' };
    }

    var token = generateId('SES');
    var expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours

    var sessionData = {
      SessionToken: token,
      UserID: user.UserID,
      Username: user.Username,
      Role: user.Role,
      IsDemoUser: user.IsDemoUser || user.Role === 'DEMO',
      ExpiresAt: expiresAt
    };

    if (config.url && config.key) {
      try {
        supabaseFetch('Sessions', 'post', sessionData);
      } catch (e) {
        Logger.log('Session insert failed: ' + e.message);
      }
    }

    // Cache session in ScriptCache
    var cache = CacheService.getScriptCache();
    cache.put('SESSION_' + token, JSON.stringify(sessionData), 21600);

    writeAuditLog(token, 'LOGIN', 'USERS', user.UserID, 'ผู้ใช้เข้าสู่ระบบสำเร็จ: ' + user.Username);

    return {
      success: true,
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
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + err.message };
  }
}

function loginDemoUser() {
  if (!isDemoEnabled()) {
    return { success: false, message: 'โหมดทดลองถูกปิดอยู่ในขณะนี้' };
  }
  return loginUser('demo', '1234');
}

function logoutUser(sessionToken) {
  try {
    if (!sessionToken) return { success: true };
    var cache = CacheService.getScriptCache();
    cache.remove('SESSION_' + sessionToken);

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      try {
        supabaseFetch('Sessions?SessionToken=eq.' + encodeURIComponent(sessionToken), 'delete');
      } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

function validateSession(sessionToken) {
  if (!sessionToken) {
    throw new Error('ไม่พบข้อมูล Session กรุณาเข้าสู่ระบบใหม่');
  }

  var cache = CacheService.getScriptCache();
  var cached = cache.get('SESSION_' + sessionToken);
  if (cached) {
    var sess = JSON.parse(cached);
    if (new Date(sess.ExpiresAt) > new Date()) {
      return sess;
    }
  }

  var config = getSupabaseConfig();
  if (config.url && config.key) {
    var res = supabaseFetch('Sessions?SessionToken=eq.' + encodeURIComponent(sessionToken) + '&select=*');
    if (res && res.length > 0) {
      var dbSession = res[0];
      if (new Date(dbSession.ExpiresAt) > new Date()) {
        cache.put('SESSION_' + sessionToken, JSON.stringify(dbSession), 21600);
        return dbSession;
      }
    }
  }

  throw new Error('Session หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
}

function getCurrentUser(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    return {
      success: true,
      user: {
        userId: session.UserID,
        username: session.Username,
        role: session.Role,
        isDemo: session.Role === 'DEMO' || session.IsDemoUser === true
      }
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// DEMO MODE MANAGEMENT
// -----------------------------------------------------------------------------

function isDemoEnabled() {
  var val = getProperty('DEMO_ENABLED', 'TRUE');
  return String(val).toUpperCase() === 'TRUE';
}

function getDemoStatus(sessionToken) {
  try {
    validateSession(sessionToken);
    return {
      success: true,
      enabled: isDemoEnabled()
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function enableDemoMode(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') {
      throw new Error('เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถเปิดโหมดทดลองได้');
    }
    setProperty('DEMO_ENABLED', 'TRUE');
    writeAuditLog(sessionToken, 'DEMO_ENABLE', 'SYSTEM', 'DEMO', 'เปิดใช้งานโหมดทดลอง (Demo Mode)');
    return { success: true, message: 'เปิดใช้งานโหมดทดลองเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function disableDemoMode(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') {
      throw new Error('เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถปิดโหมดทดลองได้');
    }
    setProperty('DEMO_ENABLED', 'FALSE');
    writeAuditLog(sessionToken, 'DEMO_DISABLE', 'SYSTEM', 'DEMO', 'ปิดใช้งานโหมดทดลอง (Demo Mode)');
    return { success: true, message: 'ปิดใช้งานโหมดทดลองเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function clearDemoData(sessionToken, confirmationText) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') {
      throw new Error('เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่ได้รับอนุญาตให้ล้างข้อมูลทดลอง');
    }
    if (confirmationText !== 'ล้างข้อมูลทดลอง') {
      throw new Error('กรุณาพิมพ์ข้อความยืนยัน "ล้างข้อมูลทดลอง" ให้ถูกต้อง');
    }

    var config = getSupabaseConfig();
    var summary = {};

    var operationalTables = [
      'InspectionItems', 'Inspections', 'MaintenancePlans', 'RepairHistory',
      'RepairRequests', 'Transfers', 'AssetTransactions', 'WarrantyContracts',
      'Disposals', 'Attachments', 'Assets'
    ];

    if (config.url && config.key) {
      for (var i = 0; i < operationalTables.length; i++) {
        var tbl = operationalTables[i];
        try {
          var res = supabaseFetch(tbl + '?IsDemo=eq.true', 'delete');
          summary[tbl] = res ? res.length : 0;
        } catch (e) {
          summary[tbl] = 0;
        }
      }
    }

    writeAuditLog(sessionToken, 'CLEAR_DEMO_DATA', 'DEMO', 'ALL', 'ล้างข้อมูลทดลองทั้งหมดเรียบร้อยแล้ว: ' + JSON.stringify(summary));

    return {
      success: true,
      message: 'ล้างข้อมูลทดลองสำเร็จ ไม่ส่งผลกระทบต่อข้อมูลจริง',
      deletedCounts: summary
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function initializeDemoData(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN' && session.Role !== 'DEMO') {
      throw new Error('ไม่มีสิทธิ์สร้างข้อมูลทดลอง');
    }

    // Insert sample items into Supabase
    var config = getSupabaseConfig();
    if (!config.url || !config.key) {
      return { success: true, message: 'สร้างชุดข้อมูลทดลองสำเร็จ (Local Sample Mode)' };
    }

    var sampleAssets = [
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
        Unit: 'เครื่อง',
        Quantity: 1,
        AcquisitionDate: '2024-10-15',
        AcquisitionMethod: 'ซื้อ',
        Vendor: 'บจก. เมดิคอลโปรเกรส',
        AcquisitionCost: 95000.00,
        CurrentValue: 76000.00,
        DepartmentID: 'DEP-ER',
        LocationID: 'LOC-ER-01',
        Condition: 'NORMAL',
        Status: 'ACTIVE',
        RiskLevel: 'CRITICAL',
        Criticality: 'LIFE_SUPPORT',
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
        Unit: 'เครื่อง',
        Quantity: 1,
        AcquisitionDate: '2024-11-20',
        AcquisitionMethod: 'ซื้อ',
        Vendor: 'บจก. อุปกรณ์การแพทย์สยาม',
        AcquisitionCost: 145000.00,
        CurrentValue: 116000.00,
        DepartmentID: 'DEP-ER',
        LocationID: 'LOC-ER-01',
        Condition: 'NORMAL',
        Status: 'ACTIVE',
        RiskLevel: 'HIGH',
        Criticality: 'LIFE_SUPPORT',
        IsDemo: true
      },
      {
        AssetID: 'DEMO-AST-003',
        AssetCode: 'AST-2569-00003',
        SerialNumber: 'ECG-12C-5542',
        Barcode: '885000100004',
        QRCode: 'QR-AST-00004',
        AssetName: 'เครื่องตรวจคลื่นไฟฟ้าหัวใจ 12 ลีด (12-Lead ECG)',
        AssetCategoryID: 'CAT-MED-02',
        Brand: 'Nihon Kohden',
        Model: 'ECG-2350',
        Unit: 'เครื่อง',
        Quantity: 1,
        AcquisitionDate: '2023-08-15',
        AcquisitionMethod: 'ซื้อ',
        Vendor: 'บจก. เมดิเทค อินสตรูเมนท์',
        AcquisitionCost: 185000.00,
        CurrentValue: 105700.00,
        DepartmentID: 'DEP-OPD',
        LocationID: 'LOC-OPD-01',
        Condition: 'REPAIRABLE',
        Status: 'IN_REPAIR',
        RiskLevel: 'MEDIUM',
        Criticality: 'DIAGNOSTIC',
        IsDemo: true
      }
    ];

    for (var i = 0; i < sampleAssets.length; i++) {
      try {
        supabaseFetch('Assets', 'post', sampleAssets[i], { 'Prefer': 'resolution=merge-duplicates' });
      } catch (e) {}
    }

    writeAuditLog(sessionToken, 'INIT_DEMO_DATA', 'DEMO', 'ALL', 'สร้างชุดข้อมูลทดลองเสร็จสมบูรณ์');
    return { success: true, message: 'สร้างชุดข้อมูลทดลองเสร็จสมบูรณ์' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function resetDemoData(sessionToken, confirmationText) {
  var clearRes = clearDemoData(sessionToken, confirmationText);
  if (!clearRes.success) return clearRes;
  return initializeDemoData(sessionToken);
}

// -----------------------------------------------------------------------------
// DASHBOARD & SUMMARY METRICS
// -----------------------------------------------------------------------------

function getDashboardData(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    var config = getSupabaseConfig();
    var assets = [];
    var repairs = [];
    var pmPlans = [];

    if (config.url && config.key) {
      assets = supabaseFetch('Assets?IsDemo=eq.' + isDemo + '&select=*') || [];
      repairs = supabaseFetch('RepairRequests?IsDemo=eq.' + isDemo + '&select=*') || [];
      pmPlans = supabaseFetch('MaintenancePlans?IsDemo=eq.' + isDemo + '&select=*') || [];
    }

    var totalAssets = assets.length;
    var totalValue = 0;
    var normalCount = 0;
    var damagedCount = 0;
    var repairCount = 0;
    var pendingDisposalCount = 0;
    var lostCount = 0;

    for (var i = 0; i < assets.length; i++) {
      var a = assets[i];
      totalValue += Number(a.AcquisitionCost || 0);
      if (a.Status === 'ACTIVE') normalCount++;
      else if (a.Status === 'IN_REPAIR') repairCount++;
      else if (a.Status === 'PENDING_DISPOSAL') pendingDisposalCount++;
      else if (a.Condition === 'LOST') lostCount++;
      else if (a.Condition === 'DAMAGED' || a.Condition === 'REPAIRABLE') damagedCount++;
    }

    var openRepairs = 0;
    for (var r = 0; r < repairs.length; r++) {
      if (repairs[r].Status !== 'COMPLETED' && repairs[r].Status !== 'RETURNED' && repairs[r].Status !== 'CANCELLED') {
        openRepairs++;
      }
    }

    var pmDueSoon = 0;
    var now = new Date();
    var thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    for (var p = 0; p < pmPlans.length; p++) {
      var plan = pmPlans[p];
      if (plan.Status === 'SCHEDULED' && plan.ScheduledDate) {
        var sDate = new Date(plan.ScheduledDate);
        if (sDate <= thirtyDaysAhead) pmDueSoon++;
      }
    }

    return {
      success: true,
      stats: {
        totalAssets: totalAssets,
        totalValue: totalValue,
        normalCount: normalCount,
        damagedCount: damagedCount,
        repairCount: repairCount,
        pendingDisposalCount: pendingDisposalCount,
        lostCount: lostCount,
        openRepairs: openRepairs,
        pmDueSoon: pmDueSoon
      },
      recentAssets: assets.slice(0, 10),
      isDemo: isDemo
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// ASSETS MANAGEMENT
// -----------------------------------------------------------------------------

function getAssets(sessionToken, filters) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    var config = getSupabaseConfig();
    if (!config.url || !config.key) {
      return { success: true, data: [] };
    }

    var query = 'Assets?IsDemo=eq.' + isDemo;
    if (filters) {
      if (filters.departmentId) query += '&DepartmentID=eq.' + encodeURIComponent(filters.departmentId);
      if (filters.status) query += '&Status=eq.' + encodeURIComponent(filters.status);
      if (filters.categoryId) query += '&AssetCategoryID=eq.' + encodeURIComponent(filters.categoryId);
    }
    query += '&order=CreatedAt.desc';

    var data = supabaseFetch(query) || [];

    // Filter department scope if user is departmental
    if (session.Role === 'DEPARTMENT' && session.DepartmentID) {
      data = data.filter(function(item) {
        return item.DepartmentID === session.DepartmentID;
      });
    }

    return { success: true, data: data, isDemo: isDemo };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getAssetById(sessionToken, assetId) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    var config = getSupabaseConfig();
    var res = supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(assetId) + '&IsDemo=eq.' + isDemo + '&select=*');
    if (!res || res.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลครุภัณฑ์' };
    }
    return { success: true, data: res[0] };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function generateAssetCode(sessionToken) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var prefix = getProperty('ASSET_PREFIX', 'AST-');
    var year = getProperty('FISCAL_YEAR', '2569');
    var counterKey = 'COUNTER_ASSET_' + year;
    var currentCount = Number(getProperty(counterKey, '0')) + 1;
    setProperty(counterKey, String(currentCount));

    var padded = ('00000' + currentCount).slice(-5);
    return { success: true, code: prefix + year + '-' + padded };
  } catch (e) {
    return { success: false, message: 'ไม่สามารถสร้างเลขครุภัณฑ์ได้: ' + e.message };
  } finally {
    lock.releaseLock();
  }
}

function saveAsset(sessionToken, assetData) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role === 'VIEWER') {
      throw new Error('ผู้ใช้ประเภท VIEWER ไม่มีสิทธิ์บันทึกหรือแก้ไขครุภัณฑ์');
    }

    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    assetData.IsDemo = isDemo;

    var isNew = !assetData.AssetID;
    if (isNew) {
      assetData.AssetID = generateId('AST');
      if (!assetData.AssetCode) {
        var codeGen = generateAssetCode(sessionToken);
        assetData.AssetCode = codeGen.code;
      }
      assetData.CreatedAt = new Date().toISOString();
      assetData.CreatedBy = session.Username;
    }

    assetData.UpdatedAt = new Date().toISOString();
    assetData.UpdatedBy = session.Username;

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      if (isNew) {
        supabaseFetch('Assets', 'post', assetData);
      } else {
        supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(assetData.AssetID), 'patch', assetData);
      }
    }

    writeAuditLog(sessionToken, isNew ? 'CREATE_ASSET' : 'UPDATE_ASSET', 'ASSETS', assetData.AssetID,
      'บันทึกข้อมูลครุภัณฑ์: ' + assetData.AssetCode + ' (' + assetData.AssetName + ')');

    return { success: true, message: 'บันทึกข้อมูลครุภัณฑ์เรียบร้อยแล้ว', data: assetData };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateAssetStatus(sessionToken, assetId, newStatus, reason) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    var updatePayload = {
      Status: newStatus,
      UpdatedAt: new Date().toISOString(),
      UpdatedBy: session.Username
    };

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(assetId) + '&IsDemo=eq.' + isDemo, 'patch', updatePayload);
    }

    writeAuditLog(sessionToken, 'UPDATE_STATUS', 'ASSETS', assetId, 'เปลี่ยนสถานะเป็น: ' + newStatus + ' (เหตุผล: ' + (reason || '-') + ')');
    return { success: true, message: 'อัปเดตสถานะสำเร็จ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// MASTER DATA: CATEGORIES, DEPARTMENTS, LOCATIONS
// -----------------------------------------------------------------------------

function getAssetCategories(sessionToken) {
  try {
    validateSession(sessionToken);
    var config = getSupabaseConfig();
    var data = [];
    if (config.url && config.key) {
      data = supabaseFetch('AssetCategories?order=CategoryName.asc') || [];
    }
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveAssetCategory(sessionToken, catData) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN' && session.Role !== 'ASSET_MANAGER') {
      throw new Error('ไม่มีสิทธิ์จัดการหมวดหมู่ครุภัณฑ์');
    }
    if (!catData.AssetCategoryID) catData.AssetCategoryID = generateId('CAT');
    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('AssetCategories', 'post', catData, { 'Prefer': 'resolution=merge-duplicates' });
    }
    return { success: true, message: 'บันทึกหมวดหมู่สำเร็จ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getDepartments(sessionToken) {
  try {
    validateSession(sessionToken);
    var config = getSupabaseConfig();
    var data = [];
    if (config.url && config.key) {
      data = supabaseFetch('Departments?order=DepartmentName.asc') || [];
    }
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveDepartment(sessionToken, deptData) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') throw new Error('เฉพาะ ADMIN เท่านั้นที่จัดการหน่วยงานได้');
    if (!deptData.DepartmentID) deptData.DepartmentID = generateId('DEP');
    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Departments', 'post', deptData, { 'Prefer': 'resolution=merge-duplicates' });
    }
    return { success: true, message: 'บันทึกข้อมูลหน่วยงานสำเร็จ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getLocations(sessionToken) {
  try {
    validateSession(sessionToken);
    var config = getSupabaseConfig();
    var data = [];
    if (config.url && config.key) {
      data = supabaseFetch('Locations?order=LocationName.asc') || [];
    }
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveLocation(sessionToken, locData) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN' && session.Role !== 'ASSET_MANAGER') throw new Error('ไม่มีสิทธิ์จัดการสถานที่');
    if (!locData.LocationID) locData.LocationID = generateId('LOC');
    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Locations', 'post', locData, { 'Prefer': 'resolution=merge-duplicates' });
    }
    return { success: true, message: 'บันทึกสถานที่สำเร็จ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// RECEIVING, TRANSACTIONS & TRANSFERS
// -----------------------------------------------------------------------------

function receiveAsset(sessionToken, assetPayload) {
  try {
    var session = validateSession(sessionToken);
    var saveRes = saveAsset(sessionToken, assetPayload);
    if (!saveRes.success) return saveRes;

    var asset = saveRes.data;
    var trx = {
      TransactionID: generateId('TRX'),
      AssetID: asset.AssetID,
      TransactionType: 'RECEIVE',
      TransactionDate: new Date().toISOString(),
      ToDepartmentID: asset.DepartmentID,
      ToLocationID: asset.LocationID,
      ResponsiblePerson: asset.CustodianName,
      Reason: 'รับเข้าครุภัณฑ์ใหม่ (' + (asset.AcquisitionMethod || 'จัดซื้อ') + ')',
      DocumentNo: asset.PurchaseOrderNo || asset.InvoiceNo || '-',
      PerformedBy: session.Username,
      IsDemo: asset.IsDemo
    };

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('AssetTransactions', 'post', trx);
    }

    return { success: true, message: 'รับเข้าครุภัณฑ์และขึ้นทะเบียนเรียบร้อย', data: asset };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getAssetTransactions(sessionToken, assetId) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    var config = getSupabaseConfig();
    var query = 'AssetTransactions?IsDemo=eq.' + isDemo;
    if (assetId) query += '&AssetID=eq.' + encodeURIComponent(assetId);
    query += '&order=TransactionDate.desc';
    var data = supabaseFetch(query) || [];
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function createTransfer(sessionToken, transferData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    transferData.TransferID = generateId('TRF');
    transferData.TransferCode = 'TRF-' + Date.now().toString().slice(-6);
    transferData.IsDemo = isDemo;
    transferData.RequestedBy = session.Username;
    transferData.Status = 'PENDING';
    transferData.CreatedAt = new Date().toISOString();

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Transfers', 'post', transferData);
    }

    writeAuditLog(sessionToken, 'CREATE_TRANSFER', 'TRANSFERS', transferData.TransferID,
      'สร้างคำขอโอนย้ายครุภัณฑ์รหัส: ' + transferData.AssetID);

    return { success: true, message: 'สร้างคำขอโอนย้ายสำเร็จ รอการอนุมัติ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function completeTransfer(sessionToken, transferId) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    var config = getSupabaseConfig();
    var transfers = supabaseFetch('Transfers?TransferID=eq.' + encodeURIComponent(transferId) + '&IsDemo=eq.' + isDemo);
    if (!transfers || transfers.length === 0) throw new Error('ไม่พบข้อมูลการโอนย้าย');
    var trf = transfers[0];

    // Update Transfer
    supabaseFetch('Transfers?TransferID=eq.' + encodeURIComponent(transferId), 'patch', {
      Status: 'COMPLETED',
      ApprovedBy: session.Username
    });

    // Update Asset Location & Department
    supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(trf.AssetID), 'patch', {
      DepartmentID: trf.ToDepartmentID,
      LocationID: trf.ToLocationID,
      CustodianName: trf.ToResponsible || undefined,
      UpdatedAt: new Date().toISOString(),
      UpdatedBy: session.Username
    });

    // Record Transaction
    var trx = {
      TransactionID: generateId('TRX'),
      AssetID: trf.AssetID,
      TransactionType: 'TRANSFER',
      TransactionDate: new Date().toISOString(),
      FromDepartmentID: trf.FromDepartmentID,
      ToDepartmentID: trf.ToDepartmentID,
      FromLocationID: trf.FromLocationID,
      ToLocationID: trf.ToLocationID,
      ResponsiblePerson: trf.ToResponsible,
      Reason: trf.Reason,
      DocumentNo: trf.TransferCode,
      PerformedBy: session.Username,
      IsDemo: isDemo
    };
    supabaseFetch('AssetTransactions', 'post', trx);

    writeAuditLog(sessionToken, 'COMPLETE_TRANSFER', 'TRANSFERS', transferId, 'โอนย้ายครุภัณฑ์เสร็จสิ้น');
    return { success: true, message: 'ดำเนินการโอนย้ายครุภัณฑ์เรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// REPAIR REQUESTS & HISTORY
// -----------------------------------------------------------------------------

function createRepairRequest(sessionToken, reqData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    reqData.RepairRequestID = generateId('REP');
    reqData.RepairCode = 'REP-' + Date.now().toString().slice(-6);
    reqData.RequestDate = new Date().toISOString();
    reqData.Reporter = session.Username;
    reqData.Status = 'REQUESTED';
    reqData.IsDemo = isDemo;
    reqData.CreatedAt = new Date().toISOString();

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('RepairRequests', 'post', reqData);
      // Update asset condition to REPAIRABLE
      supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(reqData.AssetID), 'patch', {
        Condition: 'REPAIRABLE',
        Status: 'IN_REPAIR'
      });
    }

    writeAuditLog(sessionToken, 'CREATE_REPAIR', 'REPAIRS', reqData.RepairRequestID,
      'แจ้งซ่อมครุภัณฑ์: ' + reqData.AssetID + ' อาการ: ' + reqData.Problem);

    return { success: true, message: 'บันทึกการแจ้งซ่อมเรียบร้อย รหัสแจ้งซ่อม: ' + reqData.RepairCode };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateRepairRequest(sessionToken, repairId, updateData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('RepairRequests?RepairRequestID=eq.' + encodeURIComponent(repairId) + '&IsDemo=eq.' + isDemo, 'patch', updateData);

      if (updateData.Status === 'COMPLETED' || updateData.Status === 'RETURNED') {
        // Return asset to normal status
        if (updateData.AssetID) {
          supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(updateData.AssetID), 'patch', {
            Condition: 'NORMAL',
            Status: 'ACTIVE'
          });
        }
      }
    }

    writeAuditLog(sessionToken, 'UPDATE_REPAIR', 'REPAIRS', repairId, 'อัปเดตงานซ่อม: ' + (updateData.Status || 'แก้ไขข้อมูล'));
    return { success: true, message: 'อัปเดตงานแจ้งซ่อมเรียบร้อย' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getRepairHistory(sessionToken, assetId) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    var config = getSupabaseConfig();
    var query = 'RepairRequests?IsDemo=eq.' + isDemo;
    if (assetId) query += '&AssetID=eq.' + encodeURIComponent(assetId);
    query += '&order=RequestDate.desc';
    var data = supabaseFetch(query) || [];
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// PREVENTIVE MAINTENANCE (PM)
// -----------------------------------------------------------------------------

function getMaintenancePlans(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    var config = getSupabaseConfig();
    var data = supabaseFetch('MaintenancePlans?IsDemo=eq.' + isDemo + '&order=ScheduledDate.asc') || [];
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveMaintenancePlan(sessionToken, planData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    if (!planData.PlanID) {
      planData.PlanID = generateId('PM');
      planData.PlanCode = 'PM-' + Date.now().toString().slice(-6);
      planData.Status = 'SCHEDULED';
      planData.CreatedAt = new Date().toISOString();
    }
    planData.IsDemo = isDemo;

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('MaintenancePlans', 'post', planData, { 'Prefer': 'resolution=merge-duplicates' });
    }

    return { success: true, message: 'บันทึกแผนบำรุงรักษาเรียบร้อย' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function completeMaintenance(sessionToken, planId, actualData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    actualData.Status = 'COMPLETED';
    actualData.ActualDate = actualData.ActualDate || new Date().toISOString().split('T')[0];

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('MaintenancePlans?PlanID=eq.' + encodeURIComponent(planId) + '&IsDemo=eq.' + isDemo, 'patch', actualData);
      if (actualData.AssetID) {
        supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(actualData.AssetID), 'patch', {
          LastPMDate: actualData.ActualDate,
          NextPMDate: actualData.NextPMDate || undefined
        });
      }
    }
    return { success: true, message: 'บันทึกผลการบำรุงรักษาเชิงป้องกัน (PM) เรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// INSPECTION & AUDIT COUNT (ตรวจนับและตรวจสภาพ)
// -----------------------------------------------------------------------------

function createInspectionSession(sessionToken, inspData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    inspData.InspectionID = generateId('INS');
    inspData.InspectionCode = 'INS-' + Date.now().toString().slice(-6);
    inspData.Inspector = session.Username;
    inspData.Status = 'IN_PROGRESS';
    inspData.IsDemo = isDemo;
    inspData.CreatedAt = new Date().toISOString();

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Inspections', 'post', inspData);
    }
    return { success: true, message: 'เปิดรอบการตรวจนับ/ตรวจสภาพเรียบร้อย', data: inspData };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveInspectionItem(sessionToken, itemData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    if (!itemData.ItemID) itemData.ItemID = generateId('ISI');
    itemData.CheckedBy = session.Username;
    itemData.CheckedAt = new Date().toISOString();
    itemData.IsDemo = isDemo;

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('InspectionItems', 'post', itemData, { 'Prefer': 'resolution=merge-duplicates' });
      // Update asset last inspection date
      if (itemData.AssetID) {
        supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(itemData.AssetID), 'patch', {
          LastInspectionDate: new Date().toISOString().split('T')[0],
          Condition: itemData.Condition || undefined
        });
      }
    }
    return { success: true, message: 'บันทึกผลการตรวจรายการครุภัณฑ์แล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function completeInspectionSession(sessionToken, inspectionId) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Inspections?InspectionID=eq.' + encodeURIComponent(inspectionId) + '&IsDemo=eq.' + isDemo, 'patch', {
        Status: 'COMPLETED',
        EndDate: new Date().toISOString().split('T')[0]
      });
    }
    return { success: true, message: 'ปิดรอบการตรวจนับเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// WARRANTY & CONTRACTS
// -----------------------------------------------------------------------------

function getWarrantyContracts(sessionToken, assetId) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    var config = getSupabaseConfig();
    var query = 'WarrantyContracts?IsDemo=eq.' + isDemo;
    if (assetId) query += '&AssetID=eq.' + encodeURIComponent(assetId);
    query += '&order=EndDate.asc';
    var data = supabaseFetch(query) || [];
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveWarrantyContract(sessionToken, contractData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    if (!contractData.WarrantyContractID) {
      contractData.WarrantyContractID = generateId('WAR');
      contractData.CreatedAt = new Date().toISOString();
    }
    contractData.IsDemo = isDemo;

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('WarrantyContracts', 'post', contractData, { 'Prefer': 'resolution=merge-duplicates' });
    }
    return { success: true, message: 'บันทึกสัญญาการรับประกันเรียบร้อย' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// DISPOSAL (การจำหน่ายครุภัณฑ์)
// -----------------------------------------------------------------------------

function createDisposal(sessionToken, disposalData) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN' && session.Role !== 'ASSET_MANAGER') {
      throw new Error('ไม่มีสิทธิ์จำหน่ายครุภัณฑ์');
    }

    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    disposalData.DisposalID = generateId('DSP');
    disposalData.DisposalCode = 'DSP-' + Date.now().toString().slice(-6);
    disposalData.Status = 'COMPLETED';
    disposalData.IsDemo = isDemo;
    disposalData.ApprovedBy = session.Username;
    disposalData.CreatedAt = new Date().toISOString();

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Disposals', 'post', disposalData);
      // Soft-delete: update asset status to DISPOSED, preserve records
      supabaseFetch('Assets?AssetID=eq.' + encodeURIComponent(disposalData.AssetID), 'patch', {
        Status: 'DISPOSED',
        DisposalDate: disposalData.DisposalDate || new Date().toISOString().split('T')[0],
        DisposalReason: disposalData.Reason,
        UpdatedAt: new Date().toISOString(),
        UpdatedBy: session.Username
      });
    }

    writeAuditLog(sessionToken, 'DISPOSE_ASSET', 'DISPOSALS', disposalData.DisposalID,
      'จำหน่ายครุภัณฑ์รหัส: ' + disposalData.AssetID + ' เหตุผล: ' + disposalData.Reason);

    return { success: true, message: 'บันทึกการจำหน่ายครุภัณฑ์เรียบร้อยแล้ว (เก็บประวัติถาวร)' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// ATTACHMENTS & DOCUMENTS
// -----------------------------------------------------------------------------

function getAttachments(sessionToken, assetId) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;
    var config = getSupabaseConfig();
    var query = 'Attachments?IsDemo=eq.' + isDemo;
    if (assetId) query += '&AssetID=eq.' + encodeURIComponent(assetId);
    var data = supabaseFetch(query) || [];
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveAttachment(sessionToken, fileData) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    fileData.AttachmentID = generateId('ATT');
    fileData.UploadedBy = session.Username;
    fileData.IsDemo = isDemo;
    fileData.CreatedAt = new Date().toISOString();

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Attachments', 'post', fileData);
    }
    return { success: true, message: 'แนบไฟล์เอกสารสำเร็จ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// REPORTS & EXPORT
// -----------------------------------------------------------------------------

function getReports(sessionToken, reportType, filters) {
  try {
    var session = validateSession(sessionToken);
    var isDemo = session.Role === 'DEMO' || session.IsDemoUser === true;

    var config = getSupabaseConfig();
    var assets = supabaseFetch('Assets?IsDemo=eq.' + isDemo + '&select=*') || [];

    // Filter by department, status, category if given
    if (filters) {
      if (filters.departmentId) assets = assets.filter(function(a){ return a.DepartmentID === filters.departmentId; });
      if (filters.status) assets = assets.filter(function(a){ return a.Status === filters.status; });
      if (filters.budgetYear) assets = assets.filter(function(a){ return a.BudgetYear === filters.budgetYear; });
    }

    return {
      success: true,
      reportType: reportType,
      data: assets,
      totalCount: assets.length,
      totalCost: assets.reduce(function(sum, a){ return sum + Number(a.AcquisitionCost || 0); }, 0),
      isDemo: isDemo
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function exportReportCsv(sessionToken, reportType, filters) {
  try {
    var repRes = getReports(sessionToken, reportType, filters);
    if (!repRes.success) throw new Error(repRes.message);

    var rows = repRes.data;
    var csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'เลขครุภัณฑ์,ชื่อครุภัณฑ์,ยี่ห้อ/รุ่น,หมวดหมู่,หน่วยงาน,สถานที่,สถานะ,สภาพ,ราคาจัดซื้อ(บาท),วันที่ได้มา\r\n';

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      csvContent += '"' + (r.AssetCode || '') + '",';
      csvContent += '"' + (r.AssetName || '').replace(/"/g, '""') + '",';
      csvContent += '"' + ((r.Brand || '') + ' ' + (r.Model || '')).trim() + '",';
      csvContent += '"' + (r.AssetCategoryID || '') + '",';
      csvContent += '"' + (r.DepartmentID || '') + '",';
      csvContent += '"' + (r.LocationID || '') + '",';
      csvContent += '"' + (r.Status || '') + '",';
      csvContent += '"' + (r.Condition || '') + '",';
      csvContent += (r.AcquisitionCost || 0) + ',';
      csvContent += '"' + (r.AcquisitionDate || '') + '"\r\n';
    }

    return { success: true, csv: csvContent, filename: 'hospital_assets_' + Date.now() + '.csv' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// USER MANAGEMENT
// -----------------------------------------------------------------------------

function getUsers(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') throw new Error('เฉพาะ ADMIN เท่านั้นที่ดูรายชื่อผู้ใช้ได้');
    var config = getSupabaseConfig();
    var users = [];
    if (config.url && config.key) {
      users = supabaseFetch('Users?select=UserID,Username,FullName,Role,DepartmentID,Email,Phone,IsActive,IsDemoUser,CreatedAt') || [];
    }
    return { success: true, data: users };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveUser(sessionToken, userData) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') throw new Error('เฉพาะ ADMIN เท่านั้นที่เพิ่มหรือแก้ไขผู้ใช้ได้');

    if (!userData.UserID) {
      userData.UserID = generateId('USR');
      userData.CreatedAt = new Date().toISOString();
      userData.PasswordHash = userData.Password || '1234';
    }
    userData.UpdatedAt = new Date().toISOString();
    delete userData.Password;

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Users', 'post', userData, { 'Prefer': 'resolution=merge-duplicates' });
    }

    writeAuditLog(sessionToken, 'SAVE_USER', 'USERS', userData.UserID, 'บันทึกข้อมูลผู้ใช้: ' + userData.Username);
    return { success: true, message: 'บันทึกข้อมูลผู้ใช้เรียบร้อย' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function changeUserPassword(sessionToken, targetUserId, newPassword) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN' && session.UserID !== targetUserId) {
      throw new Error('ไม่มีสิทธิ์เปลี่ยนรหัสผ่านของผู้ใช้นี้');
    }
    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Users?UserID=eq.' + encodeURIComponent(targetUserId), 'patch', {
        PasswordHash: newPassword,
        UpdatedAt: new Date().toISOString()
      });
    }
    writeAuditLog(sessionToken, 'CHANGE_PASSWORD', 'USERS', targetUserId, 'เปลี่ยนรหัสผ่านผู้ใช้');
    return { success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateUserStatus(sessionToken, targetUserId, isActive) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') throw new Error('เฉพาะ ADMIN เท่านั้นที่ปรับสถานะผู้ใช้ได้');
    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('Users?UserID=eq.' + encodeURIComponent(targetUserId), 'patch', {
        IsActive: isActive,
        UpdatedAt: new Date().toISOString()
      });
    }
    return { success: true, message: 'อัปเดตสถานะผู้ใช้งานสำเร็จ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// SETTINGS MANAGEMENT
// -----------------------------------------------------------------------------

function getSettings(sessionToken) {
  try {
    if (sessionToken) validateSession(sessionToken);
    var props = PropertiesService.getScriptProperties().getProperties();
    var config = getSupabaseConfig();
    var dbSettings = {};

    if (config.url && config.key) {
      try {
        var rows = supabaseFetch('Settings?select=*') || [];
        for (var i = 0; i < rows.length; i++) {
          dbSettings[rows[i].SettingKey] = rows[i].SettingValue;
        }
      } catch (e) {}
    }

    // Merge properties with dbSettings
    var merged = {};
    for (var k in props) merged[k] = props[k];
    for (var dk in dbSettings) merged[dk] = dbSettings[dk];

    // Mask sensitive key for client view
    if (merged.SUPABASE_KEY) {
      merged.SUPABASE_KEY_MASKED = '••••••••' + merged.SUPABASE_KEY.slice(-6);
      delete merged.SUPABASE_KEY;
    }

    return { success: true, data: merged };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveSettings(sessionToken, newSettings) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') throw new Error('เฉพาะ ADMIN เท่านั้นที่แก้ไขการตั้งค่าได้');

    var props = PropertiesService.getScriptProperties();
    var config = getSupabaseConfig();

    for (var key in newSettings) {
      var val = String(newSettings[key]);
      props.setProperty(key, val);

      if (config.url && config.key && key !== 'SUPABASE_URL' && key !== 'SUPABASE_KEY') {
        try {
          supabaseFetch('Settings', 'post', {
            SettingKey: key,
            SettingValue: val,
            UpdatedAt: new Date().toISOString()
          }, { 'Prefer': 'resolution=merge-duplicates' });
        } catch (e) {}
      }
    }

    writeAuditLog(sessionToken, 'UPDATE_SETTINGS', 'SETTINGS', 'SYS', 'แก้ไขการตั้งค่าระบบ');
    return { success: true, message: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function restoreDefaultSettings(sessionToken) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') throw new Error('เฉพาะ ADMIN เท่านั้นที่คืนค่าเริ่มต้นได้');
    initializeDefaultSettings();
    writeAuditLog(sessionToken, 'RESTORE_DEFAULT_SETTINGS', 'SETTINGS', 'SYS', 'คืนค่าการตั้งค่าเริ่มต้น');
    return { success: true, message: 'คืนค่าการตั้งค่าเริ่มต้นเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function clearOperationalData(sessionToken, confirmationText) {
  try {
    var session = validateSession(sessionToken);
    if (session.Role !== 'ADMIN') throw new Error('เฉพาะ ADMIN เท่านั้นที่ล้างข้อมูลระบบได้');
    if (confirmationText !== 'ยืนยันล้างข้อมูลระบบ') {
      throw new Error('กรุณาพิมพ์ยืนยัน "ยืนยันล้างข้อมูลระบบ" ให้ถูกต้อง');
    }
    return { success: true, message: 'ฟังก์ชันนี้ถูกจำกัดความปลอดภัย เพื่อป้องกันข้อมูลสูญหายโดยไม่ได้ตั้งใจ' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// -----------------------------------------------------------------------------
// AUDIT LOG & UTILITIES
// -----------------------------------------------------------------------------

function writeAuditLog(sessionToken, action, module, recordId, details) {
  try {
    var username = 'SYSTEM';
    var role = 'SYSTEM';
    var isDemo = false;

    if (sessionToken) {
      try {
        var sess = validateSession(sessionToken);
        username = sess.Username;
        role = sess.Role;
        isDemo = sess.Role === 'DEMO' || sess.IsDemoUser === true;
      } catch (e) {}
    }

    var logEntry = {
      LogID: generateId('LOG'),
      Username: username,
      Role: role,
      Action: action,
      Module: module,
      RecordID: recordId ? String(recordId) : null,
      Details: details ? String(details) : null,
      IsDemoAction: isDemo,
      CreatedAt: new Date().toISOString()
    };

    var config = getSupabaseConfig();
    if (config.url && config.key) {
      supabaseFetch('AuditLogs', 'post', logEntry);
    }
  } catch (e) {
    Logger.log('Audit log error: ' + e.message);
  }
}

function generateId(prefix) {
  var p = prefix ? prefix + '-' : '';
  var rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  var ts = Date.now().toString(36).toUpperCase();
  return p + ts + '-' + rand;
}

function formatDateThai(dateStr) {
  if (!dateStr) return '-';
  try {
    var d = new Date(dateStr);
    var thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    var day = d.getDate();
    var month = thaiMonths[d.getMonth()];
    var year = d.getFullYear() + 543;
    return day + ' ' + month + ' ' + year;
  } catch (e) {
    return dateStr;
  }
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}
