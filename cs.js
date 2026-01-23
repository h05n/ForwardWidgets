/**
 * Forward Bilibili 增强版模块
 * 修复了部分视频无法获取播放地址的问题
 */

var WidgetMetadata = {
    id: "bilibili_enhanced_widget",
    title: "B站热门 (增强版)",
    description: "修复了部分资源无法加载的问题",
    author: "ForwardHelper",
    site: "https://www.bilibili.com",
    version: "1.0.3",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "全站热门",
            functionName: "getPopular",
            params: [{ name: "page", title: "页码", type: "page", value: "1" }]
        }
    ]
};

async function getPopular(params = {}) {
    try {
        const page = params.page || 1;
        const url = `https://api.api.bilibili.com/x/web-interface/popular?ps=20&pn=${page}`;

        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                "Referer": "https://m.bilibili.com"
            }
        });

        const list = response.data.data.list;
        return list.map((item) => ({
            id: item.bvid,
            type: "link",
            title: item.title,
            posterPath: item.pic.replace("http://", "https://"),
            durationText: formatSeconds(item.duration),
            // 确保链接格式统一，方便 loadDetail 解析
            link: `https://www.bilibili.com/video/${item.bvid}?cid=${item.cid}`
        }));
    } catch (error) {
        throw new Error("获取列表失败，请检查网络");
    }
}

/**
 * 核心修复部分：增强版视频流解析
 */
async function loadDetail(link) {
    try {
        const bvid = link.match(/video\/(BV\w+)/)[1];
        let cidMatch = link.match(/cid=(\d+)/);
        let cid = cidMatch ? cidMatch[1] : null;

        // 如果 link 里没带 cid，手动去查一次，防止某些入口失效
        if (!cid) {
            const viewApi = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
            const viewResp = await Widget.http.get(viewApi, {
                headers: { "Referer": "https://www.bilibili.com" }
            });
            cid = viewResp.data.data.cid;
        }

        // 使用更稳定的移动端播放接口
        // qn=32 是 480P (最稳), qn=64 是 720P (可能需要登录)
        const playApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=32&type=mp4&platform=html5&high_quality=1`;
        
        const response = await Widget.http.get(playApi, {
            headers: {
                "Referer": "https://www.bilibili.com",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
                "Origin": "https://www.bilibili.com"
            }
        });

        if (response.data.code !== 0 || !response.data.data.durl) {
            // 备选方案：尝试更通用的接口
            return {
                videoUrl: `https://www.bilibili.com/video/${bvid}`,
                playerType: "app" // 如果系统播放器加载失败，尝试拉起 App 或 WebView
            };
        }

        return {
            videoUrl: response.data.data.durl[0].url,
            playerType: "system" 
        };
    } catch (error) {
        console.error("解析失败:", error);
        throw new Error("视频地址获取失败，可能是该资源受限");
    }
}

function formatSeconds(s) {
    return [Math.floor(s / 60), s % 60].map(v => v < 10 ? "0" + v : v).join(":");
}
