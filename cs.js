// ===========================================
// Forward Widget: 纯净日漫榜 (Japan Audio Locked)
// Version: 3.0.0 (Stable TMDB)
// ===========================================

WidgetMetadata = {
  // 修改ID强制刷新缓存
  id: "bangdan_japan_v3", 
  title: "番剧榜单",
  description: "只展示日本原声动画 (彻底屏蔽国产3D)",
  author: "ForwardUser",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "3.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
    {
      title: "日漫榜单",
      description: "浏览国内引进的日本动画",
      requiresWebView: false,
      functionName: "moduleDiscover",
      cacheDuration: 3600, // 缓存60分钟
      params: [
        {
          name: "platform", title: "播出平台", type: "enumeration", value: "1605",
          enumOptions: [
            { title: "哔哩哔哩", value: "1605" }, // 默认B站
            { title: "腾讯视频", value: "2007" },
            { title: "爱奇艺", value: "1330" },
            { title: "优酷", value: "1419" },
            { title: "芒果TV", value: "1631" },
            { title: "全部平台", value: "1605|2007|1330|1419|1631" }
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
    // 采用您最喜欢的 TMDB 卡片样式，不跳转
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

    // 默认 B站 (1605)
    const targetPlatform = platform || "1605";

    try {
        // 使用 Widget.tmdb.get (最稳定的通道)
        const res = await Widget.tmdb.get('/discover/tv', { 
            params: {
                language: 'zh-CN', 
                page: p,
                sort_by: 'first_air_date.desc', // 按首播时间看最新
                
                // 1. 平台过滤：只看国内引进了的
                with_networks: targetPlatform,
                
                // 2. 题材过滤：叠加用户选的题材
                with_genres: genre ? `16,${genre}` : "16",
                
                // 3. 必杀技：锁死原声语言为日语 (ja)
                // 只要这一行在，国产3D (zh) 就不可能混进来
                with_original_language: 'ja',
                
                // 4. 辅助：排除儿童
                without_genres: "10762", 
                
                // 5. 时间：已开播
                'first_air_date.lte': getBeijingToday()
            }
        });
        
        const results = res.results || [];

        return results
            // 基础清洗：必须有名字和海报
            .filter(item => item.name && item.poster_path)
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "网络请求错误，请检查网络")];
    }
}
