import common from '@/plugins/common'
import { Component } from './element'

class Navigate extends Component
{
    constructor(position){
        super(position)

        this.topNavigate = this.createElementDiv()
        this.topNavigate.style.backgroundColor = '#FFF'
        this.topNavigate.style.color = '#000'
        this.topNavigate.style.top = 0
        this.topNavigate.style.width = '100%'

        this.bottomNavigate = this.createElementDiv()
        this.bottomNavigate.style.color = '#000'
        this.bottomNavigate.style.position = 'fixed'
        this.bottomNavigate.style.bottom = 0
        this.bottomNavigate.style.width = '50%'

        this.container.append(this.topNavigate)
        this.container.append(this.bottomNavigate)
    }
}

class TextFileOriginalComponentNavigate extends Navigate
{
    constructor(textFileOriginalView){
        super(textFileOriginalView.container)
        this.textFileOriginalView = textFileOriginalView

        // Align Type Form
        var viewModeForm = this.createElementForm()
        viewModeForm.append(this.createElementLabel('ViewMode: '))

        var uid = common.uuidv4()
        var textMode = this.createElementRadioInput()
        textMode.checked = true
        textMode.id = uid
        textMode.name = 'ViewMode'
        textMode.value = 'textMode'
        viewModeForm.append(textMode)
        viewModeForm.append(this.createElementLabel('Text', uid))

        uid = common.uuidv4()
        var storyMode = this.createElementRadioInput()
        storyMode.id = uid
        storyMode.name = 'ViewMode'
        storyMode.value = 'storyMode'
        viewModeForm.append(storyMode)
        viewModeForm.append(this.createElementLabel('Story', uid))
        this.topNavigate.appendChild(viewModeForm)

        let that = this
        const mode = viewModeForm.querySelectorAll('input[name="ViewMode"]')
        mode.forEach(option => {
            option.addEventListener('click', () => {
                if (option.value == 'textMode') {
                    that.textFileOriginalView.tableShow.display()
                    that.textFileOriginalView.svgShow.hidden()
                }else if(option.value == 'storyMode') {
                    that.textFileOriginalView.tableShow.hidden()
                    that.textFileOriginalView.svgShow.display()
                }
            })
        })
    }
}

class TextFileOriginalComponentSvgNavigate extends Navigate
{
    constructor(textFileOriginalComponentSvg){
        super(textFileOriginalComponentSvg.container)
        this.textFileOriginalComponentSvg = textFileOriginalComponentSvg
        // var fileName = this.textFileOriginalComponentSvg.textFileOriginalView.model.file_name
        // console.log(fileName)
        // Align Type Form
        var alignTypeForm = this.createElementForm()
        alignTypeForm.style.marginRight = '50px'
        // alignTypeForm.style.border = '1px solid black'
        alignTypeForm.append(this.createElementLabel('AlignType: '))

        var uid = common.uuidv4()
        var alignTypeTimestamp = this.createElementRadioInput()
        alignTypeTimestamp.checked = true
        alignTypeTimestamp.id = uid
        alignTypeTimestamp.name = 'AlignType'
        alignTypeTimestamp.value = 'timestamp'
        alignTypeForm.append(alignTypeTimestamp)
        alignTypeForm.append(this.createElementLabel('Timestamp', uid))

        uid = common.uuidv4()
        var alignTypeGlobal = this.createElementRadioInput()
        alignTypeGlobal.id = uid
        alignTypeGlobal.name = 'AlignType'
        alignTypeGlobal.value = 'global'
        alignTypeForm.append(alignTypeGlobal)
        alignTypeForm.append(this.createElementLabel('Global', uid))
        this.topNavigate.appendChild(alignTypeForm)

        // Line Type Form
        var LineTypeForm = this.createElementForm()
        // LineTypeForm.style.border = '1px solid black'
        LineTypeForm.append(this.createElementLabel('LineType: '))

        uid = common.uuidv4()
        var LineTypeDash = this.createElementRadioInput()
        LineTypeDash.checked = true
        LineTypeDash.id = uid
        LineTypeDash.name = 'LineType'
        LineTypeDash.value = 'dash'
        LineTypeForm.append(LineTypeDash)
        LineTypeForm.append(this.createElementLabel('Dash', uid))

        uid = common.uuidv4()
        var LineTypeSolid = this.createElementRadioInput()
        LineTypeSolid.id = uid
        LineTypeSolid.name = 'LineType'
        LineTypeSolid.value = 'solid'
        LineTypeForm.append(LineTypeSolid)
        LineTypeForm.append(this.createElementLabel('Solid', uid))

        uid = common.uuidv4()
        var LineTypeDot = this.createElementRadioInput()
        LineTypeDot.id = uid
        LineTypeDot.name = 'LineType'
        LineTypeDot.value = 'dot'
        LineTypeForm.append(LineTypeDot)
        LineTypeForm.append(this.createElementLabel('Dot', uid))

        this.title = this.createElementLabel('Title', 'title')
        this.title.style.float = 'right'
        
        this.topNavigate.appendChild(LineTypeForm)
        this.topNavigate.appendChild(this.title)

        let that = this
        const alignType = alignTypeForm.querySelectorAll('input[name="AlignType"]')
        alignType.forEach(option => {
            option.addEventListener('click', () => {
                that.textFileOriginalComponentSvg.alignType = option.value
                that.textFileOriginalComponentSvg.update()
            })
        })

        const LineType = LineTypeForm.querySelectorAll('input[name="LineType"]')
        LineType.forEach(option => {
            option.addEventListener('click', () => {
                that.textFileOriginalComponentSvg.lineType = option.value
                that.textFileOriginalComponentSvg.update()
            })
        })
    }

    setTitle(title){
        this.title.innerHTML = title
    }
}

class ChartAtomComponentLineChartNavigate extends Navigate
{
    constructor(chartAtomComponentLineChart){
        super(chartAtomComponentLineChart.container)
        this.chartAtomComponentLineChart = chartAtomComponentLineChart

        // Align Type Form
        var alignTypeForm = this.createElementForm()
        alignTypeForm.style.marginRight = '50px'
        // alignTypeForm.style.border = '1px solid black'
        alignTypeForm.append(this.createElementLabel('AlignType: '))

        var alignTypeTimestamp = this.createElementRadioInput()
        alignTypeTimestamp.checked = true
        alignTypeTimestamp.id = 'timestamp'
        alignTypeTimestamp.name = 'AlignType'
        alignTypeTimestamp.value = 'timestamp'
        alignTypeForm.append(alignTypeTimestamp)
        alignTypeForm.append(this.createElementLabel('Timestamp', 'timestamp'))

        var alignTypeGlobal = this.createElementRadioInput()
        alignTypeGlobal.id = 'global'
        alignTypeGlobal.name = 'AlignType'
        alignTypeGlobal.value = 'global'
        alignTypeForm.append(alignTypeGlobal)
        alignTypeForm.append(this.createElementLabel('Global', 'global'))
        this.topNavigate.appendChild(alignTypeForm)

        // Line Type Form
        var LineTypeForm = this.createElementForm()
        // LineTypeForm.style.border = '1px solid black'
        LineTypeForm.append(this.createElementLabel('LineType: '))

        var LineTypeDash = this.createElementRadioInput()
        LineTypeDash.checked = true
        LineTypeDash.id = 'dash'
        LineTypeDash.name = 'LineType'
        LineTypeDash.value = 'dash'
        LineTypeForm.append(LineTypeDash)
        LineTypeForm.append(this.createElementLabel('Dash', 'dash'))

        var LineTypeSolid = this.createElementRadioInput()
        LineTypeSolid.id = 'solid'
        LineTypeSolid.name = 'LineType'
        LineTypeSolid.value = 'solid'
        LineTypeForm.append(LineTypeSolid)
        LineTypeForm.append(this.createElementLabel('Solid', 'solid'))

        var LineTypeDot = this.createElementRadioInput()
        LineTypeDot.id = 'dot'
        LineTypeDot.name = 'LineType'
        LineTypeDot.value = 'dot'
        LineTypeForm.append(LineTypeDot)
        LineTypeForm.append(this.createElementLabel('Dot', 'dot'))
        this.topNavigate.appendChild(LineTypeForm)

        let that = this
        const alignType = alignTypeForm.querySelectorAll('input[name="AlignType"]')
        alignType.forEach(option => {
            option.addEventListener('click', () => {
                that.chartAtomComponentLineChart.alignType = option.value
                that.chartAtomComponentLineChart.refresh()
            })
        })

        const LineType = LineTypeForm.querySelectorAll('input[name="LineType"]')
        LineType.forEach(option => {
            option.addEventListener('click', () => {
                that.chartAtomComponentLineChart.lineType = option.value
                that.chartAtomComponentLineChart.refresh()
            })
        })
    }

    setTitle(title){
        this.title.innerHTML = title
    }
}

class TextFileCompareComponentSvgDialogNavigate extends Navigate
{
    constructor(dialog){
        super(dialog.container)
        this.topNavigate.style.backgroundColor = '#000'
        this.title = this.createElementA('')
        this.title.style.fontSize = '25px'
        this.title.style.color = 'white'
        this.topNavigate.append(this.title)

        // btn
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.display = 'inline-block'
        this.cancel.style.width = '5%'
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.float = 'right'
        this.cancel.onclick = function(){dialog.hidden()}
        this.topNavigate.appendChild(this.cancel)
    }
}

export {TextFileOriginalComponentNavigate, TextFileOriginalComponentSvgNavigate, TextFileCompareComponentSvgDialogNavigate, ChartAtomComponentLineChartNavigate}