import { getSentDict, getSentWord, getDateRange } from './api.js'

function hexToRgbA(hex, opacity = 0.5) {
  let c
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('')
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')'
  }
}

async function sentChart(data, filter) {
  const main = document.getElementById('sentChart')
  const title = document.createElement('p')
  title.setAttribute('class', 'text-2xl text-center my-2')
  title.setAttribute('id', 'title' + filter.bank)
  title.innerText = filter.bank
  main.appendChild(title)

  const group = document.createElement('div')
  group.setAttribute('id', 'sent' + filter.bank)
  main.appendChild(group)

  const canvasWidth = (document.body.clientWidth * 5) / 14 - 100
  const canvasHeight = (canvasWidth * 3) / 4
  let allData = data
  let startTime = 0
  let EndTime = 0
  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 30, left: 60 }
  // append the svg object to the body of the page
  const svg = d3
    .select('#sent' + filter.bank)
    .attr('class', 'flex justify-center flex-col')
    .append('div')
    .attr('id', 'sent' + filter.bank + 'svg')
    .attr('class', 'flex justify-center')
    .append('svg')
    .attr('width', canvasWidth + margin.right + margin.left)
    .attr('height', canvasHeight + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleTime().range([0, canvasWidth])

  svg
    .append('g')
    .attr('transform', `translate(0, ${canvasHeight})`)
    .attr('class', 'Xaxis')
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%Y-%m')))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('transform', 'rotate(-65)')

  const dateRange = d3.extent(data, function (d) {
    return new Date(d.date)
  })
  // 沒有時間的補0
  const dateList = d3.utcMonth.range(dateRange[0], dateRange[1])

  dateList.map((x) => {
    return x.setTime(x.getTime() - 8 * 60 * 60 * 1000)
  })

  function fillZeroDate(data) {
    let sentList = ['positive', 'neutral', 'negative']
    let result = []
    sentList.forEach((sent) => {
      let temp = []
      const sentData = data.filter((x) => {
        return x.sent === sent
      })
      sentData.map((x) => {
        x.date = `${x.date.getFullYear()}/${x.date.getMonth() + 1}`
      })
      sentData.reduce((res, val) => {
        let date = val.date
        if (!res[date]) {
          res[date] = { sent: sent, date: date, count: 0 }
          temp.push(res[date])
        }
        res[date].count += val.count
        return res
      }, {})
      const tempData = dateList.map((x) => {
        let date = `${x.getFullYear()}/${x.getMonth() + 1}`
        return _.find(temp, { date: date }) || { sent: sent, date: date, count: 0 }
      })

      tempData.forEach((data) => {
        data.date = new Date(data.date)
      })
      result = result.concat(tempData)
    })
    return result
  }
  // Add Y axis
  const y = d3.scaleLinear().range([canvasHeight, 0])
  svg
    .append('g')
    .attr('class', 'Yaxis')
    .call(d3.axisLeft(y).tickFormat(d3.format('d')))

  const color = d3.scaleOrdinal(d3.schemeCategory10)
  setSlider()
  update(startTime, EndTime, data)

  function update(startTime, EndTime, inputData) {
    inputData.map((x) => {
      x.date = new Date(x.date)
    })
    let filterData
    if (startTime == 0) {
      filterData = inputData
    } else {
      filterData = allData.filter((x) => {
        return x.date > startTime && x.date < EndTime
      })
    }
    // 補0
    let domainData = filterData
    filterData = fillZeroDate(filterData)
    // 修改x axis
    x.domain(
      d3.extent(domainData, function (d) {
        return new Date(d.date)
      }),
    )

    svg
      .selectAll('.Xaxis')
      .transition()
      .duration(500)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%Y-%m')))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('transform', 'rotate(-25)')

    // 修改Y axis
    y.domain([
      0,
      d3.max(filterData, function (d) {
        return d.count
      }),
    ])
    svg
      .selectAll('.Yaxis')
      .transition()
      .duration(500)
      .call(d3.axisLeft(y).tickFormat(d3.format('d')))

    let sentList = ['positive', 'neutral', 'negative']

    let groupData = d3.group(filterData, (x) => x.sent)

    let groupSortData = new Map()
    sentList.forEach((x) => {
      groupData.get(x)
      groupSortData.set(x, groupData.get(x))
    })
    // Updata the line
    svg
      .selectAll('.line')
      .data(groupSortData)
      .join('path')
      .attr('class', 'line')
      .transition()
      .duration(500)
      .attr('fill', 'none')
      .attr('stroke', function (d) {
        return hexToRgbA(color(d[0]), 0.5)
      })
      .attr('stroke-width', 2)
      .attr('d', function (d) {
        return d3
          .line()
          .x(function (d) {
            return x(d.date)
          })
          .y(function (d) {
            return y(d.count)
          })(d[1])
      })
  }

  const barWidth = (document.body.clientWidth * 5) / 16 - 100
  const barSvg = d3
    .select('#sent' + filter.bank + 'svg')
    .append('svg')
    .attr('width', barWidth + margin.right + margin.left)
    .attr('height', barWidth + margin.top + margin.bottom)
  const svg_pos = barSvg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  const svg_neg = barSvg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  svg_pos
    .append('g')
    .attr('transform', `translate(0, ${canvasHeight})`)
    .attr('class', 'xAxis_pos' + filter.bank)
  svg_neg
    .append('g')
    .attr('transform', `translate(0, ${canvasHeight})`)
    .attr('class', 'xAxis_neg' + filter.bank)
  const x_neg_draw = d3.scaleLinear().range([0, barWidth - (barWidth / 2 + 25)])
  // Add X axis
  const x_pos = d3.scaleLinear().range([0, barWidth / 2 - 25])
  const x_neg = d3.scaleLinear().range([barWidth / 2 + 25, barWidth])
  const y_pos = d3.scaleBand().range([0, canvasHeight]).padding(0.1)
  const y_neg = d3.scaleBand().range([0, canvasHeight]).padding(0.1)
  svg_neg
    .append('g')
    .attr('transform', `translate(${barWidth / 2 + 25}, 0)`)
    .attr('class', 'yAxis_neg' + filter.bank)

  svg_pos.append('g').attr('class', 'yAxis_pos' + filter.bank)
  async function getData() {
    const data = await getSentWord({ bank: filter.bank, content: filter.content }).then((res) => res.data)
    return data
  }
  async function getDict() {
    const dict = await getSentDict().then((res) => res.data)
    return dict
  }
  const wordData = await getData()
  const dict = await getDict()
  sentBar(wordData, filter.minDate, filter.maxDate)

  function sentBar(data, minDate, maxDate) {
    let filterData = data.filter((x) => {
      return new Date(x._id.date) > minDate && new Date(x._id.date) < maxDate
    })
    const pos_dict = dict[0].list
    const neg_dict = dict[1].list

    let pos = []
    let neg = []
    filterData.forEach((word) => {
      if (pos_dict.includes(word._id.word)) {
        pos.push(word)
      } else if (neg_dict.includes(word._id.word)) {
        neg.push(word)
      }
    })
    let posResult = []
    pos.reduce((res, now) => {
      if (!res[now._id.word]) {
        res[now._id.word] = { word: now._id.word, wordCount: 0 }
        posResult.push(res[now._id.word])
      }
      res[now._id.word].wordCount += now.wordCount
      return res
    }, {})

    let negResult = []
    neg.reduce((res, now) => {
      if (!res[now._id.word]) {
        res[now._id.word] = { word: now._id.word, wordCount: 0 }
        negResult.push(res[now._id.word])
      }
      res[now._id.word].wordCount += now.wordCount
      return res
    }, {})

    const posData = posResult.sort((a, b) => b.wordCount - a.wordCount).slice(0, 10)
    const negData = negResult.sort((a, b) => b.wordCount - a.wordCount).slice(0, 10)

    x_pos.domain([0, d3.max(posData, (x) => x.wordCount)])

    x_neg.domain([0, d3.max(negData, (x) => x.wordCount)])
    x_neg_draw.domain([0, d3.max(negData, (x) => x.wordCount)])
    d3.select('.xAxis_pos' + filter.bank)
      .transition()
      .duration(500)
      .call(d3.axisBottom(x_pos).ticks(5))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')

    d3.select('.xAxis_neg' + filter.bank)
      .transition()
      .duration(500)
      .call(d3.axisBottom(x_neg).ticks(5))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
    // Y axis
    y_pos.domain(posData.map((d) => d.word))
    y_neg.domain(negData.map((d) => d.word))

    d3.select('.yAxis_neg' + filter.bank)
      .transition()
      .duration(500)
      .call(d3.axisLeft(y_neg))

    d3.select('.yAxis_pos' + filter.bank)
      .transition()
      .duration(500)
      .call(d3.axisLeft(y_pos))
    //Bars
    svg_pos
      .selectAll('.svg_pos')
      .data(posData)
      .join('rect')
      .attr('class', 'svg_pos')
      .transition()
      .duration(500)
      .attr('x', x_pos(0))
      .attr('y', (d) => y_pos(d.word))
      .attr('width', (d) => x_pos(d.wordCount))
      .attr('height', y_pos.bandwidth())
      .attr('fill', '#FCA5A5')
    svg_neg
      .selectAll('.svg_neg')
      .data(negData)
      .join('rect')
      .attr('class', 'svg_neg')
      .transition()
      .duration(500)
      .attr('x', function () {
        return x_neg(0)
      })
      .attr('y', (d) => y_neg(d.word))
      .attr('width', (d) => {
        return x_neg_draw(d.wordCount)
      })
      .attr('height', y_neg.bandwidth())
      .attr('fill', '#A5EBFC')
  }

  function setSlider() {
    const minDate = filter.minDate
    const maxDate = filter.maxDate

    const sliderRange = d3
      .sliderBottom()
      .min(minDate)
      .max(maxDate)
      .width(800)
      .fill('#D4011D')
      .step(1000 * 60 * 60 * 24 * 30)
      .tickFormat(d3.timeFormat('%Y/%m'))
      .default([minDate, maxDate])
      .on('onchange', (val) => {
        let startTime = val[0]
        let endTime = val[1]

        update(startTime, endTime, data)
        sentBar(wordData, startTime, endTime)
      })
    d3.select('#sent' + filter.bank)
      .append('div')
      .classed('dateFilter', true)
      .append('svg')
      .attr('id', 'sent' + filter.bank + 'Svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 950 600')
      .classed('svg-content', true)
      .append('g')
      .attr('transform', 'translate(80,30)')
      .call(sliderRange)
      .selectAll('text')
      .attr('class', 'text')
    d3.selectAll('#sentDateFilterSvg  text').attr('font-size', '0.7em')
  }
}

export default sentChart
