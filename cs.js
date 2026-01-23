WidgetMetadata = {
  id: "bilibili.bangumi.final",
  title: "B站番剧数据",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "仅保留热门番剧榜，对齐 TMDB 官方封面逻辑",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRank",
      title: "热门番剧榜",
      functionName: "popularRank",
      params: []
    }
  ]
};

/**
 * 标题清洗：剔除 B站 标题干扰项（如：第2季、中配、(中文)）
 */
function cleanTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*第[一二三四五六七八九十\d]+季/g, "")
    .replace(/\s*第[一二三四五六七八九十\d]+期/g, "")
    .replace(/[\(（].*?[\)）]/g, "")
    .replace(/！/g, "!")
    .trim();
}

/**
 * TMDB 搜索核心：请在下方 apiKey 处填入你自己的密钥
 */
async function getTmdbStandard(originalTitle) {
  try {
    const query = cleanTitle(originalTitle);
    // ↓ 请在此处填写你的 API Key
    const apiKey = "cf2190683e55fad0f978c719d0bc1c68"; 
    
    if (apiKey === "请自行填写") {
      console.log("提示：请先在脚本中填写 TMDB API Key");
      return null;
    }

    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=zh-CN`;
    const res = await Widget.http.get(searchUrl);
    
    if (res.data && res.data.results && res.data.results.length > 0) {
      // 优先匹配类型为 tv (动漫剧集) 的结果，防止匹配到真人电影
      const match = res.data.results.find(i => i.media_type === "tv") || res.data.results[0];
      
      return {
        id: match.id.toString(),
        description: match.overview || "",
        posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : "",
        backdropPath: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : "",
        rating: match.vote_average || 0,
        releaseDate: match.first_air_date || match.release_date || "",
        mediaType: "tv"
      };
    }
  } catch (e) {
    console.log(`TMDB 匹配异常 (${originalTitle}): ${e.message}`);
  }
  return null;
}

/**
 * 格式化：绝对弃用 B站封面，仅保留匹配成功的项
 */
async function formatWithTmdb(biliList) {
  const results = [];
  for (const item of biliList) {
    const tmdb = await getTmdbStandard(item.title);
    
    // 只有在 TMDB 匹配到高清海报时才展示
    if (tmdb && tmdb.posterPath) {
      const sid = (item.season_id || item.ss_id || "").toString();
      
      const info = {
        ...tmdb,
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
        tmdbInfo: info,
        hasTmdb: true,
        seasonInfo: info.seasonInfo,
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`
      });
    }
  }
  return results;
}

/**
 * 模块入口：热门番剧榜
 */
async function popularRank() {
  try {
    const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
    
    const list = res.data.result?.list || res.data.data?.list || [];
    // 每次刷新匹配前 15 条，保证显示质量与加载速度
    return await formatWithTmdb(list.slice(0, 15));
  } catch (e) {
    console.log("获取 B站排行失败: " + e.message);
    return [];
  }
}
