<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  number: {
    type: Number,
    default: 20
  }
})

const meteorStyles = ref([])

onMounted(() => {
  const styles = [...new Array(props.number)].map(() => ({
    top: Math.floor(Math.random() * 100 - 50) + "vh",
    left: Math.floor(Math.random() * 100 + 50) + "vw",
    animationDelay: Math.random() * 10 + "s",
    animationDuration: Math.floor(Math.random() * 8 + 2) + "s",
  }))
  meteorStyles.value = styles
})
</script>

<template>
  <div class="pointer-events-none fixed inset-0 overflow-hidden z-[-1]">
    <span
      v-for="(style, idx) in meteorStyles"
      :key="'meteor' + idx"
      class="absolute h-0.5 w-0.5 animate-meteor rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] dark:bg-slate-400 opacity-0"
      :style="{
        ...style,
        '--angle': '135deg',
        transform: 'rotate(135deg)'
      }"
    >
      <div class="pointer-events-none absolute top-1/2 right-0 -z-10 h-[1px] w-[50px] -translate-y-1/2 bg-gradient-to-l from-slate-500 to-transparent dark:from-slate-400"></div>
    </span>
  </div>
</template>
