<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="app-header">
      <div class="page-container header-content">
        <NuxtLink class="brand" to="/">DebugBear 批量测试</NuxtLink>
        <nav class="header-nav">
          <NuxtLink to="/">创建任务</NuxtLink>
          <NuxtLink to="/tasks">历史任务</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="page-container app-main">
      <NuxtPage />
    </main>
  </div>
</template>
