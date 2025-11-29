/**

- Bangumi 番组计划 ForwardWidget 模块
- 作者: Claude
- 版本: 2.0.0
- 网站: https://bgm.tv
  */

var WidgetMetadata = {
id: “bangumi_enhanced”,
title: “Bangumi 番组计划”,
description: “浏览 Bangumi 番组计划上的动画信息”,
author: “Claude”,
site: “https://bgm.tv”,
version: “2.0.0”,
requiredVersion: “0.0.1”,
detailCacheDuration: 300,
modules: [
{
title: “每日放送”,
description: “查看每日更新的动画”,
requiresWebView: false,
functionName: “getCalendar”,
sectionMode: true,
cacheDuration: 1800,
params: [
{
name: “weekday”,
title: “星期”,
type: “enumeration”,
description: “选择星期”,
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
description: “浏览动画排行榜”,
requiresWebView: false,
functionName: “getRanking”,
sectionMode: false,
cacheDuration: 3600,
params: [
{
name: “type”,
title: “排序”,
type: “enumeration”,
description: “排序方式”,
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
description: “根据标签搜索”,
requiresWebView: false,
functionName: “searchByTag”,
sectionMode: false,
cacheDuration: 1800,
params: [
{
name: “tag”,
title: “标签”,
type: “input”,
description: “输入标签”,
value: “”
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
title: “正在放送”,
description: “当前播出的动画”,
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
description: “输入关键词”,
value: “”
},
{
name: “page”,
title: “页码”,
type: “page”,
value: 1
}
]
}
};

// 通用请求头
var commonHeaders = {
“User-Agent”: “Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36”,
“Accept”: “text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8”,
“Accept-Language”: “zh-CN,zh;q=0.9”
};

// 解析条目信息
function parseItem($, element) {
try {
var item = $(element);

```
// 获取链接
var link = item.find("a.subjectCover").attr("href") || item.find("a.l").attr("href") || "";
var match = link.match(/\/subject\/(\d+)/);
if (!match) {
  return null;
}
var id = match[1];

// 获取标题
var title = item.find("h3 a.l").text().trim() || 
            item.find(".info_title a").text().trim() || 
            item.find("a.l").text().trim() || "";

// 获取封面
var cover = item.find("img.cover").attr("src") || item.find("img").attr("src") || "";
if (cover.indexOf("//") === 0) {
  cover = "https:" + cover;
}

// 获取评分
var rating = item.find(".fade").text().trim() || 
             item.find(".rating_num").text().trim() || "N/A";

// 获取描述
var desc = item.find(".info").text().trim() || 
           item.find(".info_tip").text().trim() || "";

// 获取标签
var tags = [];
item.find(".tag").each(function(i, tag) {
  var t = $(tag).text().trim();
  if (t) {
    tags.push(t);
  }
});
var genre = tags.join(" / ");

return {
  id: "url.bgm.tv/subject/" + id,
  type: "url",
  title: title,
  posterPath: cover,
  rating: rating,
  genreTitle: genre,
  description: desc,
  link: "https://bgm.tv" + link,
  mediaType: "tv"
};
```

} catch (e) {
console.error(“解析失败:”, e);
return null;
}
}

// 每日放送
async function getCalendar(params) {
try {
var weekday = params.weekday || “all”;
var url = “https://bgm.tv/calendar”;

```
var response = await Widget.http.get(url, {
  headers: commonHeaders
});

var $ = Widget.html.load(response.data);

if (weekday === "all") {
  // 返回分组数据
  var sections = [];
  
  $(".calendar").each(function(i, cal) {
    var dayTitle = $(cal).find(".headerWeek").text().trim();
    var items = [];
    
    $(cal).find(".item").each(function(j, item) {
      var parsed = parseItem($, item);
      if (parsed) {
        items.push(parsed);
      }
    });
    
    if (items.length > 0) {
      sections.push({
        title: dayTitle,
        items: items
      });
    }
  });
  
  return sections;
} else {
  // 返回单日数据
  var index = parseInt(weekday) - 1;
  var items = [];
  
  $(".calendar").eq(index).find(".item").each(function(i, item) {
    var parsed = parseItem($, item);
    if (parsed) {
      items.push(parsed);
    }
  });
  
  return items;
}
```

} catch (e) {
console.error(“获取每日放送失败:”, e);
throw e;
}
}

// 排行榜
async function getRanking(params) {
try {
var type = params.type || “rank”;
var page = params.page || 1;
var url = “https://bgm.tv/anime/browser?sort=” + type + “&page=” + page;

```
var response = await Widget.http.get(url, {
  headers: commonHeaders
});

var $ = Widget.html.load(response.data);
var items = [];

$("#browserItemList li.item").each(function(i, item) {
  var parsed = parseItem($, item);
  if (parsed) {
    items.push(parsed);
  }
});

return items;
```

} catch (e) {
console.error(“获取排行榜失败:”, e);
throw e;
}
}

// 标签搜索
async function searchByTag(params) {
try {
var tag = params.tag || “”;
var page = params.page || 1;

```
if (!tag) {
  throw new Error("请输入标签");
}

var url = "https://bgm.tv/anime/tag/" + encodeURIComponent(tag) + "?page=" + page;

var response = await Widget.http.get(url, {
  headers: commonHeaders
});

var $ = Widget.html.load(response.data);
var items = [];

$("#browserItemList li.item").each(function(i, item) {
  var parsed = parseItem($, item);
  if (parsed) {
    items.push(parsed);
  }
});

return items;
```

} catch (e) {
console.error(“标签搜索失败:”, e);
throw e;
}
}

// 正在放送
async function getOnAir(params) {
try {
var url = “https://bgm.tv/anime/browser/airtime/0”;

```
var response = await Widget.http.get(url, {
  headers: commonHeaders
});

var $ = Widget.html.load(response.data);
var items = [];

$("#browserItemList li.item").each(function(i, item) {
  var parsed = parseItem($, item);
  if (parsed) {
    items.push(parsed);
  }
});

return items;
```

} catch (e) {
console.error(“获取正在放送失败:”, e);
throw e;
}
}

// 搜索
async function search(params) {
try {
var keyword = params.keyword || “”;
var page = params.page || 1;

```
if (!keyword) {
  throw new Error("请输入关键词");
}

var url = "https://bgm.tv/subject_search/" + encodeURIComponent(keyword) + "?cat=2&page=" + page;

var response = await Widget.http.get(url, {
  headers: commonHeaders
});

var $ = Widget.html.load(response.data);
var items = [];

$("#browserItemList li.item").each(function(i, item) {
  var parsed = parseItem($, item);
  if (parsed) {
    items.push(parsed);
  }
});

return items;
```

} catch (e) {
console.error(“搜索失败:”, e);
throw e;
}
}

// 加载详情
async function loadDetail(link) {
return {
videoUrl: link
};
}
