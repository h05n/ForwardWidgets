// ===========================================
// Forward Widget: 哔哩哔哩番剧榜 (Native Fixed)
// Version: 2.0.0
// ===========================================

WidgetMetadata = {
  id: "bilibili_rank_v2",
  title: "B站番剧榜",
  description: "B站官方番剧热门榜 (纯净日漫版)",
  author: "ForwardUser",
  site: "https://www.bilibili.com",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0, 
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
    // 渲染卡片 (点击跳转B站)
    card: (item, rank) => ({
        id: String(item.season_id), 
        type: "link", // 使用链接类型，点击直接跳转
        // 尝试唤起B站APP，失败则跳网页
        url: `https://www.bilibili.com/bangumi/play/ss${item.season_id}`, 
        title: item.title, 
        // B站API封面有时缺协议头
        posterPath: item.cover.startsWith("http") ? item.cover : `https:${item.cover}`,
        // 用“更新进度”作为描述
        overview: item.new_ep ? item.new_ep.index_show : (item.desc || "暂无简介"), 
        // 榜单数据没日期，显示排名
        releaseDate: `TOP ${rank}`, 
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
    
    // 页码计算：B站接口一次返回全部(约50-100条)，我们本地切片
    const p = parseInt(page_num) || 1;
    const pageSize = 10;
    const startIdx = (p - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    // B站官方 PGC Web 榜单 API
    // season_type=1: 番剧 (日漫)
    // season_type=4: 国创 (国漫) -> 我们不查这个，所以绝对没有国漫
    const API_URL = "https://api.bilibili.com/pgc/web/rank/list";
    
    try {
        const res = await Widget.http.get(API_URL, { 
            params: {
                day: rank_type || "3", // 3日或7日
                season_type: "1"       // 核心：锁死番剧区
            },
            // 关键修复：添加请求头，防止被B站拦截
            headers: {
                "Referer": "https://www.bilibili.com/",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            }
        });
        
        // 容错校验：检查数据结构
        if (!res || !res.result || !res.result.list) {
            // 如果被拦截，打印Code以便调试
            const errCode = res ? res.code : "未知";
            return [Render.info("加载异常", `B站接口拒绝访问 (Code: ${errCode})`)];
        }

        const fullList = res.result.list;
        
        // 如果数据为空
        if (fullList.length === 0) {
            return [Render.info("暂无数据", "榜单暂时为空")];
        }

        // 执行本地分页
        const pageItems = fullList.slice(startIdx, endIdx);

        if (pageItems.length === 0) {
            return [Render.info("到底了", "后面没有更多内容了")];
        }

        // 渲染列表 (传入 index 计算排名)
        return pageItems.map((item, index) => Render.card(item, startIdx + index + 1));

    } catch (e) {
        return [Render.info("网络错误", "无法连接到哔哩哔哩服务器")];
    }
}
