import { Graph } from './graph'

import common from '@/plugins/common'

class Table extends Graph
{
    constructor(position){
        super(position)
        this.table = ''
        this.slider = ''
        this.count = 10

        this.table = document.createElement('table')
        this.table.style.display = 'inline-block'
        this.table.style.width = '98%'
        this.table.style.overflowX = 'scroll'
        this.table.style.overflowY= 'hidden'
        this.table.style.whiteSpace = 'nowrap'
        this.table.style.border = 'none'

        this.slider = document.createElement('input')
        this.slider.style.display = 'inline-block'
        this.slider.className = 'slider'
        this.slider.type = 'range'
        this.slider.min = 0
        this.slider.max = this.count
        this.slider.style.width = '1%'
        this.slider.value=0
        this.slider.step=1
    }
}

class TextFileOriginalComponentTable extends Table
{
    constructor(textFileOriginalView){
        super(textFileOriginalView.container)
        this.textFileOriginalView = textFileOriginalView

        this.container.style.display = 'none'

        let that = this
        this.slider.addEventListener('input', (event) => {
            that.textFileOriginalView.jump(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.textFileOriginalView.jump(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(this.table)
        this.container.append(this.slider)
    }

    refresh(lines){
        common.removeAllChild(this.table)
        lines.forEach((line) => {
            var tr = document.createElement('tr')
            tr.insertAdjacentHTML('beforeend', line)
            this.table.appendChild(tr)
        })
        // if (that.lines.length < that.range) {
        //     for(var i=0; i < that.range - that.lines.length; i++){
        //         var tr = document.createElement('tr')
        //         var td1 = document.createElement('td')
        //         td1.setAttribute('style', 'color:#FFF;background-color:#666666;font-size:10px;')
        //         var td2 = document.createElement('td')
        //         td2.setAttribute('style', 'color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left')
        //         td1.innerHTML = 'END'
        //         td2.innerHTML = 'END'
        //         tr.appendChild(td1)
        //         tr.appendChild(td2)
        //         that.table.appendChild(tr)
        //     }
        // }
    }
}

class SearchAtomComponentTable extends Table
{
    constructor(searchAtomView){
        super(searchAtomView.container)
        this.searchAtomView = searchAtomView

        let that = this
        var del = document.createElement('button')
        del.style.backgroundColor = 'red'
        del.style.width = '2%'
        del.style.border = '1px solid #ddd'
        del.style.color = 'white'
        del.style.cursor = 'pointer'
        del.fontSize = '15px'
        del.innerHTML = 'X'
        del.addEventListener("click", function() {
            // that.parent.keyValueSelect['children'].forEach((child, index) => {
            //     if (child.uid == that.uid) {
            //         that.parent.keyValueSelect['children'].splice(index,1)
            //     }
            // })
            // delete that.parent.searchContainer[that.uid]
            // that.parent.generateKeyValueTree()
            // common.removeAll(that.resTable)
            // common.removeAll(that.resButton)
        })

        var search = document.createElement('button')
        search.style.backgroundColor = 'green'
        search.style.width = '2%'
        search.style.border = '1px solid #ddd'
        search.style.color = 'white'
        search.style.cursor = 'pointer'
        search.fontSize = '15px'
        search.innerHTML = 'O'
        search.addEventListener("click", function() {
            // that.open()
        })

        var collapsible = document.createElement('button')
        collapsible.style.backgroundColor = '#777'
        collapsible.style.width = '94%'
        collapsible.style.border = '1px solid #ddd'
        collapsible.style.textAlign = 'left'
        collapsible.style.color = 'white'
        collapsible.style.cursor = 'pointer'
        collapsible.fontSize = '15px'
        collapsible.className = 'collapsible'
        collapsible.innerHTML = '+ ' + that.desc.value + ` (${that.res.count} hits)`
        collapsible.addEventListener("click", function() {
            // that.parent.shutAllSearch()
            // if (that.resTable.style.display === "block") {
            //     that.resTable.style.display = "none"
            //     that.parent.llt.uid = 'O/'+that.parent.uid+'/'
            //     that.parent.llt.refresh(that.parent.llt.point)
            // } else {
            //     that.resTable.style.display = "block"
            //     that.parent.llt.uid = 'O/'+that.parent.uid+'/'+that.uid
            //     that.parent.llt.refresh(that.parent.llt.point)
            // }
        })

        this.slider.addEventListener('input', (event) => {
            that.textFileOriginalView.jump(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.textFileOriginalView.jump(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(del)
        this.container.append(search)
        this.container.append(collapsible)
        this.container.append(this.table)
        this.container.append(this.slider)
    }

    refresh(lines){
        common.removeAllChild(this.table)
        lines.forEach((line) => {
            var tr = document.createElement('tr')
            tr.insertAdjacentHTML('beforeend', line)
            this.table.appendChild(tr)
        })
        // if (that.lines.length < that.range) {
        //     for(var i=0; i < that.range - that.lines.length; i++){
        //         var tr = document.createElement('tr')
        //         var td1 = document.createElement('td')
        //         td1.setAttribute('style', 'color:#FFF;background-color:#666666;font-size:10px;')
        //         var td2 = document.createElement('td')
        //         td2.setAttribute('style', 'color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left')
        //         td1.innerHTML = 'END'
        //         td2.innerHTML = 'END'
        //         tr.appendChild(td1)
        //         tr.appendChild(td2)
        //         that.table.appendChild(tr)
        //     }
        // }
    }
}

export {TextFileOriginalComponentTable, SearchAtomComponentTable}