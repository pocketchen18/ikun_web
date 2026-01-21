<script setup>
import { onMounted, ref, onBeforeUnmount } from "vue";
import createGlobe from "cobe";

const props = defineProps({
  className: {
    type: String,
    default: "",
  },
});

const canvasRef = ref(null);
const isVisible = ref(false);
let globe = null;

onMounted(() => {
  let phi = 0;

  if (!canvasRef.value) return;

  const isDark = document.documentElement.classList.contains("dark");
  const dpr = window.devicePixelRatio || 2;
  const containerWidth = canvasRef.value.offsetWidth || 400;
  // 确保 size 是整数，避免渲染异常
  const size = Math.floor(containerWidth * dpr);

  globe = createGlobe(canvasRef.value, {
    devicePixelRatio: dpr,
    width: size,
    height: size,
    phi: 0,
    theta: 0.3, // 稍微向下俯视，这样能看到北极点，更有立体感
    dark: isDark ? 1 : 0,
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 6,
    // 调整颜色：在浅色模式下让地球颜色更深一些，增强可见性
    baseColor: isDark ? [0.3, 0.3, 0.3] : [0.7, 0.7, 0.7],
    markerColor: [0.1, 0.8, 1],
    glowColor: isDark ? [0.2, 0.2, 0.2] : [0.9, 0.9, 0.9],
    opacity: isDark ? 0.8 : 0.8,
    markers: [
      { location: [39.9042, 116.4074], size: 0.08 }, // 北京
      { location: [31.2304, 121.4737], size: 0.08 }, // 上海
      { location: [30.5728, 104.0668], size: 0.08 }, // 成都
      { location: [23.1291, 113.2644], size: 0.05 }, // 广州
      { location: [22.5431, 114.0579], size: 0.05 }, // 深圳
      // { location: [23.0215, 113.1214], size: 0.03 }, // 佛山
    ],
    onRender: (state) => {
      // 保持 theta 不变（视角高度固定）
      state.theta = 0.3; 
      // 这里的 phi 是绕 Canvas 的 Y 轴旋转
      // 因为我们给 Canvas 设置了 CSS rotate(-23.5deg)，所以这个 Y 轴现在就是倾斜的地轴
      state.phi = phi;
      phi += 0.005; 
    },
  });

  // 延迟一帧设置可见，确保 canvas 已经开始渲染
  requestAnimationFrame(() => {
    isVisible.value = true;
  });
});

onBeforeUnmount(() => {
  if (globe) {
    globe.destroy();
  }
});
</script>

<template>
  <div
    :class="[
      'pointer-events-none absolute inset-0 mx-auto aspect-square h-full w-full',
      className,
    ]"
  >
    <canvas
      ref="canvasRef"
      :class="[
        'h-full w-full transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0'
      ]"
      style="transform: rotate(23.5deg); transform-origin: center;"
    />
  </div>
</template>
