WidgetMetadata = {
  id: "bilibili.bangumi.rebuilt",
  title: "B站番剧数据",
  version: "1.5.0",
  requiredVersion: "0.0.1",
  description: "Bilibili 热门数据，参考官方模块 ID 与封面逻辑",
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
 * 核心格式化逻辑：
 * 尝试将 B站数据 匹配到 官方 TMDB 数据源，以获取官方同款封面和 ID
 */
async function formatToOfficialStyle(biliList) {
  try {
    // 获取官方模块同款的增强数据源（包含 TMDB 映射）
    const proxyUrl = "https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json";
    const proxyRes = await Widget.http.get(proxyUrl);
    const proxyList = proxyRes.data || [];

    return biliList.map(item => {
      // 匹配逻辑：通过标题在官方增强库中寻找
      const matched = proxyList.find(p => 
        p.bangumi_name === item.title || 
        (p.tmdb_info && p.tmdb_info.title === item.title)
      );

      const tmdb = matched ? matched.tmdb_info : null;
      const sid = (item.season_id || item.ss_id || "").toString();
      const biliPoster = (item.cover || item.pic || "").replace("http:", "https:");

      // 严格遵循 bangumi.js 的嵌套对象结构
      const tmdbInfo = {
        id: tmdb ? tmdb.id : sid, // 优先使用 TMDB ID
        description: tmdb ? tmdb.description : (item.desc || item.evaluate || ""),
        releaseDate: tmdb ? tmdb.releaseDate : (item.pub_time || item.pub_date || ""),
        backdropPath: tmdb ? tmdb.backdropPath : biliPoster,
        posterPath: tmdb ? tmdb.posterPath : biliPoster, // 优先使用 TMDB 海报
        rating: tmdb ? tmdb.rating : (item.rating ? parseFloat(item.rating) : 0),
        mediaType: tmdb ? tmdb.mediaType : "tv",
        genreTitle: tmdb ? tmdb.genreTitle : (item.styles ? item.styles.join("/") : "番剧"),
        seasonInfo: item.index_show || (tmdb ? tmdb.seasonInfo : "")
      };

      return {
        id: tmdbInfo.id,
        type: "bangumi", // 必须设为 bangumi 类型
        title: item.title,
        description: tmdbInfo.description,
        releaseDate: tmdbInfo.releaseDate,
        posterPath: tmdbInfo.posterPath,
        backdropPath: tmdbInfo.backdropPath,
        rating: tmdbInfo.rating,
        mediaType: tmdbInfo.mediaType,
        genreTitle: tmdbInfo.genreTitle,
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`,
        tmdbInfo: tmdbInfo, // 关键：官方模块依赖此嵌套对象渲染
        hasTmdb: !!tmdb,
        seasonInfo: tmdbInfo.seasonInfo,
        originalTitle: item.title,
        popularity: item.pts || 0
      };
    });
  } catch (e) {
    console.log("格式化失败，降级显示原始数据");
    return biliList.map(item => ({
      id: (item.season_id || item.ss_id).toString(),
      type: "bangumi",
      title: item.title,
      posterPath: (item.cover || item.pic || "").replace("http:", "https:"),
      tmdbInfo: { id: (item.season_id || item.ss_id).toString() }
    }));
  }
}

// 1. 哔哩哔哩热门番剧榜
async function popularRank() {
  const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
  const list = res.data.result?.list || res.data.data?.list || [];
  return await formatToOfficialStyle(list);
}

// 2. 正在热播 (基于 B站 PGC 热门流)
async function hotAiring() {
  const url = "https://api.bilibili.com/pgc/web/discover/popular?page=1&pagesize=30";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com/" } });
  const list = res.data.result?.list || res.data.data?.list || [];
  return await formatToOfficialStyle(list);
}
