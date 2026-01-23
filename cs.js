WidgetMetadata = {
  id: "bilibili.bangumi.hot",
  title: "B站番剧排行",
  version: "2.1.0",
  requiredVersion: "0.0.1",
  description: "Bilibili 官方番剧热门排行榜",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "trending",
      title: "热门排行",
      functionName: "getPopularRanking",
      params: [
        {
          name: "type",
          title: "排行分类",
          type: "enumeration",
          enumOptions: [
            { title: "番剧榜", value: "1" },
            { title: "国创榜", value: "4" }
          ]
        }
      ]
    }
  ]
};

/**
 * 格式化函数：修正封面路径并关闭 TMDB 自动匹配
 */
function formatBiliToApp(item) {
  if (!item) return null;
  const sid = (item.season_id || item.ss_id).toString();
  
  // 修正封面：处理 B站 图片前缀并确保 HTTPS
  let coverUrl = item.cover || item.pic || "";
  if (coverUrl.startsWith("//")) coverUrl = "https:" + coverUrl;
  if (!coverUrl.startsWith("http")) coverUrl = "https://" + coverUrl;

  // 严格适配参考模块的嵌套结构
  const tmdbInfo = {
    id: sid,
    title: item.title,
    description: item.desc || item.evaluate || "",
    releaseDate: item.pub_time || item.pub_date || "",
    backdropPath: coverUrl,
    posterPath: coverUrl, // 直接使用 B站 图片链接
    rating: item.rating ? parseFloat(item.rating) : (item.pts ? parseFloat((item.pts/10000).toFixed(1)) : 0),
    mediaType: "tv",
    genreTitle: item.styles ? item.styles.join("/") : (item.badge || "番剧"),
    seasonInfo: item.index_show || item.new_ep?.index_show || ""
  };

  return {
    id: sid,
    type: "bangumi",
    title: item.title,
    description: tmdbInfo.description,
    releaseDate: tmdbInfo.releaseDate,
    posterPath: coverUrl,
    backdropPath: coverUrl,
    rating: tmdbInfo.rating,
    mediaType: "tv",
    genreTitle: tmdbInfo.genreTitle,
    tmdbInfo: tmdbInfo,
    // 关键修正：设置为 false，防止 App 用 B站 ID 去 TMDB 匹配错误封面
    hasTmdb: false, 
    seasonInfo: tmdbInfo.seasonInfo,
    link: `https://www.bilibili.com/bangumi/play/ss${sid}`,
    popularity: item.pts || 0
  };
}

/**
 * 获取 Bilibili 官方热门排行榜
 */
async function getPopularRanking(params) {
  try {
    const type = params.type || "1";
    // 使用 B站 官方 PGC 排行榜接口
    const url = `https://api.bilibili.com/pgc/season/rank/web/list?season_type=${type}&day=3`;
    
    const res = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });

    // 适配 B站 接口的返回路径
    const list = res.data.result?.list || res.data.data?.list || [];
    return list.map(formatBiliToApp).filter(i => i !== null);
  } catch (e) {
    console.log("获取排行失败: " + e.message);
    return [];
  }
}
