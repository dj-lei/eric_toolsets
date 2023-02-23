import { io } from "socket.io-client"
import common from '@/plugins/common'

const server = "http://127.0.0.1:8000"

class Element
{
    constructor(position){
        this.container = document.createElement('div')
        this.container.style.position = 'relative'
        this.container.style.display = 'block'
        this.container.style.width = '100%'

        this.loader = document.createElement('div')
        this.loader.style.display = 'none'
        this.loader.style.position = 'absolute'
        this.loader.style.backgroundColor = '#000'
        this.loader.style.opacity = 0.5
        this.loader.style.width = "100%"
        this.loader.style.height = "100%"
        this.loader.style.left = 0
        this.loader.style.top = 0
        this.loader.style.zIndex = 1

        this.spin = document.createElement('div')
        this.spin.style.position = 'absolute'
        this.spin.style.left = 0
        this.spin.style.top = 0
        this.spin.style.right = 0
        this.spin.style.bottom = 0
        this.spin.style.margin = 'auto'
        this.spin.style.zIndex = 2
        this.spin.style.width = '8px'
        this.spin.style.height = '8px'
        this.spin.style.border = '10px solid #FFF'
        this.spin.style.borderRadius = '50%'
        this.spin.style.borderTop = '10px solid #000'
        this.spin.style.animation = 'spin 2s linear infinite'
        this.spin.style.borderRadius = '50%'
        this.loader.append(this.spin)

        var cssAnimation = document.createElement('style');
        cssAnimation.type = 'text/css'
        var rules = document.createTextNode('@keyframes spin {'+
        '0% { transform: rotate(0deg); }'+
        '100% { transform: rotate(360deg); }'+
        '}')
        cssAnimation.appendChild(rules)
        document.getElementsByTagName("head")[0].appendChild(cssAnimation)

        position.append(this.container)
        this.container.append(this.loader)
    }

    hidden(){
        this.container.style.display = 'none'
    }

    display(){
        this.container.style.display = 'block'
    }

    delete(){
        this.deleteAllChilds()
        this.container.parentNode.removeChild(this.container)
    }

    startLoader(){
        this.loader.style.display = 'block'
    }

    stopLoader(){
        this.loader.style.display = 'none'
    }

    deleteAllChilds(){
      while (this.container.firstChild) {
        this.container.removeChild(this.container.lastChild)
      }
    }

    deleteDomAllChilds(dom){
        while (dom.firstChild) {
            dom.removeChild(dom.lastChild)
        }
    }
}

class View extends Element
{
    constructor(namespace, position){
        super(position)
        this.namespace = namespace
        this.container.id = this.namespace
        this.initOn()
    }

    initOn(){
        this.socket = io(`${server}${this.namespace}`, { transports: ["websocket"] , secure: false})

        var funcs = common.arrayExtend(Object.getOwnPropertyNames(Object.getPrototypeOf(this)), Object.getOwnPropertyNames(Object.getPrototypeOf(this.__proto__)))
        funcs = common.arrayExtend(funcs, Object.getOwnPropertyNames(View.prototype))
        funcs = common.arrayDuplicates(funcs)
        funcs.forEach((functionName) => {
            if(functionName.slice(0,2) === 'on'){
                var listenName = functionName.slice(2)
                listenName = listenName.charAt(0).toLowerCase() + listenName.slice(1)
                this.socket.on(listenName, (request) => {
                    this[functionName](request)
                })
            }
        })
        // console.log("connected", this.namespace)
        // this.socket.disconnect().connect()
        this.socket.emit("connected", this.namespace)
    }

    controlDelete(){
        this.socket.emit("delete")
    }

    onReconnect(namespace){
        var dom = document.getElementById(this.namespace)
        if (dom) {
            dom.id = namespace
        }
        this.namespace = namespace
        this.socket.disconnect()
        this.initOn()
    }

    onDisplay(){
        this.display()
    }

    onHidden(){
        this.hidden()
    }

    onDelete(){
        this.delete()
        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket.close()
        this.socket = ''
    }

    onDisplayDialog(){
        this.dialog.display()
    }

    onHiddenDialog(){
        this.dialog.hidden()
    }

    onUpdateDialog(model){
        this.dialog.update(model)
    }

    onDisplayShow(){
        this.show.display()
    }

    onHiddenShow(){
        this.show.hidden()
    }

    onStartLoader(){
        this.startLoader()
    }

    onStopLoader(){
        this.stopLoader()
    }
}

class ListView extends View
{
    constructor(namespace, position){
        super(namespace, position)

        this.del = this.createElementButton('X')
        this.del.style.backgroundColor = 'red'
        this.del.style.width = '2%'

        this.edit = this.createElementButton('O')
        this.edit.style.backgroundColor = 'green'
        this.edit.style.width = '2%'

        this.collapsible = this.createElementButton('+')
        this.collapsible.style.backgroundColor = '#777'
        this.collapsible.style.width = '94%'
        this.collapsible.style.textAlign = 'left'

        let that = this
        this.del.addEventListener("click", function() {
            that.controlDelete()
        })
        this.edit.addEventListener("click", function() {
            that.onDisplayDialog()
        })

        this.onHidden()
        this.container.append(this.del)
        this.container.append(this.edit)
        this.container.append(this.collapsible)
    }

    controlExec(model){
        if(this.namespace.includes('/Tmp')){
            this.socket.emit("exec", model, 'tmp')
        }else{
            this.socket.emit("exec", model)
            if (model.alias != this.model.alias) {
                this.onReconnect(this.namespace.split('/').slice(0, this.namespace.split('/').length - 1).join('/')+'/'+model.alias)
            }
        }
        this.dialog.hidden()
    }

    onRefresh(model){
        this.model = model
        this.onUpdateDialog(model)
        this.show.refresh(this.model)
    }

    onDisplay(){
        super.onDisplay()
        this.del.style.display = 'inline-block'
        this.edit.style.display = 'inline-block'
        this.collapsible.style.display = 'inline-block'
    }

    onHidden(){
        this.del.style.display = 'none'
        this.edit.style.display = 'none'
        this.collapsible.style.display = 'none'
    }

    createElementButton(name){
        var button = document.createElement('button')
        button.style.color = 'white'
        button.style.backgroundColor = '#555'
        button.style.border = '1px solid #333'
        button.style.cursor = 'pointer'
        button.style.padding = '5px 8px'
        button.style.fontSize = '12px'
        button.innerHTML = name
        return button
    }
}

class BatchView extends View
{
    constructor(namespace, position){
        super(namespace, position)
    }

    controlExec(model){
        this.socket.emit("exec", model)
        this.show.clear()
        this.dialog.hidden()
        this.show.display()
    }

    onRefresh(sample){
        this.show.refresh(sample)
    }
}

class Component extends Element
{
    constructor(position){
        super(position)
    }

    locateChildElement(parent, element, name){
        return parent.querySelector(`${element}[name="${name}"]`)
    }

    createElementDiv(){
        var div = document.createElement('div')
        return div
    }

    createElementHr(){
        var hr = document.createElement('hr')
        hr.style.borderTop = '1px solid #bbb'
        return hr
    }

    createElementHeader(name){
        var hc = document.createElement('div')
        hc.style.width = '100%'

        var header = document.createElement('a')
        header.style.fontSize = '16px'
        header.style.fontWeight = 'bold'
        header.innerHTML = name
        hc.append(header)
        return hc
    }

    createElementA(name){
        var a = document.createElement('a')
        a.style.fontSize = '12px'
        a.style.fontWeight = 'bold'
        a.innerHTML = name
        return a
    }

    createElementAHref(name, href){
        var a = document.createElement('a')
        a.style.fontSize = '10px'
        a.style.fontWeight = 'bold'
        a.innerHTML = name
        a.href = href
        return a
    }

    createElementTextInput(){
        var textInput = document.createElement('input')
        textInput.style.width = '100%'
        textInput.style.padding = '6px 10px'
        textInput.style.margin = '8px 0'
        textInput.style.display = 'inline-block'
        textInput.style.border = '1px solid #ccc'
        textInput.style.boxSizing = 'border-box'
        textInput.spellcheck = false
        textInput.type = 'text'

        return textInput
    }

    createElementCheckboxInput(){
        var checkboxInput = document.createElement('input')
        checkboxInput.style.width = '20px'
        checkboxInput.style.height = '20px'
        checkboxInput.type = 'checkbox'
        return checkboxInput
    }

    createElementColorInput(){
        var colorInput = document.createElement('input')
        colorInput.style.width = '10%'
        colorInput.style.padding = '6px 10px'
        colorInput.style.height = '30px'
        colorInput.style.display = 'inline-block'
        colorInput.style.boxSizing = 'border-box'
        colorInput.type = 'color'

        return colorInput
    }

    createElementRangeInput(count){
        var rangeInput = document.createElement('input')
        rangeInput.style.display = 'inline-block'
        rangeInput.type = 'range'
        rangeInput.min = 0
        rangeInput.max = count
        rangeInput.style.width = '1%'
        rangeInput.value=0
        rangeInput.step=1

        rangeInput.style.transition = "opacity .2s"
        rangeInput.style.direction = "rtl"
        rangeInput.style.background = "#d3d3d3"
        rangeInput.style.outline = "none"
        rangeInput.style.opacity = 0.7

        rangeInput.style.webkitTransform = "rotateX(180deg)"
        rangeInput.style.webkitAppearance = "slider-vertical"
        rangeInput.style.webkitTransition = ".2s"

        return rangeInput
    }

    createElementButton(name){
        var button = document.createElement('button')
        button.style.color = 'white'
        button.style.backgroundColor = '#555'
        button.style.border = '1px solid #333'
        button.style.cursor = 'pointer'
        button.style.padding = '8px 10px'
        button.style.fontSize = '12px'
        button.innerHTML = name
        return button
    }

    createElementUl(){
        var ul = document.createElement('ul')
        return ul
    }

    createElementLi(){
        var li = document.createElement('li')
        return li
    }

    createElementTable(){
        var table = document.createElement('table')
        table.style.display = 'inline-block'
        table.style.width = '98%'
        table.style.overflowX = 'scroll'
        table.style.overflowY= 'hidden'
        table.style.whiteSpace = 'nowrap'
        table.style.border = 'none'
        return table
    }

    createElementTr(){
        var tr = document.createElement('tr')
        tr.style.borderBottom = '1px solid #ddd'
        return tr
    }

    createElementTh(){
        var th = document.createElement('th')
        th.style.border = '1px solid #ddd'
        th.style.textAlign = 'left'
        th.style.padding = '8px'
        return th
    }

    createElementTd(){
        var td = document.createElement('td')
        td.style.textAlign = 'left'
        td.style.fontSize = '12px'
        td.style.color = '#FFF'
        td.style.border = '1px solid #555'
        td.style.textAlign = 'left'
        // td.style.padding = '6px'
        return td
    }

    createElementTextarea(){
        var textarea = document.createElement('textarea')
        textarea.style.display = 'inline-block'
        textarea.style.width = '100%'
        textarea.style.overflow = 'auto'
        textarea.style.resize = 'vertical'
        textarea.spellcheck = false
        // table.style.overflowX = 'scroll'
        // table.style.overflowY= 'hidden'
        // table.style.whiteSpace = 'nowrap'
        textarea.style.border = 'none'
        return textarea
    }

    createElementSelect(){
        var select = document.createElement('select')
        return select
    }
}

export {Element, View, ListView, BatchView, Component}