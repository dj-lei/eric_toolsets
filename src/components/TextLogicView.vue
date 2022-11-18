<template>
    <div id="screen">
    </div>
</template>

<script>
import {TextLogicView} from '../js/TextLogic.js'

export default {
  data () {
    return {
    }
  },
  mounted () {
    const test = new TextLogicView(document.getElementById('screen'))
    test.init()
  }
}
</script>

<style>
@import '../assets/dialog.css';
@import '../assets/table.css';

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