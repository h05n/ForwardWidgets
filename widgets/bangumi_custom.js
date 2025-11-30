/**
 * Bangumi 缓存模块（使用你的 GitHub 数据）
 */

export var WidgetMetadata = {
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

// 你的缓存最终文件（Forward 读取这个）
const CACHE_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched_final.json";

/**
 * 加载缓存数据
 */
async function fetchCache() {
  const res = await Widget.http.get(CACHE_URL);

  if (!res || !res.data) {
    throw new Error("❌ 无法加载缓存数据 enriched_final.json");
  }

  return res.data;
}

/**
 * 根据 weekday 过滤
 */
function filterByWeekday(data, day) {
  if (!Array.isArray(data)) return [];

  const today = new Date();
  const todayWeekday = today.getDay() === 0 ? 7 : today.getDay();

  const target = day === "today" ? todayWeekday : day;

  return data
    .map(d => ({
      weekday: d.weekday,
      items: d.items || []
    }))
    .filter(d => d.weekday === target)
    .flatMap(d => d.items);
}

/**
 * 格式化为 Forward 需要的数据
 */
function format(items) {
  return items.map(item => ({
    id: item.id,
    type: "bangumi",

    // 标题（你的脚本已经自动补全）
    title: item.title || item.name_cn || item.name || "",

    // 简介
    description: item.summary || "",

    // 竖图
    posterPath: item.images?.poster || "",

    // 横图
    backdropPath: item.images?.backdrop || "",

    // 日期
    releaseDate: item.air_date || "",

    // 评分（Bangumi）
    rating: item.rating_bgm || 0,

    mediaType: "tv",

    // 官方 Bangumi 链接
    bangumiUrl: item.url || ""
  }));
}

/**
 * 模块函数：每日放送
 */
export async function dailySchedule(params) {
  const data = await fetchCache();
  const list = filterByWeekday(data, params.day);
  return format(list);
}

/**
 * 模块函数：全部番剧
 */
export async function all() {
  const data = await fetchCache();

  // Flatten 所有 weekday
  const list = data.flatMap(d => d.items || []);
  return format(list);
}
