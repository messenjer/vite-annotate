<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import PlanCard from './PlanCard.vue'

const plans = [
  { name: 'Basic', price: '€9.99' },
  { name: 'Pro', price: '€19.99' },
]

// A modal like most UI libraries make one: it closes on a pointerdown outside it, caught on the way
// down like VueUse's onClickOutside, and the rest of the page stops taking the pointer. The overlay
// has to keep working on top of it.
const open = ref(false)
// And a native one, opened with showModal(): everything outside it is inert while it is open.
const details = ref<HTMLDialogElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
function closeOnOutside(event: PointerEvent): void {
  if (open.value && dialog.value && !dialog.value.contains(event.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('pointerdown', closeOnOutside, true))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnOutside, true))
</script>

<template>
  <main :style="{ pointerEvents: open ? 'none' : 'auto' }">
    <h1>Choose your plan</h1>
    <button type="button" @click="details?.showModal()">What is included?</button>
    <section class="plans">
      <PlanCard v-for="plan in plans" :key="plan.name" :name="plan.name" :price="plan.price" @choose="open = true" />
    </section>
  </main>
  <dialog ref="details">
    <h2>Included in every plan</h2>
    <p>Meal vouchers, a card and the app.</p>
    <button type="button" @click="details?.close()">Close</button>
  </dialog>
  <div v-if="open" class="backdrop">
    <div ref="dialog" class="dialog" role="dialog" aria-modal="true">
      <h2>Plan selected</h2>
      <p>No order has been placed.</p>
      <button type="button" @click="open = false">Back to plans</button>
    </div>
  </div>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 40px;
}
.plans {
  display: flex;
  gap: 16px;
}
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  width: 200px;
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
  display: grid;
  place-items: center;
}
.dialog {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
}
</style>
