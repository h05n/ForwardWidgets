WidgetMetadata = {
  id: "bilibili.bangumi.top100.final", // 采用全新 ID 彻底解决冲突
  title: "B站番剧榜Top100",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "仅保留排行榜，支持 100 条全数据分页，强制动漫匹配",
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
          title: "选择排名分页",
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

// --- 全局配置：请务必填写你的 TMDB API KEY ---
const TMDB_KEY = "cf2190683e55fad0f978c719d0bc1c68"; 

/**
 * 标题清洗：确保搜索精准，杜绝干扰词
 */
function clean(title) {
  if (!title) return "";
  return title
    .replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "")
    .replace(/[\(（].*?[\)）]/g, "")
    .trim();
}

/**
 * TMDB 匹配：强制 TV 分类，防止匹配到真人电影
 */
async function getTmdb(title) {
  if (!TMDB_KEY || TMDB_KEY === "请自行填写") return null;
  try {
    const q = clean(title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    const m = res.data?.results?.[0];
    if (m) {
      return {
        id: m.id.toString(),
        desc: m.overview || "",
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "",
        backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : ""
      };
    }
  } catch (e) { return null; }
  return null;
}

/**
 * 核心逻辑：分页请求并并行匹配
 */
async function popularRank(params) {
  try {
    const page = parseInt(params.page || "1");
    const startIdx = (page - 1) * 20;

    // 1. 请求 B站 排行榜 (3日榜)
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });

    // 2. 增强型数据解析，确保不返回空
    const list = res.data?.result?.list || res.data?.data?.list || [];
    if (list.length === 0) return [];

    // 3. 截取 20 条数据进行并行搜索，兼顾速度与安全
    const pageItems = list.slice(startIdx, startIdx + 20);
    const results = await Promise.all(pageItems.map(async (item) => {
      const tmdb = await getTmdb(item.title);
      if (!tmdb) return null;

      return {
        id: tmdb.id,
        type: "bangumi",
        title: item.title,
        description: tmdb.desc,
        posterPath: tmdb.poster,
        backdropPath: tmdb.backdrop,
        tmdbInfo: { id: tmdb.id, mediaType: "tv" },
        hasTmdb: true,
        // 对齐官方：评分与更新进度
        seasonInfo: `⭐${item.rating || 'N/A'} | ${item.index_show || ''}`,
        link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`
      };
    }));

    return results.filter(i => i !== null);
  } catch (e) { return []; }
}
