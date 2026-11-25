# DEAD ZONE: LAST SURVIVOR — iPad対応 Phase 1

## 内容
- Three.jsによる3D終末世界
- iPadのタッチ操作に対応
- 左下のバーチャルスティック：移動
- 画面右側のドラッグ：視点移動
- JUMP：ジャンプ / RUN：ダッシュ
- WASD・Shift・Spaceによるキーボード操作にも対応
- 建物・廃車の簡易衝突判定、霧、夕暮れの照明、瓦礫

## iPadで遊ぶ方法
このZIPを展開しただけでは、iPadの「ファイル」アプリから直接開けません（JavaScriptのモジュール読み込み制限があるため）。
次のどちらかでHTTPS公開してください。

### 方法A：GitHub Pages（無料）
1. GitHubで新しい公開リポジトリを作成
2. ZIPを展開し、`index.html`、`style.css`、`src`フォルダをリポジトリ直下にアップロード
3. リポジトリの Settings → Pages → Deploy from a branch → `main` / `root` を選んで保存
4. 発行された `https://ユーザー名.github.io/リポジトリ名/` をiPadのSafariで開く

### 方法B：Mac/PCからローカル配信
フォルダでターミナルを開き、`npx vite --host 0.0.0.0` を実行。
同じWi-FiのiPadで表示されたMac/PCのローカルIPとポートにアクセスします。

## 注意
- Three.jsをCDNから読み込むため、初回起動時にインターネット接続が必要です。
- 横画面でのプレイを推奨します。
- Phase 1は探索用プロトタイプです。ゾンビAI・戦闘・セーブ機能はまだありません。
