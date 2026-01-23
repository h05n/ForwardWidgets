WidgetMetadata = {
  id: "bilibili.bangumi.official.standard.v1", // 必须使用新 ID 以避开 App 缓存
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
      // 官方标准参数：number 类型会自动触发 App 滚动翻页逻辑
      params: [
        {
          name: "page",
          title: "起始页",
          type: "number",
          default: 1
        }
      ]
    }
  ]
};

// --- 全局配置：请在此填入你的 API KEY ---
const TMDB_API_KEY = "请自行填写"; 

/**
 * 官方标准清洗逻辑
 */
function clean(t) {
  if (!t) return "";
  return t.replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "").replace(/[\(（].*?[\)）]/g, "").trim();
}

/**
 * 官方标准匹配封装：严格对齐字段与类型
 */
async function fetchItem(item) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "请自行填写") return null;
  try {
    const q = clean(item.title);
    const url = "https://api.themoviedb.org/3/search/tv?api_key=" + TMDB_API_KEY + "&query=" + encodeURIComponent(q) + "&language=zh-CN";
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];

    // 严选逻辑：无高清海报项直接舍弃
    if (m && m.poster_path) {
      return {
        id: m.id.toString(), // 必须为字符串类型
        type: "bangumi",     // 必须为 bangumi 类型
        title: item.title,
        description: m.overview || "",
        posterPath: "https://image.tmdb.org/t/p/w500" + m.poster_path,
        backdropPath: m.backdrop_path ? "https://image.tmdb.org/t/p/original" + m.backdrop_path : "",
        // 关键字段：必须包含完整 tmdbInfo 且 mediaType 为 tv
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
 * 模块入口：对齐官方翻页与解析逻辑
 */
async function popularRank(params) {
  try {
    // 自动分页解析
    const page = (params && params.page) ? parseInt(params.page) : 1;
    const start = (page - 1) * 20;

    // B 站排行榜总计 100 条
    if (start >= 100) return [];

    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });

    // 官方级多重路径解析
    let rawList = [];
    if (res.data) {
      rawList = res.data.result?.list || res.data.data?.list || res.data.list || [];
    }

    if (rawList.length === 0) return [];

    const pageItems = rawList.slice(start, start + 20);
    const results = await Promise.all(pageItems.map(item => fetchItem(item)));
    
    // 仅返回匹配成功项
    return results.filter(i => i !== null);

  } catch (e) {
    return [];
  }
}
