import common from '@/plugins/common'
import { ipcRenderer } from 'electron'

import { Graph } from './graph'
const fs = require('fs')

class Dialog extends Graph
{
    constructor(position){
        super(position)
        this.container.style.display = 'none'
        this.container.style.position = 'fixed'
        this.container.style.zIndex = 1
        this.container.style.left = 0
        this.container.style.top = 0
        this.container.style.width = '100%'
        this.container.style.height = '100%'
        this.container.style.overflow = 'auto'

        this.subContainer = document.createElement('div')
        this.subContainer.style.color = 'white'
        this.subContainer.style.width = '40%'
        this.subContainer.style.border = '1px solid #888'
        this.subContainer.style.margin = '5% auto 15% auto'
        this.subContainer.style.backgroundColor = '#fefefe'

        this.container.appendChild(this.subContainer)
    }

    async browseFilesDirectory(_callback){
        let content = await ipcRenderer.invoke('open-dir')
        _callback(content.filePaths[0])
    }
}

class SearchAtomComponentDialog extends Dialog
{
    constructor(searchAtomView){
        super(searchAtomView.container)
        this.searchAtomView = searchAtomView

        this.desc = ''
        this.expSearch = ''
        this.expExtract = ''
        this.expSign = ''
        this.expSignColor = ''
        this.expExtractUl = ''
        this.expSignUl = ''

        this.init()
    }

    init(){
        let that = this

        // search description
        var descL = document.createElement('h4')
        descL.innerHTML = 'Search Description'
        this.desc = document.createElement('input')
        this.desc.spellcheck = false
        this.desc.type = 'text'
        this.subContainer.appendChild(descL)
        this.subContainer.appendChild(this.desc)

        // search regex express 
        var expSearchL = document.createElement('h4')
        expSearchL.innerHTML = 'Search Express'
        this.expSearch = document.createElement('input')
        this.subContainer.appendChild(expSearchL)
        this.subContainer.appendChild(this.expSearch)

        // extract key value regex express
        var expExtractL = document.createElement('h4')
        expExtractL.innerHTML = 'Extract Key Value Regex Express'
        this.expExtract = document.createElement('input')
        this.expExtract.style.width = '85%'
        this.expExtract.spellcheck = false
        this.expExtract.type = 'text'
        var addExpExtract = document.createElement('button')
        addExpExtract.style.width = '15%'
        addExpExtract.innerHTML = 'ADD'
        addExpExtract.onclick = function(){that.addExpExtractItem()}
        this.expExtractUl = document.createElement('ul')
        this.subContainer.appendChild(expExtractL)
        this.subContainer.appendChild(this.expExtract)
        this.subContainer.appendChild(addExpExtract)
        this.subContainer.appendChild(this.expExtractUl)

        // sign key location express
        var expSignL = document.createElement('h4')
        expSignL.innerHTML = 'Sign Key Location Express'
        this.expSign = document.createElement('input')
        this.expSign.style.width = '75%'
        this.expSign.spellcheck = false
        this.expSign.type = 'text'
        this.expSignColor = document.createElement('input')
        this.expSignColor.type = 'color'
        var addExpSign = document.createElement('button')
        addExpSign.style.width = '15%'
        addExpSign.innerHTML = 'ADD'
        addExpSign.onclick = function(){that.addExpSignItem()}
        this.expSignUl = document.createElement('ul')
        this.subContainer.appendChild(expSignL)
        this.subContainer.appendChild(this.expSign)
        this.subContainer.appendChild(this.expSignColor)
        this.subContainer.appendChild(addExpSign)
        this.subContainer.appendChild(this.expSignUl)

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'SEARCH'
        apply.onclick = function(){that.search(function() {})}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}
        this.subContainer.appendChild(apply)
        this.subContainer.appendChild(cancel)
    }

    async search(){
    }

    addExpExtractItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.expRegex.value)
        t.style.width = '92%'
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.innerHTML = 'X'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(t)
        li.appendChild(x)
        this.regexUl.append(li)
    }

    addExpSignItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.highlight.value)
        t.style.width = '82%'
        var c = document.createElement("input")
        c.setAttribute('type', "color")
        c.setAttribute('value', this.color.value)
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.onclick = function(){that.deleteItem(x)}
        x.innerHTML = 'X'

        li.appendChild(t)
        li.appendChild(c)
        li.appendChild(x)
        this.highlightUl.append(li)
    }

    deleteItem(b){
        common.removeAll(b.parentNode)
    }
}

export {SearchAtomComponentDialog}