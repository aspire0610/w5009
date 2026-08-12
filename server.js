const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let targetList = [
  { id: "1", name: "花櫃", url: "https://www.costco.com.tw/Sports-Lifestyle/Garden-Lifestyle/Flowers-Plant/c/121307?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-flowers", enabled: true },
  { id: "2", name: "珠寶櫃", url: "https://www.costco.com.tw/Jewelry-Gold/Jewelry-Buying-guide/Jewelry-Gold/c/CL10?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-jewelry", enabled: true },
  { id: "3", name: "Rollout 家具海報", url: "https://www.costco.com.tw/content/showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=Poster-FurnitureRollOut", enabled: true },
  { id: "4", name: "Rollout Lsign", url: "https://www.costco.com.tw/content/showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-FurnitureRollOut", enabled: true },
  { id: "5", name: "吊掛", url: "https://www.costco.com.tw/c/hero-showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=showroom-hangingbanner", enabled: true }
];

// 全域共享的 Puppeteer Browser 實例（提升執行速度）
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;

    browserInstance = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled' // 隱藏自動化特徵
      ]
    });
  }
  return browserInstance;
}
async function checkUrlWithPuppeteer(item) {
  let page = null;
  let ga4Fired = false;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // 1. 設定真實 User-Agent 與避開自動化檢測機制
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    // 隱藏 navigator.webdriver 機器人標籤
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // 2. 監聽網路請求：捕捉 GA4 collect 封包
    page.on('request', request => {
      const reqUrl = request.url();
      if (reqUrl.includes('google-analytics.com/g/collect') || reqUrl.includes('analytics.google.com/g/collect')) {
        ga4Fired = true;
      }
    });

    // 3. 改用 domcontentloaded 避免等不到 networkidle 而逾時
    const response = await page.goto(item.url, {
      waitUntil: 'domcontentloaded', 
      timeout: 45000 // 加長逾時時間至 45 秒
    });

    const httpStatus = response ? response.status() : 0;

    // 4. 等待 5 秒讓背景 Cookie 視窗與 GA4 觸發
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. 自動尋找並點擊 Cookie 同意按鈕
    try {
      const cookieSelectors = [
        '#onetrust-accept-btn-handler',
        'button[id*="accept"]',
        'button[class*="accept"]',
        '.cookie-consent-accept',
        '#accept-cookies'
      ];

      for (const selector of cookieSelectors) {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          await new Promise(resolve => setTimeout(resolve, 2000)); // 點擊後等待 2 秒
          break;
        }
      }
    } catch (e) {
      // 若無跳出 Cookie 視窗則忽略
    }

    // 6. 檢查最終 URL 是否有保留 UTM 參數
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

    await page.close();

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
    if (page) await page.close();
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      status: 0,
      statusText: '連線逾時/失敗',
      utmKept: '無',
      ga4Exist: '無'
    };
  }
}

app.use(express.json());

app.get('/api/targets', (req, res) => res.json(targetList));

app.get('/api/run-test', async (req, res) => {
  const ids = req.query.ids ? req.query.ids.split(',') : [];
  const selectedTargets = targetList.filter(t => ids.includes(t.id));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (type, payload) => res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);

  for (const [index, item] of selectedTargets.entries()) {
    sendEvent('log', { message: `[${index + 1}/${selectedTargets.length}] Puppeteer 模擬開啟中: ${item.name}...` });
    const result = await checkUrlWithPuppeteer(item);
    sendEvent('result', { data: result });
  }

  sendEvent('done', {});
  res.end();
});

// 前端 UI 保持不變，可直接復用之前的系統 UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚡ UTM & GA4 真實瀏覽器儀表板</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen p-6">
      <div class="max-w-4xl mx-auto space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-4 rounded-xl border border-slate-700 gap-4">
          <div>
            <h1 class="text-xl font-bold text-sky-400">⚡ 5009UTM & 真實瀏覽器監測儀表板</h1>
            <p class="text-xs text-slate-400">模擬點擊 Cookie & GA4 封包監控</p>
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
              <span class="text-slate-200 font-bold">🔄 自動重複測試</span>
            </label>
            <select id="intervalSelect" onchange="updateAutoCheckInterval()" class="bg-slate-800 text-sky-400 font-semibold rounded border border-slate-700 px-2 py-1 outline-none text-xs">    
            <option value="30">每 30 秒（測試用）</option>
              <option value="60">每 1 分鐘</option>
              <option value="300" selected>每 5 分鐘</option>
              <option value="900">每 15 分鐘</option>
              <option value="1800">每 30 分鐘</option>
            </select>
            <span id="countdownText" class="text-amber-400 font-mono font-bold"></span>
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
  let isTesting = false; // 紀錄目前是否正在執行測試

  async function init() {
    const res = await fetch('/api/targets');
    targets = await res.json();
    renderCards();
    updateCount();
    updateCountdownDisplay();
  }

  function renderCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = targets.map(t => `
      <div id="card-${t.id}" class="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
        <div class="flex items-start justify-between space-x-3 gap-2">
          <div class="flex items-start space-x-3 min-w-0 flex-1">
            <input type="checkbox" value="${t.id}" class="target-checkbox mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700" ${t.enabled ? 'checked' : ''} onchange="updateCount()">
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-base text-slate-100 truncate">${t.name}</h3>
              <p class="text-xs text-slate-400 truncate">${t.url}</p>
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
    `).join('');
  }

  function toggleSelectAll(master) {
    document.querySelectorAll('.target-checkbox').forEach(cb => cb.checked = master.checked);
    updateCount();
  }

  function updateCount() {
    const checked = document.querySelectorAll('.target-checkbox:checked').length;
    document.getElementById('selectedCount').textContent = `已勾選: ${checked}`;
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
        runTest(); // 倒數完畢自動觸發，測試期間會自動停止計時
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
  countdownText.textContent = `⏳ ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} 後觸發`;
  countdownText.className = 'text-amber-400 font-mono font-bold';
}
  function runTest() {
    const selected = Array.from(document.querySelectorAll('.target-checkbox:checked')).map(cb => cb.value);
    if (selected.length === 0) return alert('請至少勾選一個項目！');

    isTesting = true;
    stopCountdown(); // 開始測試時立刻暫停/清除倒數

    const startBtn = document.getElementById('startBtn');
    const statusBox = document.getElementById('statusBox');
    startBtn.disabled = true;
    startBtn.classList.add('opacity-50');
    statusBox.classList.remove('hidden');

    const evtSource = new EventSource('/api/run-test?ids=' + selected.join(','));

    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'log') {
        statusBox.textContent = `⏳ ${data.message}`;
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
        // 測試完成後，若「自動輪詢」依然勾選著，才開始全新一輪的倒數
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
      // 發生異常結束時同樣重置狀態，並依據開關決定是否重新倒數
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
