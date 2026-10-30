<template>
  <div class="app-container">
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部导航 -->
    <nav class="bottom-tabs">
      <router-link to="/" class="tab-item">
        <span class="icon">📝</span><span>列表</span>
      </router-link>
      <router-link to="/calendar" class="tab-item">
        <span class="icon">📅</span><span>月历</span>
      </router-link>
      <router-link to="/stats" class="tab-item">
        <span class="icon">📊</span><span>统计</span>
      </router-link>
      <!-- 改为设置 -->
      <router-link to="/settings" class="tab-item">
        <span class="icon">⚙️</span><span>设置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

// 页面一加载，恢复暗黑模式
onMounted(() => {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark-mode')
  }
})
</script>

<style>
/* 变量定义 */
:root {
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-color: #333333;
  --sub-text: #999999;
  --border-color: #eeeeee;
}
html.dark-mode {
  --bg-color: #121212;
  --card-bg: #1e1e1e;
  --text-color: #e0e0e0;
  --sub-text: #888888;
  --border-color: #333333;
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
  color: #ff5722 !important;
  font-weight: bold;
}
</style>
