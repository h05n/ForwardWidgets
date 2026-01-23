WidgetMetadata = {
  id: "bilibili.rank.tmdb.test", 
  title: "B站番剧排行",
  version: "3.2.0",
  requiredVersion: "0.0.1",
  description: "仅保留排行，支持 100 条分页，强制匹配动漫海报",
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
            { title: "第 1 页 (01-20名)", value: "1" },
            { title: "第 2 页 (21-40名)", value: "2" },
            { title: "第 3 页 (41-60名)", value: "3" },
            { title: "第 4 页 (61-80名)", value: "4" },
            { title: "第 5 页 (81-100名)", value: "5" }
          ]
        }
      ]
    }
  ]
};

/**
 * 标题清洗：自动剔除 B站 标题干扰项
 * 解决“蜡笔小新 第二季 (中文)”这种名称无法匹配的问题
 */
function cleanTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*第[一二三四五六七八九十\d]+[季期]/g, "")
    .replace(/[\(（].*?[\)）]/g, "")
    .replace(/！/g, "!")
    .trim();
}

/**
 * 获取 TMDB 标准数据
 * 强制 search/tv 以过滤同名真人电影（如《搏击俱乐部》）
 */
async function getTmdbStandard(title) {
  // ↓↓↓ 请在此处填写你的 API KEY ↓↓↓
  const apiKey = "cf2190683e55fad0f978c719d0bc1c68"; 

  if (!apiKey || apiKey === "请自行填写") return null;

  try {
    const query = cleanTitle(title);
    const url = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=zh-CN`;
    const res = await Widget.http.get(url);
    
    if (res.data?.results?.length > 0) {
      const match = res.data.results[0];
      return {
        id: match.id.toString(),
        description: match.overview || "",
        posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : "",
        backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : "",
        rating: match.vote_average || 0
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * 格式化：聚合 B站 评分与 TMDB 高清数据
 */
async function formatItem(item) {
  const tmdb = await getTmdbStandard(item.title);
  if (!tmdb) return null; 

  const sid = (item.season_id || item.ss_id || "").toString();
  
  return {
    id: tmdb.id,
    type: "bangumi",
    title: item.title,
    description: tmdb.description,
    posterPath: tmdb.posterPath, 
    backdropPath: tmdb.backdropPath,
    tmdbInfo: { id: tmdb.id, mediaType: "tv" },
    hasTmdb: true,
    // 在副标题展示 B站 评分和更新状态，提升 UI 体验
    seasonInfo: `⭐${item.rating ? item.rating.replace('分','') : 'N/A'} | ${item.index_show}`,
    link: `https://www.bilibili.com/bangumi/play/ss${sid}`
  };
}

/**
 * 模块入口：支持 100 条数据安全加载
 */
async function popularRank(params) {
  try {
    const page = parseInt(params.page || "1");
    const pageSize = 20;
    const startIdx = (page - 1) * pageSize;

    // 获取 B站 排行榜 (3日榜)
    const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    
    const fullList = res.data.result?.list || res.data.data?.list || [];
    const pageList = fullList.slice(startIdx, startIdx + 20);

    // 并行请求当前页面的 20 个 TMDB 数据，兼顾速度与安全
    const results = await Promise.all(pageList.map(item => formatItem(item)));
    
    return results.filter(i => i !== null);
  } catch (e) {
    return [];
  }
}
