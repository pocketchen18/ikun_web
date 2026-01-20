<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  delay: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0.4
  },
  yOffset: {
    type: Number,
    default: 8
  },
  blur: {
    type: String,
    default: '6px'
  }
})

const visible = ref(false)
const target = ref(null)

onMounted(() => {
  setTimeout(() => {
    visible.value = true
  }, props.delay * 1000)
})
</script>

<template>
  <div
    ref="target"
    class="transition-all ease-out"
    :style="{
      transitionDuration: `${duration}s`,
      transitionDelay: `${delay}s`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : `translateY(${yOffset}px)`,
      filter: visible ? 'blur(0px)' : `blur(${blur})`
    }"
  >
    <slot />
  </div>
</template>
