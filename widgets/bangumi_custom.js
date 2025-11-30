// ===============================
// h05n 专用 Bangumi 模块（ForwardWidgets 标准格式）
// 使用你的 GitHub 缓存文件
// ===============================

WidgetMetadata = {
  id: "forward.bangumi.custom",
  title: "Bangumi（缓存版）",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "从 GitHub 缓存读取 Bangumi 数据，加速稳定",
  author: "h05n",
  site: "https://github.com/h05n/forward-bangumi-cache",
  modules: [
    {
      id: "dailySchedule",
      title: "每日番剧更新",
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
      title: "番剧总览（缓存）",
      functionName: "trending",
      params: []
    }
  ]
};

// ===============================
// 你的缓存地址
// ===============================

const ENRICHED_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";

const TRENDING_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/trending.json";

// ===============================
// 载入 enriched.json（用于每日番剧）
// ===============================
async function fetchEnriched() {
  const res = await Widget.http.get(ENRICHED_URL);
  return res.data || [];
}

// ===============================
// 载入 trending.json（用于总览）
// ===============================
async function fetchTrending() {
  const res = await Widget.http.get(TRENDING_URL);
  return res.data || [];
}

// ===============================
// 获取星期
// ===============================
function getToday() {
  let d = new Date().getDay();
  return d === 0 ? 7 : d;
}

// ===============================
// Forward 模块：每日番剧
// ===============================
async function dailySchedule(params) {
  const data = await fetchEnriched();

  const targetDay = params.day === "today"
    ? getToday()
    : Number(params.day);

  const obj = data.find((d) => Number(d.weekday?.id) === targetDay);

  return obj?.items || [];
}

// ===============================
// Forward 模块：番剧总览
// ===============================
async function trending() {
  const data = await fetchTrending();

  // 合并所有星期
  let out = [];
  data.forEach((day) => {
    if (day.items) out = out.concat(day.items);
  });

  return out;
}