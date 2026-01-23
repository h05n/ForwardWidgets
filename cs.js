// ===========================================
// Forward Widget: 动画榜单 (Domestic Anime v3.0)
// Version: 3.0.0 (Ultimate Refactor)
// Author: Optimized by Gemini
// ===========================================

// --- 全局配置中心 ---
const CONFIG = {
    // 强制锁死：仅动画 (Genre ID 16)
    BASE_GENRE: "16",
    // 强制锁死：国内五大平台 (B站, 腾讯, 爱奇艺, 优库, 芒果)
    CN_NETWORKS: "1605|2007|1330|1419|1631",
    // 存储键名
    KEY_BLOCK_ITEMS: "fw_anime_block_items",
    KEY_BLOCK_GENRES: "fw_anime_block_genres",
    // 二次元题材映射 (Human Readable Mapping)
    GENRE_MAP: {
        "10759": "热血 / 战斗",    
        "10765": "奇幻 / 异世界",  
        "35":    "搞笑 / 恋爱",    
        "9648":  "悬疑 / 智斗",    
        "18":    "剧情 / 催泪",    
        "10751": "日常 / 治愈",    
        "10768": "战争 / 机战",    
        "10762": "儿童 / 幼教"     
    }
};

// ================= 元数据定义 =================
WidgetMetadata = {
  id: "anime_rank_v3",
  title: "动画榜单",
  description: "国内平台动画专用榜单 (v3.0)",
  author: "ForwardUser",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "3.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0, 
  modules: [
    // ------------------------------------------------
    // 模块 1: 动画发现 (Discover)
    // ------------------------------------------------
    {
      title: "动画榜单",
      description: "浏览国内平台的动画番剧",
      requiresWebView: false,
      functionName: "moduleDiscover",
      cacheDuration: 3600,
      params: [
        {
          name: "platform", title: "播出平台", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部平台", value: "" },
            { title: "Bilibili", value: "1605" },
            { title: "腾讯视频", value: "2007" },
            { title: "爱奇艺", value: "1330" },
            { title: "优酷", value: "1419" },
            { title: "芒果TV", value: "1631" }
          ]
        },
        {
          name: "genre", title: "动画题材", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部题材", value: "" },
            { title: "热血 / 战斗", value: "10759" },
            { title: "奇幻 / 异世界", value: "10765" },
            { title: "搞笑 / 恋爱", value: "35" },
            { title: "日常 / 治愈", value: "10751" },
            { title: "悬疑 / 智斗", value: "9648" },
            { title: "剧情 / 催泪", value: "18" },
            { title: "战争 / 机战", value: "10768" }
          ]
        },
        {
          name: "status", title: "连载状态", type: "enumeration", value: "released",
          enumOptions: [
            { title: "已开播 (看最新)", value: "released" },
            { title: "未开播 (看预告)", value: "upcoming" },
            { title: "全部", value: "" }
          ]
        },
        // 这里的排序值只是默认值，代码中会根据 status 智能调整
        {
          name: "sort", title: "排序方式", type: "enumeration", value: "smart",
          enumOptions: [
            { title: "智能排序 (推荐)", value: "smart" },
            { title: "时间倒序 (新→旧)", value: "first_air_date.desc" },
            { title: "时间正序 (旧→新)", value: "first_air_date.asc" },
            { title: "人气最高", value: "popularity.desc" },
            { title: "评分最高", value: "vote_average.desc" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    // ------------------------------------------------
    // 模块 2: 极速屏蔽 (Quick Block)
    // ------------------------------------------------
    {
      title: "搜索屏蔽",
      description: "输入名称自动屏蔽首位结果",
      requiresWebView: false,
      functionName: "moduleBlocker",
      cacheDuration: 0,
      params: [
        {
          name: "mode", title: "屏蔽模式", type: "enumeration", value: "name",
          enumOptions: [
            { title: "按名称屏蔽", value: "name" },
            { title: "按题材屏蔽", value: "genre" }
          ]
        },
        { 
            name: "query", title: "动画名称", type: "input", value: "", placeholder: "输入名称，自动屏蔽第1个结果" 
        },
        { 
          name: "genre_id", title: "选择题材", type: "enumeration", value: "", 
          belongTo: { paramName: "mode", value: ["genre"] },
          enumOptions: [
            { title: "热血 / 战斗", value: "10759" },
            { title: "奇幻 / 异世界", value: "10765" },
            { title: "搞笑 / 恋爱", value: "35" },
            { title: "日常 / 治愈", value: "10751" },
            { title: "悬疑 / 智斗", value: "9648" },
            { title: "剧情 / 催泪", value: "18" },
            { title: "战争 / 机战", value: "10768" },
            { title: "儿童 / 幼教", value: "10762" },
            { title: "所有动画 (16)", value: "16" }
          ]
        }
      ]
    },
    // ------------------------------------------------
    // 模块 3: 屏蔽管理 (Manager)
    // ------------------------------------------------
    {
      title: "屏蔽管理",
      description: "管理或解除屏蔽",
      requiresWebView: false,
      functionName: "moduleManager",
      cacheDuration: 0,
      params: [
        {
          name: "target", title: "管理对象", type: "enumeration", value: "items",
          enumOptions: [{ title: "内容黑名单", value: "items" }, { title: "题材黑名单", value: "genres" }]
        },
        {
          name: "action", title: "操作", type: "enumeration", value: "view",
          enumOptions: [
              { title: "查看列表", value: "view" }, 
              { title: "解除屏蔽", value: "unblock" }, 
              { title: "清空所有", value: "clear" }, 
              { title: "导出配置", value: "export" }, 
              { title: "导入配置", value: "import" }
          ]
        },
        { 
            name: "uid", title: "解除ID", type: "input", value: "", placeholder: "输入ID",
            belongTo: { paramName: "action", value: ["unblock"] } 
        },
        { 
            name: "import_str", title: "导入数据", type: "input", value: "", 
            belongTo: { paramName: "action", value: ["import"] } 
        }
      ]
    }
  ]
};

// ================= 核心架构 (Core) =================

// 1. 渲染卫士 (Render Guard) - 防止白屏
const Render = {
    card: (item) => ({
        id: String(item.id),
        type: "tmdb", 
        title: item.name || item.title,
        overview: item.overview || "暂无简介",
        posterPath: item.poster_path,
        rating: item.vote_average,
        releaseDate: item.first_air_date || item.release_date,
        mediaType: "tv"
    }),
    
    info: (title, desc, poster = "") => ({
        id: "msg_" + Math.random().toString(36).substr(2, 9),
        type: "info", 
        title: title,
        description: desc,
        posterPath: poster,
        mediaType: "info"
    })
};

// 2. 数据存储层 (Storage Layer)
const DB = {
    get: (key) => {
        try {
            const str = Widget.storage.get(key);
            return str ? JSON.parse(str) : [];
        } catch { return []; }
    },
    set: (key, val) => {
        Widget.storage.set(key, JSON.stringify(val));
    },
    getBlockSet: () => {
        const list = DB.get(CONFIG.KEY_BLOCK_ITEMS);
        const set = new Set();
        list.forEach(i => set.add(String(i.id)));
        return set;
    },
    getBlockGenres: () => {
        return DB.get(CONFIG.KEY_BLOCK_GENRES).map(g => String(g.id));
    }
};

// 3. 业务逻辑层 (Service Layer)
const Service = {
    isBlocked: (item, blockSet, blockGenres) => {
        if (!item || !item.id) return true;
        if (blockSet.has(String(item.id))) return true;
        if (item.genre_ids && item.genre_ids.length > 0 && blockGenres.length > 0) {
            const hasBlockedGenre = item.genre_ids.some(gid => blockGenres.includes(String(gid)));
            if (hasBlockedGenre) return true;
        }
        return false;
    },
    
    // 关键修复：获取北京时间 (UTC+8) 的日期字符串 YYYY-MM-DD
    getBeijingDateStr: (offsetDays = 0) => {
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const bjTime = new Date(utc + (3600000 * 8)); // 北京时间
        bjTime.setDate(bjTime.getDate() + offsetDays);
        return bjTime.toISOString().split('T')[0];
    }
};

// ================= 模块实现 =================

/**
 * 模块 1: 动画发现
 */
async function moduleDiscover(args) {
    const { platform, genre, status, sort, page } = args;

    // 1. 智能计算日期界限 (北京时间)
    const todayStr = Service.getBeijingDateStr(0);      // 今天
    const tomorrowStr = Service.getBeijingDateStr(1);   // 明天

    // 2. 智能排序逻辑
    let finalSort = sort;
    if (sort === 'smart') {
        if (status === 'upcoming') finalSort = 'first_air_date.asc'; // 未开播：按时间正序 (先看明天要播的)
        else finalSort = 'first_air_date.desc'; // 其他：按时间倒序 (先看最新的)
    }

    // 3. 构建 TMDB 参数
    const apiParams = {
        language: 'zh-CN',
        page: page || 1,
        sort_by: finalSort,
        with_networks: platform || CONFIG.CN_NETWORKS,
        with_genres: genre ? `${CONFIG.BASE_GENRE},${genre}` : CONFIG.BASE_GENRE,
        // 关键逻辑：严格的日期界限
        'first_air_date.lte': status === 'released' ? todayStr : undefined,    // <= 今天
        'first_air_date.gte': status === 'upcoming' ? tomorrowStr : undefined  // >= 明天
    };

    if (finalSort === 'vote_average.desc') apiParams['vote_count.gte'] = 10;

    try {
        const res = await Widget.tmdb.get('/discover/tv', { params: apiParams });
        const results = res.results || [];
        
        const bSet = DB.getBlockSet();
        const bGenres = DB.getBlockGenres();

        return results
            .filter(item => !Service.isBlocked(item, bSet, bGenres))
            .filter(item => item.name && item.poster_path)
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "网络请求错误，请稍后重试")];
    }
}

/**
 * 模块 2: 搜索与屏蔽
 */
async function moduleBlocker(args) {
    const { mode, query, genre_id } = args;

    if (mode === 'genre') {
        if (!genre_id) return [Render.info("提示", "请选择要屏蔽的题材")];
        const list = DB.get(CONFIG.KEY_BLOCK_GENRES);
        if (list.some(g => String(g.id) === String(genre_id))) {
            return [Render.info("已存在", "该题材已在黑名单中")];
        }
        const genreName = CONFIG.GENRE_MAP[genre_id] || "未知题材";
        list.push({ id: genre_id, name: genreName, date: Date.now() });
        DB.set(CONFIG.KEY_BLOCK_GENRES, list);
        return [Render.info("屏蔽成功", `已屏蔽: ${genreName}`)];
    }

    if (!query) return [Render.info("提示", "请输入动画名称以进行屏蔽")];

    try {
        const res = await Widget.tmdb.get('/search/tv', {
            params: { query: query, language: 'zh-CN', page: 1 }
        });
        
        const validItems = (res.results || []).filter(i => i.name && i.poster_path);
        
        if (validItems.length === 0) return [Render.info("未找到", "没有搜索到相关动画")];

        const target = validItems[0];
        const list = DB.get(CONFIG.KEY_BLOCK_ITEMS);

        if (list.some(i => String(i.id) === String(target.id))) {
            return [Render.info("已在黑名单", target.name, target.poster_path)];
        }

        list.push({ id: String(target.id), name: target.name, poster: target.poster_path, date: Date.now() });
        DB.set(CONFIG.KEY_BLOCK_ITEMS, list);

        return [Render.info("已自动屏蔽", `ID: ${target.id} | ${target.name}`, target.poster_path)];
    } catch (e) {
        return [Render.info("错误", "搜索过程中发生网络错误")];
    }
}

/**
 * 模块 3: 屏蔽管理
 */
async function moduleManager(args) {
    const { target, action, uid, import_str } = args;
    const isGenre = target === 'genres';
    const KEY = isGenre ? CONFIG.KEY_BLOCK_GENRES : CONFIG.KEY_BLOCK_ITEMS;
    let list = DB.get(KEY);

    if (action === 'clear') {
        DB.set(KEY, []);
        return [Render.info("操作完成", isGenre ? "题材屏蔽已清空" : "内容屏蔽已清空")];
    }

    if (action === 'unblock') {
        if (!uid) return [Render.info("提示", "请输入要解除的ID")];
        const initialLen = list.length;
        list = list.filter(i => String(i.id) !== String(uid).trim());
        if (list.length === initialLen) return [Render.info("失败", "未找到该ID")];
        DB.set(KEY, list);
        return [Render.info("解除成功", `ID ${uid} 已恢复显示`)];
    }

    if (action === 'export') {
        const dataStr = list.map(i => i.id).join(',');
        return [Render.info("配置数据", dataStr || "列表为空")];
    }

    if (action === 'import') {
        const ids = (import_str || "").split(/[,，| ]/).filter(s => /^\d+$/.test(s.trim()));
        let added = 0;
        ids.forEach(newId => {
            if (!list.some(i => String(i.id) === newId)) {
                list.push({ id: newId, name: isGenre ? (CONFIG.GENRE_MAP[newId] || "导入题材") : `导入ID(${newId})`, date: Date.now() });
                added++;
            }
        });
        DB.set(KEY, list);
        return [Render.info("导入完成", `成功导入 ${added} 条数据`)];
    }

    if (list.length === 0) return [Render.info("列表为空", "暂无屏蔽数据")];

    list.sort((a, b) => (b.date || 0) - (a.date || 0));
    return list.map(item => Render.info(item.name || "未知名称", `ID: ${item.id}`, item.poster ? item.poster : ""));
}
