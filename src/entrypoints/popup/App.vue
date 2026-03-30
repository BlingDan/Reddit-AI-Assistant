<template>
  <div class="popup">
    <h2>Reddit AI Assistant</h2>
    <div v-if="!configured" class="status warn">API not configured</div>
    <div v-else class="status ok">API configured</div>
    <div class="field">
      <label>API Endpoint</label>
      <input v-model="endpoint" type="url" placeholder="https://api.openai.com/v1/chat/completions" />
    </div>
    <div class="field">
      <label>API Key</label>
      <input v-model="apiKey" type="password" placeholder="sk-..." />
    </div>
    <div class="field">
      <label>Model</label>
      <div class="model-row">
        <select v-if="modelList.length > 0" v-model="model" class="model-select">
          <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
        </select>
        <input v-else v-model="model" type="text" placeholder="gpt-4o-mini" />
        <button class="btn-fetch" @click="fetchModelList" :disabled="fetching" :title="'Fetch available models'">
          {{ fetching ? '...' : 'Fetch' }}
        </button>
      </div>
    </div>
    <div class="actions">
      <button class="btn-primary" @click="save">Save</button>
      <button class="btn-secondary" @click="testConn" :disabled="testing">
        {{ testing ? 'Testing...' : 'Test' }}
      </button>
      <button class="btn-link" @click="openOptions">Advanced</button>
    </div>

    <div class="prompt-toggle" @click="showPrompts = !showPrompts">
      <span>{{ showPrompts ? '▾' : '▸' }} Custom Prompts</span>
    </div>
    <div v-if="showPrompts" class="prompt-section">
      <div class="field">
        <label>Post Summary Prompt</label>
        <textarea v-model="postPrompt" rows="4" placeholder="Prompt for summarizing posts..."></textarea>
      </div>
      <div class="field">
        <label>Comment Summary Prompt</label>
        <textarea v-model="commentPrompt" rows="4" placeholder="Prompt for summarizing comments..."></textarea>
      </div>
      <button class="btn-primary btn-sm" @click="savePrompts">Save Prompts</button>
      <button class="btn-link" @click="resetPrompts">Reset to Defaults</button>
    </div>

    <p v-if="msg" :class="['msg', msgType]">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { DEFAULT_POST_PROMPT, DEFAULT_COMMENT_PROMPT } from '@/shared/constants';

const endpoint = ref('https://api.openai.com/v1/chat/completions');
const apiKey = ref('');
const model = ref('gpt-4o-mini');
const postPrompt = ref(DEFAULT_POST_PROMPT);
const commentPrompt = ref(DEFAULT_COMMENT_PROMPT);
const msg = ref('');
const msgType = ref<'ok' | 'err'>('ok');
const configured = computed(() => apiKey.value.trim().length > 0);
const showPrompts = ref(false);

const testing = ref(false);
const fetching = ref(false);
const modelList = ref<string[]>([]);

const KEY = 'reddit-ai-settings';

onMounted(async () => {
  const r = await chrome.storage.local.get(KEY);
  if (r[KEY]) {
    endpoint.value = r[KEY].endpoint || endpoint.value;
    apiKey.value = r[KEY].apiKey || '';
    model.value = r[KEY].model || model.value;
    postPrompt.value = r[KEY].postPrompt || DEFAULT_POST_PROMPT;
    commentPrompt.value = r[KEY].commentPrompt || DEFAULT_COMMENT_PROMPT;
  }
});

async function save() {
  const r = await chrome.storage.local.get(KEY);
  await chrome.storage.local.set({
    [KEY]: { ...(r[KEY] || {}), endpoint: endpoint.value, apiKey: apiKey.value, model: model.value },
  });
  msg.value = 'Saved!';
  msgType.value = 'ok';
  setTimeout(() => (msg.value = ''), 2000);
}

async function savePrompts() {
  const r = await chrome.storage.local.get(KEY);
  await chrome.storage.local.set({
    [KEY]: { ...(r[KEY] || {}), postPrompt: postPrompt.value, commentPrompt: commentPrompt.value },
  });
  msg.value = 'Prompts saved!';
  msgType.value = 'ok';
  setTimeout(() => (msg.value = ''), 2000);
}

function resetPrompts() {
  postPrompt.value = DEFAULT_POST_PROMPT;
  commentPrompt.value = DEFAULT_COMMENT_PROMPT;
}

function testConn() {
  testing.value = true;
  msg.value = '';
  chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, (res) => {
    if (chrome.runtime.lastError) {
      msg.value = 'Error: ' + chrome.runtime.lastError.message;
      msgType.value = 'err';
    } else if (res?.type === 'STREAM_DONE') {
      msg.value = 'Connection OK!';
      msgType.value = 'ok';
    } else if (res?.type === 'ERROR') {
      msg.value = 'Failed: ' + res.message;
      msgType.value = 'err';
    }
    testing.value = false;
  });
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
        if (!res.models.includes(model.value)) {
          model.value = res.models[0];
        }
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
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.popup { padding: 16px; }
h2 { font-size: 15px; margin-bottom: 8px; }
.status { font-size: 12px; padding: 4px 8px; border-radius: 4px; margin-bottom: 12px; }
.status.ok { background: #f0fdf4; color: #166534; }
.status.warn { background: #fef3c7; color: #92400e; }
.field { margin-bottom: 8px; }
label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 2px; }
input { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; }
input:focus { outline: none; border-color: #6366f1; }
textarea { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; resize: vertical; font-family: inherit; }
textarea:focus { outline: none; border-color: #6366f1; }
.model-row { display: flex; gap: 6px; align-items: center; }
.model-row input { flex: 1; }
.model-select { flex: 1; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; background: white; }
.model-select:focus { outline: none; border-color: #6366f1; }
.btn-fetch { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; background: white; cursor: pointer; font-size: 12px; white-space: nowrap; }
.btn-fetch:disabled { opacity: 0.5; cursor: not-allowed; }
.actions { display: flex; gap: 8px; align-items: center; margin-top: 12px; }
.btn-primary { padding: 6px 16px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-primary:hover { opacity: 0.9; }
.btn-sm { padding: 4px 12px; font-size: 12px; margin-right: 8px; }
.btn-secondary { padding: 6px 12px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-size: 13px; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-link { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 12px; }
.btn-link:hover { text-decoration: underline; }
.prompt-toggle { margin-top: 12px; padding: 6px 0; cursor: pointer; font-size: 12px; font-weight: 600; color: #374151; border-top: 1px solid #e5e7eb; }
.prompt-toggle:hover { color: #6366f1; }
.prompt-section { margin-top: 8px; }
.msg { margin-top: 8px; font-size: 12px; padding: 4px 8px; border-radius: 4px; }
.msg.ok { background: #f0fdf4; color: #166534; }
.msg.err { background: #fef2f2; color: #991b1b; }
</style>
