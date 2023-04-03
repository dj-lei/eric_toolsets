export default {
    formatTimestamp(timestamp){
      const dateObj = new Date(timestamp * 1000);

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hour = String(dateObj.getHours()).padStart(2, '0');
      const minute = String(dateObj.getMinutes()).padStart(2, '0');
      const second = String(dateObj.getSeconds()).padStart(2, '0');
      const microsecond = String(timestamp.toFixed(6)).slice(10);
      
      const formattedDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`
      return formattedDate
    },

    escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    replaceSpecialSymbols(text, replacement) {
      text = text.replace(/[&\\#,+()$~%'":*?<>{}]/g, replacement)
      return text
    },

    uuidv4(){
      return ([1e7]+1e3+4e3+8e3+1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    },

    setBrowserTitle(val){
      document.title = val
    },

    getParentContainer(namespace){
      var parentId = namespace.split('/').slice(0, namespace.split('/').length - 1).join('/')
      return document.getElementById(parentId)
    },

    zip(x, y){
      return Array(Math.max(x.length, y.length)).fill().map((_,i) => [x[i], y[i]]);
    },

    removeAll(dom){
      this.removeAllChild(dom)
      dom.parentNode.removeChild(dom)
    },

    removeAllChild(dom){
      while (dom.firstChild) {
        dom.removeChild(dom.lastChild)
      }
    },

    arrayRemoveElm(list, elm){
      const index = list.indexOf(elm);
      if (index > -1) { // only splice array when item is found
        list.splice(index, 1); // 2nd parameter means remove one item only
      }
    },

    arrayIntersection(a, b){
      return a.filter(value => b.includes(value))
    },

    arrayDuplicates(a){
      return Array.from(new Set(a))
    },

    arrayExtend(a, b){
      Array.prototype.push.apply(a,b)
      return a
    },

    hex2bin(hex){
      var res = (parseInt(hex, 16).toString(2)).padStart(8, '0')
      if (res.length < 32){
        var tmp = 32 - res.length
        for(var i=0;i<tmp;i++){
          res = '0' + res 
        }
      }
      return res;
    },

    promptSuccess(msg){
      var prompt = document.getElementById('prompt')
      prompt.style.backgroundColor = 'green'
      prompt.innerHTML = msg
      prompt.style.display = 'block'
      setTimeout(() => {
        prompt.style.display = 'none'
      }, 3000)
    },

    promptError(msg){
      var prompt = document.getElementById('prompt')
      prompt.style.backgroundColor = 'red'
      prompt.innerHTML = msg
      prompt.style.display = 'block'
      setTimeout(() => {
        prompt.style.display = 'none'
      }, 3000)
    }
}

