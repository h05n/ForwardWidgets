WidgetMetadata = {
  id: "bilibili.bangumi.official",
  title: "B站番剧数据",
  version: "1.6.0",
  requiredVersion: "0.0.1",
  description: "获取 Bilibili 热门榜单，封面与 ID 完全适配官方 TMDB 数据",
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
 * 格式化逻辑：完全参考 bangumi.js
 * 1. 优先使用官方 TMDB 数据库中的 ID 和海报
 * 2. 必须包含嵌套的 tmdbInfo 对象
 */
async function formatToOfficial(biliList) {
  try {
    // 获取官方模块同款的 TMDB 映射数据
    const trendingUrl = "https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json";
    const res = await Widget.http.get(trendingUrl);
    const officialData = res.data || [];

    return biliList.map(item => {
      // 通过标题匹配官方数据
      const matched = officialData.find(p => 
        p.bangumi_name === item.title || 
        (p.tmdb_info && p.tmdb_info.title === item.title)
      );

      const tmdb = matched ? matched.tmdb_info : null;
      const sid = (item.season_id || item.ss_id || "").toString();

      // 严格按照 bangumi.js 的格式构造对象
      return {
        id: tmdb ? tmdb.id : sid, // 优先使用 TMDB ID
        type: "bangumi",          // 必须为 bangumi 类型
        title: item.title,
        description: tmdb ? tmdb.description : (item.desc || item.evaluate || ""),
        releaseDate: tmdb ? tmdb.releaseDate : (item.pub_time || item.pub_date || ""),
        posterPath: tmdb ? tmdb.posterPath : (item.cover || item.pic || "").replace("http:", "https:"), // 优先使用 TMDB 封面
        backdropPath: tmdb ? tmdb.backdropPath : (item.cover || item.pic || "").replace("http:", "https:"),
        rating: tmdb ? tmdb.rating : 0,
        mediaType: tmdb ? tmdb.mediaType : "tv",
        genreTitle: tmdb ? tmdb.genreTitle : "",
        tmdbInfo: tmdb || { id: sid }, // 必须嵌套 tmdbInfo
        hasTmdb: !!tmdb,
        seasonInfo: item.index_show || (tmdb ? tmdb.seasonInfo : ""),
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`
      };
    });
  } catch (e) {
    return [];
  }
}

// 模块 1: 热门番剧榜 (对接 B站排行榜)
async function popularRanking() {
  const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
  const list = res.data.result?.list || res.data.data?.list || [];
  return await formatToOfficial(list);
}

// 模块 2: 正在热播 (对接 B站热门推荐)
async function hotAiring() {
  const url = "https://api.bilibili.com/pgc/web/discover/popular?page=1&pagesize=30";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
  const list = res.data.result?.list || res.data.data?.list || [];
  return await formatToOfficial(list);
}
