import { io } from "socket.io-client"
import common from '@/plugins/common'

const server = "http://127.0.0.1:8000"

class Element
{
    constructor(position){
        this.container = document.createElement('div')
        this.container.style.display = 'block'
        this.container.style.width = '100%'
        position.append(this.container)
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

    deleteAllChilds(){
      while (this.container.firstChild) {
        this.container.removeChild(this.container.lastChild)
      }
    }
}

class View extends Element
{
    constructor(namespace){
        super(document.getElementById(namespace))
        this.namespace = namespace
        this.container.setAttribute("name", this.namespace)
        this.socket = io(`${server}${this.namespace}`)

        var funcs = common.arrayExtend(Object.getOwnPropertyNames(Object.getPrototypeOf(this)), Object.getOwnPropertyNames(Object.getPrototypeOf(this.__proto__)))
        funcs.forEach((functionName) => {
            if(functionName.slice(0,2) === 'on'){
                var listenName = functionName.slice(2)
                listenName = listenName.charAt(0).toLowerCase() + listenName.slice(1)
                this.socket.on(listenName, (request) => {
                    this[functionName](request)
                })
            }
        })
    }

    onDisplay(){
        this.display()
    }

    onHidden(){
        this.hidden()
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

    createElementH4(name){
        var h4 = document.createElement('h4')
        h4.innerHTML = name

        return h4
    }

    createElementTextInput(){
        var textInput = document.createElement('input')
        textInput.style.width = '100%'
        textInput.style.padding = '12px 20px'
        textInput.style.margin = '8px 0'
        textInput.style.display = 'inline-block'
        textInput.style.border = '1px solid #ccc'
        textInput.style.boxSizing = 'border-box'
        textInput.spellcheck = false
        textInput.type = 'text'

        return textInput
    }

    createElementColorInput(){
        var colorInput = document.createElement('input')
        colorInput.style.width = '10%'
        colorInput.style.padding = '12px 0px'
        colorInput.style.height = '43px'
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
        button.style.padding = '5px 8px'
        button.style.fontSize = '12px'
        button.style.display = 'inline-block'
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

    createElementSelect(){
        var select = document.createElement('select')
        return select
    }
}

export {Element, View, Component}