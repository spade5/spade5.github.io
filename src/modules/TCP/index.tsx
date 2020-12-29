import React from 'react'
import { PageHeader } from 'antd'
import Layout from 'antd/lib/layout/layout'
import { Chart, Line, Point, Tooltip, Axis } from 'bizcharts'
import DataSet from '@antv/data-set'

const ACTION_NONE = 1
const ACTION_TIMEOUT = 2
const ACTION_RECOMFIRM = 3

const MAX_COUNT = 100
const TIME_GAP = 300

export default class TCP extends React.Component {
  state: { data: { time: number; value: number }[] } = {
    data: [],
  }
  count: number = 0
  sWindow: number = 1
  threshold: number = 12
  dv = new DataSet().createView()
  componentDidMount() {
    setTimeout(() => this.addData(), TIME_GAP)
  }
  addData() {
    if (this.count >= MAX_COUNT) return
    const type = this.getRandomAction()
    if (type === ACTION_NONE) {
      this.sWindow = this.sWindow < this.threshold ? Math.min(this.threshold, this.sWindow * 2) : this.sWindow + 1
    } else {
      this.threshold = Math.max(Math.floor(this.sWindow / 2), 1)
      if (type === ACTION_TIMEOUT) {
        this.sWindow = 1
      } else {
        this.sWindow = this.threshold
      }
    }
    let { data } = this.state
    data.push({ time: this.count, value: this.sWindow })
    this.count++
    this.setState({ data: JSON.parse(JSON.stringify(data)) })
    setTimeout(() => this.addData(), TIME_GAP)
  }
  getRandomAction() {
    const rand = Math.round(Math.random() * 100)
    if (rand < 90) return ACTION_NONE
    if (rand < 95) return ACTION_TIMEOUT
    return ACTION_RECOMFIRM
  }
  render() {
    const { data } = this.state
    this.dv.source(data)
    return (
      <Layout>
        <PageHeader title="TCP 拥塞控制"></PageHeader>
        <Chart
          padding={[10, 20, 50, 50]}
          autoFit
          height={500}
          data={this.dv}
          scale={{ value: { min: 0 }, time: { min: 0, max: MAX_COUNT } }}>
          <Line position="time*value" />
          <Point position="time*value" />
          <Tooltip triggerOn="hover" />
          <Axis name="time" title></Axis>
        </Chart>
      </Layout>
    )
  }
}
