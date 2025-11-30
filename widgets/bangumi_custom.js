// 🍀 h05n 专用 Forward Bangumi 模块（缓存版本）
// 基于：InchStudio / ForwardWidgets 官方源码修改
// 修改点：API 请求替换为 GitHub 缓存

export const name = "bangumi";
export const version = "1.0.0";

const CACHE_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";

// Forward 小组件接口
export async function load() {
  console.log("[Bangumi Cached] Loading…");

  // 🍀 使用缓存 JSON 数据替代 bgm.tv.calendar API
  const res = await fetch(CACHE_URL);

  if (!res.ok) {
    throw new Error(`❌ Failed to load cache: ${res.status}`);
  }

  const calendar = await res.json();

  // 🍀 calendar 的结构与 ForwardWidgets 官方接口保持一致
  // enriched.json 内容：
  // [
  //   {
  //     "weekday": "Mon",
  //     "itemsCount": 5,
  //     "items": [ {bangumi item}, ... ]
  //   },
  //   ...
  // ]

  // ForwardWidgets 所需输出格式
  let output = [];

  for (const day of calendar) {
    for (const item of day.items) {
      output.push({
        title: item.name || item.name_cn,
        cover: item.images?.large || item.images?.common,
        weekday: day.weekday,
        air_date: item.air_date,
        summary: item.summary,
      });
    }
  }

  console.log("[Bangumi Cached] Loaded successfully");

  return {
    updated: new Date().toISOString(),
    total: output.length,
    items: output,
  };
}
