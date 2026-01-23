var WidgetMetadata = {
  id: "bilibili.bangumi.gallery",
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

// --- 数据获取方法 ---

async function fetchBilibiliTimeline() {
  try {
    const url = "https://api.bilibili.com/pgc/web/timeline/v2?season_type=1";
    const response = await Widget.http.get(url, getBiliHeaders());
    if (response && response.data && response.data.result) {
      return response.data.result.latest || [];
    }
  } catch (error) {
    console.error("获取 B站时间表失败:", error);
  }
  return [];
}

async function fetchBilibiliRanking() {
  try {
    const url = "https://api.bilibili.com/pgc/season/rank/web/list?season_type=1&day=3";
    const response = await Widget.http.get(url, getBiliHeaders());
    if (response && response.data && response.data.data) {
      return response.data.data.list || [];
    }
  } catch (error) {
    console.error("获取 B站排行榜失败:", error);
  }
  return [];
}

// --- 格式化方法 (仿照参考代码结构) ---

function formatBiliBangumi(item) {
  return {
    // 优先使用 season_id 作为唯一标识
    id: item.season_id || item.ss_id || Math.random().toString(36),
    type: "url",
    title: item.title,
    description: item.desc || item.evaluate || `弹幕: ${item.stat?.danmaku || "N/A"}`,
    // 处理 B 站图片协议头
    posterPath: item.cover ? (item.cover.startsWith('http') ? item.cover : "https:" + item.cover) : "",
    // 展示番剧特有的评分或热度
    rating: item.rating ? item.rating.replace("分", "") : (item.pts ? (item.pts/10000).toFixed(1) : "0"),
    // 更新进度展示
    durationText: item.index_show || item.new_ep?.index_show || "查看详情",
    genreTitle: item.styles ? item.styles.join("/") : (item.badge || "番剧"),
    releaseDate: item.pub_time || item.pub_date || "",
    link: `https://www.bilibili.com/bangumi/play/ss${item.season_id || item.ss_id}`,
    playerType: "app" 
  };
}

// --- 模块主函数 ---

// 每日播出
async function dailySchedule(params) {
  const timeline = await fetchBilibiliTimeline();
  let dayValue = params.day || "today";
  
  if (dayValue === "today") {
    const now = new Date();
    // JS getDay() 返回 0-6 (周日到周六)，B站接口映射需要处理
    const dayMap = [7, 1, 2, 3, 4, 5, 6]; 
    dayValue = dayMap[now.getDay()].toString();
  }

  // 筛选对应星期的番剧
  const targetDayData = timeline.find(d => d.day_of_week.toString() === dayValue);
  const episodes = targetDayData ? targetDayData.episodes : [];
  
  return episodes.map(formatBiliBangumi);
}

// 近期注目 (排行榜)
async function trending(params) {
  const rankingList = await fetchBilibiliRanking();
  return rankingList.map(formatBiliBangumi);
}

// --- 辅助方法 ---

function getBiliHeaders() {
  return {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.bilibili.com/anime/"
    }
  };
}
