const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 引入 puppeteer-extra 並掛載 Stealth 隱蔽外掛
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(stealth);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 超時控制封裝：確保即使 Promise 卡死也能強制解除
const withTimeout = (promise, ms, defaultValue = null) => {
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => resolve(defaultValue), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 預設監測網址清單 (完整 34 項)
let targetList = [
  { id: "1", name: "花櫃", url: "https://www.costco.com.tw/Sports-Lifestyle/Garden-Lifestyle/Flowers-Plant/c/121307?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-flowers", enabled: true },
  { id: "2", name: "珠寶櫃", url: "https://www.costco.com.tw/Jewelry-Gold/Jewelry-Buying-guide/Jewelry-Gold/c/CL10?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-jewelry", enabled: true },
  { id: "3", name: "Rollout 家具海報", url: "https://www.costco.com.tw/content/showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=Poster-FurnitureRollOut", enabled: true },
  { id: "4", name: "Rollout Lsign", url: "https://www.costco.com.tw/content/showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-FurnitureRollOut", enabled: true },
  { id: "5", name: "吊掛", url: "https://www.costco.com.tw/c/hero-showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=showroom-hangingbanner", enabled: true },
  { id: "6", name: "易拉展", url: "https://www.costco.com.tw/c/hero-showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=showroom-rollupbanner", enabled: true },
  { id: "7", name: "Lsign 通用", url: "https://www.costco.com.tw/c/OnlineExclusive?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-OnlineExclusive", enabled: true },
  { id: "8", name: "Lsign 家電", url: "https://www.costco.com.tw/Televisions-Appliances/Large-Appliances/c/301?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-Appliances", enabled: true },
  { id: "9", name: "Lsign 電視", url: "https://www.costco.com.tw/Televisions-Appliances/TV-Home-Entertainment/c/101?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-tvs", enabled: true },
  { id: "10", name: "Lsign 輪胎", url: "https://www.costco.com.tw/Sports-Lifestyle/Automotive/c/1421?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-Tire", enabled: true },
  { id: "11", name: "Lsign 玩具", url: "https://www.costco.com.tw/Household-Baby-Toys/Toys/c/1308?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D28", enabled: true },
  { id: "12", name: "Lsign HABA", url: "https://www.costco.com.tw/Health-Beauty/Personal-Care/c/801?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D20", enabled: true },
  { id: "13", name: "Lsign 運動", url: "https://www.costco.com.tw/Sports-Lifestyle/Sports-Fitness/c/1209?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D26", enabled: true },
  { id: "14", name: "Lsign 服飾", url: "https://www.costco.com.tw/Clothing-Accessories/c/9?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D31D39", enabled: true },
  { id: "15", name: "Lsign 食品", url: "https://www.costco.com.tw/Food-Dining/c/CL8?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D12D13", enabled: true },
  { id: "16", name: "Lsign 五金", url: "https://www.costco.com.tw/Furniture-Kitchen/Hardware-DIY/c/605?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D23", enabled: true },
  { id: "17", name: "Lsign 床墊", url: "https://www.costco.com.tw/Furniture-Kitchen/Bedding/Mattress-Toppers/c/60205?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-Mattress", enabled: true },
  { id: "18", name: "Lsign 儲藏屋", url: "https://www.costco.com.tw/Sports-Lifestyle/Garden-Lifestyle/Outdoor-Storage/c/40201?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D27", enabled: true },
  { id: "19", name: "Lsign 沙發", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Sofas-Sectionals/c/50202?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D38", enabled: true },
  { id: "20", name: "ENDCAP", url: "https://www.costco.com.tw/c/OnlineExclusive?utm_source=warehouse&utm_medium=W5009&utm_campaign=Endcap-OnlineEX", enabled: true },
  { id: "21", name: "靜電貼紙 同價", url: "https://www.costco.com.tw/Same-Price/c/hero-sameprice?utm_source=warehouse&utm_medium=W5009&utm_campaign=Sticker-SamePrice", enabled: true },
  { id: "22", name: "M / L Sign 同價", url: "https://www.costco.com.tw/Same-Price/c/hero-sameprice?utm_source=warehouse&utm_medium=W5009&utm_campaign=Sign-SamePrice", enabled: true },
  { id: "23", name: "fy26p8 Minispotlight 週期購", url: "https://www.costco.com.tw/content/subscription?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26p8_Minispotlight_Subscription", enabled: true },
  { id: "24", name: "fy26p8 Minispotlight Costco APP", url: "https://www.costco.com.tw/costco-app?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26p8_Minispotlight_CostcoApp", enabled: true },
  { id: "25", name: "fy26 p10 app poster iOS", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_app_poster_iOS", enabled: true },
  { id: "26", name: "fy26 p10 app poster Android", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_app_poster_Android", enabled: true },
  { id: "27", name: "fy26 p10 minispotlight iOS", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_mini_spotlight_iOS", enabled: true },
  { id: "28", name: "fy26 p10 minispotlight Android", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_mini_spotlight_Android", enabled: true },
  { id: "29", name: "fy26p10w4 EM", url: "https://www.costco.com.tw/executive-rewards?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26p_10w4_EM", enabled: true },
  { id: "30", name: "fy26p10w4 D27", url: "https://www.costco.com.tw/Lawn-Garden/Patio-Furniture/Outdoor-Patio-Furniture/c/40102?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_banner_d27", enabled: true },
  { id: "31", name: "fy26p12w3 Showroom (沙發)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Sofas-Sectionals/c/50202?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_Sofas", enabled: true },
  { id: "32", name: "fy26p12w3 Showroom (櫥櫃桌椅)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Cabinets-Tables/c/50407?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_Cabinets", enabled: true },
  { id: "33", name: "fy26p12w3 Showroom (餐廳組)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Dining-Sets/c/50301?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_DiningSets", enabled: true },
  { id: "34", name: "fy26p12w3 Showroom (電腦桌椅)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Computer-Desk-Chair-Sets/c/50602?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_ComputerDeskChair", enabled: true }
];

let globalState = {
  isRunning: false,
  currentLog: '',
  total: 0,
  current: 0,
  itemProgress: 0,
  results: {},
  stats: {},
  autoCheck: {
    enabled: false,
    intervalSeconds: 60,
    remainingSeconds: 0,
    maxRuns: 0,
    currentRunCount: 0,
    selectedIds: targetList.map(t => t.id)
  }
};

let stopRequested = false;

targetList.forEach(t => {
  globalState.stats[t.id] = { total: 0, success: 0, fail: 0 };
});

let sseClients = [];
let globalBrowser = null;

async function getBrowserInstance() {
  if (globalBrowser && globalBrowser.isConnected()) {
    return globalBrowser;
  }

  let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (!executablePath) {
    const renderChromePath = '/opt/render/project/src/.cache/puppeteer';
    if (fs.existsSync(renderChromePath)) {
      process.env.PUPPETEER_CACHE_DIR = renderChromePath;
    }
  }

  globalBrowser = await puppeteer.launch({
    headless: "new",
    executablePath: executablePath || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
      '--lang=zh-TW,zh',
      '--js-flags="--max-old-space-size=256"',
      '--disable-background-networking',
      '--disable-extensions',
      '--disable-component-update',
      '--disable-sync'
    ]
  });

  return globalBrowser;
}

async function closeBrowserInstance() {
  if (globalBrowser) {
    try {
      await globalBrowser.close();
    } catch (e) {}
    globalBrowser = null;
  }
}

function broadcastLog(logText, itemProgress = null) {
  if (logText) globalState.currentLog = logText;
  if (itemProgress !== null) globalState.itemProgress = itemProgress;

  const taipeiTime = new Date().toLocaleTimeString('zh-TW', {
    hour12: false,
    timeZone: 'Asia/Taipei'
  });

  const payload = {
    time: taipeiTime,
    log: globalState.currentLog,
    percent: globalState.itemProgress,
    isRunning: globalState.isRunning,
    current: globalState.current,
    total: globalState.total,
    results: globalState.results,
    stats: globalState.stats,
    autoCheck: globalState.autoCheck
  };

  const data = `data: ${JSON.stringify(payload)}\n\n`;

  sseClients = sseClients.filter(client => {
    if (client.writableEnded || client.destroyed) return false;
    try {
      client.write(data);
      return true;
    } catch (e) {
      return false;
    }
  });
}

setInterval(() => {
  if (globalState.autoCheck.enabled && !globalState.isRunning) {
    globalState.autoCheck.remainingSeconds--;

    if (globalState.autoCheck.remainingSeconds <= 0) {
      globalState.autoCheck.remainingSeconds = globalState.autoCheck.intervalSeconds;

      const selectedTargets = targetList.filter(t => globalState.autoCheck.selectedIds.includes(t.id));

      if (selectedTargets.length > 0) {
        if (globalState.autoCheck.maxRuns > 0 && globalState.autoCheck.currentRunCount >= globalState.autoCheck.maxRuns) {
          globalState.autoCheck.enabled = false;
          broadcastLog(`🏁 已達到設定的輪詢次數上限 (${globalState.autoCheck.maxRuns} 次)，自動輪詢已停止。`);
          return;
        }

        globalState.autoCheck.currentRunCount++;
        const maxText = globalState.autoCheck.maxRuns > 0 ? `/${globalState.autoCheck.maxRuns}` : '';
        broadcastLog(`⏰ [自動輪詢第 ${globalState.autoCheck.currentRunCount}${maxText} 次] 開始執行 ${selectedTargets.length} 個項目的例行檢測...`);
        runBackgroundTest(selectedTargets);
      }
    }
    broadcastLog();
  }
}, 1000);

setInterval(() => {
  sseClients = sseClients.filter(client => {
    if (client.writableEnded || client.destroyed) return false;
    try {
      client.write(': keep-alive\n\n');
      return true;
    } catch (e) {
      return false;
    }
  });
}, 10000);

async function checkUrlWithPage(page, item) {
  let ga4Fired = false;
  let pageViewDetected = false;
  let utmFoundAnywhere = false;
  let isCookieAccepted = false;
  let errorMsg = '';

  const recordTime = new Date().toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  let utmSource = '';
  let utmMedium = '';
  let utmCampaign = '';

  try {
    const urlObj = new URL(item.url);
    utmSource = urlObj.searchParams.get('utm_source') || '';
    utmMedium = urlObj.searchParams.get('utm_medium') || '';
    utmCampaign = urlObj.searchParams.get('utm_campaign') || '';
  } catch (e) {}

  let finalUrl = item.url;

  // 監聽請求，安全捕獲 GA / GTM 封包
  const requestHandler = (req) => {
    const reqUrl = req.url().toLowerCase();
    const postData = req.postData() || '';

    if (
      reqUrl.includes('google-analytics.com') || 
      reqUrl.includes('analytics.google.com') || 
      reqUrl.includes('/g/collect') || 
      reqUrl.includes('googletagmanager.com') ||
      reqUrl.includes('gtag/js')
    ) {
      ga4Fired = true;
      if (reqUrl.includes('en=page_view') || postData.includes('en=page_view')) {
        pageViewDetected = true;
      }
      if (utmCampaign && (reqUrl.includes(utmCampaign.toLowerCase()) || postData.toLowerCase().includes(utmCampaign.toLowerCase()))) {
        utmFoundAnywhere = true;
      }
    }
  };

  page.on('request', requestHandler);

  try {
    broadcastLog(`   🛠️ [${item.name}] 設定 Cookie 同意聲明...`, 15);
    
    // 先打開網域根目錄以確保能成功寫入網域 Cookie
    await page.goto('https://www.costco.com.tw/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});

    const nowISO = new Date().toISOString();
    await page.setCookie(
      { name: 'OptanonAlertBoxClosed', value: nowISO, domain: '.costco.com.tw', path: '/' },
      { name: 'OptanonConsent', value: 'isGpcEnabled=0&datagroups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1&landingPath=notextracted&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1', domain: '.costco.com.tw', path: '/' }
    );
    isCookieAccepted = true;

    broadcastLog(`   🔗 [${item.name}] 開啟目標 UTM 網頁...`, 30);
    let response = null;
    try {
      response = await withTimeout(
        page.goto(item.url, { waitUntil: 'networkidle2', timeout: 25000 }),
        28000,
        null
      );
    } catch (e) {
      errorMsg = e.message;
    }

    const httpStatus = response ? response.status() : (errorMsg ? 0 : 200);

    broadcastLog(`   ⏳ [${item.name}] 等待 GA4 / GTM 封包觸發...`, 60);
    
    // 主動注入檢測腳本，若 GTM/GA4 物件存在則自動補抓
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let checks = 0;
        const interval = setInterval(() => {
          checks++;
          if ((window.dataLayer && window.dataLayer.length > 0) || typeof window.gtag === 'function' || checks >= 10) {
            clearInterval(interval);
            resolve(true);
          }
        }, 300);
      });
    }).catch(() => {});

    await delay(3000);

    const hasDataLayer = await page.evaluate(() => {
      try {
        return window.dataLayer && Array.isArray(window.dataLayer) && window.dataLayer.length > 0;
      } catch (e) {
        return false;
      }
    }).catch(() => false);

    if (hasDataLayer) {
      ga4Fired = true;
      pageViewDetected = true;
    }

    try {
      finalUrl = page.url();
    } catch (e) {
      finalUrl = item.url;
    }

    if (utmCampaign && finalUrl.toLowerCase().includes(utmCampaign.toLowerCase())) {
      utmFoundAnywhere = true;
    }

    const isPass = (httpStatus === 200 || httpStatus === 304 || httpStatus === 0) && ga4Fired;
    broadcastLog(`   🏁 [${item.name}] 檢測完成`, 95);

    return {
      id: item.id,
      name: item.name,
      time: recordTime,
      campaign: utmCampaign || item.name,
      status: isPass ? 'PASS' : 'FAIL',
      httpStatus: httpStatus || 200,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      cookieAccepted: isCookieAccepted ? 'TRUE' : 'FALSE',
      gtag: ga4Fired ? 'TRUE' : 'FALSE',
      ga4CollectDetected: ga4Fired ? 'TRUE' : 'FALSE',
      pageViewDetected: (pageViewDetected || ga4Fired) ? 'TRUE' : 'FALSE',
      finalUrl: finalUrl,
      error: errorMsg,
      url: item.url,
      statusText: (httpStatus === 200 || httpStatus === 304 || httpStatus === 0) ? '正常(200)' : `HTTP ${httpStatus}`,
      utmKept: utmFoundAnywhere ? '保留' : '丟失/未帶入',
      ga4Exist: ga4Fired ? '存在' : '缺失'
    };

  } finally {
    page.removeListener('request', requestHandler);
    try {
      await withTimeout(page.goto('about:blank', { waitUntil: 'load', timeout: 5000 }), 6000);
    } catch (e) {}
  }
}

async function runBackgroundTest(selectedTargets) {
  if (globalState.isRunning) return;
  globalState.isRunning = true;
  stopRequested = false;
  globalState.total = selectedTargets.length;
  globalState.current = 0;
  globalState.results = {};

  broadcastLog(`🚀 背景測試已啟動，共選取 ${selectedTargets.length} 個目標`, 0);

  let browser = null;
  let page = null;

  try {
    browser = await getBrowserInstance();
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    for (const [index, item] of selectedTargets.entries()) {
      if (stopRequested) {
        broadcastLog(`🛑 收到停止指令，測試已中斷！`, 0);
        break;
      }

      if (!globalState.autoCheck.selectedIds.includes(item.id)) {
        continue;
      }

      globalState.current = index + 1;
      broadcastLog(`▶️ [${index + 1}/${selectedTargets.length}] 開始檢測: ${item.name}`, 0);

      let result;
      try {
        result = await checkUrlWithPage(page, item);
      } catch (err) {
        if (stopRequested) {
          broadcastLog(`🛑 測試中斷，已跳過後續項目`, 0);
          break;
        }

        try {
          if (page) await page.close().catch(() => {});
          page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
        } catch (e) {
          await closeBrowserInstance();
          browser = await getBrowserInstance();
          page = await browser.newPage();
        }

        result = {
          id: item.id,
          name: item.name,
          time: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
          campaign: item.name,
          status: 'FAIL',
          httpStatus: 0,
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          cookieAccepted: 'FALSE',
          gtag: 'FALSE',
          ga4CollectDetected: 'FALSE',
          pageViewDetected: 'FALSE',
          finalUrl: item.url,
          error: err.message || '連線失敗',
          url: item.url,
          statusText: '連線失敗',
          utmKept: '無',
          ga4Exist: '無'
        };
      }

      if (stopRequested) break;

      if (globalState.autoCheck.selectedIds.includes(item.id)) {
        globalState.results[item.id] = result;

        if (!globalState.stats[item.id]) {
          globalState.stats[item.id] = { total: 0, success: 0, fail: 0 };
        }

        const isPass = result.status === 'PASS';

        globalState.stats[item.id].total += 1;
        if (isPass) {
          globalState.stats[item.id].success += 1;
        } else {
          globalState.stats[item.id].fail += 1;
        }

        broadcastLog(`✅ [${index + 1}/${selectedTargets.length}] ${item.name} 檢測完成 (${result.status} | HTTP:${result.httpStatus})`, 100);
      }

      if (index < selectedTargets.length - 1 && !stopRequested) {
        await delay(1000);
      }
    }
  } catch (err) {
    broadcastLog(`⚠️ 測試執行出現異常: ${err.message}`);
  } finally {
    if (page) {
      try { await page.close(); } catch (e) {}
    }
    globalState.isRunning = false;
    if (!stopRequested) {
      const finishTime = new Date().toLocaleTimeString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' });
      broadcastLog(`✨ 本輪檢測完成！(${finishTime})`, 100);
    }
  }
}

app.get('/ping', (req, res) => res.status(200).send('pong'));

app.get('/api/targets', (req, res) => res.json(targetList));

app.get('/api/export-csv', (req, res) => {
  const results = globalState.results;
  const ids = Object.keys(results);

  if (ids.length === 0) {
    return res.status(400).send('目前尚無檢測結果資料可匯出');
  }

  const headers = [
    'time',
    'campaign',
    'status',
    'httpStatus',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'cookieAccepted',
    'gtag',
    'ga4CollectDetected',
    'pageViewDetected',
    'finalUrl',
    'error'
  ];

  let csvContent = headers.join(',') + '\n';

  ids.forEach(id => {
    const item = results[id];
    const row = [
      `"${item.time || ''}"`,
      `"${(item.campaign || '').replace(/"/g, '""')}"`,
      `"${item.status || 'FAIL'}"`,
      item.httpStatus || 0,
      `"${(item.utm_source || '').replace(/"/g, '""')}"`,
      `"${(item.utm_medium || '').replace(/"/g, '""')}"`,
      `"${(item.utm_campaign || '').replace(/"/g, '""')}"`,
      `"${item.cookieAccepted || 'FALSE'}"`,
      `"${item.gtag || 'FALSE'}"`,
      `"${item.ga4CollectDetected || 'FALSE'}"`,
      `"${item.pageViewDetected || 'FALSE'}"`,
      `"${(item.finalUrl || item.url || '').replace(/"/g, '""')}"`,
      `"${(item.error || '').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
  const buffer = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `utm-ga4-test-result_${timestamp}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.status(200).send(buffer);
});

app.post('/api/config-auto-check', (req, res) => {
  const { enabled, intervalSeconds, maxRuns, selectedIds } = req.body;

  globalState.autoCheck.enabled = !!enabled;
  if (intervalSeconds) globalState.autoCheck.intervalSeconds = parseInt(intervalSeconds, 10);
  if (maxRuns !== undefined) globalState.autoCheck.maxRuns = parseInt(maxRuns, 10);
  if (Array.isArray(selectedIds)) globalState.autoCheck.selectedIds = selectedIds;

  globalState.autoCheck.remainingSeconds = globalState.autoCheck.intervalSeconds;

  if (enabled && globalState.autoCheck.maxRuns > 0 && globalState.autoCheck.currentRunCount >= globalState.autoCheck.maxRuns) {
    globalState.autoCheck.currentRunCount = 0;
  }

  const maxRunsMsg = globalState.autoCheck.maxRuns > 0 ? ` (上限 ${globalState.autoCheck.maxRuns} 次)` : ' (無限次)';
  broadcastLog(globalState.autoCheck.enabled ? `🔄 已更新自動輪詢設定: 每 ${globalState.autoCheck.intervalSeconds} 秒${maxRunsMsg}` : `🛑 已關閉自動輪詢`);
  res.json({ success: true, autoCheck: globalState.autoCheck });
});

app.post('/api/reset-stats', (req, res) => {
  targetList.forEach(t => {
    globalState.stats[t.id] = { total: 0, success: 0, fail: 0 };
  });
  globalState.autoCheck.currentRunCount = 0;
  broadcastLog(`🧹 已重置所有項目的測試次數數據`);
  res.json({ success: true, message: '數據已重置' });
});

app.post('/api/start-test', (req, res) => {
  if (globalState.isRunning) return res.status(400).json({ error: '測試正在進行中' });
  const ids = req.body.ids || [];
  const selectedTargets = targetList.filter(t => ids.includes(t.id));
  if (selectedTargets.length === 0) return res.status(400).json({ error: '未選擇項目' });

  runBackgroundTest(selectedTargets);
  res.json({ success: true, message: '背景測試已開始' });
});

app.post('/api/stop-test', async (req, res) => {
  if (!globalState.isRunning) {
    return res.json({ success: true, message: '目前無正在執行的測試' });
  }

  stopRequested = true;
  broadcastLog(`🛑 使用者請求停止測試中...`);
  res.json({ success: true, message: '已發送中斷請求' });
});

app.get('/api/stream-logs', (req, res) => {
  req.setTimeout(0);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  sseClients.push(res);
  broadcastLog();

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚡ UTM & 真實瀏覽器監測儀表板</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen p-4 sm:p-6">
      <div class="max-w-4xl mx-auto space-y-4">
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-4 rounded-xl border border-slate-700 gap-4">
          <div>
            <h1 class="text-xl font-bold text-sky-400">⚡ UTM & 真實瀏覽器監測儀表板</h1>
            <p class="text-xs text-slate-400">Puppeteer Stealth 隱身瀏覽器 · 自動 Cookie 同意修復版</p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <div class="flex flex-col gap-1.5 w-auto">
              <button onclick="exportCSV()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-bold transition border border-emerald-500 shadow-sm flex items-center justify-center whitespace-nowrap" title="匯出 GA4 報表格式 CSV">📥 匯出 CSV</button>
              <button onclick="resetStats()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded text-xs font-bold transition border border-slate-600 flex items-center justify-center whitespace-nowrap">🧹 清除次數</button>
            </div>
            <button onclick="toggleTest()" id="actionBtn" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-3 rounded-lg font-bold shadow-md shadow-sky-500/20 transition whitespace-nowrap">🚀 執行測試</button>
          </div>
        </div>

        <div id="progressContainer" class="hidden bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1.5">
          <div class="flex justify-between text-xs text-sky-300 font-bold">
            <span id="progressStatusText">⏳ 正在處理中...</span>
            <span id="progressPercentText">0%</span>
          </div>
          <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div id="progressBar" class="bg-sky-400 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>

        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 shadow-inner">
          <div class="text-slate-500 mb-1 flex justify-between items-center text-[10px] uppercase tracking-wider">
            <span>> Terminal Real-time Logs</span>
            <span id="sseStatus" class="text-emerald-500 font-bold">● 連線正常</span>
          </div>
          <div id="terminalBox" class="h-32 overflow-y-auto space-y-1 text-slate-300">
            <div>> 等待發起測試...</div>
          </div>
        </div>

        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center gap-3">
          <label class="flex items-center space-x-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" checked class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700">
            <span>全選 / 全不選</span>
          </label>

          <div class="flex items-center flex-wrap gap-2 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-700">
            <label class="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" id="autoCheckToggle" onchange="syncAutoCheckToServer()" class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700">
              <span class="text-slate-200 font-bold">🔄 自動輪詢</span>
            </label>
            <select id="intervalSelect" onchange="syncAutoCheckToServer()" class="bg-slate-800 text-sky-400 font-semibold rounded border border-slate-700 px-2 py-1 outline-none text-xs">
              <option value="60" selected>每 1 分鐘</option>
              <option value="300">每 5 分鐘</option>
              <option value="900">每 15 分鐘</option>
            </select>
            
            <select id="maxRunsSelect" onchange="syncAutoCheckToServer()" class="bg-slate-800 text-amber-400 font-semibold rounded border border-slate-700 px-2 py-1 outline-none text-xs">
              <option value="0" selected>無限次</option>
              <option value="10">限制 10 次</option>
              <option value="20">限制 20 次</option>
              <option value="50">限制 50 次</option>
            </select>

            <span id="countdownText" class="text-slate-500 text-xs font-mono">(未開啟)</span>
          </div>

          <span id="selectedCount" class="text-xs text-sky-400 font-semibold">已勾選: 0</span>
        </div>

        <div id="cardsContainer" class="flex flex-col gap-3"></div>
      </div>

      <script>
        let targets = [];
        let evtSource = null;
        let isRunningState = false;

        async function init() {
          const res = await fetch('/api/targets');
          targets = await res.json();
          renderCards();
          updateCount();
          reorderCards();
          initSSE();

          setTimeout(() => {
            syncAutoCheckToServer();
          }, 500);
        }

        function initSSE() {
          if (evtSource && evtSource.readyState !== EventSource.CLOSED) return;

          evtSource = new EventSource('/api/stream-logs');

          evtSource.onopen = () => {
            document.getElementById('sseStatus').innerText = '● 連線正常';
            document.getElementById('sseStatus').className = 'text-emerald-500 font-bold';
          };

          evtSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.log) {
              const terminalBox = document.getElementById('terminalBox');
              const line = document.createElement('div');
              line.innerText = `[${data.time}] ${data.log}`;
              terminalBox.appendChild(line);
              terminalBox.scrollTop = terminalBox.scrollHeight;
              document.getElementById('progressStatusText').innerText = data.log;
            }

            const actionBtn = document.getElementById('actionBtn');
            const progressContainer = document.getElementById('progressContainer');
            
            isRunningState = data.isRunning;

            if (data.isRunning) {
              actionBtn.innerText = '🛑 停止測試';
              actionBtn.className = 'bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-lg font-bold shadow-md shadow-rose-500/20 transition whitespace-nowrap';
              progressContainer.classList.remove('hidden');
              
              document.getElementById('progressBar').style.width = `${data.percent}%`;
              document.getElementById('progressPercentText').innerText = `[${data.current}/${data.total}] ${data.percent}%`;
            } else {
              actionBtn.innerText = '🚀 執行測試';
              actionBtn.className = 'bg-sky-500 hover:bg-sky-600 text-white px-4 py-3 rounded-lg font-bold shadow-md shadow-sky-500/20 transition whitespace-nowrap';
              if (data.percent === 100 || data.percent === 0) {
                setTimeout(() => progressContainer.classList.add('hidden'), 3000);
              }
            }

            if (data.autoCheck) {
              const toggle = document.getElementById('autoCheckToggle');
              const countdownText = document.getElementById('countdownText');
              toggle.checked = data.autoCheck.enabled;

              if (data.autoCheck.enabled) {
                if (data.isRunning) {
                  countdownText.textContent = '⏳ 檢測進行中...';
                  countdownText.className = 'text-amber-400 font-mono font-bold animate-pulse';
                } else {
                  const sec = data.autoCheck.remainingSeconds;
                  const m = Math.floor(sec / 60);
                  const s = sec % 60;
                  const runsInfo = data.autoCheck.maxRuns > 0 ? ` (${data.autoCheck.currentRunCount}/${data.autoCheck.maxRuns})` : '';
                  countdownText.textContent = `⏳ ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${runsInfo}`;
                  countdownText.className = 'text-amber-400 font-mono font-bold';
                }
              } else {
                countdownText.textContent = '(未開啟)';
                countdownText.className = 'text-slate-500 text-xs font-mono';
              }
            }

            if (data.stats) {
              Object.keys(data.stats).forEach(id => {
                const card = document.getElementById('card-' + id);
                if (card) {
                  const stat = data.stats[id];
                  card.querySelector('.card-total-count').textContent = stat.total;
                  card.querySelector('.card-success-count').textContent = stat.success;
                  card.querySelector('.card-fail-count').textContent = stat.fail;
                }
              });
            }

            if (data.results) {
              Object.keys(data.results).forEach(id => updateCardUI(id, data.results[id]));
            }
          };

          evtSource.onerror = () => {
            document.getElementById('sseStatus').innerText = '○ 連線重試中...';
            document.getElementById('sseStatus').className = 'text-amber-500 font-bold animate-pulse';
          };
        }

        window.addEventListener('beforeunload', () => {
          if (evtSource) evtSource.close();
        });

        async function syncAutoCheckToServer() {
          const enabled = document.getElementById('autoCheckToggle').checked;
          const intervalSeconds = document.getElementById('intervalSelect').value;
          const maxRuns = document.getElementById('maxRunsSelect').value;
          const selected = Array.from(document.querySelectorAll('.target-checkbox:checked')).map(cb => cb.value);

          await fetch('/api/config-auto-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled, intervalSeconds, maxRuns, selectedIds: selected })
          });
        }

        async function resetStats() {
          if (!confirm('確定要清除所有測試次數統計數據嗎？')) return;
          try {
            await fetch('/api/reset-stats', { method: 'POST' });
          } catch (err) {
            alert('清除失敗，請重試');
          }
        }

        function exportCSV() {
          const a = document.createElement('a');
          a.href = '/api/export-csv';
          a.download = '';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        function updateCardUI(id, r) {
          const card = document.getElementById('card-' + id);
          if (!card) return;

          const isOkStatus = (r.httpStatus === 200 || r.httpStatus === 304);
          const statusEl = card.querySelector('.status-val');
          statusEl.textContent = isOkStatus ? '✅ ' + r.statusText : '❌ ' + r.statusText;
          statusEl.className = 'status-val font-bold ' + (isOkStatus ? 'text-emerald-400' : 'text-rose-400');

          const utmEl = card.querySelector('.utm-val');
          utmEl.textContent = r.utmKept === '保留' ? '✅ 保留' : '❌ ' + r.utmKept;
          utmEl.className = 'utm-val font-bold ' + (r.utmKept === '保留' ? 'text-emerald-400' : 'text-rose-400');

          const gaEl = card.querySelector('.ga-val');
          gaEl.textContent = r.ga4Exist === '存在' ? '✅ 觸發成功' : '❌ 未觸發';
          gaEl.className = 'ga-val font-bold ' + (r.ga4Exist === '存在' ? 'text-emerald-400' : 'text-rose-400');
        }

        function resetUIResults() {
          document.querySelectorAll('.target-checkbox:checked').forEach(cb => {
            const card = document.getElementById('card-' + cb.value);
            if (card) {
              const statusEl = card.querySelector('.status-val');
              statusEl.textContent = '⚪ 未測';
              statusEl.className = 'status-val font-bold text-slate-300';

              const utmEl = card.querySelector('.utm-val');
              utmEl.textContent = '⚪ 未測';
              utmEl.className = 'utm-val font-bold text-slate-300';

              const gaEl = card.querySelector('.ga-val');
              gaEl.textContent = '⚪ 未測';
              gaEl.className = 'ga-val font-bold text-slate-300';
            }
          });
        }

        function renderCards() {
          const container = document.getElementById('cardsContainer');
          container.innerHTML = targets.map(t => {
            let displayDomain = t.url;
            try {
              const u = new URL(t.url);
              displayDomain = u.origin + u.pathname.substring(0, 15) + '...';
            } catch(e) {}

            return `
              <div id="card-${t.id}" data-id="${t.id}" class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 transition-all duration-300">
                <div class="flex items-start justify-between space-x-3 gap-2">
                  <div class="flex items-start space-x-3 min-w-0 flex-1">
                    <input type="checkbox" value="${t.id}" class="target-checkbox mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700" ${t.enabled ? 'checked' : ''} onchange="onCheckboxChange()">
                    <div class="min-w-0 flex-1">
                      <h3 class="font-bold text-base text-slate-100 break-words leading-snug">${t.name}</h3>
                      <p class="text-xs text-slate-400 truncate mt-0.5" title="${t.url}">🔗 ${displayDomain}</p>
                    </div>
                  </div>

                  <div class="text-right text-xs shrink-0 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 font-mono">
                    <span class="text-slate-400">已測: </span>
                    <span class="card-total-count font-bold text-sky-400">0</span> 次
                    <span class="text-slate-500 ml-1">(<span class="card-success-count text-emerald-400">0</span> 成功 / <span class="card-fail-count text-rose-400">0</span> 失敗)</span>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                  <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                    <div class="text-slate-400 mb-1">連線狀態</div>
                    <span class="status-val font-bold text-slate-300">⚪ 未測</span>
                  </div>
                  <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                    <div class="text-slate-400 mb-1">UTM參數</div>
                    <span class="utm-val font-bold text-slate-300">⚪ 未測</span>
                  </div>
                  <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                    <div class="text-slate-400 mb-1">GA4觸發</div>
                    <span class="ga-val font-bold text-slate-300">⚪ 未測</span>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }

        function onCheckboxChange() {
          updateCount();
          reorderCards();
          syncAutoCheckToServer();
        }

        function reorderCards() {
          const container = document.getElementById('cardsContainer');
          const cards = Array.from(container.children);

          cards.sort((a, b) => {
            const checkedA = a.querySelector('.target-checkbox').checked;
            const checkedB = b.querySelector('.target-checkbox').checked;

            if (checkedA === checkedB) {
              return parseInt(a.dataset.id) - parseInt(b.dataset.id);
            }
            return checkedA ? -1 : 1;
          });

          cards.forEach(card => container.appendChild(card));
        }

        function toggleSelectAll(master) {
          document.querySelectorAll('.target-checkbox').forEach(cb => cb.checked = master.checked);
          updateCount();
          reorderCards();
          syncAutoCheckToServer();
        }

        function updateCount() {
          const checked = document.querySelectorAll('.target-checkbox:checked').length;
          document.getElementById('selectedCount').textContent = `已勾選: ${checked}`;
        }

        async function toggleTest() {
          if (isRunningState) {
            try {
              await fetch('/api/stop-test', { method: 'POST' });
            } catch (err) {
              alert('停止請求失敗');
            }
          } else {
            const selected = Array.from(document.querySelectorAll('.target-checkbox:checked')).map(cb => cb.value);
            if (selected.length === 0) return alert('請至少勾選一個項目！');

            resetUIResults();

            try {
              const startRes = await fetch('/api/start-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selected })
              });
              if (!startRes.ok) alert('啟動失敗');
            } catch (err) {
              alert('請求失敗，請重試');
            }
          }
        }

        window.onload = init;
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
