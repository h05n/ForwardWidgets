WidgetMetadata = {
  id: "bilibili.tmdb.strict",
  title: "B站番剧排行",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "仅保留热门排行与正在热播，强制匹配 TMDB ID 与海报",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      params: []
    },
    {
      id: "hotAiring",
      title: "正在热播",
      functionName: "hotAiring",
      params: []
    }
  ]
};

/**
 * 实时从 TMDB 匹配高质量动漫数据
 * 弃用 B站 图片，确保 id 对应的是 TMDB 动漫条目
 */
async function getTmdbStandard(title) {
  try {
    // 使用 TMDB Search API (多媒搜索或 TV 搜索)
    const apiKey = "f090d71030349800d23ef7758305c65f";
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=zh-CN`;
    const res = await Widget.http.get(searchUrl);
    
    if (res.data && res.data.results && res.data.results.length > 0) {
      // 优先匹配类型为 tv 的动漫结果
      const match = res.data.results.find(i => i.media_type === "tv") || res.data.results[0];
      
      return {
        id: match.id.toString(),
        title: match.name || match.title,
        description: match.overview || "",
        // 封面强制使用 TMDB 官方路径，不使用 B站 的
        posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : "",
        backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : "",
        rating: match.vote_average || 0,
        releaseDate: match.first_air_date || match.release_date || "",
        mediaType: match.media_type || "tv"
      };
    }
  } catch (e) {
    console.log(`TMDB 搜索失败 (${title}): ` + e.message);
  }
  return null;
}

/**
 * 格式化逻辑：构造官方 bangumi.js 要求的 tmdbInfo 嵌套结构
 */
async function formatToOfficial(biliItem) {
  if (!biliItem) return null;
  const title = biliItem.title;
  
  // 第一步：通过标题获取 TMDB 官方元数据
  const tmdb = await getTmdbStandard(title);
  if (!tmdb) return null; // 如果匹配不到 TMDB 数据，则不显示，确保封面质量

  // 第二步：构造符合框架要求的对象
  const info = {
    id: tmdb.id,
    description: tmdb.description,
    releaseDate: tmdb.releaseDate,
    posterPath: tmdb.posterPath,
    backdropPath: tmdb.backdropPath,
    rating: tmdb.rating,
    mediaType: tmdb.mediaType,
    genreTitle: biliItem.styles ? biliItem.styles.join("/") : "番剧",
    seasonInfo: biliItem.index_show || biliItem.new_ep?.index_show || ""
  };

  return {
    id: info.id,
    type: "bangumi", // 指定为动漫数据类型
    title: title,
    description: info.description,
    posterPath: info.posterPath, // 仅使用 TMDB 封面
    backdropPath: info.backdropPath,
    tmdbInfo: info, // 嵌套对象，UI 渲染核心
    hasTmdb: true,
    seasonInfo: info.seasonInfo,
    link: `https://www.bilibili.com/bangumi/play/ss${biliItem.season_id || biliItem.ss_id}`
  };
}

// 1. 热门番剧榜 (B站排行榜)
async function popularRank() {
  const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
  const list = res.data.result?.list || res.data.data?.list || [];
  
  const results = await Promise.all(list.slice(0, 20).map(formatToOfficial));
  return results.filter(i => i !== null);
}

// 2. 正在热播 (修复 404，改用索引接口)
async function hotAiring() {
  // 使用 B站 番剧索引的最热排序，避开已失效的 popular 接口
  const url = "https://api.bilibili.com/pgc/season/index/condition?season_type=1&order=3&pagesize=20";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
  const list = res.data.data?.list || [];
  
  const results = await Promise.all(list.map(formatToOfficial));
  return results.filter(i => i !== null);
}
