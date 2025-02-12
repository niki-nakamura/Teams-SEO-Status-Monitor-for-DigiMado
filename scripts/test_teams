/* test_teams.js */
const fetch = require('node-fetch');

// Teams用Webhook URL（環境変数）
const TEAMS_WEBHOOK_URL2 = process.env.TEAMS_WEBHOOK_URL2;

/**
 * Teams向けのMessageCardペイロードを作成する関数
 * - タイトル、本文、リンクボタンを含むカードを生成
 */
function createTeamsMessageForTest() {
  // テスト用のツイートURL（プレビュー用のパラメータ付与）
  const testTweetUrl = 'https://x.com/googlesearchc/status/1873848143168889194?test=123';

  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Google Search Central のXアカウント更新",
    "themeColor": "0076D7",
    "title": "Google Search Central のXアカウントが更新されました!!",
    "text": `Google Search Central's X account has been updated!\n\n[詳細を見る](${testTweetUrl})`,
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "X(Twitter)で詳細を見る",
        "targets": [
          { "os": "default", "uri": testTweetUrl }
        ]
      }
    ]
  };
}

async function postTestMessageToTeams() {
  const payload = createTeamsMessageForTest();

  const response = await fetch(TEAMS_WEBHOOK_URL2, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Teams Webhook error: ${response.status} ${response.statusText}`);
  }
  console.log('✅ テストメッセージをTeamsに送信しました。');
}

// 実行
(async function main() {
  try {
    if (!TEAMS_WEBHOOK_URL2) {
      console.error('環境変数 TEAMS_WEBHOOK_URL2 が設定されていません。');
      process.exit(1);
    }
    await postTestMessageToTeams();
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
})();

