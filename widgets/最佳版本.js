/**
 * danmu_api.js
 * 最终冻结版（洁癖级精简，不影响任何功能）
 *
 * 说明：
 * - 搜索标题与显示标题完全分离
 * - 显示逻辑克制，不猜测、不误裁
 * - TV 季数 / 剧场版 / 电影 / 特别篇自动区分
 * - 已达到长期稳定使用状态
 *
 * ⚠️ 除非出现真实错误样本，否则不建议再优化此文件
 */

/* =======================
 * 日志（默认关闭）
 * ======================= */
const LOG_LEVEL = 0; // 0=关闭 1=错误 2=信息 3=调试
const log = (level, ...args) => LOG_LEVEL >= level && console.log(...args);

/* =======================
 * Widget 元数据
 * ======================= */
WidgetMetadata = {
  id: "forward.auto.danmu_api",
  title: "自定义弹幕",
  version: "1.4.0",
  requiredVersion: "0.0.1",
  description: "弹幕接口（最终冻结版）",
  author: "，",
  site: "https://github.com/h05n/ForwardWidgets",
  globalParams: [
    {
      name: "server",
      title: "自定义服务器",
      type: "input",
      placeholders: [{ title: "示例danmu_api", value: "https://{domain}/{token}" }],
    },
  ],
  modules: [
    { id: "searchDanmu", title: "搜索弹幕", functionName: "searchDanmu", type: "danmu", params: [] },
    { id: "getDetail", title: "获取详情", functionName: "getDetailById", type: "danmu", params: [] },
    { id: "getComments", title: "获取弹幕", functionName: "getCommentsById", type: "danmu", params: [] },
  ],
};

/* =======================
 * HTTP 工具
 * ======================= */
async function apiGet(url) {
  const res = await Widget.http.get(url, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "ForwardWidgets/1.4.0",
    },
  });
  if (!res) throw new Error("获取数据失败");
  return typeof res.data === "string" ? JSON.parse(res.data) : res.data;
}

/* =======================
 * 标题公共去噪（基础层）
 * ======================= */
const stripCommonNoise = (t = "") =>
  t.replace(/\(.*?\)|【.*?】|from\s+\w+/gi, "")
   .replace(/\s+/g, " ")
   .trim();

/* =======================
 * 搜索用标题（宽松）
 * ======================= */
const normalizeTitle = t =>
  stripCommonNoise(t)
    .replace(/第\s*[一二三四五六七八九十\d]+\s*季/g, "")
    .replace(/season\s*\d+/i, "")
    .replace(/\d{4}/g, "")
    .trim();

/* =======================
 * 显示用主标题（克制）
 * ======================= */
const simplifyMainTitle = t =>
  stripCommonNoise(t)
    .replace(/第\s*[一二三四五六七八九十\d]+\s*季/g, "")
    .trim();

/* =======================
 * 剧场版 / 电影 / 特别篇判断
 * ======================= */
const EXTRA_TYPES = [
  ["剧场版", /剧场版/],
  ["电影",   /电影|movie/i],
  ["特别篇", /特别篇|\bsp\b/i],
];

const detectExtraType = t =>
  (EXTRA_TYPES.find(([_, r]) => r.test(t || "")) || [])[0] || null;

/* =======================
 * 构造最终显示标题
 * ======================= */
const buildDisplayTitle = (rawTitle, season) => {
  const base = rawTitle && simplifyMainTitle(rawTitle);
  if (!base) return rawTitle || "";

  const extra = detectExtraType(rawTitle);
  if (extra) return `${base} · ${extra}`;

  return !season || season === "1"
    ? base
    : `${base} · 第${season}季`;
};

/* =======================
 * 搜索弹幕
 * ======================= */
async function searchDanmu(params) {
  const { title, season, server } = params;

  const keyword = normalizeTitle(title);
  const data = await apiGet(`${server}/api/v2/search/anime?keyword=${keyword}`);
  if (!data.success) throw new Error(data.errorMessage || "API调用失败");

  const animes = (data.animes || []).map(a => ({
    ...a,
    animeTitle: buildDisplayTitle(a.animeTitle || title, season),
  }));

  return { animes };
}

/* =======================
 * 获取详情
 * ======================= */
async function getDetailById(params) {
  const { server, animeId } = params;
  const data = await apiGet(`${server}/api/v2/bangumi/${animeId}`);
  return data.bangumi.episodes;
}

/* =======================
 * 获取弹幕
 * ======================= */
async function getCommentsById(params) {
  const { server, commentId } = params;
  if (!commentId) return null;
  return apiGet(`${server}/api/v2/comment/${commentId}?withRelated=true&chConvert=1`);
}
