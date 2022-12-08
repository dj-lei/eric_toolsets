import common from '@/plugins/common'

class DropDown
{
    constructor(){
        this.box = ''
        this.dropDown = ''
        this.dropDownInit()
    }

    dropDownInit(){
        this.box = document.createElement('div')
        this.box.style.width = '100%'
        this.box.style.float = 'left'
        this.box.style.overflow = 'hidden'

        this.dropDown = document.createElement('div')
        this.dropDown.style.display = 'none'
        this.dropDown.style.position = 'absolute'
        this.dropDown.style.backgroundColor = '#f9f9f9'
        this.dropDown.style.zIndex = 1
    }

    addItem(item){
        let that = this
        var a = document.createElement('a')
        a.style.backgroundColor = '#000'
        a.style.float = 'none'
        a.style.color = 'white'
        a.style.padding = '12px 16px'
        a.style.textDecoration = 'none'
        a.style.display = 'block'
        a.style.textAlign = 'left'
        a.style.border = '1px solid #ddd'
        a.innerHTML = item
        a.addEventListener('mouseover', (event) => {
            a.style.backgroundColor = '#666'
        })
        a.addEventListener('mouseout', (event) => {
            a.style.backgroundColor = '#000'
        })
        a.addEventListener('click', (event) => {
            that.updateInput(a)
        })
        this.dropDown.append(a)
    }

    bindClickEvent(){

    }

    onMouseOver(){

    }

    onMouseOut(){

    }
}

class InputDropDown extends DropDown
{
    constructor(items){
        super()
        this.input = ''
        this.items = items
        this.selectItem = ''
        this.inputWord = ''
        this.inputDropDownInit()
    }

    inputDropDownInit(){
        this.input = document.createElement('input')
        this.input.style.width = '100%'
        this.input.spellcheck = false
        this.input.type = 'text'

        this.input.addEventListener("keydown", (event) => {
            this.keyDownEvent(event)
        });

        this.box.append(this.input)
        this.box.append(this.dropDown)
    }

    keyDownEvent(event){
        if(event.ctrlKey == true){
          return
        }
        if(event.key == 'ArrowDown'){
            this.clearDropdownBackColor()
            if (this.selectItem === '') {
                this.selectItem = this.dropDown.firstChild
            }else{
                if (this.selectItem.nextSibling) {
                    this.selectItem = this.selectItem.nextSibling
                }
            }
            this.selectItem.style.backgroundColor = '#666'
            event.preventDefault()
        }else if(event.key == 'ArrowUp'){
            this.clearDropdownBackColor()
            if (this.selectItem === this.dropDown.firstChild) {
                console.log('Top!!!')
            }else{
                this.selectItem = this.selectItem.previousSibling
            }
            this.selectItem.style.backgroundColor = '#666'
            event.preventDefault()
        }else if(event.key == 'Enter'){
            this.updateInput(this.selectItem)
        }else if(event.key == 'Backspace'){
            if(this.inputWord.length > 0){
                this.inputWord = this.inputWord.slice(0, this.inputWord.length - 1)
                if (this.inputWord.length > 0) {
                    this.filterItems()
                }else{
                    this.dropDown.style.display = 'none'
                }
            }
        }else if(event.code == 'Space'){
            this.dropDown.style.display = 'none'
            this.inputWord = ''
            this.selectItem = ''
        }else if((event.key.length == 1)&(!['&','|','=','>','<','(',')','.','"'].includes(event.key))){
            if(this.inputWord == ''){
                if(event.key.match(/[0-9]/g)){
                    return
                }else{
                    this.inputCursorStart = this.input.selectionStart
                }
            }
            this.inputWord = this.inputWord + event.key
            this.filterItems()
        }
    }

    filterItems(){
        common.removeAllChild(this.dropDown)
        var count = 0
        this.items.forEach((item) => {
            if (item.toUpperCase().indexOf(this.inputWord.toUpperCase()) > -1) {
                if (count < 20) {
                    this.addItem(item)
                    count = count + 1
                }
            }
        })
        this.dropDown.style.display = 'block'
        this.selectItem = ''
    }

    clearDropdownBackColor(){
        this.dropDown.childNodes.forEach(child => {
            child.style.backgroundColor = "#000"
        })
    }

    updateInput(selectItem){
        var cmd = this.input
        var tmp = cmd.value.substring(0, this.inputCursorStart) + selectItem.innerHTML
        cmd.value =  tmp + cmd.value.substring(this.inputCursorStart + this.inputWord.length, cmd.value.length)
        this.input.selectionEnd = tmp.length
        this.dropDown.style.display = 'none'
        this.inputWord = ''
    }
}

export {InputDropDown}