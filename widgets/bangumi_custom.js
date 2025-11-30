/**
 * Bangumi 缓存模块（使用 GitHub 缓存 + TMDB 封面）  
 * 完全遵照 ForwardWidgets 官方模块要求
 */

var WidgetMetadata = {
  id: "h05n.bangumi_cache",
  title: "Bangumi 放送表（缓存版）",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用 GitHub 缓存 (Bangumi + TMDB 封面 + 数据) 的放送表模块",
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

var CACHE_URL = "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched_final.json";

function fetchCache() {
  return Widget.http.get(CACHE_URL).then(res => {
    if (!res || !res.data) {
      throw new Error("无法加载缓存数据 enriched_final.json");
    }
    return res.data;
  });
}

function filterByWeekday(data, day) {
  var today = new Date();
  var weekday = today.getDay() === 0 ? 7 : today.getDay();
  var target = day === "today" ? weekday : day;

  var result = [];
  if (Array.isArray(data)) {
    data.forEach(d => {
      if (d.weekday === target && Array.isArray(d.items)) {
        result = result.concat(d.items);
      }
    });
  }
  return result;
}

function format(items) {
  return items.map(function(item) {
    return {
      id: item.id,
      type: "bangumi",
      title: item.name_cn || item.name || "",
      description: item.summary || "",
      posterPath: (item.images && item.images.poster) || "",
      backdropPath: (item.images && item.images.backdrop) || "",
      releaseDate: item.air_date || "",
      rating: item.rating || 0
    };
  });
}

async function dailySchedule(params) {
  var data = await fetchCache();
  var list = filterByWeekday(data, params.day);
  return format(list);
}

async function all() {
  var data = await fetchCache();
  var list = [];
  if (Array.isArray(data)) {
    data.forEach(function(d) {
      if (Array.isArray(d.items)) {
        list = list.concat(d.items);
      }
    });
  }
  return format(list);
}

module.exports = {
  WidgetMetadata: WidgetMetadata,
  dailySchedule: dailySchedule,
  all: all
};