import fetch from 'node-fetch';
import Parser from 'rss-parser';
const parser = new Parser();

// 監視したいRSSフィードのURL例
const feeds = [
  {
    name: 'Google Official Blog',
    url: 'https://blog.google/rss' // Google公式ブログRSS (※要確認)
  },
  {
    name: 'Google Search Central',
    url: 'https://developers.google.com/search/blog/feed/rss.xml'
  },
  // ... 必要に応じて他のRSSを追加
];

const semrushSensorUrl = 'https://www.semrush.com/sensor/'; 
// SEMrushのSensor情報をスクレイプする場合は、
// 公式にRSSやAPIを提供しているか要確認。ここでは例としてURLを記載。

// 新着をチェックする期間 (例: 過去1日分, あるいは過去数日)
const RECENT_HOURS = 24;

(async () => {
  try {
    let messages = [];

    // --- RSSチェック ---
    for (const feed of feeds) {
      const rss = await parser.parseURL(feed.url);
      
      // RSSアイテムを走査し、最近(24時間以内)の更新を見つける
      const recentItems = rss.items.filter(item => {
        const pubDate = new Date(item.pubDate);
        const now = new Date();
        // 24時間以内に投稿されたかチェック
        return (now - pubDate) < RECENT_HOURS * 60 * 60 * 1000;
      });

      if (recentItems.length > 0) {
        // 通知メッセージをまとめる
        messages.push(`**${feed.name}** に新着 ${recentItems.length} 件`);
        recentItems.forEach(item => {
          messages.push(`- [${item.title}](${item.link})`);
        });
      }
    }

    // --- SEMrush Sensorチェック(例: HTMLスクレイプやAPI) ---
    // 簡単な例としては、ページタイトルなどを取得して変化を見てアラートするなど。
    // ここでは概念的に示すのみ。
    const sensorPage = await fetch(semrushSensorUrl).then(res => res.text());
    // ここでsensorPageをパースして、センサースコアが高すぎる（例：8以上）場合にアラートメッセージを作る等
    // 例: const score = 8.2; // 仮のスコア
    // if(score > 8){
    //   messages.push(`SEMrush Sensor スコアが高騰中 ( ${score} ) に注意！`);
    // }

    // --- Teams Webhook 通知 ---
    if (messages.length > 0) {
      await sendToTeams(messages.join('\n'));
    } else {
      console.log('No new updates.');
    }
  } catch (error) {
    console.error(error);
  }
})();

async function sendToTeams(text) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('TEAMS_WEBHOOK_URL is not defined.');
    return;
  }

  // TeamsのIncoming WebhookはシンプルなJSONをPOSTすればOK
  const body = {
    text: text
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
