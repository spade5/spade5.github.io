import React from 'react'
import { Layout } from 'antd'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import TCP from 'modules/TCP'
import './App.css'
import 'antd/dist/antd.css'

export default class App extends React.Component {
  render() {
    return (
      <Router>
        <Layout style={{ height: '100vh' }}>
          <Switch>
            <Route path="/">
              <TCP />
            </Route>
          </Switch>
        </Layout>
      </Router>
    )
  }
}
