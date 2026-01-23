WidgetMetadata = {
  id: "bilibili.bangumi.strict",
  title: "B站番剧数据",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取 Bilibili 官方番剧播出日历及热门榜单",
  author: "Forward",
  site: "https://www.bilibili.com/anime/",
  modules: [
    {
      id: "dailySchedule",
      title: "每日播出",
      functionName: "dailySchedule",
      params: [
        {
          name: "day",
          title: "星期",
          type: "enumeration",
          enumOptions: [
            { title: "今天", value: "today" },
            { title: "星期一", value: "1" },
            { title: "星期二", value: "2" },
            { title: "星期三", value: "3" },
            { title: "星期四", value: "4" },
            { title: "星期五", value: "5" },
            { title: "星期六", value: "6" },
            { title: "星期日", value: "7" },
          ],
        },
      ],
    },
    {
      id: "trending",
      title: "近期注目",
      functionName: "trending",
      params: [],
    },
  ],
};

// 严格适配参考文件的格式化函数
function formatToBangumiStructure(item) {
  const sid = (item.season_id || item.ss_id || "").toString();
  const poster = (item.cover || item.pic || "").replace("http:", "https:");
  
  // 必须构造这个嵌套对象，App 界面可能直接读取此处的字段
  const tmdbInfo = {
    id: sid,
    description: item.desc || item.evaluate || "",
    releaseDate: item.pub_time || item.pub_date || "",
    backdropPath: poster,
    posterPath: poster,
    rating: item.rating ? parseFloat(item.rating) : (item.pts ? (item.pts/10000).toFixed(1) : 0),
    mediaType: "tv",
    genreTitle: item.styles ? item.styles.join("/") : (item.badge || "番剧"),
    seasonInfo: item.index_show || item.new_ep?.index_show || ""
  };

  return {
    id: sid,
    type: "bangumi", // 严格使用 bangumi 类型
    title: item.title || "",
    description: tmdbInfo.description,
    releaseDate: tmdbInfo.releaseDate,
    backdropPath: tmdbInfo.backdropPath,
    posterPath: tmdbInfo.posterPath,
    rating: tmdbInfo.rating,
    mediaType: tmdbInfo.mediaType,
    genreTitle: tmdbInfo.genreTitle,
    bangumiUrl: `https://www.bilibili.com/bangumi/play/ss${sid}`,
    tmdbInfo: tmdbInfo, // 必须包含嵌套对象
    hasTmdb: true,
    seasonInfo: tmdbInfo.seasonInfo,
    originalTitle: item.title || "",
    popularity: item.pts || 0,
    voteCount: 0
  };
}

async function dailySchedule(params) {
  try {
    const res = await Widget.http.get("https://api.bilibili.com/pgc/web/timeline/v2?season_type=1", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    const timeline = res.data.result.latest || [];
    let dayValue = params.day || "today";

    if (dayValue === "today") {
      const now = new Date();
      const dayMap = [7, 1, 2, 3, 4, 5, 6]; 
      dayValue = dayMap[now.getDay()].toString();
    }

    const dayData = timeline.find(d => d.day_of_week.toString() === dayValue);
    return (dayData ? dayData.episodes : []).map(formatToBangumiStructure);
  } catch (e) {
    return [];
  }
}

async function trending(params) {
  try {
    const res = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    return (res.data.data.list || []).map(formatToBangumiStructure);
  } catch (e) {
    return [];
  }
}
