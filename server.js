const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 預設監測網址清單
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

// 核心頁面檢測邏輯（方案 2：每次獨立建立全新 Browser）
async function checkUrlWithPuppeteer(item) {
  let browser = null;
  let page = null;
  let ga4Fired = false;

  try {
    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;

    // ⭐️ 每次檢測都開啟一個完全獨立的全新 Chrome 進程，避開跨頁面的 Session/WAF 風控
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote'
      ]
    });

    page = await browser.newPage();

    // 1. 設定真實 User-Agent 與模擬正常環境 Header
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    await page.setExtraHTTPHeaders({
      'accept-language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // 2. CDP 原生阻擋大型多媒體資源
    try {
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.setBlockedUrlPatterns', {
        patterns: [
          '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg',
          '*.woff', '*.woff2', '*.ttf', '*.otf',
          '*.mp4', '*.webm'
        ]
      });
    } catch (cdpErr) {}

    // 3. 監聽 GA4 / GTM 請求
    page.on('request', request => {
      const reqUrl = request.url().toLowerCase();
      if (
        reqUrl.includes('google-analytics.com') || 
        reqUrl.includes('analytics.google.com') ||
        reqUrl.includes('googletagmanager.com') ||
        reqUrl.includes('/collect') ||
        reqUrl.includes('gtm.js')
      ) {
        ga4Fired = true;
      }
    });

    // 4. 前往網址（放寬逾時時間至 45 秒）
    const response = await page.goto(item.url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    const httpStatus = response ? response.status() : 0;

    // 5. 自動點擊 Cookie 同意按鈕
    const cookieSelectors = [
      '#onetrust-accept-btn-handler',
      'button[id*="accept"]',
      'button[class*="accept"]',
      '.cookie-consent-accept',
      '#accept-cookies'
    ];

    for (const selector of cookieSelectors) {
      const btn = await page.waitForSelector(selector, { timeout: 1500 }).catch(() => null);
      if (btn) {
        await btn.click().catch(() => {});
        break;
      }
    }

    // 6. 模擬捲動觸發 Lazy-load
    await page.evaluate(() => window.scrollBy(0, 400)).catch(() => {});

    // 7. 動態輪詢 GA4 封包（最長 4 秒）
    const maxWaitTime = 4000;
    const checkInterval = 200;
    let waited = 0;

    while (!ga4Fired && waited < maxWaitTime) {
      await new Promise(r => setTimeout(r, checkInterval));
      waited += checkInterval;
    }

    // 8. 驗證 UTM 參數
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
      id: item.id,
      name: item.name,
      url: item.url,
      status: httpStatus,
      statusText: httpStatus === 200 ? '正常(200)' : `異常(${httpStatus})`,
      utmKept: hasUtm ? '保留' : '丟失/未帶入',
      ga4Exist: ga4Fired ? '存在' : '缺失'
    };

  } catch (error) {
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      status: 0,
      statusText: '連線逾時/失敗',
      utmKept: '無',
      ga4Exist: '無'
    };
  } finally {
    // ⭐️ 確保不論成功或拋出 Exception，都徹底關閉頁面與瀏覽器，防止記憶體洩漏
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

app.use(express.json());

// 取得目標清單
app.get('/api/targets', (req, res) => res.json(targetList));

// 執行測試 (SSE + Keep-Alive 心跳包 + 項目間 4 秒緩衝)
app.get('/api/run-test', async (req, res) => {
  const ids = req.query.ids ? req.query.ids.split(',') : [];
  const selectedTargets = targetList.filter(t => ids.includes(t.id));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendEvent = (type, payload) => res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);

  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 10000);

  try {
    for (const [index, item] of selectedTargets.entries()) {
      sendEvent('log', { message: `[${index + 1}/${selectedTargets.length}] Puppeteer 獨立模擬開啟中: ${item.name}...` });
      
      let result;
      try {
        result = await checkUrlWithPuppeteer(item);
      } catch (err) {
        result = {
          id: item.id,
          name: item.name,
          url: item.url,
          status: 0,
          statusText: '檢測過程異常',
          utmKept: '無',
          ga4Exist: '無'
        };
      }

      sendEvent('result', { data: result });

      // ⭐️ 項目間停頓 4 秒，給予伺服器足夠冷卻時間，大幅降低被 WAF 擋掉的機率
      if (index < selectedTargets.length - 1) {
        await new Promise(r => setTimeout(r, 4000));
      }
    }

    sendEvent('done', {});
  } catch (globalError) {
    console.error('SSE 全域錯誤:', globalError);
  } finally {
    clearInterval(keepAliveInterval);
    res.end();
  }
});

// 前端 UI 畫面
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
    <body class="bg-slate-900 text-slate-100 min-h-screen p-6">
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-4 rounded-xl border border-slate-700 gap-4">
          <div>
            <h1 class="text-xl font-bold text-sky-400">⚡ UTM & 真實瀏覽器監測儀表板</h1>
            <p class="text-xs text-slate-400">Puppeteer 無頭瀏覽器 · 模擬點擊 Cookie & GA4 封包監控</p>
          </div>
          <button onclick="runTest()" id="startBtn" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-sky-500/20 w-full sm:w-auto">🚀 執行測試</button>
        </div>

        <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center gap-3">
          <label class="flex items-center space-x-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" checked class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700">
            <span>全選 / 全不選</span>
          </label>

          <div class="flex items-center space-x-2 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-700">
            <label class="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" id="autoCheckToggle" onchange="toggleAutoCheck()" class="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700">
              <span class="text-slate-200 font-bold">🔄 自動輪詢</span>
            </label>
            <select id="intervalSelect" onchange="updateAutoCheckInterval()" class="bg-slate-800 text-sky-400 font-semibold rounded border border-slate-700 px-2 py-1 outline-none text-xs">
              <option value="60" selected>每 1 分鐘</option>
              <option value="300">每 5 分鐘</option>
              <option value="900">每 15 分鐘</option>
            </select>
            <span id="countdownText" class="text-slate-500 text-xs font-mono">(未開啟)</span>
          </div>

          <span id="selectedCount" class="text-xs text-sky-400 font-semibold">已勾選: 0</span>
        </div>

        <div id="statusBox" class="hidden bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs text-sky-300">⏳ 處理中...</div>
        <div id="cardsContainer" class="space-y-3"></div>
      </div>

      <script>
        let targets = [];
        let countdownTimer = null;
        let remainingSeconds = 0;
        let itemStats = {};
        let isTesting = false;

        async function init() {
          const res = await fetch('/api/targets');
          targets = await res.json();
          renderCards();
          updateCount();
        }

        function renderCards() {
          const container = document.getElementById('cardsContainer');
          container.innerHTML = targets.map(t => \`
            <div id="card-\${t.id}" class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
              <div class="flex items-start justify-between space-x-3 gap-2">
                <div class="flex items-start space-x-3 min-w-0 flex-1">
                  <input type="checkbox" value="\${t.id}" class="target-checkbox mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700" \${t.enabled ? 'checked' : ''} onchange="updateCount()">
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
        }

        function updateCount() {
          const checked = document.querySelectorAll('.target-checkbox:checked').length;
          document.getElementById('selectedCount').textContent = \`已勾選: \${checked}\`;
        }

        function toggleAutoCheck() {
          const enabled = document.getElementById('autoCheckToggle').checked;
          if (enabled) {
            if (!isTesting) startCountdown();
          } else {
            stopCountdown();
          }
        }

        function updateAutoCheckInterval() {
          if (document.getElementById('autoCheckToggle').checked && !isTesting) {
            startCountdown();
          }
        }

        function startCountdown() {
          stopCountdown();
          remainingSeconds = parseInt(document.getElementById('intervalSelect').value, 10);
          updateCountdownDisplay();

          countdownTimer = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds <= 0) {
              stopCountdown();
              runTest();
            } else {
              updateCountdownDisplay();
            }
          }, 1000);
        }

        function stopCountdown() {
          if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
          }
          updateCountdownDisplay();
        }

        function updateCountdownDisplay() {
          const enabled = document.getElementById('autoCheckToggle').checked;
          const countdownText = document.getElementById('countdownText');

          if (!enabled) {
            countdownText.textContent = '(未開啟)';
            countdownText.className = 'text-slate-500 text-xs font-mono';
            return;
          }

          if (isTesting) {
            countdownText.textContent = '⏳ 檢測進行中...';
            countdownText.className = 'text-amber-400 font-mono font-bold animate-pulse';
            return;
          }

          const m = Math.floor(remainingSeconds / 60);
          const s = remainingSeconds % 60;
          countdownText.textContent = \`⏳ \${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')} 後觸發\`;
          countdownText.className = 'text-amber-400 font-mono font-bold';
        }

        function runTest() {
          const selected = Array.from(document.querySelectorAll('.target-checkbox:checked')).map(cb => cb.value);
          if (selected.length === 0) return alert('請至少勾選一個項目！');

          isTesting = true;
          stopCountdown();

          const startBtn = document.getElementById('startBtn');
          const statusBox = document.getElementById('statusBox');
          startBtn.disabled = true;
          startBtn.classList.add('opacity-50');
          statusBox.classList.remove('hidden');

          const evtSource = new EventSource('/api/run-test?ids=' + selected.join(','));

          evtSource.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'log') {
              statusBox.textContent = \`⏳ \${data.message}\`;
            } else if (data.type === 'result') {
              const r = data.data;
              const card = document.getElementById('card-' + r.id);

              if (!itemStats[r.id]) {
                itemStats[r.id] = { total: 0, success: 0, fail: 0 };
              }

              const isPass = r.status === 200 && r.utmKept === '保留' && r.ga4Exist === '存在';
              
              itemStats[r.id].total++;
              if (isPass) {
                itemStats[r.id].success++;
              } else {
                itemStats[r.id].fail++;
              }

              if (card) {
                card.querySelector('.card-total-count').textContent = itemStats[r.id].total;
                card.querySelector('.card-success-count').textContent = itemStats[r.id].success;
                card.querySelector('.card-fail-count').textContent = itemStats[r.id].fail;

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
            } else if (data.type === 'done') {
              evtSource.close();
              statusBox.textContent = '✨ 檢測完成！(' + new Date().toLocaleTimeString() + ')';
              startBtn.disabled = false;
              startBtn.classList.remove('opacity-50');

              isTesting = false;
              if (document.getElementById('autoCheckToggle').checked) {
                startCountdown();
              } else {
                updateCountdownDisplay();
              }
            }
          };

          evtSource.onerror = () => {
            evtSource.close();
            statusBox.textContent = '❌ 連線中斷';
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50');

            isTesting = false;
            if (document.getElementById('autoCheckToggle').checked) {
              startCountdown();
            } else {
              updateCountdownDisplay();
            }
          };
        }

        init();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
