
# コード品質維持について

## Github ActionsのCIパイプラインについて

このリポジトリでは、GitHub Actions を用いて **CI パイプライン**を構築しています。  
以下のタイミングで、自動的にチェックやビルドが実行されます。

### 実行タイミング
- **Pull Request 作成時**  
- **Pull Request 作成後のコミットプッシュ時**  
- **main ブランチへのマージ時**

### 実行される処理
1. **ESLint と Prettier によるコード整形・検証**  
   - コマンド:  
     ```bash
     npm run format
     ```
   - このコマンドで ESLint と Prettier を一括実行します。  

2. **ビルド確認**  
   - Next.js プロジェクトが正しくビルドできるかを確認します。  
   - 本番環境に近い形でのエラー検出が目的です。

---

### ポイント
- ローカルでも `npm run format` を実行すれば、CI と同じチェックを手元で再現できます。  
- CI が失敗した場合は、まず `npm run format` を実行してフォーマットを揃え、再度コミット・プッシュしてください。


## Git Pre-commit Hook 導入手順
### 概要
このプロジェクトでは、**コミット前に ESLint / Prettier / Ruff を自動実行**してコード整形・検証を行います。  
対象ファイルは Git でステージされた変更ファイルのみです。  

- フロントエンド: ESLint + Prettier  
- バックエンド: Ruff (format + check --fix)  

### 導入手順

#### 1. フックスクリプトを配置
`.githooks/pre-commit` に以下のスクリプトを配置し、実行権限を付与します。

```bash
chmod +x .githooks/pre-commit
```

#### 2. Git にフックを登録

リポジトリルートで以下を実行し、`pre-commit` フックをこのスクリプトに差し替えます。

```bash
git config core.hooksPath .githooks
```

これにより、以降のコミットで自動的にフックが実行されます。

---

### OS 別の説明

#### Linux / macOS

* `bash` が標準で入っているので追加準備は不要です。
* 実行権限を付与しておくことだけ確認してください。

#### Windows (WSL)

* **WSL2 + Ubuntu** など Linux 環境で実行してください。
* Git Bash からでも動作することを確認済みですが、環境によって `xargs` / `grep -z` が正しく動かない場合があります。
* Windows ネイティブ Git を使う場合は、MSYS2 由来のコマンド互換性に注意してください。WSLを用いることを推奨します。

### よくある WARN メッセージについて

フック実行時に以下のような警告が出る場合があります:

```
WARN[0000] Found orphan containers ([postgre_db]) for this project. 
If you removed or renamed this service in your compose file, 
you can run this command with the --remove-orphans flag to clean it up.
```

これは **過去の Docker Compose で起動したコンテナ(postgre\_db)が残っている**だけで、**フックの lint 実行には影響しません**。 無視して問題ありません。

