# Vocaboost

**Vocaboost** 是一个个人词汇学习助手，旨在帮助你高效地追踪、复习和掌握新单词。它基于 SvelteKit 构建，提供流畅的“离线优先”体验。

## ✨ 功能特性

- **离线优先架构**：使用 IndexedDB 将所有数据存储在本地，确保极速访问和数据隐私。
- **智能复习系统**：通过复习日志追踪学习进度，优化你的学习计划。
- **数据同步**：轻松备份和同步数据（词汇、日志、设置）到本地文件。
- **可视化统计**：通过交互式图表和仪表盘深入了解你的学习习惯。
- **PWA 支持**：可安装在桌面或移动设备上，提供原生应用般的体验。
- **音频支持**：本地管理发音音频。

## 🚀 部署指南

推荐使用 **Docker Compose** 部署 Vocaboost。

### 准备工作
- Docker
- Docker Compose

### 快速开始

1.  **克隆或复制** 项目文件到你的服务器。
2.  **启动应用**：
    ```bash
    docker compose up -d --build
    ```
3.  **访问应用**：
    在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 常用 Docker 命令

- **启动**: `docker compose up -d`
- **停止**: `docker compose down`
- **查看日志**: `docker compose logs -f`
- **重新构建**: `docker compose up -d --build`
