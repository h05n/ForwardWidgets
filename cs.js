WidgetMetadata = {
  id: "bilibili.bangumi.v3",
  title: "B站番剧数据",
  version: "1.0.1",
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

/**
 * 严格适配 bangumi.js 要求的字段
 */
function formatBiliToApp(item) {
  if (!item) return null;
  const sid = (item.season_id || item.ss_id || "").toString();
  const poster = (item.cover || item.pic || "").replace("http:", "https:");
  
  // 构造 tmdbInfo 嵌套对象
  const tmdbInfo = {
    id: sid,
    description: item.desc || item.evaluate || "",
    releaseDate: item.pub_time || item.pub_date || "",
    backdropPath: poster,
    posterPath: poster,
    rating: item.rating ? parseFloat(item.rating) : (item.pts ? parseFloat((item.pts/10000).toFixed(1)) : 0),
    mediaType: "tv",
    genreTitle: item.styles ? item.styles.join("/") : (item.badge || "番剧"),
    seasonInfo: item.index_show || item.new_ep?.index_show || ""
  };

  return {
    id: sid,
    type: "bangumi",
    title: item.title || "",
    description: tmdbInfo.description,
    releaseDate: tmdbInfo.releaseDate,
    backdropPath: tmdbInfo.backdropPath,
    posterPath: tmdbInfo.posterPath,
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

// 每日播出
async function dailySchedule(params) {
  try {
    console.log("正在获取 B站时间表...");
    const url = "https://api.bilibili.com/pgc/web/timeline/v2?season_type=1";
    const res = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });

    // B站时间表接口数据在 res.data.result 中
    const timeline = res.data.result?.latest || [];
    if (timeline.length === 0) {
      console.log("B站时间表返回数据为空");
      return [];
    }

    let dayValue = params.day || "today";
    if (dayValue === "today") {
      const now = new Date();
      const dayMap = [7, 1, 2, 3, 4, 5, 6]; 
      dayValue = dayMap[now.getDay()].toString();
    }

    console.log("匹配星期: " + dayValue);
    // 强制转为字符串对比
    const dayData = timeline.find(d => d.day_of_week.toString() === dayValue);
    
    if (!dayData) {
      console.log("未找到对应星期的数据");
      return [];
    }

    return (dayData.episodes || []).map(formatBiliToApp).filter(i => i !== null);
  } catch (e) {
    console.log("dailySchedule 发生错误: " + e.message);
    return [];
  }
}

// 近期注目
async function trending() {
  try {
    console.log("正在获取 B站排行榜...");
    // 注意：排行榜接口 PGC 端的路径是 res.data.result.list
    const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const res = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });

    const list = res.data.result?.list || res.data.data?.list || [];
    console.log("获取到排行榜数量: " + list.length);

    return list.map(formatBiliToApp).filter(i => i !== null);
  } catch (e) {
    console.log("trending 发生错误: " + e.message);
    return [];
  }
}
