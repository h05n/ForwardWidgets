var WidgetMetadata = {
id: “bangumi_anime”,
title: “Bangumi 番组计划”,
description: “浏览 Bangumi 番组计划上的动画信息”,
author: “Claude”,
site: “https://bgm.tv”,
version: “1.0.0”,
requiredVersion: “0.0.1”,
detailCacheDuration: 300,
modules: [
{
title: “每日放送”,
description: “获取每日放送的动画列表”,
requiresWebView: false,
functionName: “getCalendar”,
sectionMode: true,
cacheDuration: 1800,
params: [
{
name: “weekday”,
title: “星期”,
type: “enumeration”,
description: “选择星期几”,
value: “all”,
enumOptions: [
{ title: “全部”, value: “all” },
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
title: “排行榜”,
description: “浏览 Bangumi 动画排行榜”,
requiresWebView: false,
functionName: “getRanking”,
sectionMode: false,
cacheDuration: 3600,
params: [
{
name: “type”,
title: “类型”,
type: “enumeration”,
description: “排行榜类型”,
value: “rank”,
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
description: “页码”,
value: 1
}
]
},
{
title: “标签搜索”,
description: “根据标签搜索动画”,
requiresWebView: false,
functionName: “searchByTag”,
sectionMode: false,
cacheDuration: 1800,
params: [
{
name: “tag”,
title: “标签”,
type: “input”,
description: “输入标签名称”,
value: “”
},
{
name: “page”,
title: “页码”,
type: “page”,
description: “页码”,
value: 1
}
]
},
{
title: “在放送”,
description: “获取正在放送的动画”,
requiresWebView: false,
functionName: “getOnAir”,
sectionMode: false,
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
description: “输入搜索关键词”,
value: “”
},
{
name: “page”,
title: “页码”,
type: “page”,
description: “页码”,
value: 1
}
]
}
};

// 通用请求头
const commonHeaders = {
“User-Agent”: “Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36”,
“Accept”: “text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8”,
“Accept-Language”: “zh-CN,zh;q=0.9,en;q=0.8”
};

// 解析条目信息
function parseSubjectItem($, element) {
try {
const $item = $(element);
const link = $item.find(“a.subjectCover”).attr(“href”) || “”;
const id = link.match(//subject/(\d+)/)?.[1] || “”;

```
const title = $item.find("h3 a.l, .info_title a").first().text().trim();
const coverUrl = $item.find("img.cover").attr("src") || "";
const rating = $item.find(".fade").text().trim() || "N/A";

// 获取描述信息
let description = "";
const infoText = $item.find(".info, .info_tip").text().trim();
if (infoText) {
  description = infoText;
}

// 获取标签
let genreTitle = "";
const tags = [];
$item.find(".tag").each((i, tag) => {
  tags.push($(tag).text().trim());
});
if (tags.length > 0) {
  genreTitle = tags.join(" / ");
}

return {
  id: `url.bgm.tv/subject/${id}`,
  type: "url",
  title: title,
  posterPath: coverUrl.startsWith("//") ? "https:" + coverUrl : coverUrl,
  rating: rating,
  genreTitle: genreTitle,
  description: description,
  link: `https://bgm.tv${link}`,
  mediaType: "tv"
};
```

} catch (error) {
console.error(“解析条目失败:”, error);
return null;
}
}

// 每日放送
async function getCalendar(params = {}) {
try {
const url = “https://bgm.tv/calendar”;
const response = await Widget.http.get(url, {
headers: commonHeaders
});

```
const $ = Widget.html.load(response.data);
const results = [];

if (params.weekday === "all") {
  // 获取所有星期的数据
  $(".calendar").each((i, calendar) => {
    const dayTitle = $(calendar).find(".headerWeek").text().trim();
    const items = [];
    
    $(calendar).find(".item").each((j, item) => {
      const parsed = parseSubjectItem($, item);
      if (parsed) {
        items.push(parsed);
      }
    });
    
    if (items.length > 0) {
      results.push({
        title: dayTitle,
        items: items
      });
    }
  });
  return results;
} else {
  // 获取指定星期的数据
  const weekdayIndex = parseInt(params.weekday) - 1;
  const calendar = $(".calendar").eq(weekdayIndex);
  
  calendar.find(".item").each((i, item) => {
    const parsed = parseSubjectItem($, item);
    if (parsed) {
      results.push(parsed);
    }
  });
  
  return results;
}
```

} catch (error) {
console.error(“获取每日放送失败:”, error);
throw error;
}
}

// 排行榜
async function getRanking(params = {}) {
try {
const { type = “rank”, page = 1 } = params;
const url = `https://bgm.tv/anime/browser?sort=${type}&page=${page}`;

```
const response = await Widget.http.get(url, {
  headers: commonHeaders
});

const $ = Widget.html.load(response.data);
const results = [];

$("#browserItemList li.item").each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
    // 添加排名信息
    const rank = $(item).find(".rank").text().trim();
    if (rank) {
      parsed.description = `排名: ${rank}\n${parsed.description}`;
    }
    results.push(parsed);
  }
});

return results;
```

} catch (error) {
console.error(“获取排行榜失败:”, error);
throw error;
}
}

// 标签搜索
async function searchByTag(params = {}) {
try {
const { tag = “”, page = 1 } = params;

```
if (!tag) {
  throw new Error("请输入标签名称");
}

const url = `https://bgm.tv/anime/tag/${encodeURIComponent(tag)}?page=${page}`;

const response = await Widget.http.get(url, {
  headers: commonHeaders
});

const $ = Widget.html.load(response.data);
const results = [];

$("#browserItemList li.item").each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
    results.push(parsed);
  }
});

return results;
```

} catch (error) {
console.error(“标签搜索失败:”, error);
throw error;
}
}

// 在放送
async function getOnAir(params = {}) {
try {
const url = “https://bgm.tv/anime/browser/airtime/0”;

```
const response = await Widget.http.get(url, {
  headers: commonHeaders
});

const $ = Widget.html.load(response.data);
const results = [];

$("#browserItemList li.item").each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
    results.push(parsed);
  }
});

return results;
```

} catch (error) {
console.error(“获取在放送失败:”, error);
throw error;
}
}

// 搜索
async function search(params = {}) {
try {
const { keyword = “”, page = 1 } = params;

```
if (!keyword) {
  throw new Error("请输入搜索关键词");
}

const url = `https://bgm.tv/subject_search/${encodeURIComponent(keyword)}?cat=2&page=${page}`;

const response = await Widget.http.get(url, {
  headers: commonHeaders
});

const $ = Widget.html.load(response.data);
const results = [];

$("#browserItemList li.item").each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
    results.push(parsed);
  }
});

return results;
```

} catch (error) {
console.error(“搜索失败:”, error);
throw error;
}
}

// 加载详情（如果需要播放地址）
async function loadDetail(link) {
try {
const response = await Widget.http.get(link, {
headers: commonHeaders
});

```
const $ = Widget.html.load(response.data);

// 这里可以解析更多详情信息
// Bangumi 主要是信息站，不提供播放地址
// 可以返回更详细的信息

return {
  videoUrl: link // 返回详情页链接
};
```

} catch (error) {
console.error(“加载详情失败:”, error);
throw error;
}
}
