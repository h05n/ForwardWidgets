WidgetMetadata = {
  id: "bilibili.bangumi.official",
  title: "Bilibili 番剧",
  version: "2.0.0",
  requiredVersion: "0.0.1",
  description: "同步 Bilibili 官方新番时间表及番剧/国创排行榜",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "timeline",
      title: "新番时间表",
      functionName: "getTimeline",
      params: [
        {
          name: "day",
          title: "选择日期",
          type: "enumeration",
          enumOptions: [
            { title: "今天", value: "today" },
            { title: "周一", value: "1" },
            { title: "周二", value: "2" },
            { title: "周三", value: "3" },
            { title: "周四", value: "4" },
            { title: "周五", value: "5" },
            { title: "周六", value: "6" },
            { title: "周日", value: "7" }
          ]
        }
      ]
    },
    {
      id: "rank_bangumi",
      title: "番剧排行榜",
      functionName: "getRankBangumi",
      params: []
    },
    {
      id: "rank_guochuang",
      title: "国创排行榜",
      functionName: "getRankGuochuang",
      params: []
    }
  ]
};

/**
 * 严格对齐 bangumi.js 要求的 tmdbInfo 嵌套结构
 */
function formatBiliToBangumi(item) {
  if (!item) return null;
  const sid = (item.season_id || item.ss_id || "").toString();
  const img = (item.cover || item.pic || "").replace("http:", "https:");
  
  // 必须构造嵌套对象，App 的 UI 渲染依赖此结构
  const tmdbInfo = {
    id: sid,
    description: item.desc || item.evaluate || "",
    releaseDate: item.pub_time || item.pub_date || "",
    backdropPath: img,
    posterPath: img,
    rating: item.rating ? parseFloat(item.rating) : (item.pts ? parseFloat((item.pts/10000).toFixed(1)) : 0),
    mediaType: "tv",
    genreTitle: item.styles ? item.styles.join("/") : (item.badge || "番剧"),
    seasonInfo: item.index_show || item.new_ep?.index_show || ""
  };

  return {
    id: sid,
    type: "bangumi", // 必须指定为 bangumi 类型
    title: item.title || "",
    description: tmdbInfo.description,
    releaseDate: tmdbInfo.releaseDate,
    backdropPath: img,
    posterPath: img,
    rating: tmdbInfo.rating,
    mediaType: "tv",
    genreTitle: tmdbInfo.genreTitle,
    bangumiUrl: `https://www.bilibili.com/bangumi/play/ss${sid}`,
    tmdbInfo: tmdbInfo, 
    hasTmdb: true,
    seasonInfo: tmdbInfo.seasonInfo,
    originalTitle: item.title || "",
    popularity: item.pts || 0,
    voteCount: 0
  };
}

/**
 * 1. 新番时间表
 */
async function getTimeline(params) {
  try {
    const res = await Widget.http.get("https://api.bilibili.com/pgc/web/timeline/v2?season_type=1", {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });
    const timeline = res.data.result?.latest || [];
    let dayValue = params.day || "today";

    if (dayValue === "today") {
      const now = new Date();
      // JS: 0 (Sun) - 6 (Sat) -> B站: 7 (Sun), 1-6 (Mon-Sat)
      const dayMap = [7, 1, 2, 3, 4, 5, 6];
      dayValue = dayMap[now.getDay()].toString();
    }

    const dayData = timeline.find(d => d.day_of_week.toString() === dayValue);
    return (dayData ? dayData.episodes : []).map(formatBiliToBangumi);
  } catch (e) {
    console.log("Timeline Error: " + e.message);
    return [];
  }
}

/**
 * 2. 番剧排行榜 (日本动画)
 */
async function getRankBangumi() {
  return await fetchRanking("1");
}

/**
 * 3. 国创排行榜 (国产动画)
 */
async function getRankGuochuang() {
  return await fetchRanking("4");
}

/**
 * 通用排行榜抓取
 */
async function fetchRanking(seasonType) {
  try {
    const url = `https://api.bilibili.com/pgc/season/rank/web/list?season_type=${seasonType}&day=3`;
    const res = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });
    // 排行榜数据路径兼容性处理
    const list = res.data.result?.list || res.data.data?.list || [];
    return list.map(formatBiliToBangumi);
  } catch (e) {
    console.log("Ranking Error: " + e.message);
    return [];
  }
}
