# 是々日々 / 徒然日記

Supabase と Next.js App Router で作る、スマホ中心の個人用日記PWAです。

## 主な機能

- Supabase Auth によるメール/パスワード認証
- 今日の日記の作成、編集、自動保存
- 過去日記のカレンダー表示
- タグ、キーワード検索、条件検索
- JSONインポート/エクスポート
- PINによるアプリ内ロック
- 簡易分析ダッシュボード
- PWA manifest と service worker

## セットアップ

1. `.env.example` を参考に `.env.local` を作成します。Supabaseの新UIでは `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を使います。
2. Supabase SQL Editor で `supabase/schema.sql` を実行します。
3. 依存関係を入れて起動します。

```bash
pnpm install
pnpm dev
```

## Vercel

Vercel の Environment Variables に `.env.example` の値を登録してください。
`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用です。クライアントへ出さないでください。
