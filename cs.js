WidgetMetadata = {
  id: "bilibili.rank.official.standard.v5", // 使用新 ID 彻底清除缓存冲突
  title: "B站番剧排行",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "完全对齐官方自动翻页逻辑，严选高清海报，无 B站原图",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      // 官方标准：使用 number 类型参数触发无限滚动
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

// --- 全局配置 ---
const TMDB_API_KEY = "cf2190683e55fad0f978c719d0bc1c68"; // ← 请填入你的 API KEY

/**
 * 官方标准清洗逻辑
 */
function clean(t) {
  if (!t) return "";
  return t.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim();
}

/**
 * 官方标准匹配封装
 */
async function fetchItem(item) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "请自行填写") return null;
  try {
    const q = clean(item.title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];

    // 严选逻辑：仅保留有高清海报的项
    if (m && m.poster_path) {
      return {
        id: m.id.toString(), // 必须为字符串
        type: "bangumi",     // 必须为 bangumi
        title: item.title,
        description: m.overview || "",
        posterPath: "https://image.tmdb.org/t/p/w500" + m.poster_path,
        backdropPath: m.backdrop_path ? "https://image.tmdb.org/t/p/original" + m.backdrop_path : "",
        // 关键：必须包含完整 tmdbInfo 且 mediaType 为 tv
        tmdbInfo: { 
          id: m.id.toString(), 
          mediaType: "tv" 
        },
        hasTmdb: true,
        seasonInfo: "⭐" + (item.rating || "N/A") + " | " + (item.index_show || ""),
        link: "https://www.bilibili.com/bangumi/play/ss" + (item.season_id || item.ss_id)
      };
    }
  } catch (e) { return null; }
  return null;
}

/**
 * 官方标准入口函数
 */
async function popularRank(params) {
  try {
    // 1. 解析分页
    const page = (params && params.page) ? parseInt(params.page) : 1;
    const start = (page - 1) * 20;

    // 限制 100 条 (5页)
    if (start >= 100) return [];

    // 2. 获取 B站 排行榜
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });

    // 3. 多重解析 B站 数据层级
    let rawList = [];
    if (res.data) {
      rawList = res.data.result?.list || res.data.data?.list || res.data.list || [];
    }

    if (rawList.length === 0) return [];

    // 4. 截取分页并并行匹配 TMDB
    const pageItems = rawList.slice(start, start + 20);
    const results = await Promise.all(pageItems.map(item => fetchItem(item)));
    
    // 5. 过滤掉匹配失败的项
    return results.filter(i => i !== null);

  } catch (e) {
    return [];
  }
}
