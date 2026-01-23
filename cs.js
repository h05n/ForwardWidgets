// ===========================================
// Forward Widget: 全网日漫榜 (All Japanese Anime)
// Version: 1.0.0
// ===========================================

const CONFIG = {
    // 国内五大平台 ID (B站, 腾讯, 爱奇艺, 优库, 芒果)
    CN_NETWORKS: "1605|2007|1330|1419|1631",
    BASE_GENRE: "16", // 动画分类
    
    // 屏蔽儿童分类 (如佩奇等)
    BLOCK_GENRE: "10762" 
};

WidgetMetadata = {
  // 修改ID确保刷新缓存
  id: "bangdan_jp_all", 
  title: "全网日漫榜",
  description: "聚合全网平台的日本动画榜单",
  author: "ForwardUser",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0", // 锁死版本号
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
    {
      title: "全网日漫",
      description: "浏览所有平台的日本番剧",
      requiresWebView: false,
      functionName: "moduleDiscover",
      cacheDuration: 3600, // 缓存60分钟
      params: [
        {
          name: "platform", title: "播出平台", type: "enumeration", value: "", // 默认空，代表全部
          enumOptions: [
            { title: "全部平台", value: "" }, // 聚合显示
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
    // 标准卡片样式
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

    // 如果用户选了"全部平台"(空值)，则使用 CONFIG.CN_NETWORKS (五大平台聚合)
    // 否则使用用户指定的具体平台 ID
    const targetPlatform = platform || CONFIG.CN_NETWORKS;

    try {
        // 使用 TMDB 稳定接口
        const res = await Widget.tmdb.get('/discover/tv', { 
            params: {
                language: 'zh-CN', 
                page: p,
                sort_by: 'first_air_date.desc', // 默认按时间倒序看最新
                
                // 1. 平台过滤：聚合或单选
                with_networks: targetPlatform,
                
                // 2. 题材过滤
                with_genres: genre ? `${CONFIG.BASE_GENRE},${genre}` : CONFIG.BASE_GENRE,
                
                // 3. 核心：强制锁死日语原声 (Japan Only)
                // 这一行代码彻底根除了国产 3D 动画
                with_original_language: 'ja',
                
                // 4. 排除儿童
                without_genres: CONFIG.BLOCK_GENRE, 
                
                // 5. 只看已开播
                'first_air_date.lte': getBeijingToday()
            }
        });
        
        const results = res.results || [];

        return results
            .filter(item => item.name && item.poster_path)
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "网络请求错误，请检查网络")];
    }
}
