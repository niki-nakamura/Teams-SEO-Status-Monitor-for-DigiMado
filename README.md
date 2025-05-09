# Teams-SEO-Status-Monitor-for-DigiMado

このリポジトリは、X（旧Twitter）の [@googlesearchc](https://x.com/googlesearchc) アカウントの最新ツイート（本文および画像）を取得し、Microsoft Teams に通知するボットです。**Teams の Incoming Webhook** 機能を利用し、指定のTeamsチャネルに自動で投稿内容を転送します。

## 機能概要

- 指定された X アカウント (@googlesearchc) の最新投稿（ツイート）を取得します。  
- ツイートの本文テキストと添付画像（存在すれば最大4枚まで）を抽出します。  
- Microsoft Teams の指定チャネルに、Webhook を通じて上記内容を投稿します。投稿にはツイート本文と画像が含まれ、元ツイートへのリンクも添付されます。  
- GitHub Actions により、本スクリプトが **毎日午前6時(JST)** に定期実行されます。

## セットアップ方法

1. **TeamsでIncoming WebhookのURLを取得**: 通知を送りたいMicrosoft Teamsチャネルにて、チャネルの「コネクタ」を開き、「Incoming Webhook (受信 Webhook)」を追加してください。任意の名前とアイコンを設定すると、**Webhook URL**が発行されます。このURLをコピーして控えます。  

2. **GitHubリポジトリのシークレットを設定**: 上記で取得した Webhook URL をGitHubのリポジトリシークレットに登録します。シークレット名は `TEAMS_WEBHOOK_URL` とします。  
   - GitHub のリポジトリ設定から **Settings > Secrets and variables > Actions** に進み、「New repository secret」を選択して `TEAMS_WEBHOOK_URL` を作成し、値にコピーしたURLを貼り付けて保存します。

3. **（オプション）ローカルで動作確認**: 開発マシンで動作を確認する場合、Python 3.8+ が必要です。リポジトリをクローンし、必要なライブラリをインストールしてください:  
   ```bash
   pip install -r requirements.txt
