/* test_teams.js */
const fetch = require('node-fetch');

// Teams用Webhook URL（環境変数）
const TEAMS_WEBHOOK_URL2 = process.env.TEAMS_WEBHOOK_URL2;

async function postTestMessageToTeams() {
  // シンプルなペイロード例
  const payload = { text: "Test message from Teams webhook test." };

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
