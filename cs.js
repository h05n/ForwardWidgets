// ===========================================
// Forward Widget: 全球日漫榜 (Stable & Clean)
// Version: 1.0.0
// ===========================================

const CONFIG = {
    // 聚合：国内五大平台 + 国际主流 (Netflix, Disney+, Crunchyroll)
    ALL_NETWORKS: "1605|2007|1330|1419|1631|213|2739|1112",
    BASE_GENRE: "16", 
    BLOCK_GENRE: "10762" 
};

WidgetMetadata = {
  id: "bangdan_global_v4", 
  title: "日漫榜单",
  description: "聚合全球平台的纯净日漫榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0", 
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
    {
      title: "日漫榜单",
      description: "浏览正版引进的日本番剧",
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
        // 极致去重分类：按照观看需求划分，避免内容交叉
        {
          name: "genre", title: "动画题材", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部题材", value: "" },
            { title: "动作热血 (战斗/冒险)", value: "10759" },
            { title: "轻松治愈 (搞笑/恋爱)", value: "35" },
            { title: "奇幻冒险 (异界/科幻)", value: "10765" },
            { title: "深度剧情 (悬疑/推理)", value: "18" }
          ]
        },
        { 
          name: "page_num", title: "选择页码", type: "enumeration", value: "1",
          enumOptions: [
            {title: "第一页", value: "1"}, {title: "第二页", value: "2"},
            {title: "第三页", value: "3"}, {title: "第四页", value: "4"},
            {title: "第五页", value: "5"}
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
        // 使用最稳定的 Widget.tmdb 通道，彻底规避 B 站 403 报错
        const res = await Widget.tmdb.get('/discover/tv', { 
            params: {
                language: 'zh-CN', 
                page: p,
                sort_by: 'first_air_date.desc',
                with_networks: targetPlatform,
                with_genres: genre ? `${CONFIG.BASE_GENRE},${genre}` : CONFIG.BASE_GENRE,
                // 核心过滤逻辑：锁死日语，屏蔽国产3D
                with_original_language: 'ja', 
                without_genres: CONFIG.BLOCK_GENRE, 
                'first_air_date.lte': getBeijingToday()
            }
        });
        
        const results = res.results || [];

        return results
            .filter(item => item.name && item.poster_path)
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "数据通道异常，请检查网络")];
    }
}
