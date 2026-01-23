WidgetMetadata = {
  id: "bilibili.rank.official.style", 
  title: "B站番剧排行",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "完全对齐官方分页逻辑，强制匹配 TMDB 高清海报",
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
          title: "排名分页 (1-100)",
          type: "enumeration",
          enumOptions: [
            { title: "01 - 20 名", value: "1" },
            { title: "21 - 40 名", value: "2" },
            { title: "41 - 60 名", value: "3" },
            { title: "61 - 80 名", value: "4" },
            { title: "81 - 100 名", value: "5" }
          ]
        }
      ]
    }
  ]
};

// --- 请填写你的 API KEY ---
const TMDB_API_KEY = "cf2190683e55fad0f978c719d0bc1c68"; 

/**
 * 官方标准清洗逻辑：移除干扰项
 */
function clean(t) {
  return t ? t.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim() : "";
}

/**
 * TMDB 匹配：仅返回匹配成功的项，确保无 B站 原图
 */
async function fetchWithTmdb(item) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "请自行填写") return null;
  try {
    const q = clean(item.title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];

    // 严选逻辑：只要没有 TMDB 封面就不要
    if (m && m.poster_path) {
      return {
        id: m.id.toString(), // 必须是字符串 ID
        type: "bangumi",
        title: item.title,
        description: m.overview || "",
        posterPath: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
        tmdbInfo: { id: m.id.toString(), mediaType: "tv" },
        hasTmdb: true,
        seasonInfo: `⭐${item.rating || 'N/A'} | ${item.index_show || ''}`,
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }
  } catch (e) { return null; }
  return null;
}

/**
 * 模块入口：对齐官方参数解析方式
 */
async function popularRank(params) {
  try {
    // 官方风格的分页处理
    const pageStr = params && params.page ? params.page : "1";
    const page = parseInt(pageStr);
    const pageSize = 20;
    const start = (page - 1) * pageSize;

    // 获取 B站 排行榜 (3日榜)
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });

    // 多路径解析 B站 数据，防止空结果
    let rawList = [];
    if (res.data) {
      rawList = res.data.result?.list || res.data.data?.list || res.data.list || [];
    }

    if (rawList.length === 0) return [];

    // 截取当前页并并发匹配
    const pageItems = rawList.slice(start, start + pageSize);
    const results = await Promise.all(pageItems.map(item => fetchWithTmdb(item)));
    
    // 严格过滤掉匹配失败（无高清封面）的项
    return results.filter(i => i !== null);

  } catch (e) {
    return [];
  }
}
