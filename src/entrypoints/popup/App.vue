<template>
  <div class="popup" @mousedown="onMouseDown">
    <div class="popup-header">
      <div class="popup-logo">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="4" fill="#6366f1"/>
          <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" fill="white"/>
        </svg>
      </div>
      <div class="popup-title">
        <strong>Reddit AI Assistant</strong>
        <span class="version">v1.0.0</span>
      </div>
    </div>
    <div :class="['status-bar', configured ? 'status-bar--ok' : 'status-bar--warn']">
      <span class="status-dot"></span>
      <span v-if="configured" class="status-text">API connected &middot; {{ model }}</span>
      <span v-else class="status-text">API not configured</span>
    </div>
    <div class="quick-settings">
      <label>Model</label>
      <div class="model-row">
        <select v-if="modelList.length > 0" v-model="model" class="model-select">
          <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
        </select>
        <input v-else v-model="model" type="text" placeholder="gpt-4o-mini" />
        <button class="btn-fetch" @click="fetchModelList" :disabled="fetching" title="Fetch models">
          {{ fetching ? '...' : 'Fetch' }}
        </button>
      </div>
      <label>Endpoint</label>
      <input v-model="endpoint" type="url" placeholder="https://api.openai.com/v1/chat/completions" />
    </div>
    <div class="popup-actions">
      <button class="btn-primary" @click="save">Save</button>
      <button class="btn-link" @click="openOptions">Full Settings</button>
    </div>
    <div class="popup-footer">
      <button class="btn-link" @click="openOptions">Edit Prompts</button>
      <a href="https://github.com/BlingDan/Reddit-AI-Assistant" target="_blank" class="footer-link">GitHub</a>
    </div>
    <p v-if="msg" :class="['msg', msgType]">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const endpoint = ref('https://api.openai.com/v1/chat/completions');
const apiKey = ref('');
const model = ref('gpt-4o-mini');
const msg = ref('');
const msgType = ref<'ok' | 'err'>('ok');
const configured = computed(() => apiKey.value.trim().length > 0);
const fetching = ref(false);
const modelList = ref<string[]>([]);
const KEY = 'reddit-ai-settings';

onMounted(async () => {
  const r = await chrome.storage.local.get(KEY);
  if (r[KEY]) {
    endpoint.value = r[KEY].endpoint || endpoint.value;
    apiKey.value = r[KEY].apiKey || '';
    model.value = r[KEY].model || model.value;
  }
});

async function save() {
  // Validate HTTPS
  try {
    const url = new URL(endpoint.value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      msg.value = 'Endpoint must use HTTPS for security';
      msgType.value = 'err';
      return;
    }
  } catch {
    msg.value = 'Invalid endpoint URL';
    msgType.value = 'err';
    return;
  }
  const r = await chrome.storage.local.get(KEY);
  await chrome.storage.local.set({
    [KEY]: { ...(r[KEY] || {}), endpoint: endpoint.value, apiKey: apiKey.value, model: model.value },
  });
  msg.value = 'Saved!';
  msgType.value = 'ok';
  setTimeout(() => (msg.value = ''), 2000);
}

function fetchModelList() {
  fetching.value = true;
  msg.value = '';
  chrome.runtime.sendMessage({ type: 'FETCH_MODELS' }, (res) => {
    if (chrome.runtime.lastError) {
      msg.value = 'Error: ' + chrome.runtime.lastError.message;
      msgType.value = 'err';
    } else if (res?.type === 'FETCH_MODELS_RESULT') {
      modelList.value = res.models;
      if (res.models.length === 0) {
        msg.value = 'No models found';
        msgType.value = 'err';
      } else {
        msg.value = `${res.models.length} models found`;
        msgType.value = 'ok';
        if (!res.models.includes(model.value)) model.value = res.models[0];
      }
    } else if (res?.type === 'ERROR') {
      msg.value = 'Failed: ' + res.message;
      msgType.value = 'err';
    }
    fetching.value = false;
  });
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}

function onMouseDown(e: MouseEvent) {
  // Prevent popup from closing when selecting text in inputs
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    e.stopPropagation();
  }
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 340px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.popup { padding: 16px; user-select: none; -webkit-user-select: none; }
.popup input, .popup textarea, .popup select { user-select: text; -webkit-user-select: text; }
.popup-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.popup-title strong { font-size: 14px; display: block; }
.version { font-size: 11px; color: #9ca3af; }
.status-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 13px; }
.status-bar--ok { background: #f0fdf4; color: #166534; }
.status-bar--warn { background: #fef3c7; color: #92400e; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-bar--ok .status-dot { background: #22c55e; }
.status-bar--warn .status-dot { background: #f59e0b; }
.status-text { font-weight: 500; }
.quick-settings { margin-bottom: 14px; }
.quick-settings label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin: 8px 0 3px; }
.quick-settings label:first-child { margin-top: 0; }
.quick-settings input { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; }
.quick-settings input:focus { outline: none; border-color: #6366f1; }
.model-row { display: flex; gap: 6px; align-items: center; }
.model-row input { flex: 1; }
.model-select { flex: 1; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; background: white; }
.model-select:focus { outline: none; border-color: #6366f1; }
.btn-fetch { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 12px; white-space: nowrap; }
.btn-fetch:disabled { opacity: 0.5; cursor: not-allowed; }
.popup-actions { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.btn-primary { padding: 7px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-primary:hover { opacity: 0.9; }
.btn-link { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 12px; }
.btn-link:hover { text-decoration: underline; }
.popup-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 11px; }
.footer-link { color: #9ca3af; text-decoration: none; }
.footer-link:hover { color: #6366f1; }
.msg { margin-top: 8px; font-size: 12px; padding: 4px 8px; border-radius: 4px; }
.msg.ok { background: #f0fdf4; color: #166534; }
.msg.err { background: #fef2f2; color: #991b1b; }
</style>
