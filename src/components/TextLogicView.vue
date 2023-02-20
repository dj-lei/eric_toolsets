<template>
    <div id="screen">
    </div>
</template>

<script>
import {TextAnalysisView} from '../js/TextAnalysis.js'

export default {
  data () {
    return {
    }
  },
  mounted () {
    const test = new TextAnalysisView(document.getElementById('screen'))
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

html,body {
  font-family: Arial;
  height: 100%;
  background: #000;
  margin: 0px 0px 0px 0px;
  overflow: hidden !important;
}
</style>