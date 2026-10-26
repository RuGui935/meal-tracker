<template>
  <div class="app-container">
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部导航栏 -->
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
    </nav>
  </div>
</template>

<style>
/* 全局基础样式，让页面铺满手机屏幕 */
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-container {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
}

.main-content {
  padding-bottom: 60px; /* 给底部 tab 留空间 */
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
  background: #fff;
  display: flex;
  border-top: 1px solid #eee;
  z-index: 2000;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  color: #999;
  font-size: 12px;
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
