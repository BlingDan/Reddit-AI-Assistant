<template>
  <div class="app">
    <header class="header">
      <h1>Reddit AI Assistant</h1>
    </header>
    <nav class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: currentTab === tab.id }]"
        @click="currentTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>
    <main class="content">
      <ApiSettings v-if="currentTab === 'api'" />
      <PromptTemplates v-else-if="currentTab === 'prompts'" />
      <About v-else-if="currentTab === 'about'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ApiSettings from '@/options/views/ApiSettings.vue';
import PromptTemplates from '@/options/views/PromptTemplates.vue';
import About from '@/options/views/About.vue';

const currentTab = ref('api');
const tabs = [
  { id: 'api', label: 'API Settings' },
  { id: 'prompts', label: 'Prompt Templates' },
  { id: 'about', label: 'About' },
];
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  color: #1a1a1a;
}
.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px;
}
.header h1 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 24px;
}
.tab {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tab.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
  font-weight: 600;
}
.tab:hover {
  color: #4f46e5;
}
.content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
