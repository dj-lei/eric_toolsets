<template>
    <div id="screen">
    </div>
    <div id="prompt">
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

#prompt {
  display: 'none';
  position: fixed;
  z-index: 99;
  left: 30%;
  bottom: 0;
  width: 40%;
  padding: 16px;
  color: #fff;
  font-size: 16px;
  text-align: center;
  /* margin-left: auto;
  margin-right: auto; */
  animation: slide-up 1s ease-in-out forwards;
}

@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>