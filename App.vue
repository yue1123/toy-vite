<template>
  <div>
    <h1>Hello Vue</h1>
    <button @click="min">-</button>
    {{ count }}
    <button @click="plus">+</button>
  </div>
</template>

<script>
  import { demoFn } from './utils/index.js'
  import { ref } from 'vue'
  export default {
    setup() {
      const a = '1'
      const count = ref(1)
      function min() {
        count.value -= 1
      }
      function plus() {
        count.value += 1
      }
      demoFn()
      return { a, count, min, plus }
    }
  }
</script>

<style lang="scss" scoped></style>
