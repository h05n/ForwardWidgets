// ===========================================
// Forward Widget: 哔哩哔哩番剧榜 (No Jump)
// Version: 2.1.0
// ===========================================

WidgetMetadata = {
  id: "bilibili_rank_v2", // 保持ID以便覆盖之前的缓存
  title: "B站番剧榜",
  description: "B站官方番剧热门榜 (无跳转版)",
  author: "ForwardUser",
  site: "https://www.bilibili.com",
  version: "2.1.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
    {
      title: "B站番剧",
      description: "查看B站热门日本番剧",
      requiresWebView: false,
      functionName: "moduleBilibiliRank",
      cacheDuration: 1800, // 缓存30分钟
      params: [
        {
          name: "rank_type", title: "榜单类型", type: "enumeration", value: "3",
          enumOptions: [
            { title: "近期热门 (三日)", value: "3" },
            { title: "每周热门 (七日)", value: "7" }
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
    // 渲染卡片 (改为 tmdb 类型，只展示不跳转)
    card: (item, rank) => ({
        id: String(item.season_id), 
        type: "tmdb", // 核心修改：改回 tmdb 类型，取消 link 跳转
        title: item.title, 
        // 图片容错处理
        posterPath: item.cover.startsWith("http") ? item.cover : `https:${item.cover}`,
        // 简介显示更新进度
        overview: item.new_ep ? item.new_ep.index_show : (item.desc || "暂无简介"), 
        // 借用日期字段显示排名
        releaseDate: `当前排名: 第${rank}名`, 
        rating: 0, // 榜单接口不带评分，置0
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

// ================= 模块实现 =================

async function moduleBilibiliRank(args) {
    const { rank_type, page_num } = args;
    
    const p = parseInt(page_num) || 1;
    const pageSize = 10;
    const startIdx = (p - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    // B站官方 PGC Web 榜单 API
    // season_type=1: 锁死番剧 (日漫)
    const API_URL = "https://api.bilibili.com/pgc/web/rank/list";
    
    try {
        const res = await Widget.http.get(API_URL, { 
            params: {
                day: rank_type || "3", 
                season_type: "1"       
            },
            // 必须带请求头，否则B站拦截
            headers: {
                "Referer": "https://www.bilibili.com/",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            }
        });
        
        if (!res || !res.result || !res.result.list) {
            return [Render.info("加载异常", "B站接口未返回数据，请稍后重试")];
        }

        const fullList = res.result.list;
        const pageItems = fullList.slice(startIdx, endIdx);

        if (pageItems.length === 0) {
            return [Render.info("到底了", "后面没有更多内容了")];
        }

        return pageItems.map((item, index) => Render.card(item, startIdx + index + 1));

    } catch (e) {
        return [Render.info("网络错误", "无法连接到哔哩哔哩")];
    }
}
