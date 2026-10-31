<template>
  <div class="app-container">
    <main class="main-content">
      <router-view />
    </main>

    <nav class="bottom-tabs">
      <router-link to="/" class="tab-item"
        ><span class="icon">📝</span><span>列表</span></router-link
      >
      <router-link to="/calendar" class="tab-item"
        ><span class="icon">📅</span><span>月历</span></router-link
      >
      <router-link to="/stats" class="tab-item"
        ><span class="icon">📊</span><span>统计</span></router-link
      >
      <router-link to="/settings" class="tab-item"
        ><span class="icon">⚙️</span><span>设置</span></router-link
      >
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 页面加载时，读取用户选的主题，应用到整个 html 标签上
  const savedTheme = localStorage.getItem('ui_theme') || 'default'
  document.documentElement.setAttribute('data-theme', savedTheme)
})
</script>

<style>
/* 1. 默认主题：极简白 */
:root {
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-color: #333333;
  --sub-text: #999999;
  --border-color: #eeeeee;
  --radius: 12px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  --primary: #ff5722;
}

/* 2. 暗夜黑 */
[data-theme='dark'] {
  --bg-color: #121212;
  --card-bg: #1e1e1e;
  --text-color: #e0e0e0;
  --sub-text: #888888;
  --border-color: #333333;
  --radius: 12px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  --primary: #ff5722;
}

/* 3. 莫兰迪风（温柔、大圆角、去阴影） */
[data-theme='morandi'] {
  --bg-color: #f4f0e9; /* 燕麦色背景 */
  --card-bg: #fdfbf7; /* 暖白卡片 */
  --text-color: #4a4a4a;
  --sub-text: #a09c95;
  --border-color: #e8e2d8;
  --radius: 20px; /* 超大圆角 */
  --card-shadow: none; /* 没有阴影 */
  --primary: #d4a373; /* 焦糖色主色调 */
}

/* 4. 赛博夜（锐利、深紫） */
[data-theme='cyber'] {
  --bg-color: #050505;
  --card-bg: #11111b;
  --text-color: #c0caf5;
  --sub-text: #565f89;
  --border-color: #292e42;
  --radius: 4px; /* 小圆角 */
  --card-shadow: 0 0 10px rgba(122, 162, 247, 0.1); /* 霓虹微光 */
  --primary: #7aa2f7;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, sans-serif;
  transition: background-color 0.3s;
}
.app-container {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: var(--bg-color);
  position: relative;
}
.main-content {
  padding-bottom: 60px;
}

.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  height: 60px;
  background: var(--card-bg);
  display: flex;
  border-top: 1px solid var(--border-color);
  z-index: 2000;
  transition: all 0.3s;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  color: var(--sub-text);
  font-size: 12px;
}
.tab-item .icon {
  font-size: 20px;
  margin-bottom: 2px;
}
.router-link-active {
  color: var(--primary) !important;
  font-weight: bold;
}
</style>
