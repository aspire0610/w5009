const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. 引入 puppeteer-extra 並掛載 Stealth 隱身外掛
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// 中間件解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 全局狀態
let globalState = {
  isRunning: false,
  currentLog: '',
  total: 0,
  current: 0,
  results: {},
  autoCheck: {
    enabled: false,
    intervalSeconds: 60,
    remainingSeconds: 0,
    selectedIds: targetList.map(t => t.id)
  }
};

let sseClients = [];
let globalBrowser = null;

/**
 * 取得/管理 單一 Browser 實例（重用瀏覽器）
 */
async function getBrowserInstance() {
  if (globalBrowser && globalBrowser.isConnected()) {
    return globalBrowser;
  }
  
  globalBrowser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768'
    ]
  });

  return globalBrowser;
}

/**
 * 廣播狀態給所有連線中的前端 (SSE)
 */
function broadcastLog(logText) {
  if (logText) globalState.currentLog = logText;
  const percent = globalState.total > 0 ? Math.round((globalState.current / globalState.total) * 100) : 0;
  
  const payload = {
    time: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
    log: globalState.currentLog,
    percent: percent,
    isRunning: globalState.isRunning,
    current: globalState.current,
    total: globalState.total,
    results: globalState.results,
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

// 後端掌控的定時器（每秒觸發一次倒數）
setInterval(() => {
  if (globalState.autoCheck.enabled && !globalState.isRunning) {
    globalState.autoCheck.remainingSeconds--;

    if (globalState.autoCheck.remainingSeconds <= 0) {
      globalState.autoCheck.remainingSeconds = globalState.autoCheck.intervalSeconds;
      
      const selectedTargets = targetList.filter(t => globalState.autoCheck.selectedIds.includes(t.id));
      
      if (selectedTargets.length > 0) {
        broadcastLog(`⏰ [自動輪詢觸發] 開始執行 ${selectedTargets.length} 個項目的例行檢測...`);
        runBackgroundTest(selectedTargets);
      } else {
        broadcastLog(`⏰ [自動輪詢觸發] 倒數結束，但目前未勾選任何檢測項目`);
      }
    }
    broadcastLog();
  }
}, 1000);

// SSE 心跳包
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

// Puppeteer 核心檢測邏輯
async function checkUrlWithPuppeteer(item, retryCount = 0) {
  let page = null;
  let ga4Fired = false;

  try {
    const browser = await getBrowserInstance();
    page = await browser.newPage();
    
    // 設置 30 秒 Timeout 限制
    page.setDefaultNavigationTimeout(30000);

    // 擬真 User-Agent 與 Header 設定
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({
      'accept-language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1'
    });

    // 注入 Cookie 避開彈窗阻擋
    const domain = '.costco.com.tw';
    await page.setCookie(
      { name: 'OptanonAlertBoxClosed', value: new Date().toISOString(), domain: domain, path: '/' },
      { name: 'OptanonConsent', value: 'isGpcEnabled=0&datavalue=1&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1', domain: domain, path: '/' }
    );

    // GA4 封包監控
    page.on('request', request => {
      const reqUrl = request.url().toLowerCase();
      if (reqUrl.includes('google-analytics.com') || reqUrl.includes('analytics.google.com') || reqUrl.includes('googletagmanager.com') || reqUrl.includes('/collect') || reqUrl.includes('gtm.js')) {
        ga4Fired = true;
      }
    });

    // 使用 domcontentloaded 避免被卡在長連線 / 影音資源加載
    const response = await page.goto(item.url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });

    const httpStatus = response ? response.status() : 0;

    // 模擬滑動頁面觸發 GA4 事件
    await page.evaluate(() => window.scrollBy(0, 300)).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const finalUrl = page.url();
    let hasUtm = false;
    try {
      const originalParams = new URL(item.url).searchParams;
      const finalParams = new URL(finalUrl).searchParams;
      const expectedCampaign = originalParams.get('utm_campaign');
      if (expectedCampaign) {
        hasUtm = finalParams.get('utm_campaign') === expectedCampaign;
      } else {
        hasUtm = Array.from(originalParams.keys()).some(k => k.startsWith('utm_') && finalParams.has(k));
      }
    } catch (e) {
      hasUtm = false;
    }

    return {
      id: item.id, name: item.name, url: item.url, status: httpStatus,
      statusText: httpStatus === 200 ? '正常(200)' : `異常(${httpStatus})`,
      utmKept: hasUtm ? '保留' : '丟失/未帶入', ga4Exist: ga4Fired ? '存在' : '缺失'
    };

  } catch (error) {
    console.error(`[檢測失敗 Error] ${item.name}:`, error.message);

    if (page) await page.close().catch(() => {});

    // 重試 1 次機制
    if (retryCount < 1) {
      await new Promise(r => setTimeout(r, 3000));
      return await checkUrlWithPuppeteer(item, retryCount + 1);
    }
    
    return { 
      id: item.id, 
      name: item.name, 
      url: item.url, 
      status: 0, 
      statusText: error.message.includes('Timeout') ? '連線逾時(30s)' : '被擋/連線失敗', 
      utmKept: '無', 
      ga4Exist: '無' 
    };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// 伺服器背景測試任務
async function runBackgroundTest(selectedTargets) {
  globalState.isRunning = true;
  globalState.total = selectedTargets.length;
  globalState.current = 0;

  broadcastLog(`🚀 背景測試已啟動，共選取 ${selectedTargets.length} 個目標`);

  for (const [index, item] of selectedTargets.entries()) {
    globalState.current = index + 1;
    broadcastLog(`[${index + 1}/${selectedTargets.length}] 模擬開啟中: ${item.name}...`);
    
    let result;
    try {
      result = await checkUrlWithPuppeteer(item);
    } catch (err) {
      result = { id: item.id, name: item.name, url: item.url, status: 0, statusText: '檢測過程異常', utmKept: '無', ga4Exist: '無' };
    }

    globalState.results[item.id] = result;
    broadcastLog(`✅ [${index + 1}/${selectedTargets.length}] ${item.name} 檢測完成 (${result.statusText})`);

    // 調大爬蟲間隔（3.5 秒），避免觸發站方的 IP 頻率限制 (Rate Limit)
    if (index < selectedTargets.length - 1) {
      await new Promise(r => setTimeout(r, 3500));
    }
  }

  // 完成後重置 Browser，清空資源
  if (globalBrowser) {
    await globalBrowser.close().catch(() => {});
    globalBrowser = null;
  }

  globalState.isRunning = false;
  broadcastLog(`✨ 檢測完成！(${new Date().toLocaleTimeString()})`);
}

// API 路由
app.get('/ping', (req, res) => res.status(200).send('pong'));

app.get('/api/targets', (req, res) => res.json(targetList));

app.post('/api/config-auto-check', (req, res) => {
  const { enabled, intervalSeconds, selectedIds } = req.body;
  globalState.autoCheck.enabled = enabled;
  if (intervalSeconds) globalState.autoCheck.intervalSeconds = parseInt(intervalSeconds, 10);
  if (selectedIds) globalState.autoCheck.selectedIds = selectedIds;
  
  if (enabled) {
    globalState.autoCheck.remainingSeconds = globalState.autoCheck.intervalSeconds;
  }
  
  broadcastLog(enabled ? `🔄 已開啟自動輪詢 (每 ${globalState.autoCheck.intervalSeconds} 秒)` : `🛑 已關閉自動輪詢`);
  res.json({ success: true, autoCheck: globalState.autoCheck });
});

app.post('/api/start-test', (req, res) => {
  if (globalState.isRunning) return res.status(400).json({ error: '測試正在進行中' });
  const ids = req.body.ids || [];
  const selectedTargets = targetList.filter(t => ids.includes(t.id));
  if (selectedTargets.length === 0) return res.status(400).json({ error: '未選擇項目' });

  runBackgroundTest(selectedTargets);
  res.json({ success: true, message: '背景測試已開始' });
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

// 首頁介面 (前端修正了 SSE 連線洩漏問題)
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
            <p class="text-xs text-slate-400">Puppeteer Stealth 隱身瀏覽器 · Cookie 預注入與 GA4 封包監控</p>
          </div>
          <button onclick="runTest()" id="startBtn" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-sky-500/20 w-full sm:w-auto transition">🚀 執行測試</button>
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
          <div id="terminalBox" class="h-20 overflow-y-auto space-y-1 text-slate-300">
            <div>> 等待發起測試...</div>
          </div>
        </div>

        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center gap-3">
          <label class="flex items-center space-x-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" checked class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700">
            <span>全選 / 全不選</span>
          </label>

          <div class="flex items-center space-x-2 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-700">
            <label class="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" id="autoCheckToggle" onchange="syncAutoCheckToServer()" class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700">
              <span class="text-slate-200 font-bold">🔄 自動輪詢</span>
            </label>
            <select id="intervalSelect" onchange="syncAutoCheckToServer()" class="bg-slate-800 text-sky-400 font-semibold rounded border border-slate-700 px-2 py-1 outline-none text-xs">
              <option value="60" selected>每 1 分鐘</option>
              <option value="300">每 5 分鐘</option>
              <option value="900">每 15 分鐘</option>
            </select>
            <span id="countdownText" class="text-slate-500 text-xs font-mono">(未開啟)</span>
          </div>

          <span id="selectedCount" class="text-xs text-sky-400 font-semibold">已勾選: 0</span>
        </div>

        <div id="cardsContainer" class="space-y-3"></div>
      </div>

      <script>
        let targets = [];
        let itemStats = {};
        let processedResultIds = new Set();
        let evtSource = null;

        async function init() {
          const res = await fetch('/api/targets');
          targets = await res.json();
          renderCards();
          updateCount();
          initSSE();

          setTimeout(() => {
            syncAutoCheckToServer();
          }, 500);
        }

        function initSSE() {
          if (evtSource && evtSource.readyState !== EventSource.CLOSED) {
            return; // 避免重複創建 SSE 連線
          }

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
              line.innerText = \`[\${data.time}] \${data.log}\`;
              terminalBox.appendChild(line);
              terminalBox.scrollTop = terminalBox.scrollHeight;
              document.getElementById('progressStatusText').innerText = data.log;
            }

            const startBtn = document.getElementById('startBtn');
            const progressContainer = document.getElementById('progressContainer');
            if (data.isRunning) {
              if (data.current === 1) {
                processedResultIds.clear();
              }
              startBtn.disabled = true;
              startBtn.classList.add('opacity-50');
              progressContainer.classList.remove('hidden');
              document.getElementById('progressBar').style.width = \`\${data.percent}%\`;
              document.getElementById('progressPercentText').innerText = \`\${data.percent}%\`;
            } else {
              startBtn.disabled = false;
              startBtn.classList.remove('opacity-50');
              if (data.percent === 100) setTimeout(() => progressContainer.classList.add('hidden'), 3000);
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
                  countdownText.textContent = \`⏳ \${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')} 後觸發\`;
                  countdownText.className = 'text-amber-400 font-mono font-bold';
                }
              } else {
                countdownText.textContent = '(未開啟)';
                countdownText.className = 'text-slate-500 text-xs font-mono';
              }
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

        // 當頁面關閉或切換分頁時正確關閉連線
        window.addEventListener('beforeunload', () => {
          if (evtSource) evtSource.close();
        });

        async function syncAutoCheckToServer() {
          const enabled = document.getElementById('autoCheckToggle').checked;
          const intervalSeconds = document.getElementById('intervalSelect').value;
          const selected = Array.from(document.querySelectorAll('.target-checkbox:checked')).map(cb => cb.value);

          await fetch('/api/config-auto-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled, intervalSeconds, selectedIds: selected })
          });
        }

        function updateCardUI(id, r) {
          const card = document.getElementById('card-' + id);
          if (!card) return;

          if (!processedResultIds.has(id)) {
            processedResultIds.add(id);
            if (!itemStats[id]) itemStats[id] = { total: 0, success: 0, fail: 0 };
            const isPass = r.status === 200 && r.utmKept === '保留' && r.ga4Exist === '存在';
            itemStats[id].total++;
            if (isPass) itemStats[id].success++; else itemStats[id].fail++;
          }

          card.querySelector('.card-total-count').textContent = itemStats[id].total;
          card.querySelector('.card-success-count').textContent = itemStats[id].success;
          card.querySelector('.card-fail-count').textContent = itemStats[id].fail;

          const statusEl = card.querySelector('.status-val');
          statusEl.textContent = r.status === 200 ? '✅ ' + r.statusText : '❌ ' + r.statusText;
          statusEl.className = 'status-val font-bold ' + (r.status === 200 ? 'text-emerald-400' : 'text-rose-400');

          const utmEl = card.querySelector('.utm-val');
          utmEl.textContent = r.utmKept === '保留' ? '✅ 保留' : '❌ ' + r.utmKept;
          utmEl.className = 'utm-val font-bold ' + (r.utmKept === '保留' ? 'text-emerald-400' : 'text-rose-400');

          const gaEl = card.querySelector('.ga-val');
          gaEl.textContent = r.ga4Exist === '存在' ? '✅ 觸發成功' : '❌ 未觸發';
          gaEl.className = 'ga-val font-bold ' + (r.ga4Exist === '存在' ? 'text-emerald-400' : 'text-rose-400');
        }

        function renderCards() {
          const container = document.getElementById('cardsContainer');
          container.innerHTML = targets.map(t => \`
            <div id="card-\${t.id}" class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
              <div class="flex items-start justify-between space-x-3 gap-2">
                <div class="flex items-start space-x-3 min-w-0 flex-1">
                  <input type="checkbox" value="\${t.id}" class="target-checkbox mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700" \${t.enabled ? 'checked' : ''} onchange="updateCount(); syncAutoCheckToServer();">
                  <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-base text-slate-100 truncate">\${t.name}</h3>
                    <p class="text-xs text-slate-400 truncate">\${t.url}</p>
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
          \`).join('');
        }

        function toggleSelectAll(master) {
          document.querySelectorAll('.target-checkbox').forEach(cb => cb.checked = master.checked);
          updateCount();
          syncAutoCheckToServer();
        }

        function updateCount() {
          const checked = document.querySelectorAll('.target-checkbox:checked').length;
          document.getElementById('selectedCount').textContent = \`已勾選: \${checked}\`;
        }

        async function runTest() {
          const selected = Array.from(document.querySelectorAll('.target-checkbox:checked')).map(cb => cb.value);
          if (selected.length === 0) return alert('請至少勾選一個項目！');

          processedResultIds.clear();
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

        init();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`🚀 監測伺服器運作中 PORT: ${PORT}`));
