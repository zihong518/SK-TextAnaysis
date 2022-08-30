import lineChart from './linechart.js'
import wordCloud from './wordcloud.js'
import proportionChart from './proportionChart.js'
import sentChart from './sentChart.js'
import { getWordCount, getDateRange, getWordProportion, getSent } from './api.js'

const { createApp } = Vue

createApp({
  data() {
    return {
      typeChoose: [
        {
          value: '論壇',
          type: 'Forum',
          checked: true,
        },
        {
          value: 'app評論',
          type: 'App',
          checked: false,
        },
      ],
      controlPanel: [
        {
          type: 'typeForum',
          value: '論壇',
          list: [
            {
              filterTitle: '產品比較',
              model: 'creditcard',
              filterName: 'product',
              filterItems: [
                {
                  name: '信用卡',
                  value: 'creditcard',
                },
                {
                  name: '銀行服務',
                  value: 'Bank_Service',
                  // checked: true,
                },
              ],
            },
            {
              filterTitle: '篩選看板',
              filterName: 'source',
              model: ['PTT'],
              checkBox: true,
              filterItems: [
                {
                  name: 'PTT',
                  value: 'PTT',
                },
              ],
            },
            {
              filterTitle: '內容篩選',
              filterName: 'content',
              model: 'article-content',
              filterItems: [
                {
                  name: '全部',
                  value: 'all-content',
                },
                {
                  name: '主文',
                  value: 'article-content',
                },
                {
                  name: '留言',
                  value: 'review-content',
                },
              ],
            },
          ],
        },
        {
          type: 'typeApp',
          value: 'app評論',
          list: [
            {
              filterTitle: '產品比較',
              filterName: 'product',
              model: ['新光', '國泰', 'Richart'],
              checkBox: true,
              filterItems: [
                {
                  name: '新光',
                  value: '新光',
                },
                {
                  name: '國泰',
                  value: '國泰',
                },
                {
                  name: 'iLeo',
                  value: 'iLeo',
                },
                {
                  name: 'KoKo',
                  value: 'KoKo',
                },
                {
                  name: '台新',
                  value: '台新',
                },
                {
                  name: 'Richart',
                  value: 'Richart',
                },
                {
                  name: '永豐',
                  value: '永豐',
                },
                {
                  name: 'DAWHO',
                  value: 'DAWHO',
                },
              ],
            },
            {
              filterTitle: '篩選看板',
              filterName: 'source',
              model: ['App store', 'Google play'],
              checkBox: true,
              filterItems: [
                {
                  name: 'App store',
                  value: 'App store',
                  checked: true,
                },
                {
                  name: 'Google play',
                  value: 'Google play',
                  checked: true,
                },
              ],
            },
          ],
        },
      ],
      bankButton: [
        {
          name: '新光',
        },
        {
          name: '永豐',
        },
        {
          name: '台新',
        },
      ],

      dateButton: [
        {
          dateStart: '2022/04/01',
          dateEnd: '2022/05/01',
        },
        {
          dateStart: '2022/05/01',
          dateEnd: '2022/06/01',
        },
        {
          dateStart: '2022/06/01',
          dateEnd: '2022/07/01',
        },
      ],
      tabs: ['文字雲比較', '提及熱度比較', '使用字詞比較', '情緒分析'],
      currentTab: '文字雲比較',
      keywordA: '台新',
      keywordB: '新光',
      minDate: '',
      maxDate: '',

      currentType: 'Forum',
    }
  },
  methods: {
    chooseChange() {
      this.typeChoose[0].checked = !this.typeChoose[0].checked
      this.typeChoose[1].checked = !this.typeChoose[1].checked
      this.chooseList = function choose() {
        const choose = this.typeChoose.filter((item) => {
          return item.checked == true
          // return item.checked
        })[0].value

        return this.controlPanel.filter((item) => {
          // console.log(item.value)
          return item.value === choose
        })[0]
      }

      setTimeout(() => {
        if (this.currentType === 'App') {
          this.temp = this.bankButton
          let product = document.querySelectorAll('input[name=product]:checked')
          let temp = []
          product.forEach((x) => {
            temp.push({ name: x._value })
          })
          this.bankButton = temp
        } else {
          this.bankButton = this.temp
        }
      }, 10)
    },
    generateChart() {
      this.getWordCloud()

      this.getLineChart()

      this.getWordProportion()

      this.getSentChart()
    },
    changeTab(tab) {
      this.currentTab = tab
      // this.generateChart()

      // if (this.currentTab == '文字雲比較') {
      //   this.generateChart()
      // }
    },
    getWordCloud() {
      let element = document.getElementById('canvas')
      if (element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild)
        }
      }

      const type = document.querySelector('input[name=type]:checked').value
      const product = document.querySelector('input[name=product]:checked').value
      const source = document.querySelectorAll('input[name=source]:checked')
      const sourceList = [...source].map((x) => x.value).toString()
      const content = document.querySelector('input[name=content]:checked').value
      // console.log(type,product,sourceList,content);

      for (let i = 0; i < this.dateButton.length; i++) {
        for (let j = 0; j < this.bankButton.length; j++) {
          let data = {
            type: type,
            product: product,
            source: sourceList,
            content: content,
            bank: this.bankButton[j].name,
            dateGroup: 'dateGroup_' + i,
            bankGroup: 'bankGroup_' + i,
            id: 'bank_' + this.bankButton[j].name + '-' + i,
            dateStart: this.dateButton[i].dateStart,
            dateEnd: this.dateButton[i].dateEnd,
          }
          let bankLength = this.bankButton.length
          wordCloud(data, bankLength)
        }
      }
    },
    getLineChart() {
      let element = document.getElementById('lineChart')
      if (element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild)
        }
      }

      const type = document.querySelector('input[name=type]:checked').value
      const product = document.querySelector('input[name=product]:checked').value
      const source = document.querySelectorAll('input[name=source]:checked')
      const sourceList = [...source].map((x) => x.value).toString()
      const content = document.querySelector('input[name=content]:checked').value
      // console.log(type,product,sourceList,content);
      const bank = this.bankButton.map((x) => x.name).toString()
      let data = {
        type: type,
        product: product,
        source: sourceList,
        content: content,
        bank: bank,
      }
      const loading = `<div role="status" class="py-44">
                <img src="./img/SK_logo.png" alt="" class="animate-bounce w-40 mx-auto " />

             <p class="text-center text-2xl animate-pulse">Loading...</p>
        </div>`

      document.getElementById('lineChart').innerHTML = loading
      getWordCount(data)
        .then((res) => {
          this.lineChartData = res.data
          document.getElementById('lineChart').removeChild(document.getElementById('lineChart').firstChild)
          lineChart(res.data)
        })
        .catch((err) => {
          console.log(err)
        })

      // let rawData = getData()
    },
    getWordProportion() {
      let element = document.getElementById('proportionChart')
      if (element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild)
        }
      }
      const loading = `<div role="status" class="py-44">
                <img src="./img/SK_logo.png" alt="" class="animate-bounce w-40 mx-auto " />

             <p class="text-center text-2xl animate-pulse">Loading...</p>
        </div>`
      element.innerHTML = loading
      const type = document.querySelector('input[name=type]:checked').value
      const product = document.querySelector('input[name=product]:checked').value
      const source = document.querySelectorAll('input[name=source]:checked')
      const sourceList = [...source].map((x) => x.value).toString()
      const content = document.querySelector('input[name=content]:checked').value
      const keywordA = this.keywordA
      const keywordB = this.keywordB
      let filter = {
        type: type,
        product: product,
        source: sourceList,
        content: content,
        keywordA: keywordA,
        keywordB: keywordB,
      }
      getWordProportion(filter)
        .then((res) => {
          element.removeChild(element.firstChild)

          proportionChart(res.data, filter)
        })
        .catch((err) => {
          console.log(err)
        })
    },
    getSentChart() {
      let element = document.getElementById('sentChart')
      if (element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild)
        }
      }
      const loading = `<div role="status" class="py-44">
                <img src="./img/SK_logo.png" alt="" class="animate-bounce w-40 mx-auto " />

             <p class="text-center text-2xl animate-pulse">Loading...</p>
        </div>`
      element.innerHTML = loading

      const type = document.querySelector('input[name=type]:checked').value
      const product = document.querySelector('input[name=product]:checked').value
      const source = document.querySelectorAll('input[name=source]:checked')
      const sourceList = [...source].map((x) => x.value).toString()
      const content = document.querySelector('input[name=content]:checked').value

      this.bankButton.forEach((bank) => {
        let filter = {
          type: type,
          product: product,
          source: sourceList,
          content: content,
          bank: bank.name,
          minDate: this.minDate,
          maxDate: this.maxDate,
        }
        getSent(filter)
          .then((res) => {
            sentChart(res.data, filter)
          })
          .catch((err) => {
            console.log(err)
          })
      })
      document.getElementById('sentChart').removeChild(document.getElementById('sentChart').firstChild)
      // const type = document.querySelector('input[name=type]:checked').value
      // const product = document.querySelector('input[name=product]:checked').value
      // const source = document.querySelectorAll('input[name=source]:checked')
      // const sourceList = [...source].map((x) => x.value).toString()
      // const content = document.querySelector('input[name=content]:checked').value
      // // console.log(type,product,sourceList,content);
      // const bank = this.bankButton.map((x) => x.name).toString()
    },
    bankSubmit() {
      const inputData = document.getElementById('bankButtonInput').value
      if (inputData) {
        this.bankButton.push({
          name: inputData,
          selected: true,
        })
      }
      const type = document.querySelector('input[name=type]:checked').value
      const product = document.querySelector('input[name=product]:checked').value
      const source = document.querySelectorAll('input[name=source]:checked')
      const sourceList = [...source].map((x) => x.value).toString()
      const content = document.querySelector('input[name=content]:checked').value
      let filter = {
        type: type,
        product: product,
        source: sourceList,
        content: content,
        bank: inputData,
        minDate: this.minDate,
        maxDate: this.maxDate,
      }
      getSent(filter)
        .then((res) => {
          sentChart(res.data, filter)
        })
        .catch((err) => {
          console.log(err)
        })

      this.getWordCloud()
      this.getLineChart()
    },
    dateSubmit() {
      const dateStartValue = document.getElementById('dateStart').innerText
      const dateEndValue = document.getElementById('dateEnd').innerText
      if (new Date(dateStartValue) > new Date(dateEndValue)) {
        alert('日期錯誤')
      } else if (dateStartValue !== '' && dateEndValue !== '') {
        this.dateButton.push({
          dateStart: dateStartValue,
          dateEnd: dateEndValue,
        })
        this.getWordCloud()
      }
    },
    removeBank(element) {
      this.bankButton = this.bankButton.filter((x) => {
        return x.name != element.target.dataset.value
      })
      if (this.currentTab == '文字雲比較') {
        this.getWordCloud()
      }
      document.getElementById('sent' + element.target.dataset.value).remove()
      document.getElementById('title' + element.target.dataset.value).remove()
    },
    removeDate(index) {
      this.dateButton.splice(index, 1)
      this.getWordCloud()
    },
    dateRangeCreate() {
      const minDate = this.minDate
      const maxDate = this.maxDate
      const sliderRange = d3
        .sliderBottom()
        .min(minDate)
        .max(maxDate)
        .width(800)
        .fill('#D4011D')
        .tickFormat(d3.timeFormat('%Y/%m/%d'))
        .default([minDate, maxDate])
        .on('onchange', function (val) {
          d3.select(`#dateStart`).text(d3.timeFormat('%Y/%m/%d')(val[0]))
          d3.select(`#dateEnd`).text(d3.timeFormat('%Y/%m/%d')(val[1]))
        })
      d3.select('#dateRange').append('svg').attr('id', 'dateRangeSvg').attr('preserveAspectRatio', 'xMinYMin meet').attr('viewBox', '0 0 950 600').classed('svg-content', true).append('g').attr('transform', 'translate(80,30)').call(sliderRange)
      d3.selectAll('#dateRangeSvg  text').attr('font-size', '1.5em')
    },
    submitKeyword() {
      if (document.getElementById('keywordInputA').value) {
        this.keywordA = document.getElementById('keywordInputA').value
      }
      if (document.getElementById('keywordInputB').value) {
        this.keywordB = document.getElementById('keywordInputB').value
      }
      this.getWordProportion()
    },
    closeModal() {
      document.getElementById('modal').classList.add('hidden')
    },
  },
  computed: {
    chooseList: function choose() {
      const choose = this.typeChoose.filter((item) => {
        return item.checked == true
        // return item.checked
      })[0].value

      return this.controlPanel.filter((item) => {
        // console.log(item.value)
        return item.value === choose
      })[0]
    },
  },
  async mounted() {
    const choose = this.typeChoose.filter((item) => {
      return item.checked == true
      // return item.checked
    })[0].type
    await getDateRange(choose)
      .then((res) => {
        return res.data
      })
      .then((data) => {
        this.minDate = new Date(data.minDate)
        this.maxDate = new Date(data.maxDate)
      })
    this.getLineChart()
    this.getWordCloud()
    this.getWordProportion()
    this.dateRangeCreate()
    this.getSentChart()
  },
}).mount('#app')
