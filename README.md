# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## 環境變數設置

為了正確運行此應用程序，您需要設置以下環境變數。請創建一個 `.env` 文件在專案根目錄下，並填入以下內容：

```
# Supabase 認證
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# PostgreSQL 連接字串 (僅在直接連接資料庫時需要)
VITE_POSTGRES_CONNECTION_STRING=postgresql://username:password@host:port/database

# Deepseek API 設定
VITE_DEEPSEEK_API_URL=https://api.deepseek.com
VITE_DEEPSEEK_API_KEY=your-deepseek-api-key
VITE_DEEPSEEK_MODEL=deepseek-chat

# OpenAI API 設定
VITE_OPENAI_OFFICIAL_API_URL=https://api.openai.com
VITE_OPENAI_PROXY_API_URL=https://api.uchat.site
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_OPENAI_MODEL=gpt-4o-image-vip
```

注意：請將上述示例中的值替換為您自己的實際值。

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
