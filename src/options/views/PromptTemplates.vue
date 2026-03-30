<template>
  <div class="field-group">
    <label>Post Summary Prompt</label>
    <textarea v-model="postPrompt" rows="4" />
    <button class="btn-link" @click="postPrompt = DEFAULT_POST_PROMPT">Reset to default</button>

    <label>Comment Summary Prompt</label>
    <textarea v-model="commentPrompt" rows="6" />
    <button class="btn-link" @click="commentPrompt = DEFAULT_COMMENT_PROMPT">Reset to default</button>

    <div class="actions">
      <button class="btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving...' : 'Save Prompts' }}</button>
    </div>

    <p v-if="message" :class="['message', messageType]">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { DEFAULT_POST_PROMPT, DEFAULT_COMMENT_PROMPT } from '@/shared/constants';

const postPrompt = ref(DEFAULT_POST_PROMPT);
const commentPrompt = ref(DEFAULT_COMMENT_PROMPT);
const saving = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const STORAGE_KEY = 'reddit-ai-settings';

onMounted(async () => {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  if (result[STORAGE_KEY]) {
    if (result[STORAGE_KEY].postPrompt) postPrompt.value = result[STORAGE_KEY].postPrompt;
    if (result[STORAGE_KEY].commentPrompt) commentPrompt.value = result[STORAGE_KEY].commentPrompt;
  }
});

async function save() {
  saving.value = true;
  message.value = '';
  try {
    const current = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
    await chrome.storage.local.set({
      [STORAGE_KEY]: { ...current, postPrompt: postPrompt.value, commentPrompt: commentPrompt.value },
    });
    message.value = 'Prompts saved';
    messageType.value = 'success';
  } catch {
    message.value = 'Failed to save';
    messageType.value = 'error';
  }
  saving.value = false;
}
</script>

<style scoped>
.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-top: 12px;
}
textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  resize: vertical;
}
textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}
.btn-link {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  padding: 2px 0;
}
.btn-link:hover {
  text-decoration: underline;
}
.actions {
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
.btn-primary:disabled {
  opacity: 0.6;
}
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
