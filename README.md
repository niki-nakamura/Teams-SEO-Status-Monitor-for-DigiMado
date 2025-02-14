
## README.md

# niki-nakamura teams-bot-search-update-monitor

### 概要
本リポジトリは、GitHub Actionsと各種スクリプトを活用し、WebサイトのリンクチェックやSEOアップデート、Google Search Central（旧Twitter/X）の最新情報を監視し、Microsoft Teamsへの通知やGoogle Sheetsへのログ更新を自動化する仕組みを提供します。

### 主な機能
- **404エラーチェック**  
  サイトマップ（例: [digi-mado.jp/sitemap.xml](https://digi-mado.jp/sitemap.xml)）をもとに全URLを取得し、各ページのHTTPステータスを確認。404エラーが発生した場合、Teamsへ通知します。

- **リンクチェッカー（クロール）**  
  サイト内外のリンクをクロールし、リンク切れ（404エラー）の検出と検出元ページの記録を実施。検出結果はGoogle Sheetsに記録され、Teamsへサマリーメッセージが送信されます。

- **Google Search Central（旧Twitter/X）更新監視**  
  Twitter APIを利用してGoogle Search Centralアカウントの最新ツイートをチェック。新規ツイートがある場合、Teamsへ詳細情報付きで通知し、最新ツイートIDをリポジトリにコミットします。

- **SEOアップデート状況のモニタリング**  
  Google Search StatusからSEOアップデート情報を取得し、特定の状態（例："Available" 以外）の場合、Teamsへ通知を送信します。

### フォルダ構成

```
.
├── .github
│   └── workflows
│       ├── check_404.yml
│       ├── crawl_links.yml
│       ├── test.yml
│       └── tweet_monitor_teams.yml
├── scripts
│   ├── check_404.py
│   ├── crawl_links.py
│   ├── main_announce_teams.py
│   ├── monitor.js
│   ├── monitor_teams.js
│   ├── test_slack.js
│   └── test_teams.js
├── .gitignore
├── README.md
├── flow.md
├── latest_tweet_id.json
├── package.json
├── requirements.txt
└── ...
```

### セットアップ
1. **GitHub Secrets の設定**  
   本リポジトリでは以下のシークレットを利用します。
   - `TEAMS_WEBHOOK_URL`：Teams通知用Webhook URL  
   - `TEAMS_WEBHOOK_URL2`：ツイート監視およびSEOアップデート通知用Webhook URL  
   - `TWITTER_BEARER_TOKEN`：Twitter API用のBearer Token  
   - `GCP_SERVICE_ACCOUNT_JSON`：Google Sheets連携用のサービスアカウントJSON

2. **Googleサービスアカウントの作成とシート設定**  
   - Google Sheets APIの有効化  
   - サービスアカウントの作成後、JSONキーを取得し、上記シークレットに登録  
   - シートID（`scripts/crawl_links.py`内の`GOOGLE_SHEET_ID`）を適切なGoogle SheetsのIDに変更

3. **ワークフローの利用方法**  
   各ワークフローはGitHub Actions上で手動実行（workflow_dispatch）またはスケジュール実行（例：30分おき）となっており、必要に応じて実行タイミングを調整してください。

### 使用方法
- **404チェック**  
  GitHub Actions上で「Check 404」ワークフロー（`check_404.yml`）を実行すると、対象サイトの全URLをチェックし、Teamsに結果を通知します。

- **リンクチェッカー**  
  「Link Checker」ワークフロー（`crawl_links.yml`）を実行すると、サイトをクロールしてリンク切れを検出。Google Sheetsへ自動でログを更新し、Teamsに通知します。

- **Google Search Central更新監視**  
  定期的に実行される「Monitor GoogleSearchCentral Tweets to Teams」ワークフロー（`tweet_monitor_teams.yml`）により、最新ツイートの確認と通知が行われ、変更があればリポジトリ内の`latest_tweet_id.json`が更新されます。

### 開発・貢献
ご意見やプルリクエストは大歓迎です。  
不具合報告や機能追加のリクエストはGitHub Issuesをご利用ください。

### ライセンス
本プロジェクトはMITライセンスの下で提供されています。詳細は[LICENSE](LICENSE)をご確認ください。
