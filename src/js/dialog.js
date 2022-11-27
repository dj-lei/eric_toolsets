import http from '@/plugins/http'
import urls from '@/plugins/urls'
import common from '@/plugins/common'
import { ipcRenderer } from 'electron'

class Dialog
{
    constructor(){
        this.modal = ''
        this.container = ''
        this.dialogInit()
    }

    dialogInit(){
        this.modal = document.createElement('div')
        this.modal.className = 'modal'

        this.container = document.createElement('div')
        this.container.style.backgroundColor = '#555'
        this.container.className = 'container'

        this.modal.appendChild(this.container)
    }

    open(){
        this.modal.style.display = "block"
    }

    close(){
        this.modal.style.display = "none"
    }
}

class SearchDialog extends Dialog
{
    constructor(){
        super()
        // this.dialogInit()
        this.desc = ''
        this.expSearch = ''
        this.expRegex = ''
        this.highlight = ''
        this.condition = ''
        this.color = ''
        this.regexUl = ''
        this.highlightUl = ''
        this.conditionUl = ''
        this.searchDialogInit()
    }

    searchDialogInit(){
        let that = this

        // search description
        var descL = document.createElement('h4')
        descL.innerHTML = 'Search Description'
        this.desc = document.createElement('input')
        this.desc.spellcheck = false
        this.desc.type = 'text'

        // search express 
        var expSearchL = document.createElement('h4')
        expSearchL.innerHTML = 'Search Express'
        this.expSearch = document.createElement('input')
        this.expSearch.spellcheck = false
        this.expSearch.type = 'text'

        // regex express
        var expRegexL = document.createElement('h4')
        expRegexL.innerHTML = 'Key Value Extract Regex Express'
        this.expRegex = document.createElement('input')
        this.expRegex.style.width = '85%'
        this.expRegex.spellcheck = false
        this.expRegex.type = 'text'
        var addRegex = document.createElement('button')
        addRegex.style.width = '15%'
        addRegex.innerHTML = 'ADD'
        addRegex.onclick = function(){that.addRegexItem()}
        this.regexUl = document.createElement('ul')

        // highlight items
        var highlightL = document.createElement('h4')
        highlightL.innerHTML = 'Highlight Word(comma separation between words)'
        this.highlight = document.createElement('input')
        this.highlight.style.width = '75%'
        this.highlight.spellcheck = false
        this.highlight.type = 'text'
        this.color = document.createElement('input')
        this.color.type = 'color'
        var addHighlight = document.createElement('button')
        addHighlight.style.width = '15%'
        addHighlight.innerHTML = 'ADD'
        addHighlight.onclick = function(){that.addHighlightItem()}
        this.highlightUl = document.createElement('ul')

        // condition items
        var conditionL = document.createElement('h4')
        conditionL.innerHTML = 'Condition Judge'
        this.condition = document.createElement('input')
        this.condition.style.width = '85%'
        this.condition.spellcheck = false
        this.condition.type = 'text'
        var addCondition = document.createElement('button')
        addCondition.style.width = '15%'
        addCondition.innerHTML = 'ADD'
        addCondition.onclick = function(){that.addConditionItem()}
        this.conditionUl = document.createElement('ul')

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'SEARCH'
        apply.onclick = function(){that.search()}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}

        this.container.appendChild(descL)
        this.container.appendChild(this.desc)
        this.container.appendChild(expSearchL)
        this.container.appendChild(this.expSearch)

        this.container.appendChild(expRegexL)
        this.container.appendChild(this.expRegex)
        this.container.appendChild(addRegex)
        this.container.appendChild(this.regexUl)

        this.container.appendChild(highlightL)
        this.container.appendChild(this.highlight)
        this.container.appendChild(this.color)
        this.container.appendChild(addHighlight)
        this.container.appendChild(this.highlightUl)

        this.container.appendChild(conditionL)
        this.container.appendChild(this.condition)
        this.container.appendChild(addCondition)
        this.container.appendChild(this.conditionUl)

        this.container.appendChild(apply)
        this.container.appendChild(cancel)
        this.modal.appendChild(this.container)
    }

    async search(){
    }

    addRegexItem(){
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

    addHighlightItem(){
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

    addConditionItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.condition.value)
        t.style.width = '92%'
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.innerHTML = 'X'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(t)
        li.appendChild(x)
        this.conditionUl.append(li)
    }

    deleteItem(b){
        common.removeAll(b.parentNode)
    }
}

class ChartDialog extends Dialog{
    constructor(parent, position){
        super()
        this.register(position)
        this.parent = parent
        this.desc = ''
        this.chartDialogInit()
    }

    register(position){
        position.append(this.modal)
    }

    chartDialogInit(){
        let that = this

        var descL = document.createElement('h4')
        descL.innerHTML = 'Title'
        this.desc = document.createElement('input')
        this.desc.spellcheck = false
        this.desc.type = 'text'

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'APPLY'
        apply.onclick = function(){that.apply()}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}

        this.container.appendChild(descL)
        this.container.appendChild(this.desc)
        this.container.appendChild(apply)
        this.container.appendChild(cancel)
        this.modal.appendChild(this.container)
    }

    apply(){
        this.parent.applyConfig()
    }
}

class ShareDownloadDialog extends Dialog
{
    constructor(position){
        super()
        this.register(position)
        this.themes = []
        this.ShareDownloadDialogInit()
    }

    register(position){
        position.append(this.modal)
    }

    async ShareDownloadDialogInit(){
        let that = this

        await http.get(urls.query_themes, {
            params: {
            },
            })
          .then(response => {
            this.themes = response.data.themes
            this.themes.forEach((theme) => {
                var div = document.createElement("div")
                div.style.width = '100%'
                div.style.display = 'block'
                div.style.position = 'relative'
                var input = document.createElement("input")
                input.style.float = 'left'
                input.style.cursor = 'pointer'
                input.type = 'radio'
                input.value = theme
                input.name = 'share-download'
                var label = document.createElement("h4")
                label.style.color = '#FFF'
                label.innerHTML = theme
                div.appendChild(input)
                div.appendChild(label)
                this.container.appendChild(div)
            })

            var download = document.createElement('button')
            download.style.width = "33%"
            download.innerHTML = 'DOWNLOAD'
            download.onclick = function(){that.download()}
            var refresh = document.createElement('button')
            refresh.style.width = "33%"
            refresh.innerHTML = 'REFRESH'
            refresh.onclick = function(){that.refresh()}
            var cancel = document.createElement('button')
            cancel.style.width = "33%"
            cancel.style.backgroundColor = 'red'
            cancel.innerHTML = 'CANCEL'
            cancel.onclick = function(){that.close()}

            this.container.appendChild(download)
            this.container.appendChild(refresh)
            this.container.appendChild(cancel)
            this.modal.appendChild(this.container)
            })
            .catch(function (error) {
                alert('Can not link to sharing service!')
                that.close()
            })
    }

    async download(){
        if (process.env.NODE_ENV == 'development'){
            await ipcRenderer.invoke('downloadURL', {url:`http://localhost:8001/download_theme/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }else{
            await ipcRenderer.invoke('downloadURL', {url:`http://10.166.152.87/share/download_theme/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }
    }

    refresh(){
        common.removeAllChild(this.container)
        this.ShareDownloadDialogInit()
    }
}

export {SearchDialog, ChartDialog, ShareDownloadDialog}