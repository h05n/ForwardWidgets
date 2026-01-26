// ===========================================
// Forward Widget: 全球日漫榜
// ===========================================

// --- 核心配置元数据 ---
// 注意：这里不使用 const/var 声明，直接赋值给全局变量，确保宿主 App 能读取配置
WidgetMetadata = {
  // 最低兼容版本号
  "requiredVersion": "0.0.1",
  // 组件唯一标识符
  "id": "global.anime.ranking.pro",
  // 组件显示名称
  "title": "日漫榜单",
  // 作者署名
  "author": "Gemini",
  // 当前脚本版本
  "version": "3.0.0",
  // 功能描述
  "description": "标准分页/中文优先/无英文",
  // 源代码仓库地址
  "site": "https://github.com/h05n/ForwardWidgets",
  // 功能模块定义
  "modules": [
    {
      // 模块ID
      "id": "animeRanking",
      // 模块显示名称
      "title": "最新番剧",
      // 对应的脚本函数名
      "functionName": "moduleDiscover",
      // 参数列表
      "params": [
        // 参数：页码选择器
        // 遵循官方标准分页逻辑，提供 1-5 页选项，共覆盖 100 条数据
        { 
          "name": "n", 
          "title": "页码", 
          "type": "enumeration", 
          "value": "1", 
          "enumOptions": [
            { "title": "第 1 页 (1-20)", "value": "1" },
            { "title": "第 2 页 (21-40)", "value": "2" },
            { "title": "第 3 页 (41-60)", "value": "3" },
            { "title": "第 4 页 (61-80)", "value": "4" },
            { "title": "第 5 页 (81-100)", "value": "5" }
          ] 
        }
      ]
    }
  ]
};

// --- 主逻辑函数：发现/浏览列表 ---
async function moduleDiscover(p) {
  // 1. 获取当前日期 (YYYY-MM-DD 格式)
  // 用于过滤掉未来尚未上映的空壳数据
  var today = new Date(Date.now() + 28800000).toISOString().split("T")[0];
  
  // 2. 获取用户选择的页码，默认为第 1 页
  var page = p.n || "1";
  
  // 3. 生成缓存键值
  // 根据页码区分缓存，防止翻页数据混淆
  var sKey = "anime_storage_p" + page;

  // 4. 构建 TMDB API 请求参数
  var apiParams = {
    // 基础语言请求：简体中文
    "language": "zh-CN",
    
    // 【核心策略】图片语言优先级
    // 顺序：无文字(null) > 中文(zh) > 日文(ja)
    // 作用：强制剔除英文海报，确保视觉纯净
    "include_image_language": "null,zh,ja",
    
    // 排序方式：按首播日期倒序 (最新的排前面)
    "sort_by": "first_air_date.desc",
    
    // 区域限制：锁定日本地区
    "region": "JP",
    
    // 平台限制：置空，不限制播放平台
    "with_networks": "", 
    
    // 类型限制：只看“动画”分类 (ID: 16)
    "with_genres": "16",
    
    // 语言限制：只看原产地为日语的作品
    "with_original_language": "ja",
    
    // 过滤成人内容
    "include_adult": false,
    
    // 【垃圾过滤】
    // 要求评分人数必须大于 5 人，过滤掉无意义的占位数据
    "vote_count.gte": 5,
    
    // 时间限制：首播日期必须早于或等于今天
    "first_air_date.lte": today,
    
    // 分页参数：透传用户选择的页码
    "page": page
  };

  try {
    // 5. 发起网络请求 (GET /discover/tv)
    // 设置网络缓存时间为 3600 秒 (1小时)
    var res = await Widget.tmdb.get("/discover/tv", {
      params: apiParams,
      cacheTime: 3600
    });
    
    var items = [];
    // 6. 处理返回数据
    if (res && res.results) {
      // 过滤：丢弃没有封面的条目
      // 映射：将原始数据格式化为 Widget 标准格式
      items = res.results.filter(function(r) {
        return r.poster_path != null;
      }).map(formatItem);
    }
    
    // 7. 写入本地持久化缓存
    // 只有当成功获取到数据时才更新缓存
    if (items.length > 0) { 
      Widget.storage.set(sKey, items); 
    }
    return items;
  } catch (e) {
    // 8. 异常处理
    // 如果网络请求失败，尝试读取本地缓存作为兜底
    var cached = Widget.storage.get(sKey);
    return cached || [];
  }
}

// --- 辅助函数：格式化单条数据 ---
function formatItem(r) {
  // 提取首播日期，如果为空则留空
  var d = r.first_air_date || "";
  // 格式化评分，保留 1 位小数
  var s = r.vote_average ? r.vote_average.toFixed(1) : "N/A";
  // 提取年份 (取日期的前4位)
  var year = d ? d.split("-")[0] : "";
  
  // --- 标题清洗逻辑 ---
  var title = r.name || ""; // 中文译名 (可能回退到英文)
  var original = r.original_name || ""; // 日文原名
  
  // 正则检测：判断标题中是否包含汉字
  var hasChinese = /[\u4e00-\u9fa5]/.test(title);
  
  // 策略：如果 TMDB 给的标题里不含汉字 (说明它回退到了英文)
  // 且存在日文原名，则强制使用日文原名覆盖
  if (!hasChinese && original) {
    title = original;
  }
  
  // 最终兜底：如果连日文名都没有，显示 Unknown
  if (!title) title = "Unknown";

  // 返回标准对象结构
  return {
    "id": String(r.id),
    "type": "tmdb",
    "title": title,
    "subtitle": year + " · " + s + "分 · 番剧",
    "overview": r.overview || "暂无简介",
    "posterPath": r.poster_path,   
    "backdropPath": r.backdrop_path, 
    "rating": r.vote_average,
    "releaseDate": d,
    "mediaType": "tv" // 强制标记为 TV 类型
  };
}
