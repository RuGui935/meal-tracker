<template>
  <div class="achievement-page">
    <header class="header">
      <h2 class="month-title">我的成就</h2>
    </header>

    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">{{ unlockedCount }}</div>
        <div class="stat-label">已解锁</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">{{ achievements.length }}</div>
        <div class="stat-label">总成就</div>
      </div>
    </div>

    <div class="achievement-list">
      <div
        v-for="ach in achievements"
        :key="ach.id"
        class="achievement-item"
        :class="{ unlocked: isUnlocked(ach.id) }"
      >
        <div class="ach-icon">{{ ach.icon }}</div>
        <div class="ach-info">
          <div class="ach-title">{{ ach.title }}</div>
          <div class="ach-desc">{{ ach.desc }}</div>
        </div>
        <div class="ach-status">
          {{ isUnlocked(ach.id) ? '已达成' : '未解锁' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// 定义所有成就
const achievements = [
  { id: 'first_record', icon: '🍚', title: '开张大吉', desc: '记录第一笔伙食账' },
  { id: 'milk_tea_5', icon: '🧋', title: '奶茶续命', desc: '单月喝 5 次及以上奶茶' },
  { id: 'save_money', icon: '🍃', title: '省钱达人', desc: '某天花费 ≤ 10 元 (不含0元)' },
  { id: 'rich_day', icon: '🔥', title: '改善伙食', desc: '某天花费 > 50 元' },
  { id: 'ingredient_cook', icon: '🥬', title: '自给自足', desc: '记录一次居家食材采购' },
]

const unlockedIds = ref([])

onMounted(() => {
  // 从本地存储读取已解锁的成就
  const saved = localStorage.getItem('unlocked_achievements')
  if (saved) {
    unlockedIds.value = JSON.parse(saved)
  }
})

const isUnlocked = (id) => unlockedIds.value.includes(id)

const unlockedCount = computed(() => unlockedIds.value.length)
</script>

<style scoped>
.achievement-page {
  padding: 15px;
}
.header {
  margin-bottom: 15px;
}
.month-title {
  margin: 0;
  font-size: 20px;
  color: var(--text-color);
}

.stats-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary);
}
.stat-label {
  font-size: 12px;
  color: var(--sub-text);
  margin-top: 5px;
}
.stat-divider {
  width: 1px;
  height: 30px;
  background: var(--border-color);
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.achievement-item {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 15px 20px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
  opacity: 0.6;
  transition: all 0.3s;
}
.achievement-item.unlocked {
  opacity: 1;
  border-color: var(--primary);
  background: rgba(255, 87, 34, 0.05);
}

.ach-icon {
  font-size: 32px;
  margin-right: 15px;
  filter: grayscale(100%);
  transition: 0.3s;
}
.achievement-item.unlocked .ach-icon {
  filter: grayscale(0%);
  transform: scale(1.1);
}

.ach-info {
  flex: 1;
}
.ach-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 4px;
}
.ach-desc {
  font-size: 12px;
  color: var(--sub-text);
}

.ach-status {
  font-size: 12px;
  font-weight: bold;
  color: var(--sub-text);
}
.achievement-item.unlocked .ach-status {
  color: var(--primary);
}
</style>
