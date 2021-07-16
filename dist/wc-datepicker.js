
class Datepicker extends HTMLElement {
  constructor () {
    super()
    // Regardless of sundayFirst value, set monday as first, sunday as last, always:
    this.dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    this.sundayFirst = false
    this.persistOnSelect = false
    this.longPressThreshold = 500
    this.longPressInterval = 150
    this.initDate = null
    this.ignoreOnFocus = false
    this.showCloseIcon = false
    this._inputStrIsValidDate = false
    this._longPressIntervalIds = []
    this._longPressTimerIds = []
    this._calTemplate = `
    <style>
    #calContainer {
      border:1px solid black;
      position:absolute;
      background-color:white;
      z-index:1000;
    }
    #calHeader {
      display:flex;
      align-items:center;
      justify-content:space-around;
      margin-top:5px;
    }
    #calGrid {
      display:grid;
      grid-template-columns:auto auto auto auto auto auto auto;
      padding:10px;
    }
    .calDayName, .calDayStyle, .calAdjacentMonthDay, #calTitle {
      padding:5px;
      font-size:20px;
      text-align:center;
    }
    .calDayStyle:hover, .calCtrl:hover {
      color:white;
      background-color:black;
      cursor:default;
    }
    .calHiddenRow {
      display:none;
    }
    .calAdjacentMonthDay {
      color:lightgray;
    }
    .calSelectedDay {
      color:red;
      font-weight:bold;
    }
    #calTitle {
      width:110px;
    }
    .calCtrl {
      font-size:20px;
      padding:0px 8px;
      user-select:none;
    }
    </style>
    <div id="calContainer" tabindex="0">
      <div id="calHeader">
        <div id="calCtrlPrevYear" class="calCtrl">&#9668;&#9668;</div>
        <div id="calCtrlPrevMonth" class="calCtrl">&#9668;</div>
        <div id="calTitle"></div>
        <div id="calCtrlNextMonth" class="calCtrl">&#9658;</div>
        <div id="calCtrlNextYear" class="calCtrl">&#9658;&#9658;</div>
        <div id="calCtrlHideCal" class="calCtrl">&#10005;</div>
      </div>
      <div id="calGrid">
        <div class="calDayName"></div>
        <div class="calDayName"></div>
        <div class="calDayName"></div>
        <div class="calDayName"></div>
        <div class="calDayName"></div>
        <div class="calDayName"></div>
        <div class="calDayName"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
        <div class="calDay"></div>
      </div>
    </div>`
  }

  static get observedAttributes () {
    return ['init-date',
      'ignore-on-focus',
      'sunday-first',
      'persist-on-select',
      'show-close-icon']
  }

  disconnectedCallback () {
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'init-date') {
      this.initDate = newValue
    } else if (name === 'ignore-on-focus') {
      this.ignoreOnFocus = true
    } else if (name === 'sunday-first') {
      this.sundayFirst = true
    } else if (name === 'persist-on-select') {
      this.persistOnSelect = true
    } else if (name === 'show-close-icon') {
      this.showCloseIcon = true
    }
  }

  connectedCallback () {
    setTimeout(() => { this.init() }, 0) // https://stackoverflow.com/questions/58676021/accessing-custom-elements-child-element-without-using-slots-shadow-dom
  }

  init () {
    this.textInputElement = this.querySelector('input')
    if (this.textInputElement === null) {
      return
    }
    var mainContainer = document.createElement('div')
    mainContainer.style.display = 'inline-block'
    if (this.container) {
      this.container.remove()
    }
    this.container = this.appendChild(mainContainer) // The returned value is the appended child

    const template = document.createElement('template')
    template.innerHTML = this._calTemplate

    this.container.appendChild(this.textInputElement)
    this.container.appendChild(template.content)

    this.calTitle = this.querySelector('#calTitle')
    this.calContainer = this.querySelector('#calContainer')
    this.dateObj = new Date()
    var obj

    if (this.initDate !== null) {
      obj = this._parseAndValidateInputStr(this.initDate)
      if (obj.valid) {
        this.dateObj = new Date(obj.year, obj.month, obj.day)
        this._inputStrIsValidDate = true
        this.textInputElement.value = this._returnDateString(this.dateObj)
      } else if (this.initDate === 'current') {
        this._inputStrIsValidDate = true
        this.textInputElement.value = this._returnDateString(this.dateObj)
      }
    } else {
      obj = this._parseAndValidateInputStr(this.textInputElement.value)
      if (obj.valid) {
        this.dateObj = new Date(obj.year, obj.month, obj.day)
        this._inputStrIsValidDate = true
      } else {
        this._inputStrIsValidDate = false
      }
    }
    this.initDate = null

    this.displayedMonth = this.dateObj.getMonth()
    this.displayedYear = this.dateObj.getFullYear()

    this.calContainer.style.display = 'none'
    this._populateDayNames()
    this._addHeaderEventHandlers()
    this._renderCalendar()

    if (!this.ignoreOnFocus) {
      this.textInputElement.onfocus = this._inputOnFocusHandler
      this.textInputElement.onfocus = this.textInputElement.onfocus.bind(this)
    }

    this.textInputElement.oninput = this._inputOnInputHandler
    this.textInputElement.oninput = this.textInputElement.oninput.bind(this)

    this.textInputElement.onblur = this._blurHandler
    this.textInputElement.onblur = this.textInputElement.onblur.bind(this)

    this.calContainer.onblur = this._blurHandler
    this.calContainer.onblur = this.calContainer.onblur.bind(this)

    if (!this.showCloseIcon) {
      this.querySelector('#calCtrlHideCal').style.display = 'none'
    }
  }

  setFocusOnCal () {
    if (this.calContainer) {
      this.calContainer.style.display = 'block'
      this.calContainer.focus()
    }
  }

  _dayClickedEventHandler (event) {
    this._inputStrIsValidDate = true
    this._setNewDateValue(event.target.innerHTML, this.displayedMonth, this.displayedYear)
    this.textInputElement.value = this._returnDateString(this.dateObj)
    this.textInputElement.dispatchEvent(new CustomEvent('dateselect'))
    this._renderCalendar()
    if (!this.persistOnSelect) {
      this._hideCalendar()
    }
  }

  _hideCalendar () {
    this.getActiveElement().blur()
  }

  getActiveElement() {
    if (this.getRootNode && this.getRootNode() && this.getRootNode().activeElement) return this.getRootNode().activeElement
    return document.activeElement
  }

  _calKeyDownEventHandler (event) {
    if (event.key === 'Enter') {
      this._dayClickedEventHandler(event)
    }
  }

  _blurHandler () {
    // When the input element loses focus due to click on calContainer, new focus won't be directly set to calContainer, it is set to body.
    // After calContainer onclick, focus will be on body unless following delay is introduced:
    setTimeout(() => { checkActiveElement(this) }, 0)
    function checkActiveElement (ctx) {
      if (!(ctx.getActiveElement().id === 'calContainer' || ctx.getActiveElement().classList.contains('calCtrl') || ctx.getActiveElement().classList.contains('calDay') || ctx.getActiveElement().isSameNode(ctx.textInputElement))) {
        ctx.calContainer.style.display = 'none'
        ctx._mouseUpEventHandler()
        if (!ctx._inputStrIsValidDate) {
          ctx.textInputElement.dispatchEvent(new Event('invalid'))
        }
      }
    }
  }

  _addHeaderEventHandlers () {
    var entries = this.calContainer.querySelectorAll('.calCtrl').entries()
    var entry = entries.next()
    while (entry.done === false) {
      entry.value[1].tabIndex = 0
      entry.value[1].onblur = this._blurHandler
      entry.value[1].onblur = entry.value[1].onblur.bind(this)
      entry.value[1].onclick = this._controlKeyDownEventHandler
      entry.value[1].onclick = entry.value[1].onclick.bind(this)
      entry.value[1].onkeydown = this._controlKeyDownEventHandler
      entry.value[1].onkeydown = entry.value[1].onkeydown.bind(this)
      entry.value[1].onmousedown = this._mouseDownEventHandler
      entry.value[1].onmousedown = entry.value[1].onmousedown.bind(this)
      entry.value[1].onmouseup = this._mouseUpEventHandler
      entry.value[1].onmouseup = entry.value[1].onmouseup.bind(this)
      entry.value[1].onmouseleave = this._mouseUpEventHandler
      entry.value[1].onmouseleave = entry.value[1].onmouseleave.bind(this)
      entry.value[1].ontouchstart = this._mouseDownEventHandler
      entry.value[1].ontouchstart = entry.value[1].ontouchstart.bind(this)
      entry.value[1].ontouchend = this._mouseUpEventHandler
      entry.value[1].ontouchend = entry.value[1].ontouchend.bind(this)
      entry.value[1].ontouchcancel = this._mouseUpEventHandler
      entry.value[1].ontouchcancel = entry.value[1].ontouchcancel.bind(this)
      entry = entries.next()
    }
  }

  _startLongPressAction (event) {
    this._longPressIntervalIds.push(setInterval(() => { this._controlKeyDownEventHandler(event) }, this.longPressInterval))
    this.querySelector('#' + event.target.id).onclick = () => { this._onClickHandlerAfterLongPress(event, this) }
  }

  // For better UX, after long press, onclick must be discarded once,
  // thus do nothing with the event and set clickhandler back to the real one:
  _onClickHandlerAfterLongPress (event, ctx) {
    ctx.querySelector('#' + event.target.id).onclick = ctx._controlKeyDownEventHandler
    ctx.querySelector('#' + event.target.id).onclick = ctx.querySelector('#' + event.target.id).onclick.bind(ctx)
  }

  _mouseDownEventHandler (event) {
    this._longPressTimerIds.push(setTimeout(() => { this._startLongPressAction(event) }, this.longPressThreshold))
  }

  _mouseUpEventHandler () {
    this._longPressTimerIds.forEach(clearTimeout)
    this._longPressTimerIds = []
    this._longPressIntervalIds.forEach(clearInterval)
    this._longPressIntervalIds = []
  }

  _parseAndValidateInputStr (str) {
    var obj = {}
    var day, month, year
    var value = str.match(/^\s*(\d{1,2})\.(\d{1,2})\.(\d\d\d\d)\s*$/)
    if (value === null) {
      obj.valid = false
    } else {
      day = Number(value[1])
      month = Number(value[2])
      year = Number(value[3])
      if (this._dateIsValid(day, month, year)) {
        obj.valid = true
        obj.day = day
        obj.month = month - 1
        obj.year = year
      } else {
        obj.valid = false
      }
    }
    return obj
  }

  _inputOnInputHandler () {
    var obj = this._parseAndValidateInputStr(this.textInputElement.value)
    if (obj.valid) {
      this._inputStrIsValidDate = true
      this._setNewDateValue(obj.day, obj.month, obj.year)
      this.displayedMonth = obj.month
      this.displayedYear = obj.year
      this.textInputElement.dispatchEvent(new CustomEvent('dateselect'))
      this._renderCalendar()
    } else {
      this._inputStrIsValidDate = false
    }
  }

  _dateIsValid (day, month, year) {
    if (month < 1 || month > 12) {
      return false
    }
    var last_day_of_month = this._daysInMonth(month, year)
    if (day < 1 || day > last_day_of_month) {
      return false
    }
    return true
  }

  _controlKeyDownEventHandler (event) {
    if (event.key === 'Enter' || event.type !== 'keydown') {
      switch (event.target.id) {
        case 'calCtrlPrevYear':
          this._showPrevYear()
          break
        case 'calCtrlNextYear':
          this._showNextYear()
          break
        case 'calCtrlPrevMonth':
          this._showPrevMonth()
          break
        case 'calCtrlNextMonth':
          this._showNextMonth()
          break
        case 'calCtrlHideCal':
          this._hideCalendar()
          break
      }
    }
  }

  _inputOnFocusHandler () {
    this._inputOnInputHandler()
    this.calContainer.style.display = 'block'
  }

  _showNextYear () {
    this.displayedYear++
    this._renderCalendar()
  }

  _showPrevYear () {
    this.displayedYear--
    this._renderCalendar()
  }

  _showNextMonth () {
    if (this.displayedMonth === 11) {
      this.displayedMonth = 0
      this.displayedYear++
    } else {
      this.displayedMonth++
    }
    this._renderCalendar()
  }

  _showPrevMonth () {
    if (this.displayedMonth === 0) {
      this.displayedMonth = 11
      this.displayedYear--
    } else {
      this.displayedMonth--
    }
    this._renderCalendar()
  }

  _renderCalendar () {
    var tempDate = new Date(this.displayedYear, this.displayedMonth)
    tempDate.setDate(1)
    this.calTitle.innerHTML = this.monthNames[this.displayedMonth] + ' ' + this.displayedYear
    var dayNumbers = []
    var adjacentMonthDays = []
    this._generateDayArray(tempDate, dayNumbers, adjacentMonthDays)
    var entries = this.calContainer.querySelectorAll('.calDay').entries()
    var entry = entries.next()
    while (entry.done === false) {
      entry.value[1].classList.remove('calAdjacentMonthDay')
      entry.value[1].classList.remove('calSelectedDay')
      entry.value[1].classList.remove('calHiddenRow')
      entry.value[1].classList.remove('calDayStyle')
      entry.value[1].onclick = null
      entry.value[1].onblur = null
      entry.value[1].onkeydown = null
      if (adjacentMonthDays[entry.value[0]]) {
        entry.value[1].classList.add('calAdjacentMonthDay')
      } else {
        entry.value[1].classList.add('calDayStyle')
      }
      entry.value[1].innerHTML = dayNumbers[entry.value[0]]
      if (this.displayedMonth === this.dateObj.getMonth() && this.displayedYear === this.dateObj.getFullYear() && dayNumbers[entry.value[0]] === this.dateObj.getDate() && !adjacentMonthDays[entry.value[0]]) {
        entry.value[1].classList.add('calSelectedDay')
      }
      if (!adjacentMonthDays[entry.value[0]]) {
        entry.value[1].onclick = this._dayClickedEventHandler
        entry.value[1].onclick = entry.value[1].onclick.bind(this)
        entry.value[1].onkeydown = this._calKeyDownEventHandler
        entry.value[1].onkeydown = entry.value[1].onkeydown.bind(this)
        entry.value[1].tabIndex = 0
        entry.value[1].onblur = this._blurHandler
        entry.value[1].onblur = entry.value[1].onblur.bind(this)
      } else {
        entry.value[1].removeAttribute('tabindex')
      }
      entry = entries.next()
    }

    // checking if last (=lowest) row of days are all adjacent month days:
    var lastSeven = adjacentMonthDays.slice(35, 42)
    if (lastSeven.every(x => x === true)) {
      entries = this.calContainer.querySelectorAll('.calDay').entries()
      entry = entries.next()
      while (entry.done === false) {
        if (entry.value[0] > 34) {
          entry.value[1].classList.add('calHiddenRow')
        }
        entry = entries.next()
      }
    }
  }

  getDateString () {
    if (this._inputStrIsValidDate) {
      return this._returnDateString(this.dateObj)
    }
    return null
  }

  getDateObject () {
    if (this._inputStrIsValidDate) {
      return this.dateObj
    }
    return null
  }

  _setNewDateValue (day, month, year) {
    day = Number(day)
    month = Number(month)
    year = Number(year)
    if (day !== this.dateObj.getDate() || month !== this.dateObj.getMonth() || year !== this.dateObj.getFullYear()) {
      // Order is important, always set year first:
      this.dateObj.setFullYear(year)
      // Do not use setDate here:
      // this.dateObj.setDate(day) <-- https://stackoverflow.com/questions/14680396/the-date-getmonth-method-has-bug
      // Use setMonth with 2 params instead:
      this.dateObj.setMonth(month, day)
    }
  }

  _returnDateString (date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    return day + '.' + month + '.' + year
  }

  _populateDayNames () {
    var dayNameArray = []
    dayNameArray = this.dayNames.slice()
    if (this.sundayFirst) {
      dayNameArray.pop()
      dayNameArray.unshift(this.dayNames[6])
    }
    var entries = this.calContainer.querySelectorAll('.calDayName').entries()
    var entry = entries.next()
    while (entry.done === false) {
      entry.value[1].innerHTML = dayNameArray[entry.value[0]]
      entry = entries.next()
    }
  }

  _generateDayArray (date, dayArray, adjacentMonthDaysArray) {
    var index
    var dateDay = date.getDay()
    var dateMonth = date.getMonth() + 1
    var dateYear = date.getFullYear()
    var daysInMonth = this._daysInMonth(dateMonth, dateYear)

    date.setDate(date.getDate() - 1)
    var prevMonth = date.getMonth() + 1
    var prevMonthYear = date.getFullYear()
    var daysInPrevMonth = this._daysInMonth(prevMonth, prevMonthYear)

    // prev month day filling:
    if (this.sundayFirst) {
      for (index = 0; index < dateDay; index++) {
        dayArray.unshift(daysInPrevMonth)
        daysInPrevMonth--
        adjacentMonthDaysArray.push(true)
      }
    } else {
      if (dateDay === 0) {
        for (index = 0; index < 6; index++) {
          dayArray.unshift(daysInPrevMonth)
          daysInPrevMonth--
          adjacentMonthDaysArray.push(true)
        }
      } else {
        for (index = 0; index < dateDay - 1; index++) {
          dayArray.unshift(daysInPrevMonth)
          daysInPrevMonth--
          adjacentMonthDaysArray.push(true)
        }
      }
    }

    // current month day filling:
    for (index = 0; index < daysInMonth; index++) {
      dayArray.push(index + 1)
      adjacentMonthDaysArray.push(false)
    }

    // next month day filling:
    var numberOfNextMonthDays = 42 - dayArray.length
    for (index = 0; index < numberOfNextMonthDays; index++) {
      dayArray.push(index + 1)
      adjacentMonthDaysArray.push(true)
    }
  }

  _isItLeapYear (year) {
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)
  }

  _daysInMonth (month, year) {
    if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
      return 31
    } else if (month === 4 || month === 6 || month === 9 || month === 11) {
      return 30
    } else if (month === 2 && this._isItLeapYear(year)) {
      return 29
    } else if (month === 2 && !(this._isItLeapYear(year))) {
      return 28
    }
  }
}

customElements.define('wc-datepicker', Datepicker)
