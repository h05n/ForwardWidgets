/**

- Bangumi 番组计划 ForwardWidget 模块 - 增强版
- 
- 功能特性:
- - 每日放送表 (支持分组显示)
- - 排行榜浏览 (排名/评分/热度)
- - 标签搜索
- - 分类浏览 (动画/书籍/音乐/游戏/三次元)
- - 正在放送
- - 搜索功能
- - 详细的错误处理
- - 完善的数据解析
- 
- @author Claude
- @version 2.0.0
- @site https://bgm.tv
  */

// ==================== Widget 元数据配置 ====================
var WidgetMetadata = {
id: “bangumi_enhanced”,
title: “Bangumi 番组计划”,
description: “浏览 Bangumi 番组计划上的 ACG 作品信息 - 增强版”,
author: “Claude”,
site: “https://bgm.tv”,
version: “2.0.0”,
requiredVersion: “0.0.1”,
detailCacheDuration: 300, // 详情缓存5分钟

// 功能模块列表
modules: [
{
title: “每日放送”,
description: “查看每日更新的动画放送表”,
requiresWebView: false,
functionName: “getCalendar”,
sectionMode: true, // 支持分段显示
cacheDuration: 1800, // 缓存30分钟
params: [
{
name: “weekday”,
title: “星期选择”,
type: “enumeration”,
description: “选择查看哪一天的放送”,
value: “all”,
enumOptions: [
{ title: “📅 全部显示”, value: “all” },
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
cacheDuration: 3600, // 缓存1小时
params: [
{
name: “type”,
title: “排序方式”,
type: “enumeration”,
description: “选择排行榜类型”,
value: “rank”,
enumOptions: [
{ title: “🏆 综合排名”, value: “rank” },
{ title: “⭐ 评分最高”, value: “rate” },
{ title: “🔥 最近热门”, value: “trend” }
]
},
{
name: “page”,
title: “页码”,
type: “page”,
description: “翻页浏览更多内容”,
value: 1
}
]
},
{
title: “分类浏览”,
description: “按类型和标签浏览作品”,
requiresWebView: false,
functionName: “browseByCategory”,
sectionMode: false,
cacheDuration: 3600,
params: [
{
name: “category”,
title: “作品类型”,
type: “enumeration”,
description: “选择作品类型”,
value: “anime”,
enumOptions: [
{ title: “📺 动画”, value: “anime” },
{ title: “📖 书籍”, value: “book” },
{ title: “🎵 音乐”, value: “music” },
{ title: “🎮 游戏”, value: “game” },
{ title: “🎬 三次元”, value: “real” }
]
},
{
name: “sort”,
title: “排序”,
type: “enumeration”,
description: “排序方式”,
value: “rank”,
enumOptions: [
{ title: “排名”, value: “rank” },
{ title: “评分”, value: “rate” },
{ title: “收藏”, value: “collects” },
{ title: “日期”, value: “date” }
]
},
{
name: “airtime”,
title: “放送时间”,
type: “enumeration”,
description: “筛选放送时间 (仅动画)”,
value: “0”,
belongTo: {
paramName: “category”,
value: [“anime”]
},
enumOptions: [
{ title: “全部”, value: “0” },
{ title: “正在放送”, value: “0” },
{ title: “2024年”, value: “2024” },
{ title: “2023年”, value: “2023” },
{ title: “2022年”, value: “2022” }
]
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
title: “标签搜索”,
description: “根据标签搜索动画”,
requiresWebView: false,
functionName: “searchByTag”,
sectionMode: false,
cacheDuration: 1800,
params: [
{
name: “tag”,
title: “标签名称”,
type: “input”,
description: “输入标签 (如: 科幻/校园/恋爱)”,
value: “”,
placeholders: [
{ title: “科幻”, value: “科幻” },
{ title: “校园”, value: “校园” },
{ title: “恋爱”, value: “恋爱” },
{ title: “战斗”, value: “战斗” },
{ title: “日常”, value: “日常” }
]
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
description: “获取当前正在播出的动画”,
requiresWebView: false,
functionName: “getOnAir”,
sectionMode: false,
cacheDuration: 3600,
params: []
}
],

// 搜索功能配置
search: {
title: “搜索”,
functionName: “search”,
params: [
{
name: “keyword”,
title: “关键词”,
type: “input”,
description: “输入作品名称或关键词”,
value: “”
},
{
name: “type”,
title: “类型”,
type: “enumeration”,
description: “筛选类型”,
value: “2”,
enumOptions: [
{ title: “全部”, value: “” },
{ title: “动画”, value: “2” },
{ title: “书籍”, value: “1” },
{ title: “音乐”, value: “3” },
{ title: “游戏”, value: “4” },
{ title: “三次元”, value: “6” }
]
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

// ==================== 常量配置 ====================

/**

- 通用 HTTP 请求头
- 模拟浏览器访问，避免被反爬
  */
  const COMMON_HEADERS = {
  “User-Agent”: “Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36”,
  “Accept”: “text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8”,
  “Accept-Language”: “zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7”,
  “Accept-Encoding”: “gzip, deflate, br”,
  “Referer”: “https://bgm.tv/”
  };

/**

- Bangumi 网站基础 URL
  */
  const BASE_URL = “https://bgm.tv”;

/**

- 星期映射表 (用于每日放送)
  */
  const WEEKDAY_MAP = {
  “1”: “星期一”,
  “2”: “星期二”,
  “3”: “星期三”,
  “4”: “星期四”,
  “5”: “星期五”,
  “6”: “星期六”,
  “7”: “星期日”
  };

// ==================== 工具函数 ====================

/**

- 解析单个条目信息
- 从 HTML 元素中提取作品的详细信息
- 
- @param {CheerioStatic} $ - Cheerio 实例
- @param {CheerioElement} element - DOM 元素
- @returns {Object|null} 解析后的条目对象，失败返回 null
  */
  function parseSubjectItem($, element) {
  try {
  const $item = $(element);
  
  // 提取链接和 ID
  const link = $item.find(“a.subjectCover, a.l”).first().attr(“href”) || “”;
  const idMatch = link.match(//subject/(\d+)/);
  if (!idMatch) {
  console.warn(“无法提取条目 ID”);
  return null;
  }
  const id = idMatch[1];
  
  // 提取标题
  const title = $item.find(“h3 a.l, .info_title a, a.l”).first().text().trim() ||
  $item.find(“img”).attr(“alt”) || “未知标题”;
  
  // 提取封面图
  let coverUrl = $item.find(“img.cover, img”).first().attr(“src”) || “”;
  // 处理相对路径
  if (coverUrl.startsWith(”//”)) {
  coverUrl = “https:” + coverUrl;
  } else if (coverUrl.startsWith(”/”)) {
  coverUrl = BASE_URL + coverUrl;
  }
  
  // 提取评分
  let rating = “N/A”;
  const ratingText = $item.find(”.fade, .rating_num”).first().text().trim();
  if (ratingText) {
  const ratingMatch = ratingText.match(/(\d+.?\d*)/);
  if (ratingMatch) {
  rating = ratingMatch[1];
  }
  }
  
  // 提取排名
  let rank = “”;
  const rankText = $item.find(”.rank”).text().trim();
  if (rankText) {
  rank = rankText.replace(/[^\d]/g, “”);
  }
  
  // 提取描述信息
  let description = “”;
  const infoText = $item.find(”.info, .info_tip, p.info”).text().trim();
  if (infoText) {
  description = infoText;
  }
  
  // 如果有排名，添加到描述中
  if (rank) {
  description = `排名: #${rank}\n${description}`;
  }
  
  // 提取标签
  const tags = [];
  $item.find(”.tag”).each((i, tag) => {
  const tagText = $(tag).text().trim();
  if (tagText) {
  tags.push(tagText);
  }
  });
  const genreTitle = tags.length > 0 ? tags.join(” / “) : “”;
  
  // 提取发布日期
  let releaseDate = “”;
  const dateMatch = description.match(/(\d{4})[年-](\d{1,2})[月-](\d{1,2})/);
  if (dateMatch) {
  releaseDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
  }
  
  // 提取集数信息
  let episode = 0;
  const episodeMatch = description.match(/(\d+)话|(\d+)集/);
  if (episodeMatch) {
  episode = parseInt(episodeMatch[1] || episodeMatch[2]);
  }
  
  // 构建返回对象
  return {
  id: `url.bgm.tv/subject/${id}`,
  type: “url”,
  title: title,
  posterPath: coverUrl,
  backdropPath: coverUrl, // Bangumi 通常只有一张图
  rating: rating,
  genreTitle: genreTitle,
  description: description,
  link: `${BASE_URL}${link}`,
  mediaType: “tv”,
  releaseDate: releaseDate,
  episode: episode,
  playerType: “system”
  };
  } catch (error) {
  console.error(“解析条目失败:”, error);
  return null;
  }
  }

/**

- 发送 HTTP GET 请求
- 统一的请求封装，包含错误处理
- 
- @param {string} url - 请求 URL
- @param {Object} options - 额外选项
- @returns {Promise<Object>} 响应数据
  */
  async function httpGet(url, options = {}) {
  try {
  console.log(`正在请求: ${url}`);
  
  const response = await Widget.http.get(url, {
  headers: { …COMMON_HEADERS, …options.headers },
  …options
  });
  
  if (!response || !response.data) {
  throw new Error(“请求失败: 无响应数据”);
  }
  
  return response;
  } catch (error) {
  console.error(`HTTP 请求失败 [${url}]:`, error);
  throw new Error(`网络请求失败: ${error.message}`);
  }
  }

// ==================== 模块功能函数 ====================

/**

- 每日放送
- 获取每日更新的动画列表
- 
- @param {Object} params - 参数对象
- @param {string} params.weekday - 星期几 (1-7) 或 “all”
- @returns {Promise<Array>} 条目列表或分组列表
  */
  async function getCalendar(params = {}) {
  try {
  const { weekday = “all” } = params;
  
  console.log(`获取每日放送 - 星期: ${weekday}`);
  
  const url = `${BASE_URL}/calendar`;
  const response = await httpGet(url);
  const $ = Widget.html.load(response.data);
  
  // 全部显示模式 - 返回分组数据
  if (weekday === “all”) {
  const sections = [];
  
  $(”.calendar, #cloumnSubjectInfo .section”).each((i, calendar) => {
  // 获取星期标题
  const dayTitle = $(calendar).find(”.headerWeek, h2”).first().text().trim() || `第 ${i + 1} 天`;
  
  ```
   const items = [];
   $(calendar).find(".item, li.item").each((j, item) => {
     const parsed = parseSubjectItem($, item);
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
  ```
  
  });
  
  if (sections.length === 0) {
  throw new Error(“未找到放送数据”);
  }
  
  return sections;
  }
  // 单日显示模式 - 返回条目列表
  else {
  const weekdayIndex = parseInt(weekday) - 1;
  if (weekdayIndex < 0 || weekdayIndex > 6) {
  throw new Error(“无效的星期参数”);
  }
  
  const calendar = $(”.calendar, #cloumnSubjectInfo .section”).eq(weekdayIndex);
  const items = [];
  
  calendar.find(”.item, li.item”).each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
  items.push(parsed);
  }
  });
  
  if (items.length === 0) {
  console.warn(`${WEEKDAY_MAP[weekday]} 暂无放送`);
  }
  
  return items;
  }
  } catch (error) {
  console.error(“获取每日放送失败:”, error);
  throw error;
  }
  }

/**

- 排行榜
- 获取 Bangumi 排行榜数据
- 
- @param {Object} params - 参数对象
- @param {string} params.type - 排序类型 (rank/rate/trend)
- @param {number} params.page - 页码
- @returns {Promise<Array>} 条目列表
  */
  async function getRanking(params = {}) {
  try {
  const { type = “rank”, page = 1 } = params;
  
  console.log(`获取排行榜 - 类型: ${type}, 页码: ${page}`);
  
  const url = `${BASE_URL}/anime/browser?sort=${type}&page=${page}`;
  const response = await httpGet(url);
  const $ = Widget.html.load(response.data);
  
  const items = [];
  $(”#browserItemList li.item, .browserFull li.item”).each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
  items.push(parsed);
  }
  });
  
  if (items.length === 0) {
  throw new Error(“未找到排行榜数据”);
  }
  
  return items;
  } catch (error) {
  console.error(“获取排行榜失败:”, error);
  throw error;
  }
  }

/**

- 分类浏览
- 按类型和条件浏览作品
- 
- @param {Object} params - 参数对象
- @param {string} params.category - 类型 (anime/book/music/game/real)
- @param {string} params.sort - 排序方式
- @param {string} params.airtime - 放送时间 (仅动画)
- @param {number} params.page - 页码
- @returns {Promise<Array>} 条目列表
  */
  async function browseByCategory(params = {}) {
  try {
  const { category = “anime”, sort = “rank”, airtime = “0”, page = 1 } = params;
  
  console.log(`分类浏览 - 类型: ${category}, 排序: ${sort}, 页码: ${page}`);
  
  let url = `${BASE_URL}/${category}/browser?sort=${sort}&page=${page}`;
  
  // 动画类型支持时间筛选
  if (category === “anime” && airtime !== “0”) {
  url += `&airtime=${airtime}`;
  }
  
  const response = await httpGet(url);
  const $ = Widget.html.load(response.data);
  
  const items = [];
  $(”#browserItemList li.item, .browserFull li.item”).each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
  items.push(parsed);
  }
  });
  
  if (items.length === 0) {
  throw new Error(“未找到符合条件的作品”);
  }
  
  return items;
  } catch (error) {
  console.error(“分类浏览失败:”, error);
  throw error;
  }
  }

/**

- 标签搜索
- 根据标签搜索动画
- 
- @param {Object} params - 参数对象
- @param {string} params.tag - 标签名称
- @param {number} params.page - 页码
- @returns {Promise<Array>} 条目列表
  */
  async function searchByTag(params = {}) {
  try {
  const { tag = “”, page = 1 } = params;
  
  if (!tag || tag.trim() === “”) {
  throw new Error(“请输入标签名称”);
  }
  
  console.log(`标签搜索 - 标签: ${tag}, 页码: ${page}`);
  
  const url = `${BASE_URL}/anime/tag/${encodeURIComponent(tag)}?page=${page}`;
  const response = await httpGet(url);
  const $ = Widget.html.load(response.data);
  
  const items = [];
  $(”#browserItemList li.item, .browserFull li.item”).each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
  items.push(parsed);
  }
  });
  
  if (items.length === 0) {
  throw new Error(`未找到标签 "${tag}" 相关的作品`);
  }
  
  return items;
  } catch (error) {
  console.error(“标签搜索失败:”, error);
  throw error;
  }
  }

/**

- 正在放送
- 获取当前正在播出的动画
- 
- @returns {Promise<Array>} 条目列表
  */
  async function getOnAir(params = {}) {
  try {
  console.log(“获取正在放送的动画”);
  
  const url = `${BASE_URL}/anime/browser/airtime/0`;
  const response = await httpGet(url);
  const $ = Widget.html.load(response.data);
  
  const items = [];
  $(”#browserItemList li.item, .browserFull li.item”).each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
  items.push(parsed);
  }
  });
  
  if (items.length === 0) {
  throw new Error(“暂无正在放送的动画”);
  }
  
  return items;
  } catch (error) {
  console.error(“获取正在放送失败:”, error);
  throw error;
  }
  }

/**

- 搜索
- 关键词搜索作品
- 
- @param {Object} params - 参数对象
- @param {string} params.keyword - 搜索关键词
- @param {string} params.type - 作品类型
- @param {number} params.page - 页码
- @returns {Promise<Array>} 条目列表
  */
  async function search(params = {}) {
  try {
  const { keyword = “”, type = “2”, page = 1 } = params;
  
  if (!keyword || keyword.trim() === “”) {
  throw new Error(“请输入搜索关键词”);
  }
  
  console.log(`搜索 - 关键词: ${keyword}, 类型: ${type}, 页码: ${page}`);
  
  let url = `${BASE_URL}/subject_search/${encodeURIComponent(keyword)}?page=${page}`;
  if (type) {
  url += `&cat=${type}`;
  }
  
  const response = await httpGet(url);
  const $ = Widget.html.load(response.data);
  
  const items = [];
  $(”#browserItemList li.item, .browserFull li.item”).each((i, item) => {
  const parsed = parseSubjectItem($, item);
  if (parsed) {
  items.push(parsed);
  }
  });
  
  if (items.length === 0) {
  throw new Error(`未找到 "${keyword}" 相关的作品`);
  }
  
  return items;
  } catch (error) {
  console.error(“搜索失败:”, error);
  throw error;
  }
  }

/**

- 加载详情
- 加载条目的详细信息
- (Bangumi 主要是信息站，不提供播放地址)
- 
- @param {string} link - 详情页链接
- @returns {Promise<Object>} 包含 videoUrl 的对象
  */
  async function loadDetail(link) {
  try {
  console.log(`加载详情: ${link}`);
  
  const response = await httpGet(link);
  const $ = Widget.html.load(response.data);
  
  // 可以在这里解析更详细的信息
  // 例如: 制作公司、声优、评论等
  // 但 Bangumi 本身不提供视频播放
  
  // 提取更多详情信息
  const summary = $(”#subject_summary”).text().trim();
  const tags = [];
  $(”.tags a”).each((i, tag) => {
  tags.push($(tag).text().trim());
  });
  
  return {
  videoUrl: link, // 返回详情页链接
  description: summary,
  tags: tags.join(”, “)
  };
  } catch (error) {
  console.error(“加载详情失败:”, error);
  // 即使失败也返回基本信息
  return {
  videoUrl: link
  };
  }
  }

// ==================== 模块导出 ====================
// ForwardWidget 会自动识别并调用以上函数
console.log(“Bangumi 增强版模块加载完成”);
