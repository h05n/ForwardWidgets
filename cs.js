WidgetMetadata = {
  id: "bilibili.official.standard",
  title: "B站番剧数据",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "Bilibili 热门榜单，完全对齐官方 TMDB ID 与封面逻辑",
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
 * 格式化逻辑：完全克隆 bangumi.js 的 formatTrendingData 逻辑
 * 核心在于匹配官方的 TMDB 映射表，使用正确的 ID
 */
async function formatToOfficial(biliList) {
  try {
    // 获取官方模块使用的 TMDB 映射数据
    const trendingUrl = "https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json";
    const res = await Widget.http.get(trendingUrl);
    const officialData = res.data || [];

    return biliList.map(item => {
      // 匹配逻辑：通过标题在官方数据中寻找
      const matched = officialData.find(p => 
        p.bangumi_name === item.title || 
        (p.tmdb_info && p.tmdb_info.title === item.title)
      );

      const tmdb = matched ? matched.tmdb_info : null;
      const sid = (item.season_id || item.ss_id || "").toString();

      // 返回结构必须包含 tmdbInfo，且 id 必须是 TMDB ID 才能显示正确封面
      return {
        id: tmdb ? tmdb.id : sid, // 必须是 TMDB 的数字 ID
        type: "bangumi",          // 必须为 bangumi 类型
        title: item.title,
        description: tmdb ? tmdb.description : (item.desc || item.evaluate || ""),
        releaseDate: tmdb ? tmdb.releaseDate : (item.pub_time || item.pub_date || ""),
        posterPath: tmdb ? tmdb.posterPath : (item.cover || item.pic || "").replace("http:", "https:"),
        backdropPath: tmdb ? tmdb.backdropPath : (item.cover || item.pic || "").replace("http:", "https:"),
        rating: tmdb ? tmdb.rating : 0,
        mediaType: tmdb ? tmdb.mediaType : "tv",
        genreTitle: tmdb ? tmdb.genreTitle : "",
        tmdbInfo: tmdb,            // 必须包含此对象
        hasTmdb: !!tmdb,
        seasonInfo: item.index_show || (tmdb ? tmdb.seasonInfo : ""),
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`
      };
    }).filter(i => i.hasTmdb); // 官方模式通常只展示有 TMDB 数据的高质量项
  } catch (e) {
    return [];
  }
}

// 模块 1: 热门番剧榜 (B站排行榜)
async function popularRanking() {
  const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com" } });
  const list = res.data.result?.list || res.data.data?.list || [];
  return await formatToOfficial(list);
}

// 模块 2: 正在热播 (修复 404，使用 B站番剧索引页的最热排序)
async function hotAiring() {
  // 替换了之前 404 的接口，改为当前最火热的番剧索引
  const url = "https://api.bilibili.com/pgc/season/index/condition?season_type=1&order=3&pagesize=30";
  const res = await Widget.http.get(url, { headers: { "Referer": "https://www.bilibili.com" } });
  const list = res.data.data?.list || [];
  return await formatToOfficial(list);
}
