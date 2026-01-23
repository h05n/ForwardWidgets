// ===========================================
// Forward Widget: 全球日漫榜 (Streamlined Edition)
// Version: 1.0.0
// ===========================================

const CONFIG = {
    // 精简后的核心聚合
    CN_CORE: "1605|2007|1330", // B站, 腾讯, 爱奇艺
    INTL_CORE: "213|2739|1112|4595", // Netflix, Disney+, Crunchyroll, dAnime
    GLOBAL_ALL: "1605|2007|1330|1419|1631|213|2739|1112|4595|1857",
    
    BASE_GENRE: "16", 
    BLOCK_GENRE: "10762" 
};

WidgetMetadata = {
  id: "bangdan_global_v4", 
  title: "日漫榜单",
  description: "聚合全球核心平台的纯净日漫榜单",
  author: "，",
  version: "1.0.0", 
  detailCacheDuration: 60, 
  modules: [
    {
      title: "日漫榜单",
      functionName: "moduleDiscover",
      cacheDuration: 3600, 
      params: [
        {
          name: "platform", title: "选择平台", type: "enumeration", value: "", 
          enumOptions: [
            { title: "全部 (全球聚合)", value: "" }, 
            { title: "国内聚合 (三大平台)", value: CONFIG.CN_CORE },
            { title: "国外聚合 (四大巨头)", value: CONFIG.INTL_CORE },
            // 细分单选 - 仅保留王者平台
            { title: "├ 哔哩哔哩 (日漫主力)", value: "1605" },
            { title: "├ 腾讯视频", value: "2007" },
            { title: "├ Netflix (独家大作)", value: "213" },
            { title: "├ Disney+ (重磅新番)", value: "2739" },
            { title: "└ d Anime (日本最全)", value: "4595" }
          ]
        },
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

async function moduleDiscover(args) {
    const { platform, genre, page_num } = args;
    const p = parseInt(page_num) || 1;
    const targetPlatform = platform || CONFIG.GLOBAL_ALL;

    try {
        const res = await Widget.tmdb.get('/discover/tv', { 
            params: {
                language: 'zh-CN', 
                page: p,
                sort_by: 'first_air_date.desc',
                with_networks: targetPlatform,
                with_genres: genre ? `${CONFIG.BASE_GENRE},${genre}` : CONFIG.BASE_GENRE,
                with_original_language: 'ja', 
                without_genres: CONFIG.BLOCK_GENRE, 
                'first_air_date.lte': getBeijingToday()
            }
        });
        
        const results = res.results || [];
        return results.filter(item => item.name && item.poster_path).map(item => Render.card(item));
    } catch (e) {
        return [Render.info("加载失败", "数据通道异常")];
    }
}
