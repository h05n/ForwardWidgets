WidgetMetadata = {
  id: "bilibili.official.standard",
  title: "B站番剧数据",
  version: "2.6.0",
  requiredVersion: "0.0.1",
  description: "仅保留热门与热播，强制匹配 TMDB 动漫海报，优化名称搜索",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "popularRanking",
      title: "热门番剧榜",
      functionName: "popularRanking",
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
 * 标题清洗：剔除 B站 标题干扰项（如：第2季、中配、(中文)）
 * 确保 TMDB 搜索能对得上
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
 * TMDB 匹配逻辑：强制使用 TV 类型以过滤真人电影
 */
async function getTmdbInfo(originalTitle) {
  try {
    const query = cleanTitle(originalTitle);
    // 请在此处确认你的 API Key 是否填写正确
    const apiKey = "cf2190683e55fad0f978c719d0bc1c68"; 
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=zh-CN`;
    
    const res = await Widget.http.get(url);
    if (res.data && res.data.results && res.data.results.length > 0) {
      // 优先寻找 media_type 为 tv 的条目，防止匹配到真人电影
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
async function processList(biliList) {
  const results = [];
  for (const item of biliList) {
    const tmdb = await getTmdbInfo(item.title);
    if (tmdb && tmdb.posterPath) { // 必须有 TMDB 海报才展示
      const sid = (item.season_id || item.ss_id).toString();
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

// 模块 1: 热门番剧榜 (B站排行榜接口)
async function popularRanking() {
  const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com" } });
  const list = res.data.result?.list || res.data.data?.list || [];
  return await processList(list.slice(0, 15));
}

// 模块 2: 正在热播 (修复 404，使用官方索引最热排序)
async function hotAiring() {
  const url = "https://api.bilibili.com/pgc/season/index/condition?season_type=1&order=3&pagesize=20";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com" } });
  const list = res.data.data?.list || [];
  return await processList(list);
}
