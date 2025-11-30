//
// 🍀 h05n 专用 Forward Bangumi 模块（使用 GitHub 缓存版）
// 基于 InchStudio / ForwardWidgets 官方模块完整改写
// dailySchedule → enriched.json
// trending → trending.json
//

WidgetMetadata = {
  id: "forward.bangumi.custom",
  title: "Bangumi（缓存版）",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用 GitHub 缓存加速的 Bangumi 模块",
  author: "h05n",
  site: "https://github.com/h05n/forward-bangumi-cache",
  modules: [
    {
      id: "dailySchedule",
      title: "每日播出（缓存）",
      functionName: "dailySchedule",
      params: [
        {
          name: "day",
          title: "星期",
          type: "enumeration",
          enumOptions: [
            { title: "今天", value: "today" },
            { title: "星期一", value: "星期一" },
            { title: "星期二", value: "星期二" },
            { title: "星期三", value: "星期三" },
            { title: "星期四", value: "星期四" },
            { title: "星期五", value: "星期五" },
            { title: "星期六", value: "星期六" },
            { title: "星期日", value: "星期日" }
          ],
        },
      ],
    },
    {
      id: "trending",
      title: "近期注目（缓存）",
      functionName: "trending",
      params: [],
    },
  ],
};

// 你的缓存地址（自动更新 6 小时）
const CACHE_TRENDING =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/trending.json";

const CACHE_ENRICHED =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";


// 获取 enriched.json（用于 dailySchedule）
async function fetchEnriched() {
  try {
    const res = await Widget.http.get(CACHE_ENRICHED);
    return res.data || {};
  } catch (e) {
    console.error("❌ enriched.json 加载失败", e);
    return {};
  }
}

// 获取 trending.json（用于 trending）
async function fetchTrendingCache() {
  try {
    const res = await Widget.http.get(CACHE_TRENDING);
    return res.data || [];
  } catch (e) {
    console.error("❌ trending.json 加载失败", e);
    return [];
  }
}


// 当天是星期几
function getTodayKey() {
  const map = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return map[new Date().getDay()];
}


// dailySchedule（使用 enriched.json）  
async function dailySchedule(params) {
  const data = await fetchEnriched();
  const day = params.day === "today" ? getTodayKey() : params.day;

  const dayData = data.find(d => d.weekday === day || d.weekday_cn === day);

  if (!dayData) return [];

  // 转换为 Forward 格式
  return dayData.items.map(item => ({
    id: item.id || item.bangumi_id,
    type: "bangumi",
    title: item.name_cn || item.name || "",
    description: item.summary || "",
    posterPath: item.images?.large || item.images?.common || "",
    bangumiUrl: item.url || "",
  }));
}


// trending（使用 trending.json）
async function trending() {
  const list = await fetchTrendingCache();

  let out = [];

  list.forEach(day => {
    day.items.forEach(item => {
      out.push({
        id: item.id,
        title: item.name_cn || item.name,
        description: item.summary || "",
        posterPath: item.images?.large || item.images?.common || "",
        bangumiUrl: item.url || "",
      });
    });
  });

  return out;
}