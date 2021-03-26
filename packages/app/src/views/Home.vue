<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { createLive } from '../lib/authAPI';
//import LiveList from "../components/LiveList.vue";

export default defineComponent({
  components: {
    //LiveList,
  },
  setup() {
    // update title
    document.title = 's3live';

    const newLiveTitle$$q = ref('');
    const newLiveKey$$q = ref('');
    const newLiveOk$$q = computed(
      () => !!newLiveTitle$$q.value.trim() && !!newLiveKey$$q.value.trim()
    );
    const createLiveResult$$q = ref('');

    return {
      newLiveTitle$$q,
      newLiveKey$$q,
      newLiveOk$$q,
      createLiveResult$$q,
      createLive$$q() {
        createLiveResult$$q.value = '';
        createLive(newLiveTitle$$q.value, newLiveKey$$q.value)
          .then((response) => {
            createLiveResult$$q.value = JSON.stringify(response, null, 2);
            newLiveTitle$$q.value = '';
          })
          .catch((error) => {
            createLiveResult$$q.value =
              error instanceof Error ? error.message : String(error);
            newLiveTitle$$q.value = '';
          });
      },
    };
  },
});
</script>

<template>
  <div>
    <div>
      <p>
        バックエンドにVercelとUpstashとWasabiを用いた低コストなライブ配信サービス
      </p>
      <p>
        ここはトップページです<br />
        動画は各配信URLから視聴できます
      </p>
      <p>動画一覧は実装未定です</p>
    </div>
    <div>
      <h2 class="text-lg">新規配信作成</h2>
      <div>
        <div class="mt-4">
          <div>
            <div>
              <label class="block">
                <div
                  class="text-sm font-medium text-gray-700 dark:text-gray-400 transition-colors"
                >
                  タイトル
                </div>
                <input
                  v-model="newLiveTitle$$q"
                  type="text"
                  class="mt-1 block w-full shadow-sm border rounded-sm px-2 py-1 border-gray-300 dark:border-gray-700 bg-white dark:bg-black transition-colors"
                />
              </label>
            </div>
            <div>
              <label class="block">
                <div
                  class="text-sm font-medium text-gray-700 dark:text-gray-400 transition-colors"
                >
                  認証キー
                </div>
                <input
                  v-model="newLiveKey$$q"
                  type="password"
                  class="mt-1 block w-full shadow-sm border rounded-sm px-2 py-1 border-gray-300 dark:border-gray-700 bg-white dark:bg-black transition-colors"
                />
              </label>
            </div>
          </div>
        </div>
        <div class="mt-6 mb-2 w-full">
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-8 py-2 text-base font-medium text-white bg-green-600 disabled:bg-green-600 hover:bg-green-700 disabled:opacity-75 disabled:cursor-not-allowed"
            :disabled="!newLiveOk$$q"
            @click="createLive$$q"
          >
            作成
          </button>
        </div>
      </div>
      <div>
        <pre>{{ createLiveResult$$q }}</pre>
      </div>
    </div>
  </div>
</template>
