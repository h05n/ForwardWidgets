/**
 * AnFuns 综合模块 (榜单 + 自动播放)
 */
WidgetMetadata = {
  id: "forward.anfuns.full",
  title: "AnFuns 动漫",
  icon: "https://www.anfuns.cc/favicon.ico",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "支持榜单浏览与高清资源自动播放",
  author: "Forward Dev",
  site: "https://www.anfuns.cc",
  modules: [
    {
      // 榜单发现模块
      id: "getRankings",
      title: "番剧榜单",
      functionName: "loadDiscovery",
      params: [
        {
          name: "type",
          title: "榜单类型",
          type: "enumeration",
          value: "1",
          enumOptions: [
            { title: "今日更新", value: "1" },
            { title: "本周热门", value: "2" },
            { title: "总排行榜", value: "3" }
          ]
        }
      ],
    },
    {
      // 播放资源模块 (id 需固定或在 App 内关联)
      id: "loadResource",
      title: "线路选择",
      functionName: "loadResource",
      type: "stream",
      params: [],
    }
  ],
};

/**
 * 逻辑 A: 加载榜单 (用于发现想看的内容)
 */
async function loadDiscovery(params) {
  const baseUrl = "https://www.anfuns.cc";
  const type = params.type || "1";
  
  // 根据参数选择不同的抓取页面 (AnFuns 常见的排行/最新页面)
  let targetUrl = `${baseUrl}/label/web.html`; // 默认为发现页
  if (type === "3") targetUrl = `${baseUrl}/label/rank.html`;

  try {
    const response = await Widget.http.get(targetUrl);
    const $ = Widget.html.load(response.data);
    const items = [];

    // 解析视频列表 (基于 AnFuns 典型的 MacCMS 结构)
    $(".searchlist_item, .vodlist_item").each((i, el) => {
      const $el = $(el);
      const title = $el.find(".searchlist_title a, .vodlist_title a").text();
      const path = $el.find(".searchlist_title a, .vodlist_title a").attr("href");
      const img = $el.find(".searchlist_img, .vodlist_thumb").attr("data-original") || $el.find("img").attr("src");

      if (title && path) {
        items.push({
          title: title,
          posterPath: img.startsWith('http') ? img : baseUrl + img,
          link: baseUrl + path, // 传递链接，点击后会进入播放流程
          type: "link", 
          description: $el.find(".pic_text, .searchlist_msg").text() || "高清资源"
        });
      }
    });

    return items;
  } catch (error) {
    console.error("榜单加载失败:", error);
    return [];
  }
}

/**
 * 逻辑 B: 自动播放解析 (保持之前的修复版逻辑)
 */
async function loadResource(params) {
  const name = params.seriesName || params.title;
  const episode = params.episode || 1;
  const baseUrl = "https://www.anfuns.cc";
  
  if (!name) return [];

  try {
    // 1. 搜索
    const searchUrl = `${baseUrl}/search/-------------.html?wd=${encodeURIComponent(name)}`;
    const searchRes = await Widget.http.get(searchUrl);
    const $search = Widget.html.load(searchRes.data);
    const detailPath = $search(".searchlist_item:first-child .searchlist_img").attr("href");

    if (!detailPath) throw new Error("未找到资源");

    // 2. 选集
    const detailRes = await Widget.http.get(baseUrl + detailPath);
    const $detail = Widget.html.load(detailRes.data);
    let playPath = "";
    const epStr = String(episode).padStart(2, '0');

    $detail(".playlist_notfull li a").each((i, el) => {
      const text = $(el).text();
      if (text.includes(epStr) || text.includes(`第${episode}集`)) {
        playPath = $(el).attr("href");
        return false;
      }
    });

    if (!playPath) playPath = $detail(".playlist_notfull li:first-child a").attr("href");

    // 3. 提取地址
    const playRes = await Widget.http.get(baseUrl + playPath);
    const playerJsonMatch = playRes.data.match(/var\s+player_aaaa\s*=\s*(\{.*?\});/);
    
    if (playerJsonMatch) {
        const videoUrl = decodeURIComponent(JSON.parse(playerJsonMatch[1]).url);
        return [{
            name: "AnFuns 高清源",
            url: videoUrl,
            header: { "Referer": baseUrl }
        }];
    }
  } catch (e) {
    console.log("播放加载失败: " + e.message);
  }
  return [];
}
