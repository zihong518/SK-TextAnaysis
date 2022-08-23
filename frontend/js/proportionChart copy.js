import { getWordProportion, getDateRange } from './api.js'

function proportionChart(data, filter) {
  const canvasWidth = (document.body.clientWidth * 10) / 13 - 100
  const canvasHeight = (canvasWidth * 3) / 4
  let allData = data
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

  //   svg
  //     .append('g')
  //     .attr('transform', `translate(0, ${canvasHeight})`)
  //     .attr('class', 'Xaxis')
  //     .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%Y-%m-%d')))
  //     .selectAll('text')
  //     .style('text-anchor', 'end')
  //     .attr('transform', 'rotate(-65)')
  const test = d3.group(data, (x) => x.word)
  let newDataList = []
  test.forEach((value, keyword) => {
    let x = { percentage: 0.0000000001 }
    let y = { percentage: 0.0000000001 }
    x = value.find((d) => d.keyword === filter.keywordA) || { percentage: 0.0000000001 }
    y = value.find((d) => d.keyword === filter.keywordB) || { percentage: 0.0000000001 }

    newDataList.push({
      word: keyword,
      x: x.percentage,
      y: y.percentage,
    })
  })
  // Add X axis
  const x = d3
    .scaleLog()
    .clamp(true)

    .domain([d3.min(data, (x) => x.percentage), d3.max(data, (x) => x.percentage)])
    .range([0, canvasWidth])

  let xAxis = svg
    .append('g')
    .attr('transform', `translate(0, ${canvasHeight})`)
    .call(d3.axisBottom(x).ticks(2.5).tickFormat(d3.format('.2%')))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('transform', 'rotate(-25)')

  // Add Y axis
  const y = d3
    .scaleLog()
    .clamp(true)
    .domain([d3.min(data, (x) => x.percentage), d3.max(data, (x) => x.percentage)])
    .range([canvasHeight, 0])
  let yAxis = svg.append('g').call(d3.axisLeft(y).ticks(2.5).tickFormat(d3.format('.2%')))

  let g = svg.append('g').attr('class', 'test')
  drawPlot()
  function drawPlot() {
    console.log('test')
    g.selectAll('circle')
      .data(newDataList)
      .join('circle')
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
      .attr('r', 10)
      .attr('fill', 'pink')
      .attr('fill-opacity', 0.8)

    g.selectAll('text')
      .data(newDataList)
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
      .attr('alignment-baseline', 'middle') // Vertically align text with point
      .attr('text-anchor', 'middle')
  }
  d3.select('#proportionChart svg')
    .append('line') // attach a line
    .style('stroke', 'black') // colour the line
    .attr('x1', 0) // x position of the first end of the line
    .attr('y1', canvasHeight + 16) // y position of the first end of the line
    .attr('x2', canvasWidth + margin.right + margin.left - 60) // x position of the second end of the line
    .attr('y2', 0)
    .attr('transform', `translate(60,0)`)

  let brush = d3
    .brush() // Add the brush feature using the d3.brush function
    .extent([
      [0, 0],
      [canvasWidth, canvasHeight],
    ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
    .on('end', updateChart)
  let idleTimeout
  function idled() {
    idleTimeout = null
  }

  svg.append('g').attr('class', 'brush').call(brush)

  function updateChart({ selection }) {
    console.log(selection)
    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if (!selection) {
      if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)) // This allows to wait a little bit
      x.domain([4, 8])
    } else {
      x.domain([x.invert(selection[0][0]), x.invert(selection[1][0])])
      y.domain([y.invert(selection[0][1]), y.invert(selection[1][1])])
      svg.select('.brush').call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and circle position
    xAxis.transition().duration(1000).call(d3.axisBottom(x))
    yAxis.transition().duration(1000).call(d3.axisLeft(y))
    svg
      .selectAll('.word')
      .transition()
      .duration(1000)
      .attr('x', (d) => {
        return x(d.x)
      })
      .attr('y', (d) => {
        return y(d.y)
      })

    d3.selectAll('circle')
      .transition()
      .duration(1000)
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.y))
  }
}

export default proportionChart
