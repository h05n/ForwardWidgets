WidgetMetadata = {
  id: "bilibili.bangumi.official.id",
  title: "B站番剧排行",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  description: "完全对齐官方映射逻辑，无需 API Key，极速匹配 TMDB ID",
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
 * 核心逻辑：直接读取官方维护的映射表
 * 这种方式不需要 API Key，速度最快，且由于是人工维护，不会匹配到真人剧
 */
async function popularRank() {
  try {
    // 1. 并发请求：同时获取 B 站榜单和官方映射表
    const [biliRes, mappingRes] = await Promise.all([
      Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
        headers: { "Referer": "https://www.bilibili.com/" }
      }),
      Widget.http.get("https://assets.vvebo.vip/scripts/datas/latest_bangumi_trending.json")
    ]);

    const biliList = biliRes.data.result?.list || biliRes.data.data?.list || [];
    const mappingList = mappingRes.data || [];

    // 2. 匹配逻辑
    return biliList.map(item => {
      // 在官方映射表中寻找该番剧
      const matched = mappingList.find(m => 
        m.bangumi_name === item.title || 
        (m.tmdb_info && m.tmdb_info.title === item.title)
      );

      // 如果没匹配到官方 TMDB 数据，我们就跳过（因为你要保证是 TMDB ID 且不匹配真人）
      if (!matched || !matched.tmdb_info) return null;

      const tmdb = matched.tmdb_info;
      const sid = (item.season_id || item.ss_id || "").toString();

      return {
        id: tmdb.id.toString(), // 强制使用 TMDB ID
        type: "bangumi",
        title: item.title,
        description: tmdb.description || item.desc || "",
        // 不要获取封面：这里不传 posterPath，或者传空，依靠 App 根据 ID 自动补全
        posterPath: "", 
        tmdbInfo: {
          id: tmdb.id.toString(),
          mediaType: "tv"
        },
        hasTmdb: true,
        seasonInfo: item.index_show || "",
        link: `https://www.bilibili.com/bangumi/play/ss${sid}`
      };
    }).filter(i => i !== null); // 过滤掉没匹配到官方 ID 的项

  } catch (e) {
    console.log("加载失败: " + e.message);
    return [];
  }
}
