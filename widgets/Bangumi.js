// Bangumi Widget - 番组计划
// 适用于 ForwardWidget 框架
// 功能：搜索番剧、获取在看列表、获取时间表

var WidgetMetadata = {
  id: "bangumi",
  title: "Bangumi 番组计划",
  description: "番组计划（bgm.tv）动漫追番平台，支持搜索番剧、查看在看列表和每日放送时间表",
  author: "Your Name",
  site: "https://bgm.tv",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  detailCacheDuration: 3600,
  modules: [
    {
      title: "热门番剧",
      description: "获取当前热门的动漫番剧",
      functionName: "getHotAnime",
      cacheDuration: 7200,
      params: [
        {
          name: "page",
          title: "页码",
          type: "page",
          value: "1",
          description: "分页页码"
        }
      ]
    },
    {
      title: "每日放送",
      description: "查看每日番剧放送时间表",
      functionName: "getCalendar",
      cacheDuration: 3600,
      params: [
        {
          name: "weekday",
          title: "星期",
          type: "enumeration",
          value: "0",
          description: "选择星期几的放送表",
          enumOptions: [
            { title: "今天", value: "0" },
            { title: "星期一", value: "1" },
            { title: "星期二", value: "2" },
            { title: "星期三", value: "3" },
            { title: "星期四", value: "4" },
            { title: "星期五", value: "5" },
            { title: "星期六", value: "6" },
            { title: "星期日", value: "7" }
          ]
        }
      ]
    },
    {
      title: "在看番剧",
      description: "获取用户正在追的番剧列表（需要配置用户ID）",
      functionName: "getUserWatching",
      cacheDuration: 1800,
      params: [
        {
          name: "username",
          title: "用户名",
          type: "input",
          value: "",
          description: "Bangumi 用户名"
        }
      ]
    }
  ],
  search: {
    title: "搜索番剧",
    functionName: "searchAnime",
    params: [
      {
        name: "keyword",
        title: "关键词",
        type: "input",
        value: "",
        description: "搜索番剧名称"
      },
      {
        name: "type",
        title: "类型",
        type: "enumeration",
        value: "2",
        enumOptions: [
          { title: "全部", value: "" },
          { title: "动画", value: "2" },
          { title: "书籍", value: "1" },
          { title: "音乐", value: "3" },
          { title: "游戏", value: "4" }
        ]
      }
    ]
  }
};

// 搜索番剧
async function searchAnime(params = {}) {
  try {
    const keyword = params.keyword || "";
    const type = params.type || "2";
    
    if (!keyword) {
      throw new Error("请输入搜索关键词");
    }

    console.log(`搜索番剧: ${keyword}, 类型: ${type}`);

    // 使用 Bangumi API 搜索
    const apiUrl = `https://api.bgm.tv/search/subject/${encodeURIComponent(keyword)}`;
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

    return response.data.list.map(item => ({
      id: `bangumi.${item.id}`,
      type: "url",
      title: item.name_cn || item.name,
      posterPath: item.images?.large || item.images?.common || "",
      backdropPath: item.images?.large || "",
      rating: item.rating?.score ? item.rating.score.toString() : "",
      releaseDate: item.air_date || "",
      description: item.summary || "",
      link: `https://bgm.tv/subject/${item.id}`,
      mediaType: type === "2" ? "tv" : "movie",
      genreTitle: "动画"
    }));

  } catch (error) {
    console.error("搜索失败:", error);
    throw error;
  }
}

// 获取热门番剧
async function getHotAnime(params = {}) {
  try {
    const page = parseInt(params.page) || 1;
    console.log(`获取热门番剧，页码: ${page}`);

    // 使用网页版热门页面
    const url = `https://bgm.tv/anime/browser?sort=rank&page=${page}`;
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      }
    });

    const $ = Widget.html.load(response.data);
    const items = [];

    // 解析列表项
    $('#browserItemList li.item').each((i, elem) => {
      const $item = $(elem);
      const $link = $item.find('.subjectCover');
      const href = $link.attr('href') || '';
      const id = href.match(/\/subject\/(\d+)/)?.[1] || '';
      
      if (!id) return;

      const title = $item.find('.l').text().trim();
      const poster = $link.find('img').attr('src') || '';
      const rating = $item.find('.fade').text().trim();
      const desc = $item.find('.info').text().trim();

      items.push({
        id: `bangumi.${id}`,
        type: "url",
        title: title,
        posterPath: poster.startsWith('//') ? `https:${poster}` : poster,
        backdropPath: poster.startsWith('//') ? `https:${poster}` : poster,
        rating: rating,
        description: desc,
        link: `https://bgm.tv${href}`,
        mediaType: "tv",
        genreTitle: "动画"
      });
    });

    return items;

  } catch (error) {
    console.error("获取热门番剧失败:", error);
    throw error;
  }
}

// 获取每日放送时间表
async function getCalendar(params = {}) {
  try {
    let weekday = parseInt(params.weekday) || 0;
    
    // 如果是今天，计算实际星期几（1-7）
    if (weekday === 0) {
      const today = new Date();
      weekday = today.getDay() || 7; // 0 (周日) 转为 7
    }

    console.log(`获取星期 ${weekday} 的放送表`);

    // 使用 Bangumi API 获取时间表
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
    const dayData = response.data.find(day => day.weekday?.id === weekday);
    if (!dayData || !dayData.items) {
      return [];
    }

    return dayData.items.map(item => ({
      id: `bangumi.${item.id}`,
      type: "url",
      title: item.name_cn || item.name,
      posterPath: item.images?.large || item.images?.common || "",
      backdropPath: item.images?.large || "",
      rating: item.rating?.score ? item.rating.score.toString() : "",
      releaseDate: item.air_date || "",
      description: item.summary || `放送时间: ${item.air_weekday || ''}`,
      link: `https://bgm.tv/subject/${item.id}`,
      mediaType: "tv",
      genreTitle: "动画",
      episode: item.eps_count || 0
    }));

  } catch (error) {
    console.error("获取放送表失败:", error);
    throw error;
  }
}

// 获取用户在看的番剧
async function getUserWatching(params = {}) {
  try {
    const username = params.username || "";
    
    if (!username) {
      throw new Error("请输入 Bangumi 用户名");
    }

    console.log(`获取用户 ${username} 的在看列表`);

    // 获取用户收藏
    const url = `https://api.bgm.tv/user/${encodeURIComponent(username)}/collections`;
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      },
      params: {
        subject_type: 2, // 动画
        type: 3, // 在看
        limit: 50
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data.map(item => {
      const subject = item.subject || {};
      return {
        id: `bangumi.${subject.id}`,
        type: "url",
        title: subject.name_cn || subject.name || "",
        posterPath: subject.images?.large || subject.images?.common || "",
        backdropPath: subject.images?.large || "",
        rating: subject.score ? subject.score.toString() : "",
        releaseDate: subject.date || "",
        description: subject.short_summary || "",
        link: `https://bgm.tv/subject/${subject.id}`,
        mediaType: "tv",
        genreTitle: "动画",
        episode: subject.eps || 0
      };
    });

  } catch (error) {
    console.error("获取用户在看列表失败:", error);
    throw error;
  }
}

// 加载详情（可选）
async function loadDetail(link) {
  try {
    console.log(`加载详情: ${link}`);
    
    const response = await Widget.http.get(link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const $ = Widget.html.load(response.data);
    
    // 解析视频链接（如果有的话）
    const videoUrl = $('iframe[src*="player"]').attr('src') || "";
    
    return {
      videoUrl: videoUrl,
      description: $('.subject_summary').text().trim()
    };

  } catch (error) {
    console.error("加载详情失败:", error);
    return {};
  }
}
