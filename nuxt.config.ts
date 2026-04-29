// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/debugbearFavicon.ico' },
        { rel: 'shortcut icon', type: 'image/x-icon', href: '/debugbearFavicon.ico' }
      ]
    }
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      perfTaskPollIntervalMs: Number(process.env.PERF_TASK_POLL_INTERVAL_MS ?? 3000)
    }
  }
})
