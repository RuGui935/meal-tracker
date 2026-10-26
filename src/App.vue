<template>
  <div class="app-container" :class="{ 'dark-mode': isDark }">
    <main class="main-content">
      <router-view />
    </main>

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
      <!-- 暗黑模式开关 -->
      <div class="tab-item" @click="toggleDark">
        <span class="icon">{{ isDark ? '☀️' : '🌙' }}</span>
        <span>{{ isDark ? '日间' : '夜间' }}</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

onMounted(() => {
  // 读取本地存储的偏好
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
  }
})

const toggleDark = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<style>
/* 核心：定义日间模式的 CSS 变量 */
:root {
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-color: #333333;
  --sub-text: #999999;
  --border-color: #eeeeee;
}

/* 核心：定义暗黑模式覆盖的 CSS 变量 */
.dark-mode {
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

/* 底部导航样式 */
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
  transition: background-color 0.3s;
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
  cursor: pointer;
}

.tab-item .icon {
  font-size: 20px;
  margin-bottom: 2px;
}

/* 选中状态 */
.router-link-active {
  color: #ff5722 !important;
  font-weight: bold;
}
</style>
