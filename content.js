/* =====================================================================
   網站內容都在這裡。要更新資料只改這個檔案，不用碰其他程式。
   - 文字直接改引號裡的字
   - 照片放到 image/ 底下，再把路徑加進對應的清單
   - 存檔後重新整理網頁就看得到
   - 不要放：地址、身分證字號、學號、薪資金額、帳本數字、隊友個資
   ===================================================================== */
window.CONTENT = {

  /* ---------- 基本資料（關於我.txt、一般模式、終端機 whoami） ---------- */
  profile: {
    name: '陳洺安',
    nameEn: 'Ming-An Chen',
    photo: './image/web/new/portrait.jpg',
    school: '國立中央大學 資訊管理學系 碩士班（2026/9～）',
    now: '華通電腦 軟體工程實習生',
    headline: 'Software Engineer Intern @ Compeq (華通電腦) · MS Information Management @ NCU',
    tagline: '做地端 LLM、BI 報表、全端網站；週末在葡萄王導覽、做咖啡，還會跳很高。',
    motto: '心中的火焰比任何風暴都更持久。',
    birthday: '2001 / 10 / 30',
    hobbies: '旅遊、看短影音、看夕陽、研究理財',
    interests: '應用 LLM（地端模型、AI agent）、資料／BI、全端開發、金融',
    languages: '中文（母語）、英文（GEPT 全民英檢中級）',
    tags: ['Python', 'C++', 'LLM／Gemma', 'BI', '全端', 'AI Agent'],
    status: '華通 · 上班中',            // 桌面右上角的狀態
  },

  /* ---------- 學歷（新到舊） ---------- */
  education: [
    { when: '2026/9～2028/6（預計）', school: '國立中央大學', dept: '資訊管理學系 碩士' },
    { when: '2020/9～2025/6', school: '中原大學', dept: '資訊工程學系 學士（雙主修 資訊管理學系）' },
    { when: '2018/9～2020/6', school: '慈濟高級中學', dept: '普通科' },
  ],

  /* ---------- 工作經歷（由舊到新） ---------- */
  jobs: [
    { title: '大自在運動休閒精品店', role: '門市工讀', when: '2021/4～2023/2', note: '銷售、盤點庫存' },
    { title: '中原大學', role: '教學助理', when: '2021/9～2025/6', note: '經濟學助教兩學期、R 語言助教一學期' },
    { title: '蝦皮物流', role: '暑期工讀', when: '2022/6～2022/9', note: '分貨、歸貨、刷條碼' },
    { title: '葡萄王生技', role: '門市兼職', when: '2023/4～現在', note: '保健食品銷售、輕食製作、觀光工廠導覽、咖啡吧（週末）' },
    { title: '國立中央大學', role: '國科會計畫研究助理＋課程助教', when: '2025/10～現在', note: 'NSTC 計畫研究助理、助教' },
    { title: '華通電腦 Compeq', role: '軟體工程實習生', when: '2026/6～現在', note: '地端 Gemma 翻譯系統、BI 報表、多語系網站、產線離線 App' },
  ],

  /* ---------- 一路走來（時間軸） ---------- */
  journey: [
    { when: '大一', title: 'PBL 商業分析', sub: '經濟學', text: '跟工業系跨系合作：我們負責分析，他們負責做竹槍。' },
    { when: '大二', title: '雪Q餅數位行銷', sub: '企業概論 · 執行長', text: '跟路得啟智學園合作，品牌「是在Q喔」：經營社群、拍宣傳影片、做線上金流。', link: { text: 'Instagram ↗', href: 'https://www.instagram.com/qq_thankq/' } },
    { when: '大三', title: '台北大黑客松、智慧城市大數據', sub: '系統分析', text: 'CodeFest 2023 城市儀表板；2024 把台北城市儀表板導入桃園，決賽入圍。', img: './image/web/rest.jpg' },
    { when: '大四', title: '兩個畢業專題', sub: '資工 × 資管', text: 'YOLOv8＋卡爾曼濾波球體追蹤；AI 虛擬人自我對話（校內第二名）。' },
    { when: '畢業', title: '中原大學 畢業', sub: '資工 × 資管 雙主修', img: './image/web/new/grad_cap.jpg' },
    { when: '2025', title: '中央大學 研究助理', sub: '國科會計畫 · 助教', text: 'AI 教與學專案拿到優等；期貨模擬交易競賽決賽第 8 名。' },
    { when: '2026/6', title: '華通電腦 實習', sub: '軟體工程實習生', text: '地端部署 Gemma 的翻譯系統、BI 報表、多語系網站、產線離線 App。' },
    { when: '現在', title: '中央資管 碩士班 ＋ 華通', sub: '2026/9 開學 · 週末還在葡萄王', text: '研究應用 LLM 與 AI agent，同時在華通實習。', now: true },
  ],

  /* ---------- 技能（0–100，自評，自己調） ---------- */
  skills: [
    ['Python', 88], ['C/C++', 86], ['LLM 應用（Gemma、Gemini、Agent）', 85], ['BI／報表、Excel 自動化', 82],
    ['SQL（MySQL、SQLite）', 78], ['Java（JSP）', 74], ['R', 70], ['Verilog', 65],
    ['導覽解說', 93], ['彈跳力', 99],
  ],
  skillsNote: '數字是自己打的分數，彈跳力是真的。',

  /* ---------- 相簿（照片路徑, 說明） ---------- */
  photos: [
    ['./image/web/new/street.jpg', '老街散步'],
    ['./image/web/new/sunset.jpg', '大溪的夕陽'],
    ['./image/web/new/temple.jpg', '老樹和廟'],
    ['./image/web/new/grad_full.jpg', '畢業照'],
    ['./image/web/new/grad_cap.jpg', '畢業典禮'],
    ['./image/web/new/tour.jpg', '葡萄王導覽'],
    ['./image/web/new/coffee.jpg', '吧檯咖啡時間'],
    ['./image/web/new/jump.jpg', '上班也要跳一下'],
    ['./image/web/S__1851394.jpg', '海邊比耶'],
    ['./image/web/8A756D7C-FD46-40F7-BE1F-1C669E6CB23B.jpg', '饒河街夜市'],
    ['./image/web/rest.jpg', '黑客松'],
    ['./image/web/S__1851396.jpg', '佛學參訪'],
    ['./image/web/work_1.jpg', '工作照'],
    ['./image/web/S__129581066.jpg', '閒暇跑 Uber'],
  ],

  /* ---------- 獎狀與證照（新的放前面；分類: comp 競賽 / school 校內 / exp 服務 / cert 證照） ---------- */
  awards: [
    { cat: 'comp', img: './image/web/award/tpex_2026.jpg', title: '櫃買中心 投資組合簡報 入圍優秀獎', year: '2026', text: '證券櫃檯買賣中心「115 年度大專生證券菁英種子線上培育營」櫃買商品投資組合簡報競賽，入圍優秀獎（終究是錯付了隊）。' },
    { cat: 'comp', img: './image/web/award/trade_like_a_pro.jpg', title: 'Trade Like a Pro 決賽第 8 名', year: '2025', text: '臺灣期貨交易所「114 年縱橫期海 Trade Like a Pro 大專院校模擬交易競賽」決賽第 8 名（中原大學 飛馬騎士隊）。' },
    { cat: 'comp', img: './image/web/award/ai_teaching.jpg', title: 'AI 教與學標竿課程 優等', year: '2025', text: '把 AI 批閱產生的質化、量化報告導入商學院基礎統計學 EMI 課程，用統計分析驗證成效。學生組優等。' },
    { cat: 'comp', img: './image/web/award/smart_city_2024.jpg', title: '智慧城市大數據應用競賽 決賽入圍', year: '2024', text: '卡拉雞尾酒團隊：把開源的台北城市儀表板導入桃園市，決賽入圍、表現優異。' },
    { cat: 'comp', img: './image/web/award/codefest.jpg', title: '城市儀表板大黑客松', year: '2023', text: '第一次碰前端，向很多厲害的人學習，一起整晚不睡打 code。' },
    { cat: 'school', img: './image/web/award/good_grade.jpg', title: '書卷獎', year: '2022', text: '第一次拿到書卷獎，雖然只有 2000 元，但還是很快樂！' },
    { cat: 'school', img: './image/web/award/ds.jpg', title: '資料結構 課程前三', year: '2022', text: '演算法最基礎的課，也讓我在資工可以吃老本。' },
    { cat: 'school', img: './image/web/award/tradetheory.jpg', title: '國際貿易理論與政策 課程前三', year: '2022', text: '要背超多東西，但學到很多貿易、匯率和市場理論。' },
    { cat: 'school', img: './image/web/award/enterprise.jpg', title: '企業資料通訊 課程前三', year: '2021', text: '超努力搞懂各種 protocol，現在有關網路的課幾乎都用得到。' },
    { cat: 'school', img: './image/web/award/pbl.jpg', title: 'PBL 跨系合作', year: '2020', text: '跟工業系跨系合作：我們分析，他們做竹槍。' },
    { cat: 'exp', img: './image/web/award/service.jpg', title: '佛光青年團 義工服務', year: '2019', text: '青年團、夏令營帶營隊，認識很多學校以外的朋友。' },
    { cat: 'exp', img: './image/web/award/sunior.jpg', title: '臺南市市長獎', year: '2020', text: '高中畢業時拿到臺南市市長獎。' },
    { cat: 'cert', img: './image/web/award/jept.jpg', title: 'GEPT 全民英檢 中級', year: '', text: '考過英文畢業門檻，大一就不用再一直做模擬考。' },
    { cat: 'cert', img: './image/web/award/java_1.jpg', title: 'Oracle Java SE 7 Programming', year: '', text: 'Oracle Workforce Development Program 結業。' },
    { cat: 'cert', img: './image/web/award/java_2.jpg', title: 'Oracle Java SE 7 Fundamentals', year: '', text: 'Oracle Workforce Development Program 結業。' },
    { cat: 'cert', img: './image/web/award/cwt.jpg', title: 'CWT 全民中文能力檢定 中高等', year: '', text: '中高等合格。' },
  ],
  awardCats: [['all', '全部'], ['comp', '競賽'], ['school', '校內'], ['exp', '服務'], ['cert', '證照']],

  /* ---------- 作品
       type: info 功能清單 / code 程式碼＋3D 模型 / video 影片 / doc 文件
     ---------- */
  projects: [
    { id: 'compeq', tab: '華通工作', kind: '華通電腦 · 軟體工程實習（2026/6～）', title: '華通電腦：工廠裡用的工具', type: 'info',
      text: '在 PCB 製造公司裡做給同事每天用的系統。',
      bullets: ['地端部署 Google Gemma 的翻譯系統：公司文件不出內網', 'BI 系統與生產／營運報表', '公司多語系網站', '產線用離線 App：工廠網路不穩也能用'],
      stack: ['Gemma', 'LLM', 'BI', 'Web', 'Offline-first'] },
    { id: 'finance', tab: 'AI 記帳', kind: '個人專案 · 2026/10～（自己每天在用）', title: 'AI 記帳與現金流規劃系統', type: 'info',
      text: '一份 Excel 帳本是唯一資料來源，Python 重算每個帳戶與專款餘額，和 Excel 公式交叉核對。（只介紹功能，不放任何金額。）',
      bullets: ['逐日現金流模擬：排好哪天從哪個帳戶搬多少錢，帳單不跳票', '信用卡帳單對帳、加密 PDF 薪資單解析（pdfplumber）', 'Gmail → Drive 自動歸檔（Google Apps Script＋rclone）', '24 個月三情境預測、規則式信用評分估計', '自動產生 Obsidian 知識圖譜', '獨立的 AI 稽核 agent 從原始資料重算數字'],
      stack: ['Python', 'Excel', 'pdfplumber', 'Apps Script', 'Claude Code', 'Agent'] },
    { id: 'avatar', tab: 'AI 虛擬人', kind: '資管系畢業專題 · 2025 · 技術長', title: 'AI 虛擬人：自我對話與心理分析', type: 'info',
      text: '做出能跟「自己」沉浸式對話的虛擬人。我負責後端約 90%（Python）。校內競賽第二名、資訊服務創新競賽複賽。',
      bullets: ['STT 語音轉文字', 'Gemini LLM：prompt＋資料庫當記憶', '聲音克隆', 'D-ID 驅動頭像'],
      stack: ['Python', 'Gemini', 'D-ID', 'Voice Clone', 'STT'] },
    { id: 'yolo', tab: 'YOLOv8 追蹤', kind: '資工系畢業專題 · 2025', title: 'YOLOv8＋卡爾曼濾波 球體追蹤', type: 'info',
      text: '偵測並追蹤影片中移動的球，用卡爾曼濾波預測與平滑位置；比較 U-Net、高斯濾波、背景相減法。',
      bullets: ['高斯濾波前處理', 'YOLOv8 偵測流程', '卡爾曼濾波落點預測', '負責報告卡爾曼原理'],
      stack: ['Python', 'YOLOv8', 'Kalman Filter', 'OpenCV'] },
    { id: 'scheme', tab: 'Scheme 直譯器', kind: 'C++ · 程式語言', title: 'Scheme 直譯器', type: 'info',
      text: '用 C++ 寫一個 LISP 系語言的直譯器，用隱藏測資黑箱測試。',
      bullets: ['詞法分析（lexer）', '語法分析（parser）', '語意求值（evaluator）', '內建特殊函式'],
      stack: ['C++', 'OOP', 'Interpreter'] },
    { id: 'tree', tab: '2-3 Tree', kind: 'C++ · 資料結構', title: '2-3 Tree', type: 'code', code: './code/code1.cpp', model: './assets/3d/tree23.glb', modelImg: './assets/3d/tree23.png',
      text: '比起普通二元樹樹高少很多，找資料更快。一開始用四個指標寫得又長又亂，改成 vector<nodetype*> 加遞迴就乾淨了。學到：先把問題最小化。' },
    { id: 'heap', tab: 'Heap', kind: 'C++ · 資料結構', title: 'Heap／Priority Queue', type: 'code', code: './code/code2.cpp', model: './assets/3d/heap.glb', modelImg: './assets/3d/heap.png',
      text: '用 heap 做 priority queue，完全不用指標，一個陣列搞定，也比較不會 memory leak。' },
    { id: 'codefest', tab: '城市儀表板', kind: 'CodeFest 2023 · 2024 智慧城市大數據', title: '台北城市儀表板 → 桃園', type: 'video', video: './video/web.mp4', poster: './image/web/video_poster.jpg',
      text: '2023 在城市儀表板大黑客松學會開發組件；2024 把開源的台北城市儀表板導入桃園市，智慧城市大數據應用競賽決賽入圍。',
      link: { text: '在 YouTube 看成果影片 ↗', href: 'https://www.youtube.com/watch?v=Wr5Q8tB_W6k' } },
    { id: 'econ', tab: '經濟預測', kind: '商業經濟及預測 · 期末報告', title: '經濟預測分析', type: 'doc', img: './image/web/report_cover.jpg',
      text: '用時間序列預測「外銷大陸及香港電子產品訂單金額」和「餐飲業營業額」。後來在系統分析課用同樣的方法分析 YouBike 趨勢。',
      link: { text: '打開報告 PDF ↗', href: './code/report.pdf' } },
    { id: 'qq', tab: '雪Q餅', kind: '數位行銷 · 與路得啟智學園合作 · 執行長', title: '雪Q餅「是在Q喔」', type: 'info',
      text: '幫路得啟智學園的雪Q餅做品牌與數位行銷。',
      bullets: ['品牌命名「是在Q喔」、經營社群', '廣告台詞、料理大賽宣傳影片', '散裝任意口味搭配＋線上金流', '抽獎活動'],
      stack: ['行銷', '社群', '金流'], link: { text: 'Instagram ↗', href: 'https://www.instagram.com/qq_thankq/' } },
  ],

  /* ---------- 一般模式（給面試官）的英文自我介紹 ---------- */
  about_en: [
    "Software engineer intern at Compeq Manufacturing (華通電腦), Master's student in Information Management at National Central University, with a B.S. in Information & Computer Engineering and a double major in Information Management from Chung Yuan Christian University.",
    'At Compeq I build tools used inside a PCB manufacturing company: a translation system running Google\'s Gemma model on-premises so internal documents never leave the company network, a BI system and dashboards for operational and production reporting, a multilingual company website, and an offline app for the production line that keeps working when the factory network is unreliable.',
    'Outside work I build AI systems for real problems: a personal finance agent that reconciles bank and credit-card data, plans day-by-day cash flow and decides how much is safe to invest (Python, Excel automation, PDF parsing, Google Apps Script); a virtual-human counselling app (Gemini + D-ID + voice cloning, 2nd place on campus); and a YOLOv8 + Kalman-filter ball-tracking system.',
    'Interests: applied LLMs (local/on-prem models, agents), data/BI, full-stack development, and finance. Languages: Mandarin (native), English (GEPT Intermediate).',
  ],

  /* ---------- 聯絡方式 ---------- */
  contact: {
    lede: '工作機會、合作、研究，或只是想說嗨，都歡迎。',
    email: 'asd0389wsx0216@gmail.com',
    phone: '0978-581-189',
    links: [
      ['LinkedIn', 'in/chenmingan ↗', 'https://www.linkedin.com/in/chenmingan'],
      ['GitHub', 'machencompeq ↗', 'https://github.com/machencompeq'],
      ['Instagram', '@andyming_90 ↗', 'https://www.instagram.com/andyming_90/'],
    ],
  },

  /* ---------- 拍過的廣告（Instagram Reels；只要填 reel 的 ID 和標題） ---------- */
  ads: [
    { id: 'C-McK2ASOG_', title: '廣告作品 1' },
    { id: 'C_W32FlyMZg', title: '廣告作品 2' },
    { id: 'DKRXDMGSpgU', title: '廣告作品 3' },
  ],

  /* ---------- 桌面寵物會說的話 ---------- */
  petLines: ['點我！', '嗨～', '華通上班中', '我在寫 Gemma 翻譯系統', '週末在葡萄王', '要喝咖啡嗎？', '按 / 試試看', '彈跳力 99', 'Python 好好玩', '看看我的作品！'],
};
