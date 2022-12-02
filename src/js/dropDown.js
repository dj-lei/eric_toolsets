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
        var a = document.createElement('a')
        a.style.float = 'none'
        a.style.color = 'black'
        a.style.padding = '12px 16px'
        a.style.textDecoration = 'none'
        a.style.display = 'block'
        a.style.textAlign = 'left'
        a.innerHTML = item
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
        this.inputDropDownInit()
    }

    inputDropDownInit(){
        this.input = document.createElement('input')
        this.input.style.width = '100%'
        this.input.spellcheck = false
        this.input.type = 'text'

        this.box.append(this.input)
        this.box.append(this.dropDown)
        this.items.forEach(item => {
            this.addItem(item)
        })
    }
}

export {InputDropDown}