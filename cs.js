var WidgetMetadata = {
  id: "bilibili.bangumi.v2",
  title: "B站番剧数据",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取 Bilibili 官方番剧播出日历及热门榜单",
  author: "Gemini",
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

// --- 格式化函数：严格匹配你提供的模板字段 ---
function formatBiliData(list) {
  if (!list) return [];
  return list.map((item) => {
    // 处理图片前缀
    const img = item.cover || item.pic || "";
    const poster = img.startsWith('http') ? img : "https:" + img;
    
    return {
      // 必须包含 id 和 type
      id: item.season_id || item.ss_id || Math.random().toString(36),
      type: "bangumi", 
      title: item.title,
      description: item.desc || item.evaluate || "",
      releaseDate: item.pub_time || item.pub_date || "",
      posterPath: poster,
      backdropPath: poster, // 展示用，背景图也设为封面
      rating: item.rating ? parseFloat(item.rating.replace("分", "")) : (item.pts ? (item.pts/10000).toFixed(1) : 0),
      mediaType: "tv",
      genreTitle: item.styles ? item.styles.join("/") : (item.badge || "番剧"),
      // 扩展字段
      seasonInfo: item.index_show || item.new_ep?.index_show || "",
      bangumiUrl: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`,
      popularity: item.pts || 0
    };
  });
}

// --- 模块主函数 ---

// 1. 每日播出
async function dailySchedule(params) {
  try {
    const url = "https://api.bilibili.com/pgc/web/timeline/v2?season_type=1";
    const response = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    const timeline = response.data.result.latest || [];
    let dayValue = params.day || "today";

    if (dayValue === "today") {
      const now = new Date();
      // 映射 JS 的 0-6 到 B站的 1-7
      const dayMap = [7, 1, 2, 3, 4, 5, 6]; 
      dayValue = dayMap[now.getDay()].toString();
    }

    const targetDayData = timeline.find(d => d.day_of_week.toString() === dayValue);
    const episodes = targetDayData ? targetDayData.episodes : [];
    
    return formatBiliData(episodes);
  } catch (error) {
    console.log("获取时间表失败:", error);
    return [];
  }
}

// 2. 近期注目
async function trending(params) {
  try {
    const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const response = await Widget.http.get(url, {
      headers: { "Referer": "https://www.bilibili.com/" }
    });
    
    const list = response.data.data.list || [];
    return formatBiliData(list);
  } catch (error) {
    console.log("获取排行榜失败:", error);
    return [];
  }
}
