const CONFIG = {
    ALL_NETWORKS: "1605|2007|1330|1419|1631",
    BASE_GENRE: "16", 
    BLOCK_GENRE: "10762" 
};

WidgetMetadata = {
  id: "bangdan_japan_simple", // 改ID刷新配置
  title: "日漫榜单",
  description: "聚合全网平台的日本动画榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
    {
      title: "日漫榜单",
      description: "浏览国内引进的日本动画",
      requiresWebView: false,
      functionName: "moduleDiscover",
      cacheDuration: 3600, 
      params: [
        {
          name: "platform", title: "播出平台", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部平台", value: "" }, 
            { title: "哔哩哔哩", value: "1605" },
            { title: "腾讯视频", value: "2007" },
            { title: "爱奇艺", value: "1330" },
            { title: "优酷", value: "1419" },
            { title: "芒果TV", value: "1631" }
          ]
        },
        // 优化：四大核心分类，去重去冗余
        {
          name: "genre", title: "动画题材", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部题材", value: "" },
            // 1. 动作冒险 (Action & Adventure) - 涵盖战斗/战争/机战
            { title: "热血 / 冒险", value: "10759" },
            // 2. 科幻奇幻 (Sci-Fi & Fantasy) - 涵盖异世界/魔法/超能力
            { title: "奇幻 / 异界", value: "10765" },
            // 3. 喜剧 (Comedy) - 涵盖恋爱/搞笑/日常/治愈 (大部分日常番都有喜剧标签)
            { title: "恋爱 / 日常", value: "35" },
            // 4. 剧情 (Drama) - 涵盖悬疑/推理/深度/致郁
            { title: "烧脑 / 剧情", value: "18" }
          ]
        },
        { 
          name: "page_num", title: "选择页码", type: "enumeration", value: "1",
          enumOptions: [
            {title: "第一页", value: "1"}, {title: "第二页", value: "2"},
            {title: "第三页", value: "3"}, {title: "第四页", value: "4"},
            {title: "第五页", value: "5"}, {title: "第六页", value: "6"},
            {title: "第七页", value: "7"}, {title: "第八页", value: "8"},
            {title: "第九页", value: "9"}, {title: "第十页", value: "10"}
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
    const targetPlatform = platform || CONFIG.ALL_NETWORKS;

    try {
        const res = await Widget.tmdb.get('/discover/tv', { 
            params: {
                language: 'zh-CN', 
                page: p,
                sort_by: 'first_air_date.desc',
                with_networks: targetPlatform,
                with_genres: genre ? `${CONFIG.BASE_GENRE},${genre}` : CONFIG.BASE_GENRE,
                with_original_language: 'ja', // 保持日漫锁
                without_genres: CONFIG.BLOCK_GENRE, 
                'first_air_date.lte': getBeijingToday()
            }
        });
        
        const results = res.results || [];

        return results
            .filter(item => item.name && item.poster_path)
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "网络请求错误")];
    }
}
