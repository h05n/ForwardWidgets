// Bangumi 番组计划 ForwardWidget 模块
// 作者: Claude
// 版本: 1.0.2
// 网站: https://bgm.tv

WidgetMetadata = {
id: “bangumi”,
title: “Bangumi 番组计划”,
version: “1.0.2”,
requiredVersion: “0.0.1”,
description: “浏览 Bangumi 番组计划上的动画信息”,
author: “Claude”,
site: “https://bgm.tv”,
detailCacheDuration: 300,
modules: [
{
id: “calendar”,
title: “每日放送”,
description: “查看每日更新的动画”,
functionName: “getCalendar”,
cacheDuration: 1800,
params: [
{
name: “weekday”,
title: “星期”,
type: “enumeration”,
value: “0”,
description: “选择星期”,
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
id: “ranking”,
title: “排行榜”,
description: “浏览动画排行榜”,
functionName: “getRanking”,
cacheDuration: 3600,
params: [
{
name: “type”,
title: “排序”,
type: “enumeration”,
value: “rank”,
description: “排序方式”,
enumOptions: [
{ title: “排名”, value: “rank” },
{ title: “评分”, value: “rate” },
{ title: “热度”, value: “trend” }
]
},
{
name: “page”,
title: “页码”,
type: “page”,
value: 1,
description: “页码”
}
]
},
{
id: “tagSearch”,
title: “标签搜索”,
description: “根据标签搜索”,
functionName: “searchByTag”,
cacheDuration: 1800,
params: [
{
name: “tag”,
title: “标签”,
type: “input”,
value: “”,
description: “输入标签”
},
{
name: “page”,
title: “页码”,
type: “page”,
value: 1
}
]
},
{
id: “onAir”,
title: “正在放送”,
description: “当前播出的动画”,
functionName: “getOnAir”,
cacheDuration: 3600,
params: []
}
],
search: {
title: “搜索”,
functionName: “search”,
params: [
{
name: “keyword”,
title: “关键词”,
type: “input”,
value: “”,
description: “输入关键词”
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
{ title: “游戏”, value: “4” }
]
}
]
}
};

// 每日放送 - 使用 API
async function getCalendar(params) {
try {
let weekday = parseInt(params.weekday) || 0;

```
// 如果是今天，计算实际星期几
if (weekday === 0) {
  const today = new Date();
  weekday = today.getDay() || 7;
}

console.log("获取星期 " + weekday + " 的放送表");

// 使用 Bangumi API
const response = await Widget.http.get("https://api.bgm.tv/calendar", {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json"
  }
});

if (!response.data || !Array.isArray(response.data)) {
  return [];
}

// 找到对应星期的数据
const dayData = response.data.find(function(day) {
  return day.weekday && day.weekday.id === weekday;
});

if (!dayData || !dayData.items) {
  return [];
}

return dayData.items.map(function(item) {
  return {
    id: "bangumi." + item.id,
    type: "url",
    title: item.name_cn || item.name,
    posterPath: (item.images && item.images.large) || (item.images && item.images.common) || "",
    backdropPath: (item.images && item.images.large) || "",
    rating: (item.rating && item.rating.score) ? item.rating.score.toString() : "",
    releaseDate: item.air_date || "",
    description: item.summary || "",
    link: "https://bgm.tv/subject/" + item.id,
    mediaType: "tv",
    genreTitle: "动画",
    episode: item.eps_count || 0
  };
});
```

} catch (error) {
console.error(“获取放送表失败:”, error);
throw error;
}
}

// 排行榜 - 使用网页爬取
async function getRanking(params) {
try {
const type = params.type || “rank”;
const page = parseInt(params.page) || 1;

```
console.log("获取排行榜，类型: " + type + ", 页码: " + page);

const url = "https://bgm.tv/anime/browser?sort=" + type + "&page=" + page;

const response = await Widget.http.get(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html"
  }
});

const $ = Widget.html.load(response.data);
const items = [];

$('#browserItemList li.item').each(function(i, elem) {
  const $item = $(elem);
  const $link = $item.find('.subjectCover');
  const href = $link.attr('href') || '';
  const match = href.match(/\/subject\/(\d+)/);
  
  if (!match) return;
  
  const id = match[1];
  const title = $item.find('.l').text().trim();
  const poster = $link.find('img').attr('src') || '';
  const rating = $item.find('.fade').text().trim();
  const desc = $item.find('.info').text().trim();

  items.push({
    id: "bangumi." + id,
    type: "url",
    title: title,
    posterPath: poster.indexOf('//') === 0 ? "https:" + poster : poster,
    backdropPath: poster.indexOf('//') === 0 ? "https:" + poster : poster,
    rating: rating,
    description: desc,
    link: "https://bgm.tv" + href,
    mediaType: "tv",
    genreTitle: "动画"
  });
});

return items;
```

} catch (error) {
console.error(“获取排行榜失败:”, error);
throw error;
}
}

// 标签搜索 - 使用网页爬取
async function searchByTag(params) {
try {
const tag = params.tag || “”;
const page = parseInt(params.page) || 1;

```
if (!tag) {
  throw new Error("请输入标签");
}

console.log("标签搜索: " + tag + ", 页码: " + page);

const url = "https://bgm.tv/anime/tag/" + encodeURIComponent(tag) + "?page=" + page;

const response = await Widget.http.get(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html"
  }
});

const $ = Widget.html.load(response.data);
const items = [];

$('#browserItemList li.item').each(function(i, elem) {
  const $item = $(elem);
  const $link = $item.find('.subjectCover');
  const href = $link.attr('href') || '';
  const match = href.match(/\/subject\/(\d+)/);
  
  if (!match) return;
  
  const id = match[1];
  const title = $item.find('.l').text().trim();
  const poster = $link.find('img').attr('src') || '';
  const rating = $item.find('.fade').text().trim();
  const desc = $item.find('.info').text().trim();

  items.push({
    id: "bangumi." + id,
    type: "url",
    title: title,
    posterPath: poster.indexOf('//') === 0 ? "https:" + poster : poster,
    backdropPath: poster.indexOf('//') === 0 ? "https:" + poster : poster,
    rating: rating,
    description: desc,
    link: "https://bgm.tv" + href,
    mediaType: "tv",
    genreTitle: "动画"
  });
});

return items;
```

} catch (error) {
console.error(“标签搜索失败:”, error);
throw error;
}
}

// 正在放送 - 使用网页爬取
async function getOnAir(params) {
try {
console.log(“获取正在放送的动画”);

```
const url = "https://bgm.tv/anime/browser/airtime/0";

const response = await Widget.http.get(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html"
  }
});

const $ = Widget.html.load(response.data);
const items = [];

$('#browserItemList li.item').each(function(i, elem) {
  const $item = $(elem);
  const $link = $item.find('.subjectCover');
  const href = $link.attr('href') || '';
  const match = href.match(/\/subject\/(\d+)/);
  
  if (!match) return;
  
  const id = match[1];
  const title = $item.find('.l').text().trim();
  const poster = $link.find('img').attr('src') || '';
  const rating = $item.find('.fade').text().trim();
  const desc = $item.find('.info').text().trim();

  items.push({
    id: "bangumi." + id,
    type: "url",
    title: title,
    posterPath: poster.indexOf('//') === 0 ? "https:" + poster : poster,
    backdropPath: poster.indexOf('//') === 0 ? "https:" + poster : poster,
    rating: rating,
    description: desc,
    link: "https://bgm.tv" + href,
    mediaType: "tv",
    genreTitle: "动画"
  });
});

return items;
```

} catch (error) {
console.error(“获取正在放送失败:”, error);
throw error;
}
}

// 搜索 - 使用 API
async function search(params) {
try {
const keyword = params.keyword || “”;
const type = params.type || “2”;

```
if (!keyword) {
  throw new Error("请输入搜索关键词");
}

console.log("搜索番剧: " + keyword + ", 类型: " + type);

// 使用 Bangumi API
const apiUrl = "https://api.bgm.tv/search/subject/" + encodeURIComponent(keyword);
const response = await Widget.http.get(apiUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json"
  },
  params: {
    type: type,
    responseGroup: "large"
  }
});

if (!response.data || !response.data.list) {
  return [];
}

return response.data.list.map(function(item) {
  return {
    id: "bangumi." + item.id,
    type: "url",
    title: item.name_cn || item.name,
    posterPath: (item.images && item.images.large) || (item.images && item.images.common) || "",
    backdropPath: (item.images && item.images.large) || "",
    rating: (item.rating && item.rating.score) ? item.rating.score.toString() : "",
    releaseDate: item.air_date || "",
    description: item.summary || "",
    link: "https://bgm.tv/subject/" + item.id,
    mediaType: type === "2" ? "tv" : "movie",
    genreTitle: "动画"
  };
});
```

} catch (error) {
console.error(“搜索失败:”, error);
throw error;
}
}

// 加载详情
async function loadDetail(link) {
try {
console.log(“加载详情: “ + link);

```
const response = await Widget.http.get(link, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
});

const $ = Widget.html.load(response.data);

const videoUrl = $('iframe[src*="player"]').attr('src') || "";

return {
  videoUrl: videoUrl || link,
  description: $('.subject_summary').text().trim()
};
```

} catch (error) {
console.error(“加载详情失败:”, error);
return {
videoUrl: link
};
}
}
