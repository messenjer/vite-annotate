<script setup lang="ts">
defineProps<{ name: string; price: string }>()
defineEmits<{ choose: [] }>()
</script>

<template>
  <article class="card">
    <h2>{{ name }}</h2>
    <p>{{ price }} / month</p>
    <button type="button" @click="$emit('choose')">Choose</button>
  </article>
</template>
