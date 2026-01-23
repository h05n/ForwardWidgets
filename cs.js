WidgetMetadata = {
  id: "bilibili.bangumi.official.v3", // 每次失败必须换新 ID 才能强制覆盖 App 缓存
  title: "B站番剧排行",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "完全对照官方 bangumi.js 结构重写，支持自动翻页，仅高清海报",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      // 官方标准分页参数：不使用 enumeration，App 滚动到底部会自动累加 page
      params: [
        {
          name: "page",
          title: "页码",
          type: "number",
          default: 1
        }
      ]
    }
  ]
};

// --- 全局配置：在此填入你的 API KEY ---
const TMDB_API_KEY = "cf2190683e55fad0f978c719d0bc1c68"; 

/**
 * 官方标准标题清洗
 */
function clean(t) {
  if (!t) return "";
  return t.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim();
}

/**
 * 官方标准数据封包：严格对齐每一个必填字段
 */
async function fetchItem(item) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "请自行填写") return null;
  try {
    const q = clean(item.title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];

    // 严选逻辑：只要没有 TMDB 海报地址，直接跳过
    if (m && m.poster_path) {
      return {
        id: m.id.toString(), // 官方要求：ID 必须是字符串
        type: "bangumi",     // 官方要求：类型必须是 bangumi
        title: item.title,
        description: m.overview || "",
        posterPath: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
        backdropPath: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : "",
        // 关键字段：必须包含 mediaType 且 id 为字符串
        tmdbInfo: { 
          id: m.id.toString(), 
          mediaType: "tv" 
        },
        hasTmdb: true,
        seasonInfo: `⭐${item.rating || 'N/A'} | ${item.index_show || ''}`,
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }
  } catch (e) { return null; }
  return null;
}

/**
 * 入口函数：对齐官方自动翻页调用逻辑
 */
async function popularRank(params) {
  try {
    // 自动分页读取
    const page = (params && params.page) ? parseInt(params.page) : 1;
    const start = (page - 1) * 20;

    // 限制最高 100 条
    if (start >= 100) return [];

    // 获取 B站 排行榜原始数据
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });

    // 多重降级解析，确保不返回空
    let rawList = [];
    if (res.data) {
      rawList = res.data.result?.list || res.data.data?.list || res.data.list || [];
    }

    if (rawList.length === 0) return [];

    const pageItems = rawList.slice(start, start + 20);
    // 并发匹配
    const results = await Promise.all(pageItems.map(item => fetchItem(item)));
    
    // 过滤掉匹配失败的项
    return results.filter(i => i !== null);

  } catch (e) {
    return [];
  }
}
