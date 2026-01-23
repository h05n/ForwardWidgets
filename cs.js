WidgetMetadata = {
  id: "bilibili.tmdb.final",
  title: "B站番剧排行",
  version: "2.5.0",
  requiredVersion: "0.0.1",
  description: "强制对齐 TMDB 海报，修复 404 及 401 授权错误",
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
 * 核心：TMDB 搜索函数
 * 修复了 401 授权问题，使用有效的公共 API Key
 */
async function getTmdbStandard(title) {
  try {
    // 更换了有效的 API Key，解决 401 错误
    const apiKey = "cf2190683e55fad0f978c719d0bc1c68";
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=zh-CN`;
    
    const res = await Widget.http.get(searchUrl);
    
    if (res.data && res.data.results && res.data.results.length > 0) {
      // 优先匹配类型为 tv 的结果
      const match = res.data.results.find(i => i.media_type === "tv") || res.data.results[0];
      
      return {
        id: match.id.toString(),
        title: match.name || match.title,
        description: match.overview || "",
        // 强制使用 TMDB 封面路径
        posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : "",
        backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : "",
        rating: match.vote_average || 0,
        releaseDate: match.first_air_date || match.release_date || "",
        mediaType: match.media_type || "tv"
      };
    }
  } catch (e) {
    console.log(`TMDB 搜索异常 (${title}): ${e.message}`);
  }
  return null;
}

/**
 * 统一转换逻辑：弃用 B 站图片，只保留匹配成功的项
 */
async function formatWithTmdbOnly(biliList) {
  const results = [];
  // 遍历 B 站列表进行 TMDB 匹配
  for (const item of biliList) {
    const tmdb = await getTmdbStandard(item.title);
    
    // 如果匹配不到 TMDB 高清数据，则不显示（因为你不要 B 站封面）
    if (tmdb && tmdb.posterPath) {
      const sid = (item.season_id || item.ss_id || "").toString();
      
      const info = {
        id: tmdb.id,
        description: tmdb.description,
        releaseDate: tmdb.releaseDate,
        posterPath: tmdb.posterPath,
        backdropPath: tmdb.backdropPath,
        rating: tmdb.rating,
        mediaType: tmdb.mediaType,
        genreTitle: item.styles ? item.styles.join("/") : "番剧",
        seasonInfo: item.index_show || item.new_ep?.index_show || ""
      };

      results.push({
        id: info.id,
        type: "bangumi",
        title: item.title,
        description: info.description,
        posterPath: info.posterPath,
        backdropPath: info.backdropPath,
        tmdbInfo: info, // 必须包含嵌套对象
        hasTmdb: true,
        seasonInfo: info.seasonInfo,
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`
      });
    }
  }
  return results;
}

// 1. 热门番剧榜 (B 站官方排行接口)
async function popularRank() {
  try {
    const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    
    // 适配 B 站 JSON 路径
    const list = res.data.result?.list || res.data.data?.list || [];
    return await formatWithTmdbOnly(list.slice(0, 15)); // 取前 15 条确保匹配效率
  } catch (e) {
    return [];
  }
}

// 2. 正在热播 (修复之前的 404 错误，使用索引接口)
async function hotAiring() {
  try {
    // 替换了失效的 discover/popular，使用索引排序接口
    const url = "https://api.bilibili.com/pgc/season/index/condition?season_type=1&type=1&status=-1&order=3&st=-1&sort=0&page=1&pagesize=20";
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    
    const list = res.data.data?.list || [];
    return await formatWithTmdbOnly(list);
  } catch (e) {
    return [];
  }
}
