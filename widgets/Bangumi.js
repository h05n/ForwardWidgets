{
  "id": "forward.bangumi",
  "title": "动漫数据",
  "version": "2.0.0",
  "requiredVersion": "0.0.1",
  "description": "获取时下热门动漫数据和播出日历（重写增强版）",
  "author": "Forward",
  "site": "https://github.com/InchStudio/ForwardWidgets",
  "modules": [
    {
      "id": "dailySchedule",
      "title": "每日播出",
      "functionName": "dailySchedule",
      "params": [
        {
          "name": "day",
          "title": "星期",
          "type": "enumeration",
          "enumOptions": [
            { "title": "今天", "value": "today" },
            { "title": "星期一", "value": "星期一" },
            { "title": "星期二", "value": "星期二" },
            { "title": "星期三", "value": "星期三" },
            { "title": "星期四", "value": "星期四" },
            { "title": "星期五", "value": "星期五" },
            { "title": "星期六", "value": "星期六" },
            { "title": "星期日", "value": "星期日" }
          ]
        }
      ]
    },
    {
      "id": "trending",
      "title": "近期注目",
      "functionName": "trending",
      "params": []
    }
  ]
}
