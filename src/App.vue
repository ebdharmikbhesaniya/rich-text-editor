<script setup lang="ts">
import { ref } from "vue";
import RichTextEditor from "./components/Editor/RichTextEditor.vue";

//  TODO: issue 2: this data not bind properly in to model

const limitedContent = ref(
  "jtyjtyjty<b>tyjtyjtyjtyyyyyytyjtyjytjtyjtyj</b><p></p>"
);
</script>

<template>
  Hello
  <RichTextEditor v-model="limitedContent" placeholder="Simple editor..." />
</template>

<style scoped></style>
