// ================= 元数据配置 =================
WidgetMetadata = {
  id: "bangdan",
  title: "影视榜单",
  description: "影视榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // ------------- 1. 播出平台模块 -------------
    {
      title: "播出平台",
      description: "按播出平台和内容类型筛选剧集内容",
      requiresWebView: false,
      functionName: "tmdbDiscoverByNetwork",
      cacheDuration: 3600,
      params: [
        {
          name: "with_networks", title: "播出平台", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部", value: "" },
            { title: "Tencent", value: "2007" },
            { title: "iQiyi", value: "1330" },
            { title: "Youku", value: "1419" },
            { title: "Bilibili", value: "1605" },
            { title: "MGTV", value: "1631" }
          ]
        },
        {
          name: "with_genres", title: "内容类型", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部类型", value: "" }, { title: "犯罪", value: "80" }, { title: "动画", value: "16" },
            { title: "喜剧", value: "35" }, { title: "剧情", value: "18" }, { title: "悬疑", value: "9648" },
            { title: "家庭", value: "10751" }, { title: "动作冒险", value: "10759" }, { title: "科幻奇幻", value: "10765" }
          ]
        },
        {
          name: "air_status", title: "上映状态", type: "enumeration", value: "released",
          enumOptions: [{ title: "已上映", value: "released" }, { title: "未上映", value: "upcoming" }, { title: "全部", value: "" }]
        },
        {
          name: "sort_by", title: "排序方式", type: "enumeration", value: "first_air_date.desc",
          enumOptions: [
            { title: "上映时间↓", value: "first_air_date.desc" },
            { title: "上映时间↑", value: "first_air_date.asc" },
            { title: "人气最高", value: "popularity.desc" },
            { title: "评分最高", value: "vote_average.desc" },
            { title: "最多投票", value: "vote_count.desc" }
          ]
        },
        { name: "page", title: "页码", type: "page" },
        { name: "language", title: "语言", type: "language", value: "zh-CN" }
      ]
    },
    // ------------- 2. 搜索屏蔽模块 (交互优化版) -------------
    {
      title: "搜索屏蔽",
      description: "搜索内容或类型，点击结果即可屏蔽",
      requiresWebView: false,
      functionName: "searchAndBlock",
      cacheDuration: 0,
      params: [
        {
          name: "block_type", title: "屏蔽类型", type: "enumeration", value: "by_name",
          enumOptions: [{ title: "按影片名称", value: "by_name" }, { title: "按内容类型", value: "by_genre" }, { title: "手动输入ID", value: "manual_id" }]
        },
        // 优化点：类型名称改为下拉菜单
        { 
          name: "genre_id", title: "选择类型", type: "enumeration", value: "", 
          belongTo: { paramName: "block_type", value: ["by_genre"] },
          enumOptions: [
            { title: "真人秀", value: "10764" }, { title: "脱口秀", value: "10767" }, { title: "综艺", value: "10764" },
            { title: "纪录片", value: "99" }, { title: "动作冒险", value: "10759" }, { title: "动画", value: "16" },
            { title: "喜剧", value: "35" }, { title: "犯罪", value: "80" }, { title: "剧情", value: "18" },
            { title: "家庭", value: "10751" }, { title: "儿童", value: "10762" }, { title: "悬疑", value: "9648" },
            { title: "新闻", value: "10763" }, { title: "科幻奇幻", value: "10765" }, { title: "肥皂剧", value: "10766" },
            { title: "战争政治", value: "10768" }, { title: "西部", value: "37" }, { title: "动作", value: "28" },
            { title: "冒险", value: "12" }, { title: "历史", value: "36" }, { title: "奇幻", value: "14" },
            { title: "恐怖", value: "27" }, { title: "音乐", value: "10402" }, { title: "爱情", value: "10749" },
            { title: "科幻", value: "878" }, { title: "电视电影", value: "10770" }, { title: "惊悚", value: "53" },
            { title: "战争", value: "10752" }
          ]
        },
        { name: "query", title: "影片名称", type: "input", value: "", placeholder: "例如：鬼灭之刃", belongTo: { paramName: "block_type", value: ["by_name"] } },
        { name: "tmdb_id", title: "TMDB ID", type: "input", value: "", placeholder: "例如：550", belongTo: { paramName: "block_type", value: ["manual_id"] } },
        { name: "media_type", title: "媒体类型", type: "enumeration", value: "tv", enumOptions: [{ title: "剧集", value: "tv" }, { title: "电影", value: "movie" }], belongTo: { paramName: "block_type", value: ["manual_id"] } }
      ]
    },
    // ------------- 3. 屏蔽管理模块 (交互优化版) -------------
    {
      title: "屏蔽管理",
      description: "点击列表项即可解除屏蔽",
      requiresWebView: false,
      functionName: "manageBlockedItems",
      cacheDuration: 0,
      params: [
        {
          name: "manage_type", title: "管理类型", type: "enumeration", value: "items",
          enumOptions: [{ title: "屏蔽的内容", value: "items" }, { title: "屏蔽的类型", value: "genres" }]
        },
        {
          name: "action", title: "操作", type: "enumeration", value: "view",
          enumOptions: [{ title: "查看 (点击解除)", value: "view" }, { title: "清空所有", value: "clear" }, { title: "导出配置", value: "export" }, { title: "导入配置", value: "import" }]
        },
        { name: "import_data", title: "导入数据", type: "input", value: "", belongTo: { paramName: "action", value: ["import"] } }
      ]
    }
  ]
};

// ================= 常量与缓存 =================
const CONSTANTS = {
    GENRE_KEY: "forward_blocked_genres",
    ITEM_KEY: "forward_blocked_items",
    // 这里的 MAP 仅用于反查名称，下拉菜单已硬编码在 Params 中
    TMDB_GENRE_MAP: {
        "10764": "真人秀", "10767": "脱口秀", "99": "纪录片", "10759": "动作冒险",
        "16": "动画", "35": "喜剧", "80": "犯罪", "18": "剧情", "10751": "家庭",
        "10762": "儿童", "9648": "悬疑", "10763": "新闻", "10765": "科幻奇幻",
        "10766": "肥皂剧", "10768": "战争政治", "37": "西部", "28": "动作",
        "12": "冒险", "36": "历史", "14": "奇幻", "27": "恐怖", "10402": "音乐",
        "10749": "爱情", "878": "科幻", "10770": "电视电影", "53": "惊悚", "10752": "战争"
    },
    DOMESTIC_IDS: "2007|1330|1419|1605|1631",
    DOMESTIC_STD: { minVoteCount: 5 },
    DEFAULT_STD: { minVoteCount: 10 }
};

let cache = { genres: null, blockedIds: null, blockedGenres: null, blockedItems: null };

function resetCache(keys = []) {
    if (!keys.length) cache = { genres: null, blockedIds: null, blockedGenres: null, blockedItems: null };
    else keys.forEach(k => cache[k] = null);
}

function getStorage(key, defaultVal = []) {
    try {
        const val = Widget.storage.get(key);
        return val ? JSON.parse(val) : defaultVal;
    } catch { return defaultVal; }
}

function setStorage(key, val) {
    try {
        Widget.storage.set(key, JSON.stringify(val));
        return true;
    } catch { return false; }
}

function getBlockedGenres() {
    if (cache.blockedGenres) return cache.blockedGenres;
    return cache.blockedGenres = getStorage(CONSTANTS.GENRE_KEY);
}

function getBlockedItems() {
    if (cache.blockedItems) return cache.blockedItems;
    return cache.blockedItems = getStorage(CONSTANTS.ITEM_KEY);
}

function getBlockedIdSet() {
    if (cache.blockedIds) return cache.blockedIds;
    const set = new Set();
    getBlockedItems().forEach(item => {
        set.add(String(item.id));
        set.add(`${item.id}_${item.media_type}`);
    });
    return cache.blockedIds = set;
}

// ================= 核心逻辑 =================
function isBlocked(item) {
    if (!item?.id) return false;
    const idSet = getBlockedIdSet();
    const sid = String(item.id);
    if (idSet.has(sid)) return true;
    const mType = item.mediaType || item.media_type;
    if (mType && idSet.has(`${sid}_${mType}`)) return true;
    
    if (item.genre_ids && Array.isArray(item.genre_ids) && item.genre_ids.length > 0) {
        const blockedGids = new Set(getBlockedGenres().map(g => g.id));
        if (item.genre_ids.some(gid => blockedGids.has(gid))) return true;
    }
    return false;
}

function filterBlockedItemsEnhanced(items) {
    return Array.isArray(items) ? items.filter(item => !isBlocked(item)) : [];
}

function addBlockedGenre(name, id) {
    const list = getBlockedGenres();
    const gid = String(id);
    if (list.some(g => String(g.id) === gid)) return false;
    list.push({ id: gid, name, description: `屏蔽"${name}"`, blocked_date: new Date().toISOString() });
    return setStorage(CONSTANTS.GENRE_KEY, list) && (resetCache(['blockedGenres']) || true);
}

function removeBlockedGenre(id) {
    const list = getBlockedGenres().filter(g => String(g.id) !== String(id));
    return setStorage(CONSTANTS.GENRE_KEY, list) && (resetCache(['blockedGenres']) || true);
}

function addBlockedItem(item) {
    const list = getBlockedItems();
    const sid = String(item.id);
    if (list.some(i => i.id === sid && i.media_type === item.media_type)) return false;
    
    const displayTitle = item.title || item.name || `ID:${sid}`;
    
    list.push({
        id: sid, media_type: item.media_type, title: displayTitle,
        poster_path: item.poster_path, overview: item.overview,
        blocked_date: new Date().toISOString(), vote_average: item.vote_average || 0
    });
    return setStorage(CONSTANTS.ITEM_KEY, list) && (resetCache(['blockedItems', 'blockedIds']) || true);
}

function removeBlockedItem(id, mediaType) {
    const list = getBlockedItems().filter(i => !(i.id === String(id) && i.media_type === mediaType));
    return setStorage(CONSTANTS.ITEM_KEY, list) && (resetCache(['blockedItems', 'blockedIds']) || true);
}

async function fetchTmdbGenres() {
    if (cache.genres) return cache.genres;
    const [m, t] = await Promise.all([
        Widget.tmdb.get('/genre/movie/list', { params: { language: 'zh-CN' } }),
        Widget.tmdb.get('/genre/tv/list', { params: { language: 'zh-CN' } })
    ]);
    return cache.genres = {
        movie: m.genres.reduce((a, g) => ({ ...a, [g.id]: g.name }), {}),
        tv: t.genres.reduce((a, g) => ({ ...a, [g.id]: g.name }), {})
    };
}

function getTmdbGenreTitles(ids, type) {
    const map = cache.genres?.[type] || {};
    return (ids || []).slice(0, 3).map(id => map[id]).filter(Boolean).join('•');
}

async function fetchTmdbBase(endpoint, params) {
    const [data, _] = await Promise.all([
        Widget.tmdb.get(endpoint, { params }),
        fetchTmdbGenres()
    ]);
    const rawResults = data.results || [];
    const results = rawResults.map(item => {
        const mType = item.media_type || (item.title ? 'movie' : 'tv');
        return {
            id: String(item.id),
            type: "tmdb",
            title: item.title || item.name,
            description: item.overview,
            releaseDate: item.release_date || item.first_air_date,
            backdropPath: item.backdrop_path,
            posterPath: item.poster_path,
            rating: item.vote_average,
            mediaType: mType,
            genreTitle: getTmdbGenreTitles(item.genre_ids, mType),
            genre_ids: item.genre_ids || [],
            vote_count: item.vote_count
        };
    }).filter(item => 
        item.posterPath && item.title && item.genre_ids.length > 0 &&
        (!params['vote_count.gte'] || item.vote_count >= params['vote_count.gte'])
    );
    return filterBlockedItemsEnhanced(results);
}

// ================= 模块功能 =================
async function tmdbDiscoverByNetwork(params = {}) {
    const sortBy = params.sort_by || "first_air_date.desc";
    const networksToSearch = params.with_networks || CONSTANTS.DOMESTIC_IDS;
    
    const apiParams = {
        language: params.language || 'zh-CN', 
        page: params.page || 1,
        with_networks: networksToSearch, 
        sort_by: sortBy,
        with_genres: params.with_genres,
        'first_air_date.lte': params.air_status === 'released' ? getBeijingDate() : undefined,
        'first_air_date.gte': params.air_status === 'upcoming' ? getBeijingDate() : undefined
    };
    
    if (sortBy === 'vote_average.desc') {
        const isDomestic = CONSTANTS.DOMESTIC_IDS.includes(String(networksToSearch));
        apiParams['vote_count.gte'] = isDomestic ? CONSTANTS.DOMESTIC_STD.minVoteCount : CONSTANTS.DEFAULT_STD.minVoteCount;
    }
    return await fetchTmdbBase('/discover/tv', apiParams);
}

async function searchAndBlock(params) {
    const { block_type, query, genre_id, language = "zh-CN" } = params;

    // 类型屏蔽 - 使用下拉菜单的 genre_id
    if (block_type === "by_genre") {
        if (!genre_id) return [createMsg("info", "请选择要屏蔽的类型")];
        
        const genreName = CONSTANTS.TMDB_GENRE_MAP[genre_id] || "未知类型";
        const isB = getBlockedGenres().some(bg => String(bg.id) === String(genre_id));
        
        // 关键：添加 link 属性
        const link = isB 
            ? `unblock_genre://${genre_id}/${encodeURIComponent(genreName)}` 
            : `block_genre://${genre_id}/${encodeURIComponent(genreName)}`;
            
        return [
            createMsg("info", `🔍 ${genreName}`, `ID: ${genre_id}`),
            {
                id: `genre_${genre_id}`, type: "info",
                title: `${isB ? "🚫 已屏蔽 (点击解封)" : "✅ 未屏蔽 (点击屏蔽)"}`,
                description: isB ? "此类型已在黑名单中" : "点击加入黑名单",
                posterPath: "", mediaType: "info",
                link: link // 添加点击跳转链接
            }
        ];
    }

    // 手动 ID 屏蔽
    if (block_type === "manual_id") {
        const id = (params.tmdb_id || "").trim();
        if (!/^\d+$/.test(id)) return [createMsg("error", "无效ID")];
        try {
            const mType = params.media_type || "movie";
            const item = await Widget.tmdb.get(`/${mType}/${id}`, { params: { language: "zh-CN" } }).then(r => r.data || r);
            const success = addBlockedItem({ ...item, media_type: mType });
            return [createMsg("info", success ? "屏蔽成功" : "已存在", item.title || item.name)];
        } catch (e) { return [createMsg("error", "失败", e.message)]; }
    }

    // 按名称搜索
    if (!query) return [createMsg("info", "请输入关键词")];
    try {
        const res = await Widget.tmdb.get("/search/multi", { params: { query, language, page: 1 } });
        const results = (res.results || res.data?.results || [])
            .filter(i => ["movie", "tv"].includes(i.media_type) && i.poster_path)
            .slice(0, 20);

        if (!results.length) return [createMsg("info", "未找到结果")];

        const blockedSet = getBlockedIdSet();
        return [
            createMsg("info", "搜索结果 (点击屏蔽)", `找到 ${results.length} 个结果`),
            ...results.map(i => {
                const isB = blockedSet.has(String(i.id)) || blockedSet.has(`${i.id}_${i.media_type}`);
                const title = i.title || i.name;
                return {
                    id: `search_${i.id}`, type: "info",
                    title: `${isB ? "🚫" : "✅"} ${title} (${(i.release_date || i.first_air_date || '').slice(0, 4)})`,
                    description: `ID: ${i.id} | 评分: ${i.vote_average} | ${isB ? "已屏蔽" : "点击屏蔽"}`,
                    posterPath: `https://image.tmdb.org/t/p/w500${i.poster_path}`,
                    mediaType: i.media_type,
                    // 关键：添加点击跳转链接
                    link: isB ? "" : `block://${i.id}/${i.media_type}/${encodeURIComponent(title)}`
                };
            })
        ];
    } catch (e) { return [createMsg("error", "搜索失败", e.message)]; }
}

async function manageBlockedItems(params) {
    const { manage_type, action } = params;

    if (action === "clear") {
        if (manage_type === "genres") {
            setStorage(CONSTANTS.GENRE_KEY, []) && resetCache();
            return [createMsg("info", "类型屏蔽已清空")];
        }
        Widget.storage.clear(); resetCache();
        return [createMsg("info", "所有屏蔽已清空")];
    }

    if (action === "export") {
        const ids = getBlockedItems().map(i => i.id).join(',');
        return [createMsg("info", "导出配置", ids || "无数据")];
    }

    if (action === "import") {
        const ids = (params.import_data || "").replace(/['"]/g, '').split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s));
        let count = 0;
        ids.forEach(id => addBlockedItem({ id, media_type: "movie", title: `Imported ${id}` }) && count++);
        return [createMsg("info", "导入完成", `成功导入 ${count} 条`)];
    }

    // 查看模式（支持点击解封）
    const list = manage_type === "genres" ? getBlockedGenres() : getBlockedItems();
    if (!list.length) return [createMsg("info", "列表为空")];

    // 排序
    const sortedList = list.sort((a, b) => new Date(b.blocked_date) - new Date(a.blocked_date));

    return sortedList.map(i => {
        if (manage_type === "genres") {
            return {
                id: `b_g_${i.id}`, type: "info",
                title: `🚫 ${i.name}`,
                description: `ID: ${i.id} | 点击解除屏蔽`,
                posterPath: "", mediaType: "info",
                link: `unblock_genre://${i.id}/${encodeURIComponent(i.name)}`
            };
        } else {
            return {
                id: `b_${i.id}`, type: "info",
                title: `${i.title || i.name}`,
                description: `ID: ${i.id} | Time: ${new Date(i.blocked_date).toLocaleDateString()} | 点击解封`,
                posterPath: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "",
                mediaType: i.media_type,
                link: `unblock://${i.id}/${i.media_type}/${encodeURIComponent(i.title || i.name)}`
            };
        }
    });
}

function getBeijingDate() {
    return new Date(Date.now() + 28800000).toISOString().split('T')[0];
}

function createMsg(type, title, desc = "") {
    return { id: Math.random().toString(36), type, title, description: desc, posterPath: "", mediaType: "info" };
}

// Deeplink 处理逻辑 - 负责响应点击
async function loadDetail(link) {
    try {
        const [scheme, content] = link.split("://");
        
        // 屏蔽内容
        if (scheme === "block") {
            const [id, mType, encTitle] = content.split("/");
            const title = decodeURIComponent(encTitle || "");
            const item = await Widget.tmdb.get(`/${mType}/${id}`, { params: { language: "zh-CN" } }).then(r => r.data || r);
            const ok = addBlockedItem({ ...item, media_type: mType });
            return { title: ok ? "✅ 已屏蔽" : "ℹ️ 已存在", description: `${title} 已加入黑名单，刷新列表后消失` };
        } 
        
        // 解封内容
        if (scheme === "unblock") {
            const [id, mType, encTitle] = content.split("/");
            const title = decodeURIComponent(encTitle || "");
            const ok = removeBlockedItem(id, mType);
            return { title: ok ? "✅ 已解封" : "❌ 失败", description: `${title} 已移出黑名单` };
        }

        // 屏蔽类型
        if (scheme === "block_genre") {
            const [id, encName] = content.split("/");
            const name = decodeURIComponent(encName || "");
            const ok = addBlockedGenre(name, id);
            return { title: ok ? "✅ 类型已屏蔽" : "ℹ️ 已存在", description: `${name} 类型内容将不再显示` };
        }

        // 解封类型
        if (scheme === "unblock_genre") {
            const [id, encName] = content.split("/");
            const name = decodeURIComponent(encName || "");
            const ok = removeBlockedGenre(id);
            return { title: ok ? "✅ 类型已解封" : "❌ 失败", description: `${name} 类型已恢复显示` };
        }

    } catch (e) { return { title: "❌ 错误", description: e.message }; }
    return { title: "未知操作", description: "" };
}
