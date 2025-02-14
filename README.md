
# README.md

# Teams-SEO-Status-Monitor-for-DigiMado

GitHub Actions を用いて以下のタスクを自動化し、結果を Microsoft Teams (以下、Teams) に通知するリポジトリです。

1. **Check 404 (Python)**  
   - サイトマップを読み込み、各ページのステータスを確認して 404 エラーを検出。  
   - エラー検出結果を Teams に通知。

2. **Link Checker (Python + Google Sheets)**  
   - 内部リンク・外部リンクをクローリングし、404 エラーを検出。  
   - 検出したリンク切れを Google Sheets に追記。  
   - 最終的なサマリーを Teams に通知。

3. **Monitor GoogleSearchCentral Tweets (Node.js)**  
   - Google Search Central ([@googlesearchc](https://twitter.com/googlesearchc)) アカウントの最新ツイートを定期的に取得。  
   - 新着ツイートがあれば Teams に通知し、最新ツイートIDをコミットしてバージョン管理。

4. **(参考) Google Search Status Monitor (Python)**  
   - [Google Search Status Dashboard](https://status.search.google.com/summary) から状態を取得し、"Available" 以外の場合に Teams に通知するサンプル。

---

## 特徴

- **自動化フロー**: GitHub Actions 上で cron や手動トリガー (workflow_dispatch) によって実行されます。
- **通知先**: Microsoft Teams のチャンネルに対して Webhook 通知を行います。
- **外部リソース**: Google Sheets への書き込みが行われるため、GCP の Service Account JSON をシークレットとして扱います。
- **Twitter API**: 最新ツイートを取得するために Twitter API(Bearer Token) が必要です。

---

## セットアップ手順

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/niki-nakamura/teams-bot-search-update-monitor.git
   cd teams-bot-search-update-monitor
   ```

2. **依存関係のインストール**

   - Python 側:
     ```bash
     pip install --upgrade pip
     pip install -r requirements.txt
     ```
   - Node.js 側:
     ```bash
     npm install
     # 本リポジトリでは node-fetch@2 を使用
     ```

3. **シークレットの設定 (GitHub Actions の場合)**  
   GitHub リポジトリ設定 > Secrets and variables > Actions にて、以下のシークレットを登録してください。

   - `TEAMS_WEBHOOK_URL`  
     Teams の Incoming Webhook 用 URL (404チェックやクローリング結果用)
   - `TEAMS_WEBHOOK_URL2`  
     Teams の Incoming Webhook 用 URL (GoogleSearchCentral のツイート監視用 等)
   - `TWITTER_BEARER_TOKEN`  
     Twitter API ベアラートークン
   - `GCP_SERVICE_ACCOUNT_JSON`  
     Google Sheets に書き込む際に利用する GCP Service Account JSON 全文

4. **必要に応じてワークフローの有効化/無効化**  
   `.github/workflows/` 下にある各 `.yml` ファイルの `on:` セクションを確認し、実行タイミングを調整してください。

---

## ワークフロー構成

### 1. Check 404

- **ファイル**: [`.github/workflows/check_404.yml`](./.github/workflows/check_404.yml)  
- **主な処理**:  
  1. Python スクリプト `scripts/check_404.py` を実行。  
  2. 予め指定されたサイトマップ URL (`MAIN_SITEMAP_URL`) を辿り、404 を検出。  
  3. Teams の Webhook (`TEAMS_WEBHOOK_URL`) に通知。

### 2. Link Checker

- **ファイル**: [`.github/workflows/link_checker.yml`](./.github/workflows/link_checker.yml) など (複数バージョンが存在)  
- **主な処理**:  
  1. Python スクリプト `scripts/crawl_links.py` を実行。  
  2. サイト内をクロールし、リンク切れ (404) を検出。  
  3. 検出したリンク切れ情報を Google Sheets に追記。  
  4. Teams に通知。

### 3. Monitor GoogleSearchCentral Tweets

- **ファイル**: [`.github/workflows/monitor_gc_tweets.yml`](./.github/workflows/monitor_gc_tweets.yml)  
- **主な処理**:  
  1. Node.js スクリプト `scripts/monitor_teams.js` を 30 分おき（`cron: '*/30 * * * *'`）に実行。  
  2. Twitter API を用いて @googlesearchc アカウントの最新ツイートを取得。  
  3. 直近のツイートID との差分がある場合に Teams に通知。  
  4. 新しいツイートID を `latest_tweet_id.json` に書き込み、GitHub へコミット＆プッシュ。

---

## 使用するスクリプト一覧

### `scripts/check_404.py`
- 指定したサイトマップ（`MAIN_SITEMAP_URL`）から全ての URL を取得し、各ページが 404 エラーを返していないかチェック。
- 結果を Teams に通知。

### `scripts/crawl_links.py`
- 指定したトップページ (例: `https://digi-mado.jp/`) から内部リンクを幅広くクロール。
- 404 エラーの検出結果を Google Sheets と Teams に連携。

### `scripts/monitor_teams.js`
- @googlesearchc (ID: `22046611`) の最新ツイートを取得し、前回記録したツイートIDとの比較を行う。
- 新着があれば Teams へメッセージカード形式で通知し、`latest_tweet_id.json` を更新（コミット＆プッシュ）。

### `scripts/test_message.js`
- Teams Webhook への疎通確認 (テスト) 用スクリプト。

### (参考) `google_status_monitor.py` 等
- Google Search Status Dashboard から状態をパースして、"Available" 以外であれば Teams に通知するサンプル。
- (ワークフロー未定義の場合は手動実行か、任意のスケジュールでセットアップ)

---

## 環境変数

- **TEAMS_WEBHOOK_URL** / **TEAMS_WEBHOOK_URL2**  
  - Teams に送信するための Webhook URL。GitHub Secrets で管理。
- **TWITTER_BEARER_TOKEN**  
  - Twitter API の Bearer Token。GitHub Secrets で管理。
- **GCP_SERVICE_ACCOUNT_JSON**  
  - Google Sheets に書き込むための Service Account JSON。本 JSON はベタ書きではなく、GitHub Secrets 経由で扱います。

---

## 実行方法

- **手動実行 (workflow_dispatch)**:  
  GitHub Actions タブから各ワークフローを選択し、"Run workflow" ボタンを押す。
- **スケジュール実行**:  
  `cron: '*/30 * * * *'` や `schedule: ...` で指定。30分おきや日次など自由に調整可能。

---

## 注意点

- **API制限**: Twitter API はレートリミットを受ける可能性があります。スクリプト内では簡単なリトライを実装していますが、頻繁すぎるリクエストを避けてください。
- **Google Sheets 追記**: 404 リンクが大量に検出された場合はシート行数が急増する可能性があるため、運用時は適切なシート管理が必要です。
- **セキュリティ**: Service Account JSON や Webhook URL、Twitter Token などは外部に漏れないように注意してください（GitHub Secrets で管理する）。

---

## ライセンス

本リポジトリのコードは、特に指定がない限り [MIT License](LICENSE) に準拠します。  
利用時にはソースコード内のコメントや本 README に記載の内容を踏まえ、適切にご活用ください。
