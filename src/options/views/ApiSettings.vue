<template>
  <div class="field-group">
    <label>API Endpoint</label>
    <input v-model="settings.endpoint" type="url" placeholder="https://api.openai.com/v1/chat/completions" />

    <label>API Key</label>
    <div class="password-row">
      <input v-model="settings.apiKey" :type="showKey ? 'text' : 'password'" placeholder="sk-..." />
      <button class="btn-sm" @click="showKey = !showKey">{{ showKey ? 'Hide' : 'Show' }}</button>
    </div>

    <label>Model</label>
    <div class="model-row">
      <select v-if="modelList.length > 0" v-model="settings.model" class="model-select">
        <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
      </select>
      <input v-else v-model="settings.model" type="text" placeholder="gpt-4o-mini" />
      <button class="btn-sm" @click="fetchModelList" :disabled="fetching">
        {{ fetching ? '...' : 'Fetch' }}
      </button>
    </div>

    <div class="actions">
      <button class="btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
      <button class="btn-secondary" @click="testConn" :disabled="testing">
        {{ testing ? 'Testing...' : 'Test Connection' }}
      </button>
    </div>

    <p v-if="message" :class="['message', messageType]">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Settings } from '@/shared/types';

const settings = reactive<Pick<Settings, 'endpoint' | 'apiKey' | 'model'>>({
  endpoint: DEFAULT_SETTINGS.endpoint,
  apiKey: '',
  model: DEFAULT_SETTINGS.model,
});

const showKey = ref(false);
const saving = ref(false);
const testing = ref(false);
const fetching = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const modelList = ref<string[]>([]);

const STORAGE_KEY = 'reddit-ai-settings';

onMounted(async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  if (result[STORAGE_KEY]) {
    Object.assign(settings, result[STORAGE_KEY]);
  }
});

async function save() {
  saving.value = true;
  message.value = '';
  try {
    const current = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
    await chrome.storage.local.set({
      [STORAGE_KEY]: { ...current, ...settings },
    });
    message.value = 'Settings saved';
    messageType.value = 'success';
  } catch {
    message.value = 'Failed to save';
    messageType.value = 'error';
  }
  saving.value = false;
}

function testConn() {
  testing.value = true;
  message.value = '';
  chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, (res) => {
    if (chrome.runtime.lastError) {
      message.value = 'Error: ' + chrome.runtime.lastError.message;
      messageType.value = 'error';
    } else if (res?.type === 'STREAM_DONE') {
      message.value = 'Connection successful!';
      messageType.value = 'success';
    } else if (res?.type === 'ERROR') {
      message.value = 'Connection failed: ' + res.message;
      messageType.value = 'error';
    }
    testing.value = false;
  });
}

function fetchModelList() {
  fetching.value = true;
  message.value = '';
  chrome.runtime.sendMessage({ type: 'FETCH_MODELS' }, (res) => {
    if (chrome.runtime.lastError) {
      message.value = 'Error: ' + chrome.runtime.lastError.message;
      messageType.value = 'error';
    } else if (res?.type === 'FETCH_MODELS_RESULT') {
      modelList.value = res.models;
      if (res.models.length === 0) {
        message.value = 'No models found';
        messageType.value = 'error';
      } else {
        message.value = `${res.models.length} models found`;
        messageType.value = 'success';
        if (!res.models.includes(settings.model)) {
          settings.model = res.models[0];
        }
      }
    } else if (res?.type === 'ERROR') {
      message.value = 'Failed: ' + res.message;
      messageType.value = 'error';
    }
    fetching.value = false;
  });
}
</script>

<style scoped>
.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-top: 8px;
}
input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}
.password-row {
  display: flex;
  gap: 8px;
}
.password-row input {
  flex: 1;
}
.model-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.model-row input {
  flex: 1;
}
.model-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.model-select:focus {
  outline: none;
  border-color: #6366f1;
}
.btn-sm {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.btn-primary {
  padding: 8px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
.btn-primary:disabled { opacity: 0.6; }
.btn-secondary {
  padding: 8px 20px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-secondary:disabled { opacity: 0.6; }
.message {
  margin-top: 12px;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
}
.message.success {
  background: #f0fdf4;
  color: #166534;
}
.message.error {
  background: #fef2f2;
  color: #991b1b;
}
</style>
