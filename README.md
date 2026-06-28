# 考研日课 · Daily Chronicle

考研每日学习打卡与作息统计，黑白严肃报纸风格，部署于 GitHub Pages。
数据通过 GitHub Contents API 同步至仓库的 `data/app.json`，支持多设备。

## 本地开发

```bash
npm install
npm run dev      # 本地预览（http://localhost:5173/tomyself2026/）
npm run build    # 生产构建至 dist/
```

> 因 `vite.config.ts` 中 `base` 设为 `/tomyself2026/`，本地预览路径带此前缀。

## 首次部署 GitHub Pages

1. 推送 `main` 分支后，仓库会自动触发 `.github/workflows/deploy.yml`，
   构建并把产物发布到 Pages。
2. 进入仓库 **Settings → Pages → Build and deployment**，
   "Source" 选择 **GitHub Actions**（本工作流使用官方 deploy-pages action，
   无需手动选分支）。
3. 等待 Actions 完成，访问：

   ```
   https://weilv-d.github.io/tomyself2026/
   ```

## 启用数据同步

应用的打卡数据存于仓库 `data/app.json`。要实现多设备同步，需配置一个
Personal Access Token：

1. 打开 GitHub → Settings → Developer settings → Personal access tokens
   → **Fine-grained tokens** → Generate new token。
2. **Repository access** 选 `Only select repositories` → 选 `tomyself2026`。
3. **Permissions** → Repository permissions →
   **Contents: Read and write**（其余保持 No access）。
4. 生成并复制 token（形如 `github_pat_…`）。
5. 在应用的「同步」页填写：用户名 `Weilv-D`、仓库 `tomyself2026`、
   分支 `main`、路径 `data/app.json`，粘贴 token，保存。
6. 点「验证连通性」确认，随后即可拉取 / 推送 / 同步。

> **安全提示**：token 仅保存在当前浏览器的 localStorage，不会上传至任何第三方。
> 但 localStorage 对页面脚本可见，请勿在公共电脑上长期保存。可在设置页随时清除。

## 同步机制

- **拉取**：读取远程 `data/app.json`，与本地按日期合并（冲突块保留两份备注）。
- **推送**：将本地数据写回远程，带 SHA 乐观锁，防止并发覆盖。
- **同步**：先拉取合并，再推送。
- 首次远程文件不存在时，推送会自动创建。

## 技术栈

Vite + React 18 + TypeScript + react-router (HashRouter)。
样式为手写衬线报纸风格，图表与时间轴均为纯 SVG / CSS。
