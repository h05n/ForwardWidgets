WidgetMetadata = {
  id: "bilibili.rank.fixed.standard", 
  title: "B站番剧排行",
  version: "3.4.0",
  description: "修复空数据问题，参考官方逻辑增强兼容性",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      params: [
        {
          name: "page",
          title: "选择分页 (1-100名)",
          type: "enumeration",
          enumOptions: [
            { title: "第 1 页 (01-20)", value: "1" },
            { title: "第 2 页 (21-40)", value: "2" },
            { title: "第 3 页 (41-60)", value: "3" },
            { title: "第 4 页 (61-80)", value: "4" },
            { title: "第 5 页 (81-100)", value: "5" }
          ]
        }
      ]
    }
  ]
};

// --- 配置区 ---
const API_KEY = "cf2190683e55fad0f978c719d0bc1c68"; // ← 必须在此填入你的 TMDB API Key

/**
 * 核心匹配逻辑：强制 TV 分类，过滤电影干扰
 */
async function fetchTmdb(item) {
  if (!API_KEY || API_KEY === "请自行填写") return null;
  try {
    // 清洗标题
    const q = item.title.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim();
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=zh-CN`;
    
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];
    
    if (m) {
      return {
        id: m.id.toString(),
        type: "bangumi",
        title: item.title,
        description: m.overview || "",
        posterPath: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "",
        tmdbInfo: { id: m.id.toString(), mediaType: "tv" },
        hasTmdb: true,
        // 对齐官方展示：B站评分 + 更新状态
        seasonInfo: `⭐${item.rating || 'N/A'} | ${item.index_show || ''}`,
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }
  } catch (e) { return null; }
  return null;
}

async function popularRank(p) {
  try {
    const page = parseInt(p.page || "1");
    const start = (page - 1) * 20;

    // 获取 B站 排行榜
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    // 兼容解析：官方模块常用的多层级尝试
    let list = [];
    if (res.data) {
      list = res.data.result?.list || res.data.data?.list || res.data.list || [];
    }

    if (list.length === 0) {
      console.log("无法获取B站列表，请确认网络环境");
      return [];
    }

    // 截取当前页
    const pageItems = list.slice(start, start + 20);

    // 并行处理 20 个请求
    const results = await Promise.all(pageItems.map(item => fetchTmdb(item)));
    
    return results.filter(i => i !== null);

  } catch (e) {
    console.log("脚本执行异常: " + e.message);
    return [];
  }
}
