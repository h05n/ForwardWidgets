WidgetMetadata = {
  id: "bilibili.official.bangumi",
  title: "B站番剧数据",
  version: "1.1.0",
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
      id: "trending",
      title: "近期注目",
      functionName: "trending",
      params: [
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          enumOptions: [
            { title: "番剧 (日漫)", value: "1" },
            { title: "国创 (国产)", value: "4" }
          ]
        }
      ]
    }
  ]
};

/**
 * 严格适配参考文件的格式化函数
 * 包含嵌套的 tmdbInfo 对象以确保 UI 正常渲染
 */
function formatBiliItem(item) {
  if (!item) return null;
  // B站的 season_id 是番剧的核心标识
  const sid = (item.season_id || item.ss_id || "").toString();
  const title = item.title || "";
  const img = (item.cover || item.pic || "").replace("http:", "https:");
  
  // 构造嵌套对象，UI 框架通常读取此处数据
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
    title: title,
    description: tmdbInfo.description,
    releaseDate: tmdbInfo.releaseDate,
    backdropPath: img,
    posterPath: img,
    rating: tmdbInfo.rating,
    mediaType: "tv",
    genreTitle: tmdbInfo.genreTitle,
    bangumiUrl: `https://www.bilibili.com/bangumi/play/ss${sid}`,
    tmdbInfo: tmdbInfo, // 关键：嵌套对象
    hasTmdb: true,
    seasonInfo: tmdbInfo.seasonInfo,
    originalTitle: title,
    popularity: item.pts || 0,
    voteCount: 0
  };
}

// 模块1：每日播出 (Timeline API)
async function dailySchedule(params) {
  try {
    const url = "https://api.bilibili.com/pgc/web/timeline/v2?season_type=1";
    const res = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });

    const timeline = res.data.result?.latest || [];
    let dayValue = params.day || "today";

    if (dayValue === "today") {
      const now = new Date();
      // JS 0-6 (Sun-Sat) -> B站 1-7 (Mon-Sun)
      const dayMap = [7, 1, 2, 3, 4, 5, 6];
      dayValue = dayMap[now.getDay()].toString();
    }

    const dayData = timeline.find(d => d.day_of_week.toString() === dayValue);
    const list = dayData ? dayData.episodes : [];
    
    return list.map(formatBiliItem).filter(i => i !== null);
  } catch (e) {
    console.error("Schedule Error:", e.message);
    return [];
  }
}

// 模块2：近期注目 (Ranking API)
async function trending(params) {
  try {
    const cat = params.category || "1";
    // B站官方排行榜 Web 接口
    const url = `https://api.bilibili.com/pgc/season/rank/web/list?season_type=${cat}&day=3`;
    const res = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/anime/" }
    });

    // 适配 B站 接口的两种可能的返回路径
    const list = res.data.data?.list || res.data.result?.list || [];
    
    return list.map(formatBiliItem).filter(i => i !== null);
  } catch (e) {
    console.error("Trending Error:", e.message);
    return [];
  }
}
