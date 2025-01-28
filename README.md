最終的には、**GitHubリポジトリを作成**して、**GitHub Actionsの定期実行（スケジューリング）**で  
1. Google公式ブログやSearch Central Blog、SEMrush（セムラッシュ）のアップデート情報（ブログやRSS、あるいはSensor情報など）を自動チェック  
2. 新しい更新があったらTeamsにアラートを送る（BOTまたはWebhook）  

という一連の仕組みを作ります。

---

## 1. リポジトリのタイトルとディスクリプション

### リポジトリ名 (例)
```
teams-bot-search-update-monitor
```
### リポジトリの説明 (例)
```
Google検索アルゴリズムやランキング関連の最新アップデート情報を自動的に取得し、Teamsで通知するボット
```

---

## 2. リポジトリの作成手順

1. **GitHubにログイン**します。（[GitHub](https://github.com/)）
2. 右上の「**+**」アイコンから「**New repository**」を選択します。
3. 以下の情報を入力します:
   - **Repository name**: 上記の例を参考に入力 (teams-bot-search-update-monitor)
   - **Description**: 上記の例を参考に説明を入力
   - **Public / Private**: どちらでも可（社内用ならPrivateを推奨）
4. 「**Create repository**」ボタンを押してリポジトリを作成します。

---

## 3. Microsoft TeamsでWebhookを作成する

Teamsに通知する方法はいくつかありますが、**Incoming Webhook**を使うのが一番簡単です。  
BOTとして実装する場合は追加の開発やMicrosoft Azure Bot登録などが必要になりますが、Webhookなら設定のみでOKです。

1. **Teamsを開く**  
2. 通知を受け取りたい**チャンネル**に移動し、「**チャンネルの[···]メニュー → コネクタ**」をクリック  
3. 「**Incoming Webhook**」を追加  
4. 名前（例：`Google Update Alert`）とアイコンなど設定して**Webhook URLをコピー**  
   - このWebhook URLはGitHub Actionsで使うので**メモしておく**こと

---

## 4. GitHub Actionsのワークフローを作成する

### 4-1. ワークフロー用ディレクトリの作成

1. 作成したリポジトリにアクセスし、「**Add file → Create new file**」を選択
2. ファイル名に「`.github/workflows/search-update-monitor.yml`」と入力  
   （`.github/workflows`というフォルダは、GitHub Actionsのワークフロー配置専用フォルダです）

### 4-2. TeamsのWebhook URLをGitHub Secretsに登録

- セキュリティのため、Webhook URLはソースコードに直接書かず、**GitHub Secrets**に登録して呼び出す方法が安全です。
  
1. リポジトリのメイン画面で「**Settings**」タブをクリック  
2. 左メニューから「**Secrets and variables → Actions**」を選択  
3. 「**New repository secret**」ボタンを押し、  
   - **Name**: `TEAMS_WEBHOOK_URL` など（大文字・アンダースコアが一般的）  
   - **Secret**: 先ほどコピーしたWebhook URL  
   - を入力して保存

### 4-3. ワークフローファイルの記述例

下記の例では**Node.js**を使ってRSSやページ情報を取得する想定です。Pythonでも同様に実装可能です。  
新着があれば、Teams WebhookへPOSTリクエストを送り、更新情報を通知する簡単な例を示します。

```yaml
name: Search Update Monitor

on:
  schedule:
    # 毎日朝9時に実行 (UTCなので、必要に応じて調整)
    - cron: '0 0 * * *'
  # リポジトリにpushしたときなどに手動でテストしたい場合
  workflow_dispatch:

jobs:
  check-updates-and-alert:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v3

      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: 16

      - name: Install dependencies
        run: npm install

      - name: Run update monitor script
        run: node monitor.js
        env:
          TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
```

- `cron: '0 0 * * *'` はUTCで深夜0時。日本時間で朝9時にしたい場合は `'0 0 * * *'` を `'0 0 * * *'` (UTC+9=差分で調整) などに書き換える必要があります。  
  - 例: 日本時間毎日9時 → cronは `'0 0 * * *'`（UTCで0時）。もし1日1回実行であればUTC=0時に走らせて日本時間=9時と認識する形。  
  - cronを設定するときは[Crontab.guru](https://crontab.guru/)などで確認してください。

---

## 5. 実際のコードイメージ

上記ワークフローの中で動かす `monitor.js` (Node.js) のサンプルイメージを示します。  
ここでは、**Google公式ブログ**と**Google Search Central Blog**、そして**SEMrush Sensorページ**の例を使い、  
単純にRSSやページを取得して、更新があればTeamsに通知する仕組みにします。

> **注意**: 実際には各サイトのRSSフィードURLや構造（APIエンドポイント）が変わることがあります。事前に公式ドキュメントでRSSのURLなどを確認してください。

```js
// monitor.js
const fetch = require('node-fetch');
const Parser = require('rss-parser'); // npm install rss-parser
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
```

### 必要なライブラリのインストール
- `fetch`はNode.js 18以上で標準搭載ですが、古いNode.jsを使う場合は `node-fetch` のインストールが必要です。
- RSSを解析するために `npm install rss-parser` が必要です。

```bash
npm init -y
npm install node-fetch rss-parser
```

その後、`package.json` 内の `scripts` に `"monitor": "node monitor.js"` のようにしておくと  
ローカルで `npm run monitor` でテスト実行できます。

---

## 6. 運用・カスタマイズ

1. **スケジュール設定**  
   - `cron: '0 0 * * *'`を変更することで、実行タイミングを変更できます。  
   - 例えば日本時間で毎朝9時なら `'0 0 * * *'`でUTC=0時→日本時間=9時。  
   - もう少し頻度高くチェックしたいなら1日2回や3回などに調整してください。

2. **監視対象サイトの追加**  
   - 今回はGoogleの公式関連やSEMrushを例にしましたが、他にMozやSearch Engine LandなどのRSSも追加すると、さらに網羅的な情報を得られます。  
   - RSSフィードやAPIが公開されていない場合、スクレイピングして差分をとる方法もありますが、**利用規約に注意**してください。

3. **通知内容のカスタマイズ**  
   - Teamsのメッセージをリッチにする場合は、[Adaptive Cards](https://learn.microsoft.com/ja-jp/microsoftteams/platform/task-modules-and-cards/what-are-cards#adaptive-cards)を使う方法もあります。  
   - ただし、Incoming Webhookの場合はシンプルなJSONしか受け付けないケースが多いので、カードを使うにはBotフレームワークや別の連携が必要です。

4. **差分検知方法の高度化**  
   - 今回は「**過去24時間に更新されたもの**」という単純な基準ですが、本格的にやるなら「最後にチェックしたときからの差分」を管理するために、ローカルファイルやDB（GitHub Actionsなら[Artifacts](https://docs.github.com/ja/actions/using-workflows/storing-workflow-data-as-artifacts)や[Cache](https://docs.github.com/ja/actions/using-workflows/caching-dependencies-to-speed-up-workflows)）を使用したり、外部のデータストアに記録する方法もあります。  

---

## 7. まとめ

- **GitHubリポジトリを作成** → `.github/workflows/` フォルダに**ワークフローファイル**を作成  
- **Teams Incoming Webhook**を取得 → **GitHub Secrets**に登録 (例: `TEAMS_WEBHOOK_URL`)  
- **Node.jsのスクリプト**などでRSS（Google公式ブログ、Search Central Blog、SEMrushなど）を取得 → 差分チェック  
- **新着があれば**Teamsへ通知  

---

### 参考リンク
- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [Microsoft Teams での Incoming Webhook 設定手順](https://learn.microsoft.com/ja-jp/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [Crontab.guru (cron設定の確認)](https://crontab.guru/)
- [Google Developers Japan Blog (Search Central Blog)](https://developers-jp.googleblog.com/)
- [Google Official Blog (英語版)](https://blog.google/)
- [SEMrush Sensor](https://www.semrush.com/sensor/) (要APIリファレンス調査)

---

これで、**新たなTeamsボット（あるいはWebhook通知）**として、**検索アルゴリズム/ランキングアップデート関連**の情報を定期的に収集し、**Teamsでアラート**する仕組みが構築できます。ぜひお試しください。  
