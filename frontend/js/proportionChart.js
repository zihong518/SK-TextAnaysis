import { getWordProportion, getDateRange } from './api.js'

function proportionChart(data, filter) {
  const canvasWidth = (document.body.clientWidth * 10) / 13 - 100
  const canvasHeight = (canvasWidth * 3) / 4

  function getSumValue(keyword, data) {
    const sum = data
      .filter((x) => x.keyword === keyword)
      .reduce((last, now) => {
        return last + now.wordCount
      }, 0)
    return sum
  }

  function cleanData(minDate, maxDate) {
    let filterData = data.filter((d) => new Date(d.date) >= minDate && new Date(d.date) <= maxDate)

    let result = []
    filterData.reduce((res, value) => {
      if (!res[value.word + value.keyword]) {
        res[value.word + value.keyword] = { keyword: value.keyword, word: value.word, wordCount: 0 }
        result.push(res[value.word + value.keyword])
      }
      res[value.word + value.keyword].wordCount += value.wordCount
      return res
    }, {})

    result = result.map((x) => {
      x.proportion = x.wordCount / getSumValue(x.keyword, filterData)
      return x
    })

    let groupResult = d3.group(result, (x) => x.word)
    let newDataList = []
    groupResult.forEach((value, keyword) => {
      let x = { proportion: 0.0000000001 }
      let y = { proportion: 0.0000000001 }
      x = value.find((d) => d.keyword === filter.keywordA) || { proportion: 0.0000000001 }
      y = value.find((d) => d.keyword === filter.keywordB) || { proportion: 0.0000000001 }
      if (!(x.proportion < 0.001 && y.proportion < 0.001)) {
        newDataList.push({
          word: keyword,
          x: x.proportion,
          y: y.proportion,
        })
      }
    })
    return [result, newDataList]
  }

  const minDate = new Date(Math.min(...data.map((p) => new Date(p.date))))
  const maxDate = new Date(Math.max(...data.map((p) => new Date(p.date))))

  const [rawResult, newDataList] = cleanData(minDate, maxDate)

  let allData = newDataList
  let startTime = 0
  let EndTime = 0
  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 30, left: 60 }
  // append the svg object to the body of the page
  const svg = d3
    .select('#proportionChart')
    .append('svg')
    .attr('width', canvasWidth + margin.right + margin.left)
    .attr('height', canvasHeight + margin.top + margin.bottom + 50)
    .attr('class', 'mx-auto')
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  svg.selectAll('.tick line').attr('stroke', '#EBEBEB')

  // Add X axis
  const x = d3
    .scaleLog()
    .clamp(true)

    .domain([d3.min(rawResult, (x) => x.proportion), d3.max(rawResult, (x) => x.proportion)])
    .range([0, canvasWidth])

  let xAxis = svg
    .append('g')
    .attr('transform', `translate(0, ${canvasHeight})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(2.7)
        .tickFormat(d3.format('.2%'))
        .tickSize(-canvasWidth * 1.4),
    )
    // .select('.domain')
    // .remove()
    .selectAll('text')
    .style('text-anchor', 'end')
    .style('font-size', '14px')
    .attr('transform', 'rotate(-25)')

  // Add Y axis
  const y = d3
    .scaleLog()
    .clamp(true)
    .domain([d3.min(rawResult, (x) => x.proportion), d3.max(rawResult, (x) => x.proportion)])
    .range([canvasHeight, 0])
  let yAxis = svg
    .append('g')
    .call(
      d3
        .axisLeft(y)
        .ticks(2.7)
        .tickFormat(d3.format('.2%'))
        .tickSize(-canvasHeight * 1.4),
    )
    .style('font-size', '14px')
  // .select('.domain')
  // .remove()

  svg.selectAll('.tick line').attr('stroke', '#EBEBEB').attr('opacity', '0.8')
  svg.selectAll('.domain').attr('stroke', '#EBEBEB').attr('opacity', '0.8')

  let simulation = d3
    .forceSimulation(allData)
    .force('collision', d3.forceCollide(11))
    .force(
      'x',
      d3.forceX((d) => {
        return x(d.x)
      }),
    )
    .force(
      'y',
      d3.forceY((d) => y(d.y)),
    )
    .on('tick', drawPlot)
  d3.select('#keywordA').style('background-color', '#FF7676')
  d3.select('#keywordB').style('background-color', '#5095FF')

  function getColor(d) {
    const newX = x.invert(d.x)
    const newY = y.invert(d.y)
    if (newX > newY) {
      return '#FF5050'
    } else {
      return '#5095FF'
    }
  }
  function getOpacity(d) {
    const newX = x.invert(d.x)
    const newY = y.invert(d.y)
    const maxA = Math.max(...allData.map((p) => x.invert(p.x) - y.invert(p.y)))
    const maxB = Math.max(...allData.map((p) => y.invert(p.y) - x.invert(p.x)))
    if (newX > newY) {
      return ((newX - newY) / maxA) * 0.9 + 0.1
    } else {
      return ((newY - newX) / maxB) * 0.9 + 0.1
    }
  }

  let g = svg.append('g').attr('class', 'test')
  simulation.stop()
  createCanvas(allData)

  function createCanvas(data) {
    g.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => {
        x(d.x)
      })
      .attr('cy', (d) => y(d.y))
      .attr('r', 10)
      .attr('fill-opacity', (d) => getOpacity(d))
      .attr('fill', (d) => getColor(d))

    g.selectAll('text')
      .data(data)
      .join('text')
      .attr('x', (d) => {
        return x(d.x)
      })
      .attr('y', (d) => {
        return y(d.y)
      })
      .style('font-size', '10px')
      .text((i) => i.word)
      .attr('class', 'word')
  }
  function drawPlot() {
    d3.selectAll('circle')
      .data(allData)
      .attr('cx', (d) => {
        return d.x
      })
      .attr('cy', (d) => d.y)
      .attr('r', 10)
      .attr('fill-opacity', (d) => getOpacity(d))
      .attr('fill', (d) => getColor(d))

    d3.selectAll('.word')
      .data(allData)
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('alignment-baseline', 'middle') // Vertically align text with point
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .text((i) => i.word)
      .attr('class', 'word')
    // svg.selectAll(".word").
  }

  simulation.alpha(1)
  simulation.restart()
  d3.select('#proportionDateFilterSvg').remove()
  const sliderRange = d3
    .sliderBottom()
    .min(minDate)
    .max(maxDate)
    .width(800)
    .fill('#D4011D')
    .tickFormat(d3.timeFormat('%Y/%m/%d'))
    .default([minDate, maxDate])
    .on('onchange', function (val) {
      simulation.stop()

      startTime = val[0]
      EndTime = val[1]

      let [_, temp] = cleanData(startTime, EndTime)
      allData = temp
      // drawPlot()

      simulation = d3
        .forceSimulation(allData)
        .force('collision', d3.forceCollide(11))
        .force(
          'x',
          d3.forceX((d) => {
            return x(d.x)
          }),
        )
        .force(
          'y',
          d3.forceY((d) => y(d.y)),
        )
        .on('tick', drawPlot)
    })

  d3.select('#proportionDateFilter').append('svg').attr('id', 'proportionDateFilterSvg').attr('preserveAspectRatio', 'xMinYMin meet').attr('viewBox', '0 0 950 600').classed('svg-content', true).append('g').attr('transform', 'translate(80,30)').call(sliderRange)
  d3.selectAll('#proportionDateFilterSvg  text').attr('font-size', '0.7em')
}

export default proportionChart
