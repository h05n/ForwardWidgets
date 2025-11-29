// Bangumi Widget - 番组计划（优化版）
// 适用于 ForwardWidget 框架
// 功能：搜索番剧、获取在看列表、获取时间表、热门排行

var WidgetMetadata = {
id: “bangumi”,
title: “Bangumi 番组计划”,
description: “番组计划（bgm.tv）动漫追番平台，支持搜索番剧、查看在看列表和每日放送时间表”,
author: “Bangumi Widget Team”,
site: “https://bgm.tv”,
version: “2.0.0”,
requiredVersion: “0.0.1”,
detailCacheDuration: 3600,
modules: [
{
title: “热门番剧”,
description: “获取当前热门的动漫番剧”,
functionName: “getHotAnime”,
cacheDuration: 7200,
params: [
{
name: “page”,
title: “页码”,
type: “page”,
value: “1”,
description: “分页页码”
},
{
name: “sort”,
title: “排序方式”,
type: “enumeration”,
value: “rank”,
description: “选择排序方式”,
enumOptions: [
{ title: “排名”, value: “rank” },
{ title: “评分”, value: “score” },
{ title: “热度”, value: “trend” },
{ title: “最新”, value: “date” }
]
}
]
},
{
title: “每日放送”,
description: “查看每日番剧放送时间表”,
functionName: “getCalendar”,
cacheDuration: 1800,
params: [
{
name: “weekday”,
title: “星期”,
type: “enumeration”,
value: “0”,
description: “选择星期几的放送表”,
enumOptions: [
{ title: “今天”, value: “0” },
{ title: “星期一”, value: “1” },
{ title: “星期二”, value: “2” },
{ title: “星期三”, value: “3” },
{ title: “星期四”, value: “4” },
{ title: “星期五”, value: “5” },
{ title: “星期六”, value: “6” },
{ title: “星期日”, value: “7” }
]
}
]
},
{
title: “在看番剧”,
description: “获取用户正在追的番剧列表”,
functionName: “getUserWatching”,
cacheDuration: 1800,
params: [
{
name: “username”,
title: “用户名”,
type: “input”,
value: “”,
description: “Bangumi 用户名或 ID”
},
{
name: “limit”,
title: “数量限制”,
type: “enumeration”,
value: “30”,
enumOptions: [
{ title: “15条”, value: “15” },
{ title: “30条”, value: “30” },
{ title: “50条”, value: “50” }
]
}
]
},
{
title: “本季新番”,
description: “获取当前季度的新番动画”,
functionName: “getSeasonAnime”,
cacheDuration: 86400,
params: [
{
name: “page”,
title: “页码”,
type: “page”,
value: “1”,
description: “分页页码”
}
]
}
],
search: {
title: “搜索番剧”,
functionName: “searchAnime”,
params: [
{
name: “keyword”,
title: “关键词”,
type: “input”,
value: “”,
description: “搜索番剧名称”
},
{
name: “type”,
title: “类型”,
type: “enumeration”,
value: “2”,
enumOptions: [
{ title: “全部”, value: “” },
{ title: “动画”, value: “2” },
{ title: “书籍”, value: “1” },
{ title: “音乐”, value: “3” },
{ title: “游戏”, value: “4” },
{ title: “真人”, value: “6” }
]
}
]
}
};

// ============ 工具函数 ============

// 标准化图片 URL
function normalizeImageUrl(url) {
if (!url) return “”;
if (url.startsWith(”//”)) return `https:${url}`;
if (url.startsWith(”/”)) return `https://lain.bgm.tv${url}`;
return url;
}

// 获取当前季度
function getCurrentSeason() {
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

let season;
if (month >= 1 && month <= 3) season = 1;      // 冬季
else if (month >= 4 && month <= 6) season = 4;  // 春季
else if (month >= 7 && month <= 9) season = 7;  // 夏季
else season = 10;                               // 秋季

return { year, month: season };
}

// 创建标准返回对象
function createMediaItem(data) {
return {
id: `bangumi.${data.id}`,
type: “url”,
title: data.name_cn || data.name || data.title || “”,
posterPath: normalizeImageUrl(data.images?.large || data.images?.common || data.image || data.posterPath || “”),
backdropPath: normalizeImageUrl(data.images?.large || data.backdropPath || “”),
rating: data.rating?.score?.toString() || data.score?.toString() || data.rating || “”,
releaseDate: data.air_date || data.date || data.releaseDate || “”,
description: data.summary || data.short_summary || data.description || “”,
link: data.url || `https://bgm.tv/subject/${data.id}`,
mediaType: “tv”,
genreTitle: data.type_name || “动画”,
episode: data.eps_count || data.eps || data.episode || 0
};
}

// HTTP 请求封装
async function fetchWithRetry(url, options = {}, retries = 3) {
const defaultHeaders = {
“User-Agent”: “Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36”,
“Accept”: “application/json”,
“Accept-Language”: “zh-CN,zh;q=0.9,en;q=0.8”
};

options.headers = { …defaultHeaders, …options.headers };

for (let i = 0; i < retries; i++) {
try {
const response = await Widget.http.get(url, options);
if (response && response.data) {
return response;
}
} catch (error) {
console.error(`请求失败 (尝试 ${i + 1}/${retries}):`, error);
if (i === retries - 1) throw error;
await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
}
}
throw new Error(“请求失败”);
}

// ============ 主要功能函数 ============

// 搜索番剧
async function searchAnime(params = {}) {
try {
const keyword = (params.keyword || “”).trim();
const type = params.type || “2”;

```
if (!keyword) {
  throw new Error("请输入搜索关键词");
}

console.log(`搜索番剧: ${keyword}, 类型: ${type}`);

// 使用 Bangumi API v0
const apiUrl = `https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}`;
const response = await fetchWithRetry(apiUrl, {
  params: {
    type: type,
    responseGroup: "large",
    max_results: 25
  }
});

if (!response.data || !response.data.list || response.data.list.length === 0) {
  console.log("搜索结果为空");
  return [];
}

return response.data.list.map(item => createMediaItem(item));
```

} catch (error) {
console.error(“搜索失败:”, error.message);
throw new Error(`搜索失败: ${error.message}`);
}
}

// 获取热门番剧
async function getHotAnime(params = {}) {
try {
const page = Math.max(1, parseInt(params.page) || 1);
const sort = params.sort || “rank”;

```
console.log(`获取热门番剧，页码: ${page}, 排序: ${sort}`);

// 使用网页版浏览器
const url = `https://bgm.tv/anime/browser?sort=${sort}&page=${page}`;
const response = await fetchWithRetry(url, {
  headers: {
    "Accept": "text/html"
  }
});

const $ = Widget.html.load(response.data);
const items = [];

// 解析列表项
$('#browserItemList li.item').each((i, elem) => {
  try {
    const $item = $(elem);
    const $link = $item.find('a.subjectCover');
    const href = $link.attr('href') || '';
    const match = href.match(/\/subject\/(\d+)/);
    
    if (!match) return;
    
    const id = match[1];
    const title = $item.find('.l').text().trim() || $link.attr('title') || '';
    const $img = $link.find('img');
    const poster = $img.attr('src') || $img.attr('data-src') || '';
    const rating = $item.find('.fade').text().trim().replace(/[^0-9.]/g, '');
    const info = $item.find('.info.tip').text().trim();
    
    items.push(createMediaItem({
      id: id,
      name_cn: title,
      images: { large: poster },
      rating: { score: rating ? parseFloat(rating) : 0 },
      summary: info,
      url: `https://bgm.tv${href}`
    }));
  } catch (err) {
    console.error("解析项目失败:", err);
  }
});

if (items.length === 0) {
  console.log("未找到番剧数据");
}

return items;
```

} catch (error) {
console.error(“获取热门番剧失败:”, error.message);
throw new Error(`获取热门番剧失败: ${error.message}`);
}
}

// 获取每日放送时间表
async function getCalendar(params = {}) {
try {
let weekday = parseInt(params.weekday) || 0;

```
// 如果是今天，计算实际星期几（1-7）
if (weekday === 0) {
  const today = new Date();
  weekday = today.getDay() || 7; // 0 (周日) 转为 7
}

console.log(`获取星期 ${weekday} 的放送表`);

// 使用 Bangumi API
const response = await fetchWithRetry("https://api.bgm.tv/calendar");

if (!response.data || !Array.isArray(response.data)) {
  throw new Error("获取放送表数据失败");
}

// 找到对应星期的数据
const dayData = response.data.find(day => day.weekday?.id === weekday);

if (!dayData || !dayData.items || dayData.items.length === 0) {
  console.log(`星期 ${weekday} 没有放送数据`);
  return [];
}

return dayData.items.map(item => {
  const airTime = item.air_weekday ? `每周${['日', '一', '二', '三', '四', '五', '六'][item.air_weekday % 7]}` : '';
  return createMediaItem({
    ...item,
    summary: item.summary || `${airTime} 放送中`,
    episode: item.eps_count
  });
});
```

} catch (error) {
console.error(“获取放送表失败:”, error.message);
throw new Error(`获取放送表失败: ${error.message}`);
}
}

// 获取用户在看的番剧
async function getUserWatching(params = {}) {
try {
const username = (params.username || “”).trim();
const limit = Math.min(50, parseInt(params.limit) || 30);

```
if (!username) {
  throw new Error("请输入 Bangumi 用户名");
}

console.log(`获取用户 ${username} 的在看列表，限制: ${limit}`);

// 使用 API v0
const url = `https://api.bgm.tv/user/${encodeURIComponent(username)}/collection`;
const response = await fetchWithRetry(url, {
  params: {
    cat: "watching",
    max_results: limit
  }
});

if (!response.data || !Array.isArray(response.data)) {
  throw new Error("获取用户数据失败或用户不存在");
}

const items = response.data
  .filter(item => item.subject && item.subject.id)
  .map(item => {
    const subject = item.subject;
    const progress = item.ep_status ? `进度: ${item.ep_status}` : '';
    
    return createMediaItem({
      ...subject,
      name_cn: subject.name_cn || subject.name,
      summary: `${subject.summary || ''} ${progress}`.trim(),
      episode: subject.eps
    });
  });

return items;
```

} catch (error) {
console.error(“获取用户在看列表失败:”, error.message);
throw new Error(`获取用户在看列表失败: ${error.message}`);
}
}

// 获取本季新番
async function getSeasonAnime(params = {}) {
try {
const page = Math.max(1, parseInt(params.page) || 1);
const { year, month } = getCurrentSeason();

```
console.log(`获取 ${year}年${month}月 新番，页码: ${page}`);

// 使用网页版标签页
const url = `https://bgm.tv/anime/tag/${year}年${month}月?page=${page}`;
const response = await fetchWithRetry(url, {
  headers: {
    "Accept": "text/html"
  }
});

const $ = Widget.html.load(response.data);
const items = [];

// 解析列表
$('#browserItemList li.item, .item_list .item').each((i, elem) => {
  try {
    const $item = $(elem);
    const $link = $item.find('a.subjectCover, a.cover');
    const href = $link.attr('href') || '';
    const match = href.match(/\/subject\/(\d+)/);
    
    if (!match) return;
    
    const id = match[1];
    const title = $item.find('.l, h3 a').text().trim();
    const $img = $link.find('img');
    const poster = $img.attr('src') || $img.attr('data-src') || '';
    const rating = $item.find('.fade, .rank').text().trim().replace(/[^0-9.]/g, '');
    const info = $item.find('.info, .tip').text().trim();
    
    items.push(createMediaItem({
      id: id,
      name_cn: title,
      images: { large: poster },
      rating: { score: rating ? parseFloat(rating) : 0 },
      summary: info || `${year}年${month}月新番`,
      url: `https://bgm.tv${href}`
    }));
  } catch (err) {
    console.error("解析新番项目失败:", err);
  }
});

return items;
```

} catch (error) {
console.error(“获取本季新番失败:”, error.message);
throw new Error(`获取本季新番失败: ${error.message}`);
}
}

// 加载详情页
async function loadDetail(link) {
try {
console.log(`加载详情: ${link}`);

```
const response = await fetchWithRetry(link, {
  headers: {
    "Accept": "text/html"
  }
});

const $ = Widget.html.load(response.data);

// 提取详细信息
const summary = $('#subject_summary').text().trim() || $('.subject_summary').text().trim();
const staff = [];

// 提取制作人员
$('.data.box .content ul.browserCoverMedium li').each((i, elem) => {
  const $li = $(elem);
  const name = $li.find('.l').text().trim();
  const role = $li.find('.tip').text().trim();
  if (name) staff.push(`${role}: ${name}`);
});

// 提取评分详情
const ratingCount = $('.global_score .number').text().trim();
const rank = $('.global_score .chart_rank_wrap .number').text().trim();

return {
  description: summary,
  staff: staff.join('\n'),
  ratingCount: ratingCount,
  rank: rank,
  videoUrl: "" // Bangumi 不提供直接播放链接
};
```

} catch (error) {
console.error(“加载详情失败:”, error.message);
return {
description: “加载详情失败”,
error: error.message
};
}
}
