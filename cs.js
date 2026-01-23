// ===========================================
// Forward Widget: 动画榜单 (No 3D Hardcoded)
// Version: 1.0.0
// ===========================================

const CONFIG = {
    // 基础配置
    CN_NETWORKS: "1605|2007|1330|1419|1631",
    BASE_GENRE: "16",
    BLOCK_GENRE: "10762", // 屏蔽儿童
    
    // --- 3D / 动态漫 净化配置 ---
    // TMDB没有3D标签，只能靠“错杀一千”的关键词和“定点爆破”的标题库
    
    // 1. 通用关键词拦截 (标题含这些必杀)
    FILTER_KEYWORDS: ["3D", "3d", "动态漫", "动态漫画", "重制版"],

    // 2. 知名3D/爽文动画内置黑名单 (专杀深空彼岸这类)
    // 只要标题包含以下任意词组，直接屏蔽
    BUILT_IN_BLOCK: [
        "深空彼岸", "斗罗大陆", "凡人修仙传", "吞噬星空", 
        "完美世界", "遮天", "斗破苍穹", "神印王座", 
        "仙逆", "绝世武神", "武动乾坤", "星辰变",
        "雪鹰领主", "武庚纪", "西行纪", "元龙",
        "天宝伏妖录", "眷思量", "少年歌行", "墓王之王",
        "画江湖", "不良人", "秦时明月", "天行九歌", // 若森系列
        "万界", "无上", "独步", "武神", "系统" // 烂大街的3D爽文常用词
    ]
};

WidgetMetadata = {
  id: "bangdan",
  title: "动画榜单",
  description: "动画榜单",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  version: "1.0.0", // 锁死
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
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
            // 基础数据清洗
            .filter(item => item.name && item.poster_path)
            
            // --- 智能 3D 拦截 ---
            .filter(item => {
                const name = item.name;
                
                // 1. 检查通用屏蔽词 (3D, 动态漫)
                if (CONFIG.FILTER_KEYWORDS.some(k => name.includes(k))) return false;
                
                // 2. 检查内置黑名单 (深空彼岸, 斗罗等)
                if (CONFIG.BUILT_IN_BLOCK.some(blockTitle => name.includes(blockTitle))) return false;
                
                return true;
            })
            
            .map(item => Render.card(item));

    } catch (e) {
        return [Render.info("加载失败", "网络请求错误")];
    }
}
