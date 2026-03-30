<template>
  <div class="about">
    <h2>Reddit AI Assistant</h2>
    <p class="version">Version 1.0.0</p>
    <p class="desc">
      AI-powered summarization for Reddit posts and comment threads.
      Uses your own OpenAI-compatible API key.
    </p>
    <div class="links">
      <p>Built with WXT + Vue 3 + TypeScript</p>
    </div>
  </div>
</template>

<style scoped>
.about {
  text-align: center;
  padding: 20px 0;
}
h2 {
  font-size: 18px;
  margin-bottom: 4px;
}
.version {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 16px;
}
.desc {
  font-size: 14px;
  color: #374151;
  max-width: 400px;
  margin: 0 auto 16px;
}
.links {
  font-size: 12px;
  color: #9ca3af;
}
</style>
