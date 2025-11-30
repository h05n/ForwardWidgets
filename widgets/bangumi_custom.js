/**
 * Forward - Bangumi 自定义缓存版
 * 作者：h05n（基于官方模块修改）
 * 数据来源：你的 GitHub enriched.json
 */

const CACHE_URL = "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";

async function fetchData() {
  const res = await fetch(CACHE_URL, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error("无法加载你的缓存数据");
  }
  return await res.json();
}

function createItemView(item) {
  // 竖图：优先 TMDB poster，没有则使用 bangumi 图片
  const poster =
    item.images?.poster ||
    item.images?.large ||
    item.images?.common ||
    "";

  // 横图：来自 tmdb backdrop
  const backdrop = item.images?.backdrop || "";

  return {
    title: item.name_cn || item.name,
    subtitle: `放送日期：${item.air_date || "未知"}`,
    image: poster,
    banner: backdrop,
    url: item.url,
    summary: item.summary || "",
    rating: item.rating?.score || 0,
  };
}

export default {
  name: "Bangumi 番剧时间表（自定义缓存）",
  version: "1.0.0",
  author: "h05n",

  async onLoad() {
    try {
      const data = await fetchData();

      // 官方模块是按 weekday 生成 section 列表
      const sections = data.map(day => ({
        title: day.weekday?.cn || day.weekday?.en || "",
        items: day.items.map(createItemView)
      }));

      return {
        type: "list",
        sections
      };
    } catch (err) {
      return {
        type: "error",
        message: err.message || "加载失败"
      };
    }
  }
};
