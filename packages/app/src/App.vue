<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    return {};
  },
});
</script>

<template>
  <div>
    <header class="px-4 py-1 bg-green-500 select-none z-50">
      <h1 class="text-2xl font-bold leading-tight text-white">s3live</h1>
    </header>
    <main class="container mx-auto max-w-screen-2xl">
      <router-view />
    </main>
  </div>
</template>
