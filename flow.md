
## flow.md

# システムフロー・ドキュメント

本ドキュメントでは、各自動化処理の処理フローと連携関係について説明します。

---

### 1. 404チェックフロー
1. **起点**  
   - ワークフロー「Check 404」（`check_404.yml`）が手動実行または必要に応じたトリガーで起動。

2. **処理内容**  
   - **コードのチェックアウト**  
     GitHubリポジトリを取得。
   - **Python環境のセットアップ**  
     actions/setup-pythonでPython3.xを利用。
   - **依存関係のインストール**  
     `pip install -r requirements.txt` により必要ライブラリをインストール。
   - **404チェック実行**  
     `scripts/check_404.py`が実行され、以下の手順で処理：
     - メインサイトマップ（例: `https://digi-mado.jp/sitemap.xml`）を取得。
     - サブサイトマップやページURLを再帰的に抽出。
     - 各URLに対してHTTPリクエストを送り、404エラーを検出。
     - 結果に応じてTeamsへ通知（Webhook経由）。

---

### 2. リンクチェッカーフロー
1. **起点**  
   - ワークフロー「Link Checker」（`crawl_links.yml`）が手動実行される。

2. **処理内容**  
   - **コードのチェックアウト**  
     リポジトリを取得。
   - **Python環境のセットアップと依存関係のインストール**  
     `pip install --upgrade pip` + `pip install -r requirements.txt`。
   - **GCPサービスアカウントの準備**  
     GitHub SecretsからサービスアカウントJSONを取得し、一時ファイルとして保存。
   - **サイトクロール実行**  
     `scripts/crawl_links.py` により以下を実施：
     - 開始URL（例: `https://digi-mado.jp/`）からクロール開始。
     - 内部リンク・外部リンクそれぞれに対してHTTPリクエスト（GETまたはHEAD）を実施。
     - 404エラー（またはエラー発生）を検出した場合、リンク情報を記録。
   - **ログ更新**  
     検出したリンク切れ情報をGoogle Sheetsに記録（gspread利用）。
   - **Teams通知**  
     検出結果のサマリーをTeamsへ送信。
   - **後処理**  
     サービスアカウントファイルの削除。

---

### 3. Google Search Central（旧Twitter/X）更新監視フロー
1. **起点**  
   - ワークフロー「Monitor GoogleSearchCentral Tweets to Teams」（`tweet_monitor_teams.yml`）がスケジュール（30分おき）または手動実行で起動。

2. **処理内容**  
   - **コードのチェックアウト**  
     最新コミットの取得（fetch-depth: 0）。
   - **Node環境のセットアップ**  
     actions/setup-nodeによりNode.js v18を利用。
   - **依存関係のインストール**  
     `npm install node-fetch@2` 等で必要パッケージを導入。
   - **ツイート監視スクリプト実行**  
     `scripts/monitor_teams.js` により以下の処理を実施：
     - Twitter APIを利用して最新ツイート情報を取得。
     - ローカルファイル（`latest_tweet_id.json`）に記録されたIDと比較。
     - 新規ツイートが存在する場合、TeamsへMessageCard形式で通知を送信。
     - 最新ツイートIDをファイルに更新し、gitコミット＆プッシュを実施。

---

### 4. SEOアップデート監視（オプション）
- **処理内容**  
  - 別途実行可能なPythonスクリプト（例: `main_announce_teams.py`）が、Google Search StatusページからSEOアップデート情報を取得。
  - 特定条件（例：fill_colorが`"#1E8E3E"`でない場合）の際、Teamsへ詳細情報付きの通知を送信。

---

このシステム全体では、各ワークフローが定期的またはオンデマンドで実行され、Webサイトの品質監視や最新情報の通知を自動化することで、管理者が迅速に状況を把握できるよう設計されています。
