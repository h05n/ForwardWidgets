// ================= 元数据配置 =================
// 注意：不要加 const/let，确保它是全局变量，Forward 才能读取到
WidgetMetadata = {
  id: "bangdan",
  title: "影视榜单",
  description: "影视动画榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60,
  modules: [
    // ------------- TMDB 模块 -------------
    {
      title: "TMDB 热门剧集",
      description: "今日热门电视剧",
      requiresWebView: false,
      functionName: "loadTodayHotTV",
      cacheDuration: 3600,
      params: [
        { name: "language", title: "语言", type: "language", value: "zh-CN" },
        { 
          name: "sort_by", title: "地区", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部地区", value: "" }, { title: "中国", value: "CN" }, { title: "美国", value: "US" },
            { title: "韩国", value: "KR" }, { title: "日本", value: "JP" }, { title: "英国", value: "GB" },
            { title: "泰国", value: "TH" }, { title: "德国", value: "DE" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      title: "TMDB 热门电影",
      description: "今日热门电影",
      requiresWebView: false,
      functionName: "loadTodayHotMovies",
      cacheDuration: 3600,
      params: [
        { name: "language", title: "语言", type: "language", value: "zh-CN" },
        { 
          name: "sort_by", title: "地区", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部地区", value: "" }, { title: "中国", value: "CN" }, { title: "美国", value: "US" },
            { title: "韩国", value: "KR" }, { title: "日本", value: "JP" }, { title: "英国", value: "GB" },
            { title: "中国香港", value: "HK" }, { title: "中国台湾", value: "TW" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
      title: "TMDB 高分内容",
      description: "高分电影或剧集 (按用户评分排序)",
      requiresWebView: false,
      functionName: "tmdbTopRated",
      cacheDuration: 3600,
      params: [
        { name: "type", title: "类型", type: "enumeration", enumOptions: [{ title: "电影", value: "movie" }, { title: "剧集", value: "tv" }], value: "movie" },
        { name: "language", title: "语言", type: "language", value: "zh-CN" },
        { name: "page", title: "页码", type: "page" }
      ]
    },
    {
        title: "TMDB 播出平台",
        description: "按播出平台和内容类型筛选剧集内容",
        requiresWebView: false,
        functionName: "tmdbDiscoverByNetwork",
        cacheDuration: 3600,
        params: [
            {
                name: "with_networks", title: "播出平台", type: "enumeration", value: "",
                enumOptions: [
                  { title: "全部", value: "" }, { title: "Tencent", value: "2007" }, { title: "iQiyi", value: "1330" },
                  { title: "Youku", value: "1419" }, { title: "Bilibili", value: "1605" }, { title: "Netflix", value: "213" },
                  { title: "Disney+", value: "2739" }, { title: "HBO", value: "49" }, { title: "Apple TV+", value: "2552" }
                ]
            },
            {
              name: "with_genres", title: "内容类型", type: "enumeration", value: "",
              enumOptions: [
                { title: "全部类型", value: "" }, { title: "犯罪", value: "80" }, { title: "动画", value: "16" },
                { title: "喜剧", value: "35" }, { title: "剧情", value: "18" }, { title: "悬疑", value: "9648" }
              ]
            },
            {
              name: "air_status", title: "上映状态", type: "enumeration", value: "released",
              enumOptions: [{ title: "已上映", value: "released" }, { title: "未上映", value: "upcoming" }, { title: "全部", value: "" }]
            },
            {
              name: "sort_by", title: "排序方式", type: "enumeration", value: "first_air_date.desc",
              enumOptions: [
                { title: "上映时间↓", value: "first_air_date.desc" }, { title: "人气最高", value: "popularity.desc" },
                { title: "评分最高", value: "vote_average.desc" }
              ]
            },
            { name: "page", title: "页码", type: "page" },
            { name: "language", title: "语言", type: "language", value: "zh-CN" }
        ]
    },
    {
      title: "TMDB 出品公司",
      requiresWebView: false,
      functionName: "tmdbCompanies",
      cacheDuration: 3600,
      params: [
        {
          name: "with_companies", title: "出品公司", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部", value: "" }, { title: "Disney", value: "2" }, { title: "Warner Bros", value: "174" },
            { title: "Netflix", value: "213" }, { title: "A24", value: "41077" }
          ]
        },
        { name: "page", title: "页码", type: "page" },
        { name: "language", title: "语言", type: "language", value: "zh-CN" }
      ]
    },
    // ------------- 屏蔽管理模块 -------------
    {
      title: "TMDB 搜索屏蔽",
      description: "按影片名称或内容类型进行屏蔽",
      requiresWebView: false,
      functionName: "searchAndBlock",
      cacheDuration: 0,
      params: [
        {
          name: "block_type", title: "屏蔽类型", type: "enumeration", value: "by_name",
          enumOptions: [{ title: "按影片名称", value: "by_name" }, { title: "按内容类型", value: "by_genre" }, { title: "手动输入ID", value: "manual_id" }]
        },
        {
          name: "action", title: "操作模式", type: "enumeration", value: "search_only",
          enumOptions: [{ title: "仅搜索", value: "search_only" }, { title: "搜索并屏蔽", value: "search_and_block" }]
        },
        { name: "query", title: "影片名称", type: "input", value: "", placeholder: "例如：鬼灭之刃" },
        { name: "genre_name", title: "类型名称", type: "input", value: "", placeholder: "例如：真人秀" },
        { name: "tmdb_id", title: "TMDB ID", type: "input", value: "", placeholder: "例如：550" },
        { name: "media_type", title: "媒体类型", type: "enumeration", value: "tv", enumOptions: [{ title: "剧集", value: "tv" }, { title: "电影", value: "movie" }] }
      ]
    },
    {
      title: "TMDB 屏蔽管理",
      description: "查看和管理已屏蔽的内容",
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
          enumOptions: [{ title: "查看", value: "view" }, { title: "清空", value: "clear" }, { title: "取消屏蔽", value: "unblock" }, { title: "导出", value: "export" }, { title: "导入", value: "import" }]
        },
        { name: "unblock_id", title: "解除ID", type: "input", value: "", belongTo: { paramName: "action", value: ["unblock"] } },
        { name: "import_data", title: "导入数据", type: "input", value: "", belongTo: { paramName: "action", value: ["import"] } }
      ]
    },
    // ------------- 豆瓣模块 -------------
    {
      title: "豆瓣自定义片单",
      description: "支持桌面/移动端豆列、官方榜单",
      requiresWebView: false,
      functionName: "loadEnhancedDoubanList",
      cacheDuration: 3600,
      params: [
        {
          name: "url", title: "片单地址", type: "input",
          placeholders: [
              { title: "豆瓣电影实时热榜", value: "https://www.douban.com/doubanapp/dispatch?uri=/subject_collection/movie_real_time_hotest/&dt_dapp=1" },
              { title: "豆瓣书影音实时热榜", value: "https://www.douban.com/doubanapp/dispatch?uri=/subject_collection/subject_real_time_hotest/&dt_dapp=1" }
          ]
        },
        { name: "page", title: "页码", type: "page" }
      ]
    }
  ]
};

// ================= 常量定义 =================
const CONSTANTS = {
    GENRE_KEY: "forward_blocked_genres",
    ITEM_KEY: "forward_blocked_items",
    TMDB_GENRE_MAP: {
        "真人秀": 10764, "脱口秀": 10767, "综艺": 10764, "纪录片": 99, "动作冒险": 10759,
        "动画": 16, "喜剧": 35, "犯罪": 80, "剧情": 18, "家庭": 10751, "儿童": 10762,
        "悬疑": 9648, "新闻": 10763, "科幻奇幻": 10765, "肥皂剧": 10766, "战争政治": 10768,
        "西部": 37, "动作": 28, "冒险": 12, "历史": 36, "奇幻": 14, "恐怖": 27, "音乐": 10402,
        "爱情": 10749, "科幻": 878, "电视电影": 10770, "惊悚": 53, "战争": 10752
    },
    MIN_VOTES: { movie: 50, tv: 30 },
    POPULAR_STD: { movie: { count: 50, avg: 5.0 }, tv: { count: 10, avg: 5.0 } },
    DOMESTIC_NETWORKS: ['2007', '1330', '1419', '1605', '1631'],
    DOMESTIC_STD: { movie: { count: 15, avg: 4.5 }, tv: { count: 5, avg: 4.5 } }
};

// ================= 缓存与存储 =================
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
        if (item.originalDoubanId) set.add(String(item.originalDoubanId));
    });
    return cache.blockedIds = set;
}

// ================= 核心过滤逻辑 =================
function isBlocked(item) {
    if (!item?.id) return false;
    const idSet = getBlockedIdSet();
    const sid = String(item.id);
    
    // ID匹配 (简单ID 或 ID_Media类型)
    if (idSet.has(sid)) return true;
    const mType = item.mediaType || item.media_type;
    if (mType && idSet.has(`${sid}_${mType}`)) return true;
    
    // 豆瓣ID匹配
    if (item.originalDoubanId && idSet.has(String(item.originalDoubanId))) return true;
    
    // 类型匹配
    if (item.genre_ids && Array.isArray(item.genre_ids) && item.genre_ids.length > 0) {
        const blockedGids = new Set(getBlockedGenres().map(g => g.id));
        if (item.genre_ids.some(gid => blockedGids.has(gid))) return true;
    }
    return false;
}

function filterBlockedItemsEnhanced(items) {
    return Array.isArray(items) ? items.filter(item => !isBlocked(item)) : [];
}

// ================= 屏蔽操作 =================
function addBlockedGenre(name, id) {
    const list = getBlockedGenres();
    if (list.some(g => g.id === id)) return false;
    list.push({ id, name, description: `屏蔽"${name}"`, blocked_date: new Date().toISOString() });
    return setStorage(CONSTANTS.GENRE_KEY, list) && (resetCache(['blockedGenres']) || true);
}

function removeBlockedGenre(id) {
    const list = getBlockedGenres().filter(g => g.id !== id);
    return setStorage(CONSTANTS.GENRE_KEY, list) && (resetCache(['blockedGenres']) || true);
}

function addBlockedItem(item) {
    const list = getBlockedItems();
    const sid = String(item.id);
    if (list.some(i => i.id === sid && i.media_type === item.media_type)) return false;
    list.push({
        id: sid, media_type: item.media_type, title: item.title,
        poster_path: item.poster_path, overview: item.overview,
        blocked_date: new Date().toISOString(), vote_average: item.vote_average || 0
    });
    return setStorage(CONSTANTS.ITEM_KEY, list) && (resetCache(['blockedItems', 'blockedIds']) || true);
}

function removeBlockedItem(id, mediaType) {
    const list = getBlockedItems().filter(i => !(i.id === String(id) && i.media_type === mediaType));
    return setStorage(CONSTANTS.ITEM_KEY, list) && (resetCache(['blockedItems', 'blockedIds']) || true);
}

// ================= TMDB 基础函数 =================
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

// 通用 TMDB 获取与处理
async function fetchTmdbBase(endpoint, params, mediaTypeOverride) {
    const [data, _] = await Promise.all([
        Widget.tmdb.get(endpoint, { params }),
        fetchTmdbGenres()
    ]);

    const rawResults = data.results || [];
    const results = rawResults.map(item => {
        const mType = mediaTypeOverride || item.media_type || (item.title ? 'movie' : 'tv');
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
            genre_ids: item.genre_ids || []
        };
    }).filter(item => 
        item.posterPath && item.title && item.genre_ids.length > 0 &&
        (!params['vote_count.gte'] || item.vote_count >= params['vote_count.gte'])
    );

    return filterBlockedItemsEnhanced(results);
}

// ================= 业务功能实现 =================

// 1. 热门内容 (合并 TV 和 Movie)
async function loadHotContent(params, type) {
    const page = parseInt(params.page) || 1;
    const region = params.sort_by || '';
    const isCN = region === 'CN';
    
    // 远程 Trending 数据 (仅第一页且无筛选时)
    if (page === 1 && !region) {
        try {
            const remote = await Widget.http.get("https://for-ward.vercel.app/data/TMDB_Trending.json").then(r => r.data);
            const list = type === 'tv' ? remote.today_tv : remote.today_movies;
            const items = list.filter(i => i.type === type && i.poster_url && i.genre_ids?.length).map(i => ({
                id: String(i.id), type: "tmdb", title: i.title, description: i.overview,
                releaseDate: i.release_date, posterPath: i.poster_url, backdropPath: i.title_backdrop,
                rating: i.rating, mediaType: type, genreTitle: i.genreTitle, genre_ids: i.genre_ids || []
            })).slice(0, 20);
            return filterBlockedItemsEnhanced(items);
        } catch (e) {}
    }

    const std = isCN ? CONSTANTS.DOMESTIC_STD[type] : CONSTANTS.POPULAR_STD[type];
    const apiParams = {
        language: params.language || 'zh-CN',
        page,
        sort_by: 'popularity.desc',
        'vote_count.gte': std.count,
        'vote_average.gte': std.avg,
        with_origin_country: region || undefined
    };
    return await fetchTmdbBase(`/discover/${type}`, apiParams, type);
}

// 暴露给 Forward 的入口函数
async function loadTodayHotTV(params) { return loadHotContent(params, 'tv'); }
async function loadTodayHotMovies(params) { return loadHotContent(params, 'movie'); }

// 2. Top Rated
async function tmdbTopRated(params) {
    const type = params.type || 'movie';
    const minVotes = CONSTANTS.MIN_VOTES[type];
    return await fetchTmdbBase(`/${type}/top_rated`, { ...params, 'vote_count.gte': minVotes }, type);
}

// 3. 按平台发现
async function tmdbDiscoverByNetwork(params = {}) {
    const sortBy = params.sort_by || "first_air_date.desc";
    const apiParams = {
        language: params.language || 'zh-CN', page: params.page || 1,
        with_networks: params.with_networks, sort_by: sortBy,
        with_genres: params.with_genres,
        'first_air_date.lte': params.air_status === 'released' ? getBeijingDate() : undefined,
        'first_air_date.gte': params.air_status === 'upcoming' ? getBeijingDate() : undefined
    };
    
    if (sortBy === 'vote_average.desc') {
        const isDomestic = CONSTANTS.DOMESTIC_NETWORKS.includes(String(params.with_networks));
        apiParams['vote_count.gte'] = isDomestic ? CONSTANTS.DOMESTIC_STD.tv.count : CONSTANTS.MIN_VOTES.tv;
    }
    return await fetchTmdbBase('/discover/tv', apiParams);
}

// 4. 按公司发现
async function tmdbCompanies(params = {}) {
    const sortBy = params.sort_by || "primary_release_date.desc";
    const apiParams = {
        page: params.page || 1, language: "zh-CN", sort_by: sortBy,
        with_companies: params.with_companies,
        with_genres: params.with_genres,
        include_adult: false, include_video: false
    };

    if (sortBy === 'vote_average.desc') apiParams['vote_count.gte'] = CONSTANTS.MIN_VOTES.movie;
    else if (sortBy === 'popularity.desc') {
        apiParams['vote_count.gte'] = CONSTANTS.POPULAR_STD.movie.count;
        apiParams['vote_average.gte'] = CONSTANTS.POPULAR_STD.movie.avg;
    }

    const dateKey = 'primary_release_date';
    if (params.air_status === 'released') apiParams[`${dateKey}.lte`] = getBeijingDate();
    else if (params.air_status === 'upcoming') apiParams[`${dateKey}.gte`] = getBeijingDate();

    return await fetchTmdbBase('/discover/movie', apiParams);
}

// 5. 搜索与屏蔽
async function searchAndBlock(params) {
    const { block_type, action, query, language = "zh-CN" } = params;

    // 类型屏蔽
    if (block_type === "by_genre") {
        const name = (params.genre_name || "").trim().toLowerCase();
        if (!name) return [createMsg("info", "请输入类型名称")];
        
        const matches = Object.entries(CONSTANTS.TMDB_GENRE_MAP)
            .filter(([k]) => k.includes(name) || name.includes(k))
            .map(([n, id]) => ({ name: n, id }));

        if (!matches.length) return [createMsg("info", "未找到匹配类型")];

        if (action === "search_and_block") {
            let count = 0;
            matches.forEach(g => addBlockedGenre(g.name, g.id) && count++);
            return [createMsg("info", "操作完成", `新增屏蔽: ${count}个`)];
        }

        return [
            createMsg("info", "匹配类型", `找到 ${matches.length} 个类型`),
            ...matches.map(g => {
                const isB = getBlockedGenres().some(bg => bg.id === g.id);
                return createMsg("info", `${isB ? "已屏蔽" : "可屏蔽"} ${g.name}`, `ID: ${g.id}`);
            })
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
            return [createMsg("info", success ? "屏蔽成功" : "已存在", item.title)];
        } catch (e) { return [createMsg("error", "失败", e.message)]; }
    }

    // 搜索屏蔽
    if (!query) return [createMsg("info", "请输入关键词")];
    try {
        const res = await Widget.tmdb.get("/search/multi", { params: { query, language, page: 1 } });
        const results = (res.results || res.data?.results || [])
            .filter(i => ["movie", "tv"].includes(i.media_type) && i.poster_path)
            .slice(0, 20);

        if (!results.length) return [createMsg("info", "未找到结果")];

        if (action === "search_and_block") {
            let count = 0;
            results.forEach(i => addBlockedItem(i) && count++);
            return [createMsg("info", "操作完成", `新增屏蔽: ${count}个`)];
        }

        const blockedSet = getBlockedIdSet();
        return [
            createMsg("info", "搜索结果", `找到 ${results.length} 个结果`),
            ...results.map(i => {
                const isB = blockedSet.has(String(i.id)) || blockedSet.has(`${i.id}_${i.media_type}`);
                return {
                    id: `search_${i.id}`, type: "info",
                    title: `${isB ? "已屏蔽 " : ""} ${i.title || i.name} (${(i.release_date || i.first_air_date || '').slice(0, 4)})`,
                    description: `ID: ${i.id} | 评分: ${i.vote_average}`,
                    posterPath: `https://image.tmdb.org/t/p/w500${i.poster_path}`,
                    mediaType: i.media_type
                };
            })
        ];
    } catch (e) { return [createMsg("error", "搜索失败", e.message)]; }
}

// 6. 屏蔽管理
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

    if (action === "unblock") {
        const id = (params.unblock_id || "").trim();
        if (!id) return [createMsg("info", "请输入ID")];
        
        if (manage_type === "genres") {
            return [createMsg("info", removeBlockedGenre(parseInt(id)) ? "类型解封成功" : "失败")];
        } else {
            // 尝试同时移除 movie 和 tv
            const r1 = removeBlockedItem(id, "movie");
            const r2 = removeBlockedItem(id, "tv");
            return [createMsg("info", (r1 || r2) ? "内容解封成功" : "未找到该内容")];
        }
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

    // 查看列表
    const list = manage_type === "genres" ? getBlockedGenres() : getBlockedItems();
    if (!list.length) return [createMsg("info", "列表为空")];

    return list.sort((a, b) => new Date(b.blocked_date) - new Date(a.blocked_date)).map(i => ({
        id: `b_${i.id}`, type: "info",
        title: `${i.name || i.title}`,
        description: `ID: ${i.id} | Time: ${new Date(i.blocked_date).toLocaleDateString()}`,
        posterPath: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "",
        mediaType: manage_type === "genres" ? "genre" : i.media_type
    }));
}

// ================= 豆瓣模块 (逻辑简化) =================
const DoubanRules = [
    { p: /^\u771f\u7684\u662f\u5f88\u4e0d\u9519\u7684\u4eba/, r: '\uc9c4\uc9dc \uad1c\ucc2e\uc740 \uc0ac\ub78c' },
    { p: / \u7b2c[^\u5b63]*\u5b63/, r: '' },
    { p: /^\u5954\u8dd1\u5427(?! ?\u5144\u5f1f)/, r: '\u5954\u8dd1\u5427\u5144\u5f1f' },
    { p: /^\u6700\u540e\u590d\u6d3b\u6218/, r: '\u30d5\u30a1\u30a4\u30ca\u30eb\u30c9\u30e9\u30d5\u30c8' }
];

async function loadEnhancedDoubanList(params) {
    const url = params.url || "";
    if (url.includes("doulist")) return loadDoubanList(params, "doulist");
    if (url.includes("subject_collection")) return loadDoubanList(params, "collection");
    if (url.includes("dispatch")) {
        const uriMatch = url.match(/uri=([^&]+)/);
        if (uriMatch) {
            const uri = decodeURIComponent(uriMatch[1]);
            const target = `https://m.douban.com${uri.startsWith('/') ? uri : '/' + uri}`;
            return loadEnhancedDoubanList({ ...params, url: target });
        }
    }
    return [];
}

async function loadDoubanList(params, type) {
    const page = params.page || 1;
    const count = 20;
    const start = (page - 1) * count;
    
    // 构造 URL
    let items = [];
    
    if (type === "doulist") {
        const lid = params.url.match(/doulist\/(\d+)/)?.[1];
        if (!lid) return [];
        const res = await Widget.http.get(`https://www.douban.com/doulist/${lid}/?start=${start}&sort=seq&playable=0&sub_type=`, {
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/91.0.4472.124" }
        });
        const dom = Widget.dom.parse(res.data);
        const els = Widget.dom.select(dom, ".doulist-item .title a");
        for (const el of els) {
            items.push({ title: (await Widget.dom.text(el)).trim().split(' ')[0], type: "multi" });
        }
    } else {
        const lid = params.url.match(/subject_collection\/(\w+)/)?.[1];
        if (!lid) return [];
        const res = await Widget.http.get(`https://m.douban.com/rexxar/api/v2/subject_collection/${lid}/items?start=${start}&count=${count}&items_only=1&for_mobile=1`, {
            headers: { Referer: `https://m.douban.com/subject_collection/${lid}/` }
        });
        items = res.data.subject_collection_items || [];
    }
    
    // 匹配 TMDB
    const results = await Promise.all(items.map(async item => {
        let title = item.title;
        // 简单正则替换
        for (const rule of DoubanRules) if (rule.p.test(title)) title = title.replace(rule.p, rule.r);
        
        try {
            const searchRes = await Widget.tmdb.get("/search/multi", { params: { query: title, language: "zh-CN" } });
            const match = (searchRes.results || []).find(i => i.poster_path && (i.title || i.name));
            
            if (match) {
                return {
                    id: String(match.id), type: "tmdb", title: match.title || match.name,
                    description: match.overview, releaseDate: match.release_date || match.first_air_date,
                    posterPath: match.poster_path, rating: match.vote_average, mediaType: match.media_type,
                    genreTitle: getTmdbGenreTitles(match.genre_ids, match.media_type)
                };
            }
        } catch {}
        return null;
    }));
    
    return filterBlockedItemsEnhanced(results.filter(Boolean));
}

// ================= 辅助函数 =================
function getBeijingDate() {
    return new Date(Date.now() + 28800000).toISOString().split('T')[0];
}

function createMsg(type, title, desc = "") {
    return { id: Math.random().toString(36), type, title, description: desc, posterPath: "", mediaType: "info" };
}

// Deeplink 处理
async function loadDetail(link) {
    try {
        const [action, content] = link.split("://");
        const parts = (content || "").split("/");
        if (parts.length < 3) return { title: "错误", description: "链接格式无效" };
        
        const [id, mType, encTitle] = parts;
        const title = decodeURIComponent(encTitle || "");
        
        if (action === "block") {
            const item = await Widget.tmdb.get(`/${mType}/${id}`, { params: { language: "zh-CN" } }).then(r => r.data || r);
            const ok = addBlockedItem({ ...item, media_type: mType });
            return { title: ok ? "已屏蔽" : "已存在", description: `${title} 已加入黑名单` };
        } 
        if (action === "unblock") {
            const ok = removeBlockedItem(id, mType);
            return { title: ok ? "已解封" : "失败", description: `${title} 已移出黑名单` };
        }
    } catch (e) { return { title: "错误", description: e.message }; }
    return { title: "未知操作", description: "" };
}
