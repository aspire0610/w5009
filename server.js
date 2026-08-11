const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let targetList = [
  { id: "1", name: "花櫃", url: "https://www.costco.com.tw/Sports-Lifestyle/Garden-Lifestyle/Flowers-Plant/c/121307?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-flowers", enabled: true },
  { id: "2", name: "珠寶櫃", url: "https://www.costco.com.tw/Jewelry-Gold/Jewelry-Buying-guide/Jewelry-Gold/c/CL10?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-jewelry", enabled: true }
];

// 擬真瀏覽器請求頭（防止被 Cloudflare / 防火牆攔截 403）
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

async function checkUrl(item) {
  try {
    const response = await fetch(item.url, {
      headers: BROWSER_HEADERS,
      redirect: 'follow'
    });

    const statusOk = response.status === 200;
    const finalUrl = response.url;
    const htmlText = await response.text();

    // 1. UTM 參數檢查：檢查轉址後的 URL 是否還保留原始 utm 參數
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

    // 2. GA4 / GTM 深入比對（涵蓋 Inline GA4, GTM 容器, gtag.js）
    const hasGa4MeasurementId = /G-[A-Z0-9]{8,12}/i.test(htmlText);
    const hasGtmContainer = /GTM-[A-Z0-9]{4,10}/i.test(htmlText);
    const hasGoogleTagScript = htmlText.includes('googletagmanager.com/gtag/js') || htmlText.includes('google-analytics.com');

    const ga4Detected = hasGa4MeasurementId || hasGtmContainer || hasGoogleTagScript;

    return {
      id: item.id,
      name: item.name,
      url: item.url,
      status: response.status,
      statusText: statusOk ? '正常(200)' : `異常(${response.status})`,
      utmKept: hasUtm ? '保留' : '丟失/未帶入',
      ga4Exist: ga4Detected ? '存在' : '未發現'
    };
  } catch (error) {
    return {
      id: item.id,
      name: item.name,
      url: item.url,
      status: 0,
      statusText: '連線失敗',
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
    sendEvent('log', { message: `[${index + 1}/${selectedTargets.length}] 正在檢測: ${item.name}...` });
    const result = await checkUrl(item);
    sendEvent('result', { data: result });
  }

  sendEvent('done', {});
  res.end();
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>⚡ UTM & 網頁連結速查儀表板</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen p-6">
      <div class="max-w-4xl mx-auto space-y-4">
        <h1 class="text-xl font-bold text-sky-400">⚡ UTM & 網頁連結速查儀表板</h1>
        <button onclick="runTest()" id="startBtn" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-bold">🚀 開始全選檢測</button>
        <div id="statusBox" class="hidden text-xs text-sky-300">⏳ 處理中...</div>
        <div id="cardsContainer" class="space-y-3"></div>
      </div>
      <script>
        let targets = [];
        async function init() {
          const res = await fetch('/api/targets');
          targets = await res.json();
          const container = document.getElementById('cardsContainer');
          container.innerHTML = targets.map(t => \`
            <div id="card-\${t.id}" class="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h3 class="font-bold">\${t.name}</h3>
              <p class="text-xs text-slate-400 break-all">\${t.url}</p>
              <div class="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div class="bg-slate-900 p-2 rounded">連線狀態: <span class="status-val font-bold">⚪ 未測</span></div>
                <div class="bg-slate-900 p-2 rounded">UTM參數: <span class="utm-val font-bold">⚪ 未測</span></div>
                <div class="bg-slate-900 p-2 rounded">GA4代碼: <span class="ga-val font-bold">⚪ 未測</span></div>
              </div>
            </div>
          \`).join('');
        }
        function runTest() {
          const evtSource = new EventSource('/api/run-test?ids=' + targets.map(t=>t.id).join(','));
          evtSource.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'result') {
              const r = data.data;
              const card = document.getElementById('card-' + r.id);
              card.querySelector('.status-val').textContent = r.statusText;
              card.querySelector('.utm-val').textContent = r.utmKept;
              card.querySelector('.ga-val').textContent = r.ga4Exist;
            } else if (data.type === 'done') {
              evtSource.close();
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
