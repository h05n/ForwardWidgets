// ===========================================
// Forward Widget: 动画榜单 (Domestic Anime v10.0)
// Version: 10.0.0 (Clean Text & Renamed)
// Author: Optimized by Gemini
// ===========================================

const CONFIG = {
    CN_NETWORKS: "1605|2007|1330|1419|1631",
    KEY_BLOCK_ITEMS: "fw_anime_block_items"
};

WidgetMetadata = {
  id: "anime_rank_v10",
  title: "动画榜单",
  description: "国内平台动画专用榜单 (v10.0 纯净版)",
  author: "ForwardUser",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "10.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0, 
  modules: [
    // ------------------------------------------------
    // 模块 1: 动画榜单
    // ------------------------------------------------
    {
      title: "动画榜单",
      description: "浏览国内平台已开播的动画",
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
          name: "page_num", title: "选择页码", type: "enumeration", value: "1",
          enumOptions: [
            {title: "第 1 页", value: "1"}, {title: "第 2 页", value: "2"},
            {title: "第 3 页", value: "3"}, {title: "第 4 页", value: "4"},
            {title: "第 5 页", value: "5"}, {title: "第 6 页", value: "6"},
            {title: "第 7 页", value: "7"}, {title: "第 8 页", value: "8"},
            {title: "第 9 页", value: "9"}, {title: "第 10 页", value: "10"}
          ]
        }
      ]
    },
    // ------------------------------------------------
    // 模块 2: 屏蔽管理 (已更名，无表情)
    // ------------------------------------------------
    {
      title: "屏蔽管理",
      description: "手动输入精确名称进行管理",
      requiresWebView: false,
      functionName: "moduleShield",
      cacheDuration: 0,
      params: [
        {
          name: "mode", title: "执行操作", type: "enumeration", value: "block",
          enumOptions: [
            { title: "屏蔽 (输入名称)", value: "block" },
            { title: "解除 (输入名称)", value: "unblock" },
            { title: "查看列表", value: "list" },
            { title: "清空所有", value: "clear" }
          ]
        },
        // 输入框常驻，无表情提示
        { 
            name: "input_name", title: "准确剧名", type: "input", value: "", 
            placeholder: "屏蔽或解除时请填写准确名称"
        }
      ]
    }
  ]
};

// ================= 核心逻辑 =================

const Render = {
    card: (item) => ({
        id: String(item.id), type: "tmdb", 
        title: item.name, overview: item.overview || "暂无简介",
        posterPath: item.poster_path, rating: item.vote_average,
        releaseDate: item.first_air_date, mediaType: "tv"
    }),
    info: (title, desc, poster = "") => ({
        id: "m_" + Math.random().toString(36).substr(2), type: "info", 
        title: title, description: desc, posterPath: poster, mediaType: "info"
    })
};

const DB = {
    get: () => { try { return JSON.parse(Widget.storage.get(CONFIG.KEY_BLOCK_ITEMS)) || []; } catch { return []; } },
    set: (v) => Widget.storage.set(CONFIG.KEY_BLOCK_ITEMS, JSON.stringify(v)),
    getSet: () => new Set(DB.get().map(i => String(i.id)))
};

const getToday = () => {
    const d = new Date();
    return new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + (3600000 * 8)).toISOString().split('T')[0];
};

// 模块 1: 发现
async function moduleDiscover(args) {
    const { platform, genre, page_num } = args;
    const p = parseInt(page_num) || 1;

    try {
        const res = await Widget.tmdb.get('/discover/tv', { 
            params: {
                language: 'zh-CN', page: p,
                sort_by: 'first_air_date.desc',
                with_networks: platform || CONFIG.CN_NETWORKS,
                with_genres: genre ? `16,${genre}` : "16",
                'first_air_date.lte': getToday()
            }
        });
        
        const bSet = DB.getSet();
        return (res.results || [])
            .filter(i => !bSet.has(String(i.id)))
            .filter(i => i.name && i.poster_path)
            .map(Render.card);
    } catch { return [Render.info("加载失败", "网络请求错误")]; }
}

// 模块 2: 屏蔽管理 (纯净版)
async function moduleShield(args) {
    const { mode, input_name } = args;
    const list = DB.get();

    // --- 查看 ---
    if (mode === 'list') {
        if (!list.length) return [Render.info("列表为空", "暂无屏蔽内容")];
        return list.reverse().map(i => Render.info(i.name, "已屏蔽", i.poster));
    }

    // --- 清空 ---
    if (mode === 'clear') {
        DB.set([]);
        return [Render.info("操作完成", "列表已清空")];
    }

    // --- 屏蔽 (搜 -> 封) ---
    if (mode === 'block') {
        if (!input_name) return [Render.info("提示", "请输入要屏蔽的动画全名")];
        
        try {
            const res = await Widget.tmdb.get('/search/tv', { params: { query: input_name, language: 'zh-CN' } });
            const target = (res.results || []).find(i => i.name && i.poster_path);

            if (!target) return [Render.info("未找到", "搜不到该动画，请核对名称")];
            if (list.some(i => String(i.id) === String(target.id))) {
                return [Render.info("重复操作", `${target.name} 已经在黑名单里`)];
            }

            list.push({ id: String(target.id), name: target.name, poster: target.poster_path });
            DB.set(list);
            return [Render.info("屏蔽成功", `已拉黑: ${target.name}`, target.poster_path)];
            
        } catch { return [Render.info("错误", "网络请求失败")]; }
    }

    // --- 解除 (完全精确匹配) ---
    if (mode === 'unblock') {
        if (!input_name) return [Render.info("提示", "请输入要解除的动画全名")];

        const initialCount = list.length;
        // 严格精确匹配
        const newList = list.filter(item => item.name !== input_name.trim());

        if (newList.length === initialCount) {
            return [Render.info("匹配失败", "未找到完全同名的屏蔽项")];
        }

        DB.set(newList);
        return [Render.info("解除成功", `已恢复显示: ${input_name}`)];
    }
}
