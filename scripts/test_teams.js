const fetch = require('node-fetch');

function createTeamsMessageForTest() {
  const testTweetUrl = 'https://x.com/googlesearchc/status/1873848143168889194?test=123';
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Google Search Central のXアカウント更新",
    "themeColor": "0076D7",
    "title": "Google Search Central のXアカウントが更新されました!!",
    "text": `Google Search Central's X account has been updated!! 詳細を見る: ${testTweetUrl}`,
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "X(Twitter)で詳細を見る",
        "targets": [{ "os": "default", "uri": testTweetUrl }]
      }
    ]
  };
}

async function main() {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL2; // Secrets から設定されたURL
  if (!webhookUrl) {
    throw new Error('TEAMS_WEBHOOK_URL2 is not set');
  }

  const messageCard = createTeamsMessageForTest();

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageCard)
  });

  if (!res.ok) {
    throw new Error(`Teams webhook post failed. Status: ${res.status}`);
  }

  console.log('Teams への送信に成功しました');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
