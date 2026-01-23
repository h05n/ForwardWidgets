/**
 * AnFuns 自动播放模块
 */
WidgetMetadata = {
  id: "forward.anfuns.live",
  title: "AnFuns 动画",
  icon: "https://www.anfuns.cc/favicon.ico",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description: "自动搜索 AnFuns 高清番剧资源",
  author: "Forward Dev",
  site: "https://www.anfuns.cc",
  modules: [
    {
      id: "loadResource",
      title: "线路选择",
      functionName: "loadResource",
      type: "stream",
      params: [],
    }
  ],
};

async function loadResource(params) {
  const { seriesName, episode, type } = params;
  const baseUrl = "https://www.anfuns.cc";
  
  try {
    // 1. 发起搜索 (使用剧名进行匹配)
    const searchUrl = `${baseUrl}/search/-------------.html?wd=${encodeURIComponent(seriesName)}`;
    const searchRes = await Widget.http.get(searchUrl);
    const $search = Widget.html.load(searchRes.data);
    
    // 获取第一个搜索结果的链接
    const detailPath = $search(".searchlist_item:first-child .searchlist_img").attr("href");
    if (!detailPath) throw new Error("未搜索到资源");

    // 2. 进入详情页获取集数列表
    const detailUrl = baseUrl + detailPath;
    const detailRes = await Widget.http.get(detailUrl);
    const $detail = Widget.html.load(detailRes.data);
    
    // 匹配集数 (寻找包含对应数字的按钮)
    let playPath = "";
    $detail(".playlist_notfull li a").each((i, el) => {
      const text = $detail(el).text();
      // 如果文字中包含当前集数，例如 "第03集" 匹配 episode: 3
      if (text.includes(String(episode).padStart(2, '0')) || text.includes(String(episode))) {
        playPath = $detail(el).attr("href");
      }
    });

    if (!playPath) throw new Error("未找到对应集数");

    // 3. 进入播放页提取视频直链
    const playUrl = baseUrl + playPath;
    const playRes = await Widget.http.get(playUrl);
    
    // 关键：从网页的 JavaScript 变量中提取加密或直连地址
    // AnFuns 类站点通常将地址存在 player_aaaa 变量中
    const htmlContent = playRes.data;
    const playerJsonMatch = htmlContent.match(/var\s+player_aaaa\s*=\s*(\{.*?\});/);
    
    if (playerJsonMatch) {
        const playerData = JSON.parse(playerJsonMatch[1]);
        const videoUrl = decodeURIComponent(playerData.url); // 获取真正的 m3u8 或 mp4 地址

        return [
          {
            name: "AnFuns 原画",
            description: `当前播放：${seriesName} - 第${episode}集\n画质：高清 1080P`,
            url: videoUrl,
            header: { "Referer": baseUrl } // 某些站需要 Referer 才能播放
          }
        ];
    }

    throw new Error("播放解析失败");

  } catch (error) {
    console.error("AnFuns 模块错误:", error);
    return [];
  }
}
