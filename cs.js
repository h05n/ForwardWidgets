/**
 * Forward Bilibili 简易模块
 * 符合 ForwardWidgets 规范
 */

var WidgetMetadata = {
    id: "bilibili_hot_simple",
    title: "Bilibili 热门",
    description: "展示 B 站全站热门视频",
    author: "Gemini",
    site: "https://www.bilibili.com",
    version: "1.0.1",
    requiredVersion: "0.0.1",
    detailCacheDuration: 60,
    modules: [
        {
            title: "全站热门",
            description: "实时更新的 B 站热门视频",
            functionName: "getPopular",
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    value: "1"
                }
            ]
        }
    ]
};

/**
 * 获取热门视频列表
 */
async function getPopular(params = {}) {
    try {
        const page = params.page || 1;
        const url = `https://api.bilibili.com/x/web-interface/popular?ps=20&pn=${page}`;

        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://www.bilibili.com"
            }
        });

        if (response.data.code !== 0) {
            throw new Error("Bilibili API 响应异常");
        }

        const list = response.data.data.list;

        // 转换为 Forward 标准数据模型
        return list.map((item) => ({
            id: item.bvid,
            type: "link", // 设置为 link 类型，点击时会触发 loadDetail
            title: item.title,
            posterPath: item.pic.replace("http://", "https://"),
            releaseDate: new Date(item.pubdate * 1000).toISOString().split('T')[0],
            durationText: formatDuration(item.duration),
            description: item.desc,
            // 传递给 loadDetail 的链接
            link: `https://www.bilibili.com/video/${item.bvid}?cid=${item.cid}`
        }));
    } catch (error) {
        console.error("获取热门失败:", error);
        throw error;
    }
}

/**
 * 加载视频详情（解析播放地址）
 * 当 type 为 link 时，Forward 会自动调用此函数
 */
async function loadDetail(link) {
    try {
        // 从 link 中提取 bvid 和 cid
        const bvid = link.match(/video\/(BV\w+)/)[1];
        const cidMatch = link.match(/cid=(\d+)/);
        let cid = cidMatch ? cidMatch[1] : null;

        // 如果没有 cid，先请求 view 接口获取
        if (!cid) {
            const viewResp = await Widget.http.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
            cid = viewResp.data.data.cid;
        }

        // 获取播放地址 (qn=64 为 720P)
        // 注意：未登录账号通常只能获取到最高 720P 或 480P
        const playUrlApi = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=64&type=mp4&platform=html5&high_quality=1`;
        
        const playResp = await Widget.http.get(playUrlApi, {
            headers: {
                "Referer": "https://www.bilibili.com",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
            }
        });

        const videoUrl = playResp.data.data.durl[0].url;

        return {
            videoUrl: videoUrl,
            playerType: "system" // 使用系统播放器
        };
    } catch (error) {
        console.error("解析视频地址失败:", error);
        throw error;
    }
}

/**
 * 辅助函数：格式化时长
 */
function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
}
