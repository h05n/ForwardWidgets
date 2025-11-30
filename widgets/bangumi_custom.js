/*
 * Forward 官方 Bangumi 模块（自定义缓存版）
 * 完全基于官方模块结构，仅替换数据源为你的 GitHub 缓存
 */

WidgetMetadata = {
  id: "forward.bangumi.custom",
  title: "Bangumi 自定义缓存",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用你的 GitHub enriched 缓存加载 Bangumi 番剧数据",
  author: "h05n",
  site: "https://github.com/h05n",
  modules: [
    {
      id: "dailySchedule",
      title: "每日放送（缓存）",
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
            { title: "星期日", value: "7" }
          ]
        }
      ]
    },
    {
      id: "trending",
      title: "全部番剧（缓存）",
      functionName: "trending",
      params: []
    }
  ]
};

// -----------------------------
// 1) 自定义缓存加载
// -----------------------------

const CACHE_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";

// 加载你的 enriched.json
async function fetchBangumiData() {
  console.log("加载你的缓存：", CACHE_URL);

  try {
    const response = await Widget.http.get(CACHE_URL + `?t=${Date.now()}`, {
      timeout: 15000
    });

    if (!response || !response.data) {
      throw new Error("缓存为空或格式错误");
    }

    console.log("自定义缓存加载成功");
    return response.data;
  } catch (err) {
    console.error("加载你的缓存失败：", err.message);

    // 返回空结构（避免 Forward 崩溃）
    return [];
  }
}

// -----------------------------
// 2) 根据 weekday 获取番剧
// -----------------------------
function getAnimeByDay(data, day) {
  if (!Array.isArray(data)) return [];

  let weekday = day;

  if (day === "today") {
    const now = new Date();
    weekday = now.getDay(); // 星期日=0
    if (weekday === 0) weekday = 7;
  }

  const block = data.find(d => (d.weekday?.en || d.weekday) == weekday);
  return block ? block.items || [] : [];
}

// -----------------------------
// 3) 统一格式化（官方结构）
// -----------------------------
function formatAnimeData(list) {
  return list.map(item => ({
    id: item.id,
    type: "bangumi",
    title: item.name_cn || item.name,
    description: item.summary || "",
    bangumiUrl: item.url,
    releaseDate: item.air_date || "",
    posterPath:
      item.images?.tmdb_poster ||
      item.images?.bangumi ||
      "",
    backdropPath: item.images?.tmdb_backdrop || "",
    rating: item.tmdb?.vote || item.rating?.score || 0,
    mediaType: "tv",
    popularity: item.tmdb?.popularity || 0
  }));
}

// -----------------------------
// 4) 模块：每日放送
// -----------------------------
async function dailySchedule(params) {
  const data = await fetchBangumiData();
  const day = params.day || "today";
  const list = getAnimeByDay(data, day);
  return formatAnimeData(list);
}

// -----------------------------
// 5) 模块：全部番剧
// -----------------------------
async function trending() {
  const data = await fetchBangumiData();

  // 扁平化所有日期
  const list = data.flatMap(d => d.items);
  return formatAnimeData(list);
}
