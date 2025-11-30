WidgetMetadata = {
  id: "forward.bangumi.enriched",
  title: "Bangumi 增强版（含TMDB高清图）",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "使用自定义 enriched.json（含 TMDB）提供横图和竖图的 Bangumi 模块",
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

const ENRICHED_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";

async function fetchEnriched() {
  try {
    console.log("请求 enriched.json:", ENRICHED_URL);

    const response = await Widget.http.get(ENRICHED_URL);
    if (response?.data) return response.data;

    throw new Error("返回数据为空");
  } catch (e) {
    console.error("请求 enriched.json 失败:", e);
    return [];
  }
}

// 优先标题：中文 → 繁体 → 原名 → 英文
function pickTitle(item) {
  const t = item.tmdb;
  return (
    item.name_cn ||
    t?.name_zh ||
    t?.name_cht ||
    t?.original_name ||
    t?.name_en ||
    item.name ||
    "未知标题"
  );
}

function getPoster(item) {
  return item.tmdb?.poster || item.images?.poster || "";
}

function getBackdrop(item) {
  return item.tmdb?.backdrop || "";
}

function formatList(items) {
  return items.map(item => ({
    id: item.id,
    title: pickTitle(item),
    description: item.summary || item.tmdb?.overview || "",
    releaseDate: item.air_date || "",
    posterPath: getPoster(item),
    backdropPath: getBackdrop(item),
    rating: item.tmdb?.vote || item.rating?.score || 0,
    url: item.url
  }));
}

function getAnimeByDay(data, day) {
  const map = {
    "星期一": 1,
    "星期二": 2,
    "星期三": 3,
    "星期四": 4,
    "星期五": 5,
    "星期六": 6,
    "星期日": 7
  };

  let id = null;

  if (day === "today") {
    const js = new Date().getDay(); // 0-6
    id = js === 0 ? 7 : js;
  } else {
    id = map[day];
  }

  return data.find(b => b.weekday?.id == id)?.items || [];
}

// 每日播出
async function dailySchedule(params) {
  const day = params.day || "today";
  const enriched = await fetchEnriched();
  const items = getAnimeByDay(enriched, day);

  return formatList(items);
}

// 近期注目（所有 items 汇总）
async function trending() {
  const enriched = await fetchEnriched();
  const all = enriched.flatMap(b => b.items || []);
  return formatList(all);
}
