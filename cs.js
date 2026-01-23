WidgetMetadata = {
  id: "bilibili.bangumi.tmdb",
  title: "B站番剧排行",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "Bilibili 官方排行 + TMDB 高清数据匹配",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "hotRanking",
      title: "热门排行",
      functionName: "hotRanking",
      params: [
        {
          name: "type",
          title: "分类",
          type: "enumeration",
          enumOptions: [
            { title: "番剧榜 (日漫)", value: "1" },
            { title: "国创榜 (国产)", value: "4" }
          ]
        }
      ]
    }
  ]
};

async function hotRanking(params) {
  try {
    const category = params.type || "1";
    
    // 1. 获取 Bilibili 官方实时排行榜
    const biliUrl = `https://api.bilibili.com/pgc/season/rank/web/list?season_type=${category}&day=3`;
    const biliRes = await Widget.http.get(biliUrl, {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });
    const biliList = biliRes.data.result?.list || biliRes.data.data?.list || [];

    // 2. 获取官方模块同款的 TMDB 映射数据 (用于修正封面和 ID)
    const proxyUrl = "https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json";
    const proxyRes = await Widget.http.get(proxyUrl);
    const proxyList = proxyRes.data || [];

    // 3. 匹配并格式化
    return biliList.map(item => {
      // 尝试在 TMDB 增强数据中寻找匹配的标题
      const matched = proxyList.find(p => 
        p.bangumi_name === item.title || 
        (p.tmdb_info && p.tmdb_info.title === item.title)
      );

      const tmdb = matched ? matched.tmdb_info : null;
      const sid = (item.season_id || item.ss_id).toString();

      // 构造符合官方 bangumi.js 预期的嵌套对象
      return {
        // 如果匹配到 TMDB，则使用 TMDB ID，否则使用 B站 ID
        id: tmdb ? tmdb.id : sid, 
        type: "bangumi", 
        title: item.title,
        description: tmdb ? tmdb.description : (item.desc || item.evaluate || ""),
        // 封面优先使用 TMDB 高清 posterPath
        posterPath: tmdb ? tmdb.posterPath : (item.cover || item.pic || "").replace("http:", "https:"),
        backdropPath: tmdb ? tmdb.backdropPath : (item.cover || item.pic || "").replace("http:", "https:"),
        rating: tmdb ? tmdb.rating : (item.rating ? parseFloat(item.rating) : 0),
        mediaType: tmdb ? tmdb.mediaType : "tv",
        genreTitle: tmdb ? tmdb.genreTitle : (item.styles ? item.styles.join("/") : "番剧"),
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`,
        tmdbInfo: tmdb || { id: sid, posterPath: item.cover }, // 确保 tmdbInfo 对象存在
        hasTmdb: !!tmdb,
        seasonInfo: item.index_show || (tmdb ? tmdb.seasonInfo : ""),
        popularity: item.pts || 0
      };
    });
  } catch (e) {
    console.error("Ranking Error:", e.message);
    return [];
  }
}
