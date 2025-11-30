WidgetMetadata = {
  id: "forward.bangumi.custom",
  title: "Bangumi 自定义缓存",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用自定义 GitHub 缓存的 Bangumi 模块",
  author: "h05n",
  site: "https://github.com/h05n/forward-bangumi-cache",
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
            { title: "星期一", value: "星期一" },
            { title: "星期二", value: "星期二" },
            { title: "星期三", value: "星期三" },
            { title: "星期四", value: "星期四" },
            { title: "星期五", value: "星期五" },
            { title: "星期六", value: "星期六" },
            { title: "星期日", value: "星期日" }
          ]
        }
      ]
    },
    {
      id: "trending",
      title: "近期注目",
      functionName: "trending",
      params: []
    }
  ]
};

// 你的 GitHub 缓存地址
const CACHE_URL = "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/trending.json";

// 从你的 GitHub 获取缓存
async function fetchCachedData() {
  try {
    console.log("正在从 GitHub 加载缓存:", CACHE_URL);

    const response = await Widget.http.get(CACHE_URL);
    if (!response || !response.data) {
      console.error("GitHub 缓存无数据");
      return null;
    }

    console.log("缓存获取成功");
    return response.data;
  } catch (error) {
    console.error("缓存请求失败:", error);
    return null;
  }
}

// 根据官方格式处理数据
function getAnimeByDay(data, day) {
  const weekdaysMap = {
    "星期一": 1,
    "星期二": 2,
    "星期三": 3,
    "星期四": 4,
    "星期五": 5,
    "星期六": 6,
    "星期日": 7
  };

  let weekdayId = null;

  if (day === "today") {
    const jsDay = new Date().getDay(); // 0-6
    weekdayId = jsDay === 0 ? 7 : jsDay; // JS：0=星期日 → 改成 7
  } else {
    weekdayId = weekdaysMap[day];
  }

  const todayBlock = data.find(b => Number(b?.weekday?.id) === weekdayId);

  return todayBlock?.items || [];
}

function formatAnimeList(items) {
  return items.map(item => ({
    id: item.id,
    type: "bangumi",
    title: item.name_cn || item.name,
    description: item.summary || "",
    releaseDate: item.air_date || "",
    posterPath: item.images?.large || "",
    rating: item.rating?.score || 0,
    bangumiUrl: item.url,
    originalTitle: item.name,
    popularity: item.rating?.total || 0
  }));
}

// 每日播出
async function dailySchedule(params) {
  const data = await fetchCachedData();
  if (!data) return [];

  const day = params.day || "today";
  const animeList = getAnimeByDay(data, day);

  return formatAnimeList(animeList);
}

// 近期注目（官方是热度，这里就是所有 item 的汇总）
async function trending() {
  const data = await fetchCachedData();
  if (!data) return [];

  const all = data.flatMap(block => block.items || []);

  return formatAnimeList(all);
}