// ===========================================
// Forward Widget: 动画榜单 (Better Genre UI)
// Version: 1.0.0 (Fixed)
// ===========================================

const CONFIG = {
    CN_NETWORKS: "1605|2007|1330|1419|1631",
    BASE_GENRE: "16",
    BLOCK_GENRE: "10762" // 屏蔽儿童
};

WidgetMetadata = {
  id: "bangdan",
  title: "动画榜单",
  description: "动画榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0, 
  modules: [
    {
      title: "动画榜单",
      description: "浏览国内平台已开播的动画",
      requiresWebView: false,
      functionName: "moduleDiscover",
      cacheDuration: 1800, 
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
        // 优化点：视觉分层与场景化分类
        {
          name: "genre", title: "动画题材", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部题材", value: "" },
            // --- 热门区 ---
            { title: "【热门】热血战斗", value: "10759" },
            { title: "【热门】异界奇幻", value: "10765" },
            // --- 轻松区 ---
            { title: "【轻松】搞笑恋爱", value: "35" },
            { title: "【轻松】日常治愈", value: "10751" },
            // --- 硬核区 ---
            { title: "【硬核】悬疑智斗", value: "9648" },
            { title: "【硬核】深度剧情", value: "18" },
            { title: "【硬核】战争机战", value: "10768" }
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
    }
  ]
};

// ================= 核心工具 =================

const Render = {
    card: (item) => ({
        id: String(item.id), 
        type: "tmdb", 
        title: item.name, 
        overview: item.overview || "暂无简介",
        posterPath: item.poster_path, 
        rating: item.vote_average,
        releaseDate: item.first_air_date, 
        mediaType: "tv"
    }),
    info: (title, desc) => ({
        id: "msg_" + Math.random().toString(36).substr(2), 
        type: "info", 
        title: title, 
        description: desc, 
        mediaType: "info"
    })
};

const getBeijingToday = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const bjTime = new Date(utc + (3600000 * 8)); 
    return bjTime.toISOString().split('T')[0];
};

// ================= 模块实现 =================

async function moduleDiscover(args) {
    const { platform, genre, page_num } = args;
    const p = parseInt(page_num) || 1;

    try {
        const res = await Widget.tmdb.get('/discover/tv', { 
            params: {
                language: 'zh-CN', 
                page: p,
                sort_by: 'first_air_date.desc',
                with_networks: platform || CONFIG.CN_NETWORKS,
                with_genres: genre ? `${CONFIG.BASE_GENRE},${genre}` : CONFIG.BASE_GENRE,
                without_genres: CONFIG.BLOCK_GENRE, 
                'first_air_date.lte': getBeijingToday()
            }
        });
        
        return (res.results || [])
            .filter(item => item.name && item.poster_path)
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "网络请求错误")];
    }
}
