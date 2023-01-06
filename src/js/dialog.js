import common from '@/plugins/common'
import { ipcRenderer } from 'electron'

import { Component } from './element'

class Dialog extends Component
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
        this.subContainer.style.backgroundColor = '#333'
        this.subContainer.style.color = 'white'
        this.subContainer.style.width = '40%'
        this.subContainer.style.border = '1px solid #888'
        this.subContainer.style.margin = '5% auto 15% auto'

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

        this.alias = ''
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

        // alias
        this.alias = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Alias(Global Unique)'))
        this.subContainer.appendChild(this.alias)

        // search description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Search Description'))
        this.subContainer.appendChild(this.desc)

        // search regex express 
        this.expSearch = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Search Express'))
        this.subContainer.appendChild(this.expSearch)

        // extract key value regex express
        this.expExtract = this.createElementTextInput()
        this.expExtract.style.width = '85%'
        var addExpExtract = this.createElementButton('ADD')
        addExpExtract.style.width = '15%'
        addExpExtract.onclick = function(){that.addExpExtractItem()}
        this.expExtractUl = this.createElementUl()
        this.subContainer.appendChild(this.createElementH4('Extract Key Value Regex Express'))
        this.subContainer.appendChild(this.expExtract)
        this.subContainer.appendChild(addExpExtract)
        this.subContainer.appendChild(this.expExtractUl)

        // sign key location express
        this.expSignAlias = this.createElementTextInput()
        this.expSignAlias.style.width = '10%'
        this.expSign = this.createElementTextInput()
        this.expSign.style.width = '65%'
        this.expSignColor = this.createElementColorInput()
        var addExpSign = this.createElementButton('ADD')
        addExpSign.style.width = '15%'
        addExpSign.onclick = function(){that.addExpSignItem()}
        this.expSignUl = this.createElementUl()
        this.subContainer.appendChild(this.createElementH4('Sign Key Location Express'))
        this.subContainer.appendChild(this.expSignAlias)
        this.subContainer.appendChild(this.expSign)
        this.subContainer.appendChild(this.expSignColor)
        this.subContainer.appendChild(addExpSign)
        this.subContainer.appendChild(this.expSignUl)

        // search and cancel button
        var apply = this.createElementButton('SEARCH')
        apply.style.width = '50%'
        apply.onclick = function(){that.search()}
        var cancel = this.createElementButton('CANCEL')
        cancel.style.backgroundColor = 'red'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(apply)
        this.subContainer.appendChild(cancel)
    }

    search(){
        let model = {
            namespace: this.searchAtomView.namespace,
            alias: this.alias.value,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            exp_extract: this.getExpExtractList(),
            exp_sign: this.getExpSignList(),
        }
        this.searchAtomView.search(model)
    }

    update(model){
        this.alias.value = model.alias
        this.desc.value = model.desc
        this.expSearch.value = model.expSearch
        model.expExtract.forEach((exp) => {
            this.expExtract.value = exp
            this.addExpExtractItem()
        })
        model.expSign.forEach((sign) => {
            this.expSignAlias.value = sign.alias
            this.expSign.value = sign.exp
            this.expSignColor.value = sign.color
            this.addExpSignItem()
        })
    }

    addExpExtractItem(){
        let that = this
        var li = this.createElementLi()

        var t = this.createElementTextInput()
        t.setAttribute('value', this.expExtract.value)
        t.style.width = '92%'
        var x = this.createElementButton('X')
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(t)
        li.appendChild(x)
        this.expExtractUl.append(li)
    }

    addExpSignItem(){
        let that = this
        var li = this.createElementLi()

        var a = this.createElementTextInput()
        a.setAttribute('value', this.expSignAlias.value)
        a.style.width = '10%'
        var t = this.createElementTextInput()
        t.setAttribute('value', this.expSign.value)
        t.style.width = '72%'
        var c = this.createElementColorInput()
        c.setAttribute('value', this.expSignColor.value)
        var x = this.createElementButton('X')
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(a)
        li.appendChild(t)
        li.appendChild(c)
        li.appendChild(x)
        this.expSignUl.append(li)
    }

    getExpExtractList(){
        var expExtracts = []
        for (const li of this.expExtractUl.children) {
            for (const elm of li.children) {
                if (elm.tagName == 'INPUT'){
                    expExtracts.push(elm.value)
                }
            }
        }
        return expExtracts
    }

    getExpSignList(){
        var expSigns = []
        for (const li of this.expSignUl.children) {
            var item = []
            for (const elm of li.children) {
                if (elm.tagName == 'INPUT'){
                    item.push(elm.value)
                }
            }
            expSigns.push(item)
        }
        return expSigns
    }

    deleteItem(item){
        common.removeAll(item.parentNode)
    }
}

export {SearchAtomComponentDialog}