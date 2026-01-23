WidgetMetadata = {
  id: "bilibili.bangumi.fixed",
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

/**
 * 严格适配 bangumi.js 的数据格式
 */
function formatToBangumiStructure(item) {
  const sid = (item.season_id || item.ss_id || "").toString();
  const title = item.title || "";
  const img = item.cover || item.pic || "";
  const poster = img.startsWith('http') ? img : "https:" + img;
  const ratingNum = item.rating ? parseFloat(item.rating.replace("分", "")) : (item.pts ? parseFloat((item.pts / 10000).toFixed(1)) : 0);
  const styles = item.styles ? item.styles.join("/") : (item.badge || "番剧");
  
  // 构造 App 预期的嵌套 tmdbInfo 对象
  const tmdbInfo = {
    id: sid,
    description: item.desc || item.evaluate || "",
    releaseDate: item.pub_time || item.pub_date || "",
    backdropPath: poster,
    posterPath: poster,
    rating: ratingNum,
    mediaType: "tv",
    genreTitle: styles,
    seasonInfo: item.index_show || item.new_ep?.index_show || ""
  };

  return {
    id: sid,
    type: "bangumi", // 必须与参考文件一致
    title: title,
    description: tmdbInfo.description,
    releaseDate: tmdbInfo.releaseDate,
    backdropPath: poster,
    posterPath: poster,
    rating: ratingNum,
    mediaType: "tv",
    genreTitle: styles,
    bangumiUrl: `https://www.bilibili.com/bangumi/play/ss${sid}`,
    link: `https://www.bilibili.com/bangumi/play/ss${sid}`, 
    tmdbInfo: tmdbInfo, // 核心：嵌套对象
    hasTmdb: true,
    seasonInfo: tmdbInfo.seasonInfo,
    originalTitle: title,
    popularity: item.pts || 0,
    voteCount: 0,
    playerType: "app"
  };
}

// 每日播出
async function dailySchedule(params) {
  try {
    const response = await Widget.http.get("https://api.bilibili.com/pgc/web/timeline/v2?season_type=1", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    if (!response || !response.data || !response.data.result) return [];
    
    const timeline = response.data.result.latest || [];
    let dayValue = params.day || "today";

    if (dayValue === "today") {
      const now = new Date();
      // B站接口: 1-7 代表周一到周日
      const dayMap = [7, 1, 2, 3, 4, 5, 6]; 
      dayValue = dayMap[now.getDay()].toString();
    }

    const dayData = timeline.find(d => d.day_of_week.toString() === dayValue);
    return (dayData ? dayData.episodes : []).map(formatToBangumiStructure);
  } catch (e) {
    console.log("dailySchedule error:", e.message);
    return [];
  }
}

// 近期注目
async function trending(params) {
  try {
    const response = await Widget.http.get("https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3", {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    if (!response || !response.data || !response.data.data) return [];
    
    const list = response.data.data.list || [];
    return list.map(formatToBangumiStructure);
  } catch (e) {
    console.log("trending error:", e.message);
    return [];
  }
}
