import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署于 https://weilv-d.github.io/tomyself2026/，故 base 必须匹配仓库名。
// 本地开发时 vite 会自动以 base 为根，无需额外处理。

// https://vite.dev/config/
export default defineConfig({
  base: '/tomyself2026/',
  plugins: [react()],
})
