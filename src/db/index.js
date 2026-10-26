import Dexie from 'dexie'

// 创建数据库实例
export const db = new Dexie('MealTrackerDB')

// 定义表结构
db.version(1).stores({
  // 三餐表：主键是自增 id，按日期、类型建索引
  meals: '++id, date, type',

  // 额外记录表（奶茶/饮料/零食等）
  extras: '++id, date, type',

  // 食材记录表
  ingredients: '++id, date'
})
