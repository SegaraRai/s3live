<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    // update title
    document.title = 'Page Not Found';
  },
});
</script>

<template>
  <div class="p-2">
    <h1 class="cs-title-t leading-tight">ページが見つかりません</h1>

    <p class="mt-4">
      <router-link class="text-blue-400" :to="{ name: 'home' }">
        トップページに戻る
      </router-link>
    </p>
    </template>
  </div>
</template>
