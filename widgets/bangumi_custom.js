/**
 * Bangumi 缓存模块（使用你的 GitHub 数据）
 */

var WidgetMetadata = {
  id: "h05n.bangumi_cache",
  title: "Bangumi 番剧放送（缓存版）",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用 GitHub 自动更新的缓存数据（Bangumi + TMDB）",
  author: "h05n",
  site: "https://github.com/h05n/forward-bangumi-cache",
  modules: [
    {
      id: "dailySchedule",
      title: "每日放送",
      functionName: "dailySchedule",
      params: [
        {
          name: "day",
          title: "星期",
          type: "enumeration",
          enumOptions: [
            { title: "今天", value: "today" },
            { title: "星期一", value: 1 },
            { title: "星期二", value: 2 },
            { title: "星期三", value: 3 },
            { title: "星期四", value: 4 },
            { title: "星期五", value: 5 },
            { title: "星期六", value: 6 },
            { title: "星期日", value: 7 }
          ]
        }
      ],
      cacheDuration: 3600
    },
    {
      id: "all",
      title: "全部番剧",
      functionName: "all",
      params: [],
      cacheDuration: 3600
    }
  ]
};

// 你的 GitHub enriched 最终缓存
const CACHE_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched_final.json";

/**
 * 加载缓存
 */
async function fetchCache() {
  const res = await Widget.http.get(CACHE_URL);

  if (!res || !res.data) {
    console.log("❌ 无法加载 enriched_final.json");
    return [];
  }

  return res.data;
}

/**
 * 获取今日的 weekday
 */
function filterByWeekday(data, day) {
  const today = new Date();
  const weekday = today.getDay() === 0 ? 7 : today.getDay();
  const target = day === "today" ? weekday : day;

  const match = data.find(d => d.weekday === target);
  return match ? match.items || [] : [];
}

/**
 * 转换成 Forward 格式
 */
function format(items) {
  return items.map(item => ({
    id: item.id,
    type: "bangumi",
    title: item.title || item.name_cn || item.name,
    description: item.summary || "",
    posterPath: item.images?.poster || "",
    backdropPath: item.images?.backdrop || "",
    releaseDate: item.air_date || "",
    rating: item.rating_bgm || 0,
    mediaType: "tv",
    bangumiUrl: item.url || ""
  }));
}

/**
 * 每日放送
 */
async function dailySchedule(params) {
  const data = await fetchCache();
  const list = filterByWeekday(data, params.day);
  return format(list);
}

/**
 * 全部番剧
 */
async function all() {
  const data = await fetchCache();
  const list = data.flatMap(d => d.items || []);
  return format(list);
}

// 必须导出
module.exports = {
  WidgetMetadata,
  dailySchedule,
  all
};
