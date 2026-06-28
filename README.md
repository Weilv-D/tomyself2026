# 考研日课 · Daily Chronicle

考研每日学习打卡、作息统计与计划管理。黑白严肃报纸风格，纯静态部署于
GitHub Pages，数据经 GitHub Contents API 同步，多设备共用一份记录。

> 线上：https://weilv-d.github.io/tomyself2026/

## 功能

- **今日课表**　按生物钟（超日节律）排好的每日时间块；勾选打卡、记录实际学习
  时长、写手记备注；顶部显示「实际 / 计划 / 完成率」三项进度；当前所在时段高亮。
  可按日期前后翻页（不允许跳到未来）。
- **数据档案**　四个面板，图表全部纯 SVG / CSS 手写：
  - 科目学习时长（条形图）
  - 连续打卡 · 热力图（近 18 周，按完成率分五档灰阶）
  - 计划 vs 实际学习时长（折线对比）
  - 今日 24 小时作息时间轴（含「此刻」指示线）
  - 范围切换：本周 / 近 30 日 / 全部
- **作息方略**　时间块可增删改、上下排序；支持 JSON 导出与粘贴导入；
  一键恢复内置默认作息。
- **同步**　数据写入仓库 `data/app.json`，多设备共用；带 SHA 乐观锁，
  按修改时间戳合并，离线时自动回退本地存储。

## 本地开发

```bash
npm install
npm run dev      # 本地预览 http://localhost:5173/tomyself2026/
npm run build    # 类型检查 + 生产构建到 dist/
npm run lint     # oxlint
```

> `vite.config.ts` 里 `base` 设为 `/tomyself2026/`，须与仓库名一致；
> 故本地预览路径带此前缀。

## 部署到 GitHub Pages

1. 推送 `main` 分支，`.github/workflows/deploy.yml` 自动构建并发布。
2. 进 **Settings → Pages → Build and deployment**，Source 选
   **GitHub Actions**（用官方 `deploy-pages` action，无需手选分支）。
3. Actions 跑完即可访问上面的线上地址。

## 启用数据同步

应用数据存于仓库 `data/app.json`。多设备同步需配一个 Personal Access Token：

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens** → Generate new token。
2. **Repository access** 选 `Only select repositories` → 选 `tomyself2026`。
3. **Permissions → Repository permissions → Contents: Read and write**
   （其余保持 No access）。
4. 复制 token（形如 `github_pat_…`）。
5. 应用「同步」页填：用户名 `Weilv-D`、仓库 `tomyself2026`、分支 `main`、
   路径 `data/app.json`，粘贴 token，保存。
6. 点「验证连通性」，再拉取 / 推送 / 同步。

> **令牌安全。** Token 只存在当前浏览器的 localStorage，不经过任何第三方。
> 但 localStorage 对页面脚本可见，勿在公共电脑上长期保存；设置页可随时清除。
> 怀疑泄露，到 GitHub 把它删掉重发即可。

## 同步机制

- **拉取**　读远程 `data/app.json`，与本地按时间戳合并。
- **推送**　本地数据写回远程，带 SHA 乐观锁，防止并发覆盖；远程文件不存在时
  自动新建。
- **同步**　先拉取合并，再推送。
- **离线优先**　所有数据先写 localStorage；联网后手动或自动（可配置）同步。

合并策略为**按修改时间戳的「最后写入优先」(Last-Write-Wins)**：

- 打卡记录逐日逐块比较时间戳，取新者的整条记录（勾选 / 时长 / 备注作为原子
  单元跟随该块时间戳）；真冲突时保留较新一份。
- 作息计划作为整体比较时间戳，取新者的整份（不做逐块混搭，避免时段错乱）。
- 没有时间戳的记录视为最旧，任何新写入都会覆盖它。

> 建议在编辑前先拉取远程最新，可减少时钟偏差导致的冲突覆盖。

## 技术栈

Vite + React 19 + TypeScript + react-router（HashRouter）。样式为手写衬线报纸
风格（Noto Serif SC / Playfair Display / EB Garamond / IBM Plex Mono /
Cormorant Garamond 分层），图表与时间轴均为纯 SVG / CSS，无第三方图表库。
