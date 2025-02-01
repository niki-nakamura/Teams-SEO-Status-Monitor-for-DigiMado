// testTeamsNotification.js
const fetch = require('node-fetch');

// 環境変数からTeams Webhook URLを取得（または直接URLを記載してもよい）
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || 'あなたのTeamsWebhookURL';

// テスト用のツイートデータ（指定URLを利用）
const tweet = {
  id: '1879476380796125443',
  text: 'テスト用ツイート',
  created_at: new Date().toISOString(),
  mediaUrl: null
};

// Teams用メッセージカード生成関数
function createTeamsCardMessage(tweet) {
  const tweetUrl = `https://x.com/googlesearchc/status/${tweet.id}`;
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "summary": "Google Search Central の更新",
    "themeColor": "0072C6",
    "title": "Google Search Central のツイート更新",
    "text": `Google Search Central のXアカウントが更新されました！\n\n詳細はこちら: [ツイートを確認する](${tweetUrl})`,
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "X(Twitter)で詳細を見る",
        "targets": [
          { "os": "default", "uri": tweetUrl }
        ]
      }
    ]
  };
}

// Teamsへ通知を送信する関数
async function postToTeams(tweet) {
  const payload = createTeamsCardMessage(tweet);
  const res = await fetch(TEAMS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error(`Teams Webhook error: ${res.status} ${res.statusText}`);
  } else {
    console.log('テスト通知がTeamsに送信されました。');
  }
}

// テスト実行
postToTeams(tweet);
