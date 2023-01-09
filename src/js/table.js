import { Component } from './element'

import common from '@/plugins/common'

class Table extends Component
{
    constructor(position){
        super(position)
        this.table = ''
        this.slider = ''
        this.count = 0
        this.container.style.display = 'inline-block'
        this.table = this.createElementTable()
        this.slider = this.createElementRangeInput(this.count)
    }

    deleteTableAllChilds(){
        while (this.table.firstChild) {
            this.table.removeChild(this.table.lastChild)
        }
    }
}

class TextFileOriginalComponentTable extends Table
{
    constructor(textFileOriginalView){
        super(textFileOriginalView.container)
        this.textFileOriginalView = textFileOriginalView

        let that = this
        this.slider.addEventListener('input', (event) => {
            that.textFileOriginalView.scroll(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.textFileOriginalView.scroll(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(this.table)
        this.container.append(this.slider)
    }

    refresh(model){
        this.deleteTableAllChilds()
        this.slider.max = model.count
        model.displayLines.forEach((line) => {
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
        this.collapsible = ''

        let that = this
        this.slider.style.height = `${18 * 15}px`
        var del = this.createElementButton('X')
        del.style.backgroundColor = 'red'
        del.style.width = '2%'
        del.addEventListener("click", function() {
            that.searchAtomView.onDelete()
        })

        var search = this.createElementButton('O')
        search.style.backgroundColor = 'green'
        search.style.width = '2%'
        search.addEventListener("click", function() {
            that.searchAtomView.searchAtomComponentDialog.display()
        })

        this.collapsible = this.createElementButton('')
        this.collapsible.style.backgroundColor = '#777'
        this.collapsible.style.width = '94%'
        this.collapsible.style.textAlign = 'left'
        this.collapsible.addEventListener("click", function() {
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
            if (that.table.style.display === "inline-block") {
                that.table.style.display = "none"
                that.slider.style.display = "none"
                // that.parent.llt.refresh(that.parent.llt.point)
            } else {
                that.table.style.display = "inline-block"
                that.slider.style.display = "inline-block"
                // that.parent.llt.refresh(that.parent.llt.point)
            }
        })

        this.slider.addEventListener('input', (event) => {
            that.searchAtomView.scroll(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.searchAtomView.scroll(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(del)
        this.container.append(search)
        this.container.append(this.collapsible)
        this.container.append(this.table)
        this.container.append(this.slider)
    }

    refresh(model){
        this.deleteTableAllChilds()
        this.slider.max = model.count
        this.collapsible.innerHTML = '+ ' + model.desc + ` (${model.count} hits)`
        model.displayLines.forEach((line) => {
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