<script setup lang="ts">
import { ref } from "vue";
import RichTextEditor from "./components/Editor/RichTextEditor.vue";

const limitedContent = ref();
</script>

<template>
  Hello
  <RichTextEditor
    v-model="limitedContent"
    placeholder="Simple editor..." />
</template>

<style scoped></style>
