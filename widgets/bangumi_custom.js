/**
 * Bangumi 缓存模块（基于官方模块 + 使用你的 enriched.json）
 */

var WidgetMetadata = {
  id: "h05n.bangumi_cache",
  title: "Bangumi 放送表（缓存版）",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用本地 GitHub 缓存的 Bangumi 数据 + TMDB 封面（竖/横图）",
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
      title: "所有番剧",
      functionName: "all",
      params: [],
      cacheDuration: 3600
    }
  ]
};

// 缓存地址
const CACHE_URL = "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";

// 加载缓存
async function fetchCache() {
  const res = await Widget.http.get(CACHE_URL);
  if (!res || !res.data) {
    throw new Error("无法加载缓存数据");
  }
  return res.data;
}

// 获取今天/指定 weekday 的番剧
function filterByWeekday(data, day) {
  const d = new Date();
  const weekday = day === "today" ? (d.getDay() === 0 ? 7 : d.getDay()) : day;
  return (data || []).filter(item => item.weekday === weekday);
}

// 格式化为 Forward 需要的数据格式
function format(items) {
  return items.map(item => {
    return {
      id: item.id,
      type: "bangumi",
      title: item.name_cn || item.name || "",
      description: item.summary || "",
      posterPath: item.images?.poster || "",
      backdropPath: item.images?.backdrop || "",
      releaseDate: item.air_date || "",
      rating: item.rating || 0,
      mediaType: "tv",
      url: item.url || ""
    };
  });
}

// 模块函数：每日放送
async function dailySchedule(params) {
  const data = await fetchCache();
  const list = filterByWeekday(data, params.day);
  return format(list);
}

// 模块函数：全部番剧
async function all() {
  const data = await fetchCache();
  return format(data);
}

export { WidgetMetadata, dailySchedule, all };