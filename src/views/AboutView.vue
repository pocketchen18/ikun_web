<template>
  <div class="about">
    <h1>About This Project</h1>
    <p>This is a portfolio website built with Vue 3, Vite, and a Node.js backend.</p>
    <router-link to="/">Back to Home</router-link>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>
