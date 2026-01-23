// ===========================================
// Forward Widget: 哔哩哔哩番剧榜 (Bilibili Native)
// Version: 1.0.0
// Author: Optimized by Gemini
// ===========================================

WidgetMetadata = {
  id: "bilibili_rank",
  title: "B站番剧榜",
  description: "直接同步B站官方番剧热门榜",
  author: "ForwardUser",
  site: "https://www.bilibili.com",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 60, 
  modules: [
    {
      title: "B站番剧",
      description: "查看B站热门日本番剧",
      requiresWebView: false,
      functionName: "moduleBilibiliRank",
      cacheDuration: 3600, // 缓存60分钟
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

// ================= 核心渲染 =================

const Render = {
    // 转换 B站数据 -> Forward 卡片
    card: (item) => ({
        id: String(item.season_id), 
        type: "link", // 点击跳转类型
        url: item.link || `https://www.bilibili.com/bangumi/play/ss${item.season_id}`, // 跳转B站播放
        title: item.title, 
        // B站API里的封面通常没有协议头，要做容错处理
        posterPath: item.cover.startsWith("http") ? item.cover : `https:${item.cover}`,
        // B站没有评分字段，用“追番人数”或“更新进度”代替简介
        overview: item.new_ep ? item.new_ep.index_show : (item.desc || "暂无简介"), 
        // 榜单数据通常不含日期，这里留空或填当前
        releaseDate: "Bilibili", 
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
    
    // 页码计算：B站榜单一次返回前50-100名，我们在本地做切片
    const p = parseInt(page_num) || 1;
    const pageSize = 10; // 每页显示10个
    const startIdx = (p - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    // B站官方接口 (Web端 PGC 榜单)
    // season_type=1 代表番剧(日漫)，season_type=4 代表国创(国漫)
    // 我们锁死 type=1，这就彻底过滤了国产3D
    const API_URL = "https://api.bilibili.com/pgc/web/rank/list";
    
    try {
        const res = await Widget.http.get(API_URL, { 
            params: {
                day: rank_type || "3", // 3=三日榜, 7=周榜
                season_type: "1"       // 核心：锁死番剧区 (Japan Only)
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            }
        });
        
        // 检查返回数据结构
        if (!res || !res.result || !res.result.list) {
            return [Render.info("加载异常", "B站接口未返回预期数据")];
        }

        const fullList = res.result.list;
        
        // 本地分页切片
        const pageItems = fullList.slice(startIdx, endIdx);

        if (pageItems.length === 0) {
            return [Render.info("到底了", "后面没有更多内容了")];
        }

        return pageItems.map(item => Render.card(item));

    } catch (e) {
        return [Render.info("网络错误", "无法连接到哔哩哔哩")];
    }
}
