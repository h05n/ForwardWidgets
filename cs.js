// ===========================================
// Forward Widget: 动画榜单 (Origin Filter Only)
// Version: 1.0.0
// ===========================================

const CONFIG = {
    // 基础配置
    CN_NETWORKS: "1605|2007|1330|1419|1631",
    BASE_GENRE: "16",
    
    // 屏蔽配置
    BLOCK_GENRE: "10762", // 屏蔽儿童
    
    // 辅助过滤
    FILTER_WORDS: ["动态漫", "动态漫画"]
};

WidgetMetadata = {
  id: "bangdan", // 严格保留 ID 不变
  title: "动画榜单",
  description: "动画榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0", 
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
    {
      title: "动画榜单",
      description: "浏览国内平台引进的海外动画",
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
        {
          name: "genre", title: "动画题材", type: "enumeration", value: "",
          enumOptions: [
            { title: "全部题材", value: "" },
            { title: "热血战斗", value: "10759" },
            { title: "异界奇幻", value: "10765" },
            { title: "搞笑恋爱", value: "35" },
            { title: "日常治愈", value: "10751" },
            { title: "悬疑智斗", value: "9648" },
            { title: "深度剧情", value: "18" },
            { title: "战争机战", value: "10768" }
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
        
        const results = res.results || [];

        return results
            .filter(item => item.name && item.poster_path)
            
            // --- 核心修改：仅使用产地过滤 ---
            .filter(item => {
                // 如果产地信息存在，且包含 "CN" (中国大陆)，则剔除
                // 这样会保留 JP(日本), US(美国) 等所有非中国产地的动画
                // 同时不再误杀 "zh" 语言的非国产内容（如果有的话）
                if (item.origin_country && item.origin_country.includes('CN')) {
                    return false;
                }
                return true;
            })
            
            // 辅助过滤：动态漫
            .filter(item => !CONFIG.FILTER_WORDS.some(word => item.name.includes(word)))
            
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "网络请求错误")];
    }
}
