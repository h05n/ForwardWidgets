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

// 你的 GitHub 缓存
var CACHE_URL = "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched_final.json";

function safeGet(obj, path, fallback) {
  try {
    var parts = path.split(".");
    var val = obj;
    for (var i = 0; i < parts.length; i++) {
      val = val[parts[i]];
      if (val === undefined || val === null) return fallback;
    }
    return val;
  } catch (e) {
    return fallback;
  }
}

// 加载缓存
async function fetchCache() {
  var res = await Widget.http.get(CACHE_URL);

  if (!res || !res.data) {
    throw new Error("无法加载 enriched_final.json");
  }

  return res.data;
}

// weekday 过滤
function filterByWeekday(data, day) {
  var today = new Date();
  var weekday = today.getDay();
  if (weekday === 0) weekday = 7;

  var target = day === "today" ? weekday : day;

  for (var i = 0; i < data.length; i++) {
    if (data[i].weekday === target) {
      return data[i].items || [];
    }
  }
  return [];
}

// 格式化
function format(items) {
  var list = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    var poster = safeGet(item, "images.poster", "");
    var backdrop = safeGet(item, "images.backdrop", "");
    var title = item.title || item.name_cn || item.name || "";

    list.push({
      id: item.id,
      type: "bangumi",
      title: title,
      description: item.summary || "",
      posterPath: poster,
      backdropPath: backdrop,
      releaseDate: item.air_date || "",
      rating: item.rating_bgm || 0,
      mediaType: "tv",
      bangumiUrl: item.url || ""
    });
  }

  return list;
}

// 每日放送
async function dailySchedule(params) {
  var data = await fetchCache();
  var items = filterByWeekday(data, params.day);
  return format(items);
}

// 全部番剧
async function all() {
  var data = await fetchCache();
  var list = [];

  for (var i = 0; i < data.length; i++) {
    var block = data[i];
    if (block.items && block.items.length) {
      list = list.concat(block.items);
    }
  }
  return format(list);
}

module.exports = {
  WidgetMetadata: WidgetMetadata,
  dailySchedule: dailySchedule,
  all: all
};
