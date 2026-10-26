import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '专属伙食记',
        short_name: '伙食记',
        description: '极简纯支出伙食记录工具',
        theme_color: '#2b2b45',
        background_color: '#f5f5f5',
        icons: [
          {
            src: 'pwa-192x192.png', // 稍后教你怎么放图标
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/meal-tracker/', // 👈 确保这里还是你的仓库名
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
