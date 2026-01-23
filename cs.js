/**
 * @name 窗外的电影 (国内精准版)
 * @id weather_cinema_cn
 * @version 1.2.0
 */

async function getLazyWeatherList(params = {}) {
    let cityName = "上海"; // 默认城市
    let weatherText = "晴";
    let temp = "22";

    try {
        // 1. 【精准定位】使用太平洋电脑网 IP 接口（国内 IP 识别率 99% 以上，无需 Key）
        // 这个接口会直接返回：{"ip":"xxx","pro":"上海市","city":"上海市","region":"徐汇区",...}
        const ipResp = await Widget.http.get('http://whois.pconline.com.cn/ipJson.jsp?json=true');
        const ipData = JSON.parse(ipResp);
        
        if (ipData && ipData.city) {
            cityName = ipData.city.replace("市", ""); // 去掉“市”字，方便匹配
        }

        // 2. 【准确天气】使用国内可直接访问的公开接口 (以 wttr.in 为例，但通过强制指定城市名来修正)
        // 既然第一步拿到了准确城市名，强制传给 wttr.in，它的准确度就会瞬间提升
        const weatherUrl = `https://wttr.in/${encodeURIComponent(cityName)}?format=j1&lang=zh-cn`;
        const weatherResp = await Widget.http.get(weatherUrl);
        const weatherData = JSON.parse(weatherResp);
        
        weatherText = weatherData.current_condition[0].lang_zh 
                      ? weatherData.current_condition[0].lang_zh[0].value 
                      : weatherData.current_condition[0].weatherDesc[0].value;
        temp = weatherData.current_condition[0].temp_C;

    } catch (e) {
        console.log("自动定位失败，使用默认配置");
    }

    // 3. 【氛围匹配】
    const hour = new Date().getHours();
    let mood = { genre: "18", label: "精选" };

    if (hour >= 22 || hour <= 4) { mood = { genre: "27,53", label: "深夜惊悚" }; }
    else if (weatherText.includes("雨")) { mood = { genre: "18,80", label: "雨天氛围" }; }
    else if (weatherText.includes("晴")) { mood = { genre: "35,12", label: "明媚心情" }; }

    // 4. 【抓取电影】(调用 TMDB 逻辑，略...)
    // ...
    return renderMovies(mood, cityName, weatherText, temp); 
}
