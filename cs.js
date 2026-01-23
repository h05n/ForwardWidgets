// ================= 元数据配置 =================
WidgetMetadata = {
  id: "bangdan",
  title: "动画榜单",
  description: "动画榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // ------------- 1. 播出平台 (仅限动画) -------------
    {
      title: "播出平台",
      description: "浏览国内平台的动画番剧",
      requiresWebView: false,
      functionName: "discoverAnime",
      cacheDuration: 3600,
      params: [
        {
          name: "platform", title: "播出平台", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "Bilibili", value: "1605" },
            { title: "Tencent", value: "2007" },
            { title: "iQiyi", value: "1330" },
            { title: "Youku", value: "1419" },
            { title: "MGTV", value: "1631" }
          ]
        },
        {
          name: "sub_genre", title: "动画题材", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部题材", value: "" },
            { title: "热血冒险", value: "10759" }, // 动作冒险
            { title: "科幻奇幻", value: "10765" },
            { title: "搞笑喜剧", value: "35" },
            { title: "悬疑推理", value: "9648" },
            { title: "剧情", value: "18" },
            { title: "家庭", value: "10751" },
            { title: "犯罪", value: "80" }
          ]
        },
        {
          name: "status", title: "连载状态", type: "enumeration", value: "released",
          enumOptions: [
            { title: "已开播", value: "released" },
            { title: "未开播", value: "upcoming" },
            { title: "全部", value: "" }
          ]
        },
        {
          name: "sort", title: "排序方式", type: "enumeration", value: "first_air_date.desc",
          enumOptions: [
            { title: "首播时间↓", value: "first_air_date.desc" },
            { title: "首播时间↑", value: "first_air_date.asc" },
            { title: "人气最高", value: "popularity.desc" },
            { title: "评分最高", value: "vote_average.desc" },
            { title: "最多投票", value: "vote_count.desc" }
          ]
        },
        { name: "page", title: "页码", type: "page" },
        { name: "language", title: "语言", type: "language", value: "zh-CN" }
      ]
    },
    // ------------- 2. 搜索屏蔽 (智能屏蔽首位) -------------
    {
      title: "搜索屏蔽",
      description: "自动屏蔽搜索结果中的第一个匹配项",
      requiresWebView: false,
      functionName: "quickBlock",
      cacheDuration: 0,
      params: [
        {
          name: "mode", title: "屏蔽方式", type: "enumeration", value: "name",
          enumOptions: [
            { title: "按名称屏蔽", value: "name" },
            { title: "按题材屏蔽", value: "genre" }
          ]
        },
        // 优化：无 belongTo，默认显示，输入即屏蔽
        { 
            name: "query", title: "影片名称", type: "input", value: "", placeholder: "输入名称，自动屏蔽第1个结果" 
        },
        { 
          name: "genre_id", title: "选择题材", type: "enumeration", value: "", 
          belongTo: { paramName: "mode", value: ["genre"] },
          enumOptions: [
            { title: "热血冒险 (10759)", value: "10759" },
            { title: "科幻奇幻 (10765)", value: "10765" },
            { title: "搞笑喜剧 (35)", value: "35" },
            { title: "动画 (16)", value: "16" }, // 兜底
            { title: "悬疑 (9648)", value: "9648" },
            { title: "剧情 (18)", value: "18" },
            { title: "家庭 (10751)", value: "10751" },
            { title: "犯罪 (80)", value: "80" },
            { title: "儿童 (10762)", value: "10762" }
          ]
        }
      ]
    },
    // ------------- 3. 屏蔽管理 -------------
    {
      title: "屏蔽管理",
      description: "管理已屏蔽的内容",
      requiresWebView: false,
      functionName: "manageBlocks",
      cacheDuration: 0,
      params: [
        {
          name: "type", title: "管理对象", type: "enumeration", value: "items",
          enumOptions: [{ title: "内容黑名单", value: "items" }, { title: "题材黑名单", value: "genres" }]
        },
        {
          name: "act", title: "操作", type: "enumeration", value: "view",
          enumOptions: [
              { title: "查看列表", value: "view" }, 
              { title: "解除屏蔽", value: "unblock" }, 
              { title: "清空所有", value: "clear" }, 
              { title: "导出配置", value: "export" }, 
              { title: "导入配置", value: "import" }
          ]
        },
        { 
            name: "id", title: "解除ID", type: "input", value: "", placeholder: "输入ID",
            belongTo: { paramName: "act", value: ["unblock"] } 
        },
        { 
            name: "data", title: "导入数据", type: "input", value: "", 
            belongTo: { paramName: "act", value: ["import"] } 
        }
      ]
    }
  ]
};

// ================= 常量定义 =================
const C = {
    // 存储Key
    KEY_GENRE: "fw_block_genres",
    KEY_ITEM: "fw_block_items",
    // 国内五大平台ID
    CN_NETWORKS: "1605|2007|1330|1419|1631", 
    // 动画ID
    ANIMATION_ID: "16",
    // 题材映射 (用于反查名称)
    GENRES: {
        "10759": "热血冒险", "10765": "科幻奇幻", "35": "搞笑喜剧",
        "9648": "悬疑", "18": "剧情", "10751": "家庭", "80": "犯罪",
        "16": "动画", "10762": "儿童"
    }
};

// ================= 工具函数 =================
let _cache = {};
function cleanCache() { _cache = {}; }

function getDB(key) {
    try { return JSON.parse(Widget.storage.get(key)) || []; } catch { return []; }
}
function setDB(key, val) {
    Widget.storage.set(key, JSON.stringify(val));
    cleanCache();
    return true;
}

// 获取屏蔽ID集合
function getBlockSet() {
    if (_cache.ids) return _cache.ids;
    const s = new Set();
    getDB(C.KEY_ITEM).forEach(i => {
        s.add(String(i.id));
        s.add(`${i.id}_${i.type}`); // 兼容 id_type 格式
    });
    return _cache.ids = s;
}

// 检查是否被屏蔽
function isBlocked(item) {
    if (!item?.id) return false;
    const bs = getBlockSet();
    // 1. 检查ID
    if (bs.has(String(item.id))) return true;
    
    // 2. 检查题材 (Genre)
    if (item.genre_ids && item.genre_ids.length) {
        if (!_cache.bGenres) _cache.bGenres = getDB(C.KEY_GENRE).map(g => String(g.id));
        if (item.genre_ids.some(gid => _cache.bGenres.includes(String(gid)))) return true;
    }
    return false;
}

// ================= 功能模块 1: 发现动画 =================
async function discoverAnime(args) {
    const { platform, sub_genre, status, sort, page, language } = args;
    
    // 核心参数构建
    const params = {
        language: language || 'zh-CN',
        page: page || 1,
        sort_by: sort || 'first_air_date.desc',
        with_networks: platform || C.CN_NETWORKS, // 默认为国内全平台
        with_genres: sub_genre ? `${C.ANIMATION_ID},${sub_genre}` : C.ANIMATION_ID, // 锁死动画 + 选定题材
        'first_air_date.lte': status === 'released' ? new Date().toISOString().split('T')[0] : undefined,
        'first_air_date.gte': status === 'upcoming' ? new Date().toISOString().split('T')[0] : undefined
    };

    // 评分排序优化：防止冷门高分
    if (sort === 'vote_average.desc') params['vote_count.gte'] = 5;

    // 请求数据
    const res = await Widget.tmdb.get('/discover/tv', { params });
    const items = res.results || [];

    // 格式化输出
    return items
        .filter(item => !isBlocked({ id: item.id, genre_ids: item.genre_ids })) // 过滤黑名单
        .filter(item => item.poster_path && item.name) // 基础数据清洗
        .map(item => ({
            type: "tmdb",
            id: String(item.id),
            title: item.name, // 剧集使用 name
            overview: item.overview,
            posterPath: item.poster_path,
            rating: item.vote_average,
            releaseDate: item.first_air_date,
            vote_count: item.vote_count
        }));
}

// ================= 功能模块 2: 快速屏蔽 =================
async function quickBlock(args) {
    const { mode, query, genre_id } = args;

    // A. 题材屏蔽
    if (mode === 'genre') {
        if (!genre_id) return [{ title: "提示", description: "请选择题材" }];
        const list = getDB(C.KEY_GENRE);
        if (list.some(g => String(g.id) === String(genre_id))) {
            return [{ title: "已存在", description: `${C.GENRES[genre_id]} 已在黑名单` }];
        }
        list.push({ id: genre_id, name: C.GENRES[genre_id], date: Date.now() });
        setDB(C.KEY_GENRE, list);
        return [{ title: "屏蔽成功", description: `已屏蔽题材: ${C.GENRES[genre_id]}` }];
    }

    // B. 名称屏蔽 (自动首位)
    if (!query) return [{ title: "提示", description: "请输入动画名称" }];
    
    try {
        const res = await Widget.tmdb.get('/search/tv', { 
            params: { query, language: 'zh-CN', page: 1 } 
        });
        
        const validResults = (res.results || []).filter(i => i.name && i.poster_path);
        
        if (!validResults.length) return [{ title: "未找到", description: "没有搜到相关动画" }];

        const target = validResults[0]; // 取第一个
        const list = getDB(C.KEY_ITEM);
        
        // 查重
        if (list.some(i => String(i.id) === String(target.id))) {
            return [{ 
                title: "已在黑名单", 
                description: target.name,
                posterPath: target.poster_path 
            }];
        }

        // 入库
        list.push({
            id: String(target.id),
            name: target.name,
            type: 'tv', 
            date: Date.now(),
            poster_path: target.poster_path
        });
        setDB(C.KEY_ITEM, list);

        return [{
            title: "已自动屏蔽",
            description: `ID: ${target.id} | ${target.name}`,
            posterPath: target.poster_path
        }];

    } catch (e) {
        return [{ title: "错误", description: e.message }];
    }
}

// ================= 功能模块 3: 屏蔽管理 =================
async function manageBlocks(args) {
    const { type, act, id, data } = args;
    const isGenre = type === 'genres';
    const KEY = isGenre ? C.KEY_GENRE : C.KEY_ITEM;
    let list = getDB(KEY);

    // 1. 清空
    if (act === 'clear') {
        setDB(KEY, []);
        return [{ title: "操作完成", description: isGenre ? "题材屏蔽已清空" : "内容屏蔽已清空" }];
    }

    // 2. 解除 (输入ID)
    if (act === 'unblock') {
        if (!id) return [{ title: "提示", description: "请输入ID" }];
        const before = list.length;
        list = list.filter(i => String(i.id) !== String(id).trim());
        if (list.length === before) return [{ title: "失败", description: "未找到该ID" }];
        setDB(KEY, list);
        return [{ title: "解除成功", description: `ID ${id} 已移出黑名单` }];
    }

    // 3. 导出
    if (act === 'export') {
        const txt = list.map(i => i.id).join(',');
        return [{ title: "配置数据", description: txt || "空" }];
    }

    // 4. 导入
    if (act === 'import') {
        const newIds = (data || "").split(',').filter(s => /^\d+$/.test(s.trim()));
        let count = 0;
        newIds.forEach(nid => {
            if (!list.some(i => String(i.id) === nid)) {
                list.push({ id: nid, name: `导入ID:${nid}`, date: Date.now() });
                count++;
            }
        });
        setDB(KEY, list);
        return [{ title: "导入完成", description: `新增 ${count} 条数据` }];
    }

    // 5. 查看列表 (默认)
    if (!list.length) return [{ title: "空列表", description: "暂无屏蔽数据" }];

    return list.sort((a, b) => b.date - a.date).map(i => ({
        title: i.name || i.title || `ID:${i.id}`,
        description: `ID: ${i.id}`,
        posterPath: i.poster_path,
        mediaType: "info"
    }));
}
