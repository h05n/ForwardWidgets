/**
 * Forward Bangumi Module - 缓存版
 * 结构完全参照官方 bangumi.js
 */

const TRENDING_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/trending.json";

const ENRICHED_URL =
  "https://raw.githubusercontent.com/h05n/forward-bangumi-cache/main/datas/enriched.json";

/** 通用 JSON 请求 */
async function getJSON(url) {
  try {
    const res = await request({
      url,
      method: "GET",
      allow_redirections: true
    });
    return JSON.parse(res.data);
  } catch (err) {
    console.error("数据加载失败:", err);
    return null;
  }
}

module.exports = {
  version: 1,
  name: "Bangumi（缓存版）",
  icon: "tv",

  async run() {
    console.log("Bangumi 缓存版模块启动");

    /** 1. 加载 trending.json */
    const trending = await getJSON(TRENDING_URL);

    /** 2. 加载 enriched.json */
    const enriched = await getJSON(ENRICHED_URL);

    if (!trending || !enriched) {
      return {
        title: "Bangumi（缓存）",
        content: "❌ 无法加载缓存文件"
      };
    }

    console.log("trending.json:", trending.length);
    console.log("enriched.json:", enriched.length);

    /** 3. 获取今天星期几（与官方一致） */
    let weekday = new Date().getDay();
    weekday = weekday === 0 ? 7 : weekday; // 星期天修正为 7

    /** trending.json 结构：[{ weekday: { id }, items: [] }] */
    const todayData = trending.find(
      (d) => Number(d.weekday?.id) === weekday
    );

    if (!todayData) {
      return {
        title: "Bangumi（缓存）",
        content: "📭 今天无番剧更新"
      };
    }

    const items = todayData.items.map((item) => {
      const extra = enriched.find((e) => e.id === item.id);

      // 横图优先
      const cover =
        extra?.horizontal_image ||
        item.images?.common ||
        item.images?.large ||
        "";

      return {
        title: item.name_cn || item.name,
        description: item.summary || "",
        image: cover,
        link: item.url,
        badge: item.rating?.score
          ? `⭐ ${item.rating.score}`
          : "暂无评分"
      };
    });

    return {
      title: `今日更新 · ${todayData.weekday.cn}`,
      content: items
    };
  }
};
