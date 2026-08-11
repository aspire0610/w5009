const express = require('express');
const { chromium } = require('playwright');
const app = express();
const PORT = process.env.PORT || 3000;

let targetList = [
  { id: "1", name: "花櫃", url: "https://www.costco.com.tw/Sports-Lifestyle/Garden-Lifestyle/Flowers-Plant/c/121307?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-flowers", enabled: false },
  { id: "2", name: "珠寶櫃", url: "https://www.costco.com.tw/Jewelry-Gold/Jewelry-Buying-guide/Jewelry-Gold/c/CL10?utm_source=warehouse&utm_medium=W5009&utm_campaign=posm-jewelry", enabled: false },
  { id: "3", name: "Rollout 家具海報", url: "https://www.costco.com.tw/content/showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=Poster-FurnitureRollOut", enabled: false },
  { id: "4", name: "Rollout Lsign", url: "https://www.costco.com.tw/content/showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-FurnitureRollOut", enabled: false },
  { id: "5", name: "吊掛", url: "https://www.costco.com.tw/c/hero-showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=showroom-hangingbanner", enabled: false },
  { id: "6", name: "易拉展", url: "https://www.costco.com.tw/c/hero-showroom?utm_source=warehouse&utm_medium=W5009&utm_campaign=showroom-rollupbanner", enabled: false },
  { id: "7", name: "Lsign 通用", url: "https://www.costco.com.tw/c/OnlineExclusive?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-OnlineExclusive", enabled: false },
  { id: "8", name: "Lsign 家電", url: "https://www.costco.com.tw/Televisions-Appliances/Large-Appliances/c/301?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-Appliances", enabled: false },
  { id: "9", name: "Lsign 電視", url: "https://www.costco.com.tw/Televisions-Appliances/TV-Home-Entertainment/c/101?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-tvs", enabled: false },
  { id: "10", name: "Lsign 輪胎", url: "https://www.costco.com.tw/Sports-Lifestyle/Automotive/c/1421?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-Tire", enabled: false },
  { id: "11", name: "Lsign 玩具", url: "https://www.costco.com.tw/Household-Baby-Toys/Toys/c/1308?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D28", enabled: false },
  { id: "12", name: "Lsign HABA", url: "https://www.costco.com.tw/Health-Beauty/Personal-Care/c/801?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D20", enabled: false },
  { id: "13", name: "Lsign 運動", url: "https://www.costco.com.tw/Sports-Lifestyle/Sports-Fitness/c/1209?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D26", enabled: false },
  { id: "14", name: "Lsign 服飾", url: "https://www.costco.com.tw/Clothing-Accessories/c/9?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D31D39", enabled: false },
  { id: "15", name: "Lsign 食品", url: "https://www.costco.com.tw/Food-Dining/c/CL8?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D12D13", enabled: false },
  { id: "16", name: "Lsign 五金", url: "https://www.costco.com.tw/Furniture-Kitchen/Hardware-DIY/c/605?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D23", enabled: false },
  { id: "17", name: "Lsign 床墊", url: "https://www.costco.com.tw/Furniture-Kitchen/Bedding/Mattress-Toppers/c/60205?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-Mattress", enabled: false },
  { id: "18", name: "Lsign 儲藏屋", url: "https://www.costco.com.tw/Sports-Lifestyle/Garden-Lifestyle/Outdoor-Storage/c/40201?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D27", enabled: false },
  { id: "19", name: "Lsign 沙發", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Sofas-Sectionals/c/50202?utm_source=warehouse&utm_medium=W5009&utm_campaign=Lsign-D38", enabled: false },
  { id: "20", name: "ENDCAP", url: "https://www.costco.com.tw/c/OnlineExclusive?utm_source=warehouse&utm_medium=W5009&utm_campaign=Endcap-OnlineEX", enabled: false },
  { id: "21", name: "靜電貼紙 同價", url: "https://www.costco.com.tw/Same-Price/c/hero-sameprice?utm_source=warehouse&utm_medium=W5009&utm_campaign=Sticker-SamePrice", enabled: false },
  { id: "22", name: "M / L Sign 同價", url: "https://www.costco.com.tw/Same-Price/c/hero-sameprice?utm_source=warehouse&utm_medium=W5009&utm_campaign=Sign-SamePrice", enabled: false },
  { id: "23", name: "fy26p8 Minispotlight 週期購", url: "https://www.costco.com.tw/content/subscription?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26p8_Minispotlight_Subscription", enabled: false },
  { id: "24", name: "fy26p8 Minispotlight Costco APP", url: "https://www.costco.com.tw/costco-app?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26p8_Minispotlight_CostcoApp", enabled: false },
  { id: "25", name: "fy26 p10 app poster iOS", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_app_poster_iOS", enabled: false },
  { id: "26", name: "fy26 p10 app poster Android", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_app_poster_Android", enabled: false },
  { id: "27", name: "fy26 p10 minispotlight iOS", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_mini_spotlight_iOS", enabled: false },
  { id: "28", name: "fy26 p10 minispotlight Android", url: "https://www.costco.com.tw/content/costco-app-ios?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_mini_spotlight_Android", enabled: false },
  { id: "29", name: "fy26p10w4 EM", url: "https://www.costco.com.tw/executive-rewards?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26p_10w4_EM", enabled: false },
  { id: "30", name: "fy26p10w4 D27", url: "https://www.costco.com.tw/Lawn-Garden/Patio-Furniture/Outdoor-Patio-Furniture/c/40102?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p10_banner_d27", enabled: false },
  { id: "31", name: "fy26p12w3 Showroom (Sofas)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Sofas-Sectionals/c/50202?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_Sofas", enabled: false },
  { id: "32", name: "fy26p12w3 Showroom (Cabinets)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Cabinets-Tables/c/50407?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_Cabinets", enabled: false },
  { id: "33", name: "fy26p12w3 Showroom (DiningSets)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Dining-Sets/c/50301?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_DiningSets", enabled: false },
  { id: "34", name: "fy26p12w3 Showroom (ComputerDesk)", url: "https://www.costco.com.tw/Furniture-Kitchen/Furniture/Computer-Desk-Chair-Sets/c/50602?utm_source=warehouse&utm_medium=W5009&utm_campaign=fy26_p12_Showroom_ComputerDeskChair", enabled: false }
];

const COOKIE_SELECTORS = [
  'button:has-text("同意接受全部")',
  '#onetrust-accept-btn-handler',
  'button:has-text("接受所有 Cookie")'
];

async function testSingleItem(item) {
  let browser;
  try {
    // 記憶體極限優化參數
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ] 
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 }
    });

    // 封鎖圖片與 CSS 以極速載入並省記憶體
    await context.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());
    
    const page = await context.newPage();
    let expCampaign = "";
    try { expCampaign = new URL(item.url).searchParams.get("utm_campaign") || ""; } catch(e){}
    
    let hasPageView = false, pageViewPayload = null, clickedCookie = false;

    page.on('request', req => {
      const u = req.url(), postData = req.postData() || '';
      if ((u.includes('g/collect') || u.includes('google-analytics.com')) && 
          (u.includes('en=page_view') || postData.includes('en=page_view'))) {
        hasPageView = true; 
        pageViewPayload = u + ' ' + postData;
      }
    });

    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 12000 });

      for (const selector of COOKIE_SELECTORS) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible({ timeout: 1000 })) {
            await btn.click({ force: true });
            clickedCookie = true;
            break;
          }
        } catch (e) {}
      }
      await page.waitForTimeout(1500);
    } catch (e) {}

    const hasCampaign = (expCampaign && pageViewPayload) ? pageViewPayload.includes(expCampaign) : false;
    await browser.close();

    return { 
      id: item.id, name: item.name, url: item.url, 
      cookie: clickedCookie, pageView: hasPageView, campaign: hasCampaign, 
      time: new Date().toLocaleTimeString() 
    };
  } catch (err) {
    if (browser) await browser.close();
    return { id: item.id, error: err.message };
  }
}

app.use(express.json());
app.get('/api/targets', (req, res) => res.json(targetList));

app.post('/api/targets/toggle', (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids)) {
    targetList.forEach(t => t.enabled = ids.includes(t.id));
  }
  res.json({ success: true });
});

app.post('/api/run-single', async (req, res) => {
  const { id } = req.body;
  const item = targetList.find(t => t.id === id);
  if (!item) return res.status(404).json({ error: '找不到該項目' });
  
  const result = await testSingleItem(item);
  res.json(result);
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>UTM & GA4 自動檢測儀表板</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen pb-20">
      <div class="max-w-4xl mx-auto p-4 space-y-4">
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div>
            <h1 class="text-xl font-bold text-sky-400">📊 GA4 UTM 監測儀表板</h1>
            <p class="text-xs text-slate-400">輕量化正式版</p>
          </div>
          <button onclick="runSelectedTest()" id="startBtn" class="bg-sky-500 active:bg-sky-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg w-full sm:w-auto shadow-lg">
            🚀 執行測試
          </button>
        </div>

        <div class="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
          <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" class="w-4 h-4 rounded">
            <span>全選 / 全不選</span>
          </label>
          <span id="selectedCount" class="text-xs text-sky-400 font-semibold">已勾選: 0</span>
        </div>

        <div id="statusBox" class="hidden bg-slate-800/90 p-3 rounded-xl border border-sky-500/30 flex items-center gap-3 text-xs">
          <div class="animate-spin text-sky-400">⏳</div>
          <span id="statusText" class="text-slate-200">準備檢測...</span>
        </div>

        <div id="cardsContainer" class="space-y-3"></div>

      </div>

      <script>
        let targets = [];

        async function loadTargets() {
          try {
            const res = await fetch('/api/targets');
            targets = await res.json();
            renderCards();
          } catch(e) {}
        }

        function renderCards() {
          const container = document.getElementById('cardsContainer');
          container.innerHTML = '';
          let count = 0;

          targets.forEach(item => {
            if(item.enabled) count++;
            const card = document.createElement('div');
            card.id = 'card-' + item.id;
            card.className = "bg-slate-800 rounded-xl p-4 border border-slate-700/80 space-y-3 shadow-md";
            card.innerHTML = \`
              <div class="flex items-start justify-between gap-3">
                <label class="flex items-start gap-3 cursor-pointer flex-1">
                  <input type="checkbox" onchange="syncCheckboxState()" class="target-checkbox w-5 h-5 rounded mt-0.5" data-id="\${item.id}" \${item.enabled ? 'checked' : ''}>
                  <div>
                    <h3 class="font-bold text-sm text-slate-100">\${item.name}</h3>
                    <p class="text-xs text-slate-400 break-all line-clamp-1 mt-0.5">\${item.url}</p>
                  </div>
                </label>
              </div>
              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50 text-center text-xs">
                <div class="bg-slate-900/50 p-2 rounded-lg">
                  <span class="block text-[10px] text-slate-400 mb-1">Cookie</span>
                  <span class="status-cookie font-medium text-slate-400">⚪ 未檢測</span>
                </div>
                <div class="bg-slate-900/50 p-2 rounded-lg">
                  <span class="block text-[10px] text-slate-400 mb-1">Page View</span>
                  <span class="status-pv font-medium text-slate-400">⚪ 未檢測</span>
                </div>
                <div class="bg-slate-900/50 p-2 rounded-lg">
                  <span class="block text-[10px] text-slate-400 mb-1">Campaign</span>
                  <span class="status-campaign font-medium text-slate-400">⚪ 未檢測</span>
                </div>
              </div>
            \`;
            container.appendChild(card);
          });
          document.getElementById('selectedCount').textContent = \`已勾選: \${count}\`;
        }

        async function syncCheckboxState() {
          const checkboxes = document.querySelectorAll('.target-checkbox:checked');
          const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.id);
          document.getElementById('selectedCount').textContent = \`已勾選: \${selectedIds.length}\`;
          await fetch('/api/targets/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
        }

        function toggleSelectAll(master) {
          document.querySelectorAll('.target-checkbox').forEach(cb => cb.checked = master.checked);
          syncCheckboxState();
        }

        async function runSelectedTest() {
          const checkboxes = document.querySelectorAll('.target-checkbox:checked');
          const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.id);

          if (selectedIds.length === 0) return alert('請先勾選項目！');

          const btn = document.getElementById('startBtn');
          const statusBox = document.getElementById('statusBox');
          const statusText = document.getElementById('statusText');
          
          btn.disabled = true;
          statusBox.classList.remove('hidden');

          for (let i = 0; i < selectedIds.length; i++) {
            const id = selectedIds[i];
            const targetItem = targets.find(t => t.id === id);
            
            statusText.textContent = \`[\${i + 1}/\${selectedIds.length}] 正在檢測: \${targetItem.name}...\`;

            const card = document.getElementById('card-' + id);
            if (card) {
              card.querySelector('.status-cookie').innerHTML = '⏳';
              card.querySelector('.status-pv').innerHTML = '⏳';
              card.querySelector('.status-campaign').innerHTML = '⏳';
            }

            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 18000); // 18 秒強制斷開避免阻塞

              const res = await fetch('/api/run-single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
                signal: controller.signal
              });
              clearTimeout(timeoutId);

              const r = await res.json();

              if (card && !r.error) {
                card.querySelector('.status-cookie').innerHTML = r.cookie ? '<span class="text-emerald-400 font-bold">✅ 已同意</span>' : '<span class="text-slate-500">⚪ 無彈窗</span>';
                card.querySelector('.status-pv').innerHTML = r.pageView ? '<span class="text-emerald-400 font-bold">✅ 成功</span>' : '<span class="text-rose-400 font-bold">❌ 失敗</span>';
                card.querySelector('.status-campaign').innerHTML = r.campaign ? '<span class="text-emerald-400 font-bold">✅ 帶入</span>' : '<span class="text-amber-400 font-bold">⚠️ 無參數</span>';
              } else if (card) {
                card.querySelector('.status-pv').innerHTML = '<span class="text-rose-400 font-bold">❌ 逾時</span>';
              }
            } catch (e) {
              if (card) {
                card.querySelector('.status-pv').innerHTML = '<span class="text-rose-400 font-bold">❌ 逾時</span>';
              }
            }
          }

          btn.disabled = false;
          statusText.textContent = '✨ 檢測完成！';
        }

        loadTargets();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
