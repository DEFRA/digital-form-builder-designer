import React from 'react'
import ReactDOM from 'react-dom'
import dagre from 'dagre'
import Page from './page'
import Flyout from './flyout'
import DataModel from './data-model'
import PageCreate from './page-create'
import LinkEdit from './link-edit'
import LinkCreate from './link-create'
import ListsEdit from './lists-edit'
import SectionsEdit from './sections-edit'
import ConditionsEdit from './conditions-edit'

function getLayout (pages, el) {
  // Create a new directed graph
  var g = new dagre.graphlib.Graph()

  // Set an object for the graph label
  g.setGraph({
    rankdir: 'LR',
    marginx: 50,
    marginy: 150,
    ranksep: 160
  })

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () { return {} })

  // Add nodes to the graph. The first argument is the node id. The second is
  // metadata about the node. In this case we're going to add labels to each node
  pages.forEach((page, index) => {
    const pageEl = el.children[index]

    g.setNode(page.path, { label: page.path, width: pageEl.offsetWidth, height: pageEl.offsetHeight })
  })

  // Add edges to the graph.
  pages.forEach(page => {
    if (Array.isArray(page.next)) {
      page.next.forEach(next => {
        // The linked node (next page) may not exist if it's filtered
        const exists = pages.find(page => page.path === next.path)
        if (exists) {
          g.setEdge(page.path, next.path)
        }
      })
    }
  })

  dagre.layout(g)

  const pos = {
    nodes: [],
    edges: []
  }

  const output = g.graph()
  pos.width = output.width + 'px'
  pos.height = output.height + 'px'
  g.nodes().forEach((v, index) => {
    const node = g.node(v)
    const pt = { node }
    pt.top = (node.y - node.height / 2) + 'px'
    pt.left = (node.x - node.width / 2) + 'px'
    pos.nodes.push(pt)
  })

  g.edges().forEach((e, index) => {
    const edge = g.edge(e)
    pos.edges.push({
      source: e.v,
      target: e.w,
      points: edge.points.map(p => {
        const pt = {}
        pt.y = p.y
        pt.x = p.x
        return pt
      })
    })
  })

  return { g, pos }
}

class Lines extends React.Component {
  state = {}

  editLink = (edge) => {
    console.log('clicked', edge)
    this.setState({
      showEditor: edge
    })
  }

  render () {
    const { layout, data } = this.props

    return (
      <div>
        <svg height={layout.height} width={layout.width}>
          {
            layout.edges.map(edge => {
              const points = edge.points.map(points => `${points.x},${points.y}`).join(' ')
              return (
                <g key={points}>
                  <polyline
                    onClick={() => this.editLink(edge)}
                    points={points} />
                </g>
              )
            })
          }
        </svg>

        <Flyout title='Edit Link' show={this.state.showEditor}
          onHide={e => this.setState({ showEditor: false })}>
          <LinkEdit edge={this.state.showEditor} data={data}
            onEdit={e => this.setState({ showEditor: false })} />
        </Flyout>
      </div>
    )
  }
}

class Minimap extends React.Component {
  state = {}

  render () {
    const { layout, scale = 0.05 } = this.props

    return (
      <div className='minimap'>
        <svg height={parseFloat(layout.height) * scale} width={parseFloat(layout.width) * scale}>
          {
            layout.edges.map(edge => {
              const points = edge.points.map(points => `${points.x * scale},${points.y * scale}`).join(' ')
              return (
                <g key={points}>
                  <polyline points={points} />
                </g>
              )
            })
          }
          {
            layout.nodes.map((node, index) => {
              return (
                <g key={node + index}>
                  <a xlinkHref={`#${node.node.label}`}>
                    <rect x={parseFloat(node.left) * scale}
                      y={parseFloat(node.top) * scale}
                      width={node.node.width * scale}
                      height={node.node.height * scale}
                      title={node.node.label} />
                  </a>
                </g>
              )
            })
          }
        </svg>
      </div>
    )
  }
}

class Visualisation extends React.Component {
  state = {}

  constructor () {
    super()
    this.ref = React.createRef()
  }

  scheduleLayout () {
    setTimeout(() => {
      const { data } = this.props
      const { pages } = data
      const layout = getLayout(pages, this.ref.current)

      this.setState({
        layout: layout.pos
      })
    }, 200)
  }

  componentDidMount () {
    this.scheduleLayout()
  }

  componentWillReceiveProps () {
    this.scheduleLayout()
  }

  render () {
    const { data } = this.props
    const { pages } = data

    return (
      <div ref={this.ref} className='visualisation' style={this.state.layout &&
        { width: this.state.layout.width, height: this.state.layout.height }}>
        {pages.map((page, index) => <Page
          key={index} data={data} page={page}
          layout={this.state.layout && this.state.layout.nodes[index]} />
        )}
        {this.state.layout &&
          <Lines layout={this.state.layout} data={data} />}

        {this.state.layout &&
          <Minimap layout={this.state.layout} data={data} />}
      </div>
    )
  }
}

class Menu extends React.Component {
  state = {
    tab: 'model'
  }

  onClickUpload = (e) => {
    e.preventDefault()
    document.getElementById('upload').click()
  }

  onFileUpload = (e) => {
    const { data } = this.props
    const file = e.target.files.item(0)
    const reader = new window.FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = function (evt) {
      const content = JSON.parse(evt.target.result)
      data.save(content)
    }
  }

  setTab (e, name) {
    e.preventDefault()
    this.setState({ tab: name })
  }

  render () {
    const { data, playgroundMode } = this.props

    return (
      <div className='menu'>
        <button className={`govuk-button govuk-!-font-size-14${this.state.showMenu ? ' govuk-!-margin-right-2' : ''}`}
          onClick={() => this.setState({ showMenu: !this.state.showMenu })}>☰</button>
        {this.state.showMenu && <span className='menu-inner'>
          <button className='govuk-button govuk-!-font-size-14'
            onClick={() => this.setState({ showAddPage: true })}>Add Page</button>{' '}

          <button className='govuk-button govuk-!-font-size-14'
            onClick={() => this.setState({ showAddLink: true })}>Add Link</button>{' '}

          <button className='govuk-button govuk-!-font-size-14'
            onClick={() => this.setState({ showEditSections: true })}>Edit Sections</button>{' '}

          <button className='govuk-button govuk-!-font-size-14'
            onClick={() => this.setState({ showEditConditions: true })}>Edit Conditions</button>{' '}

          <button className='govuk-button govuk-!-font-size-14'
            onClick={() => this.setState({ showEditLists: true })}>Edit Lists</button>{' '}

          <button className='govuk-button govuk-!-font-size-14'
            onClick={() => this.setState({ showSummary: true })}>Summary</button>

          {playgroundMode && (
            <div className='govuk-!-margin-top-4'>
              <a className='govuk-link govuk-link--no-visited-state govuk-!-font-size-16' download href='/api/data?format=true'>Download JSON</a>{' '}
              <a className='govuk-link govuk-link--no-visited-state govuk-!-font-size-16' href='#' onClick={this.onClickUpload}>Upload JSON</a>{' '}
              <input type='file' id='upload' hidden onChange={this.onFileUpload} />
            </div>
          )}

          <Flyout title='Add Page' show={this.state.showAddPage}
            onHide={() => this.setState({ showAddPage: false })}>
            <PageCreate data={data} onCreate={() => this.setState({ showAddPage: false })} />
          </Flyout>

          <Flyout title='Add Link' show={this.state.showAddLink}
            onHide={() => this.setState({ showAddLink: false })}>
            <LinkCreate data={data} onCreate={() => this.setState({ showAddLink: false })} />
          </Flyout>

          <Flyout title='Edit Sections' show={this.state.showEditSections}
            onHide={() => this.setState({ showEditSections: false })}>
            <SectionsEdit data={data} onCreate={() => this.setState({ showEditSections: false })} />
          </Flyout>

          <Flyout title='Edit Conditions' show={this.state.showEditConditions}
            onHide={() => this.setState({ showEditConditions: false })} width='large'>
            <ConditionsEdit data={data} onCreate={() => this.setState({ showEditConditions: false })} />
          </Flyout>

          <Flyout title='Edit Lists' show={this.state.showEditLists}
            onHide={() => this.setState({ showEditLists: false })} width='xlarge'>
            <ListsEdit data={data} onCreate={() => this.setState({ showEditLists: false })} />
          </Flyout>

          <Flyout title='Summary' show={this.state.showSummary} width='large'
            onHide={() => this.setState({ showSummary: false })}>
            <div className='js-enabled' style={{ paddingTop: '3px' }}>
              <div className='govuk-tabs' data-module='tabs'>
                <h2 className='govuk-tabs__title'>Summary</h2>
                <ul className='govuk-tabs__list'>
                  <li className='govuk-tabs__list-item'>
                    <a className='govuk-tabs__tab' href='#'
                      aria-selected={this.state.tab === 'model' ? 'true' : 'false'}
                      onClick={e => this.setTab(e, 'model')}>Data Model</a>
                  </li>
                  <li className='govuk-tabs__list-item'>
                    <a className='govuk-tabs__tab' href='#'
                      aria-selected={this.state.tab === 'json' ? 'true' : 'false'}
                      onClick={e => this.setTab(e, 'json')}>JSON</a>
                  </li>
                  <li className='govuk-tabs__list-item'>
                    <a className='govuk-tabs__tab' href='#'
                      aria-selected={this.state.tab === 'summary' ? 'true' : 'false'}
                      onClick={e => this.setTab(e, 'summary')}>Summary</a>
                  </li>
                </ul>
                {this.state.tab === 'model' &&
                  <section className='govuk-tabs__panel'>
                    <DataModel data={data} />
                  </section>
                }
                {this.state.tab === 'json' &&
                  <section className='govuk-tabs__panel'>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                  </section>
                }
                {this.state.tab === 'summary' &&
                  <section className='govuk-tabs__panel'>
                    <pre>{JSON.stringify(data.pages.map(page => page.path), null, 2)}</pre>
                  </section>
                }
              </div>
            </div>
          </Flyout>
        </span>
        }
      </div>
    )
  }
}

class App extends React.Component {
  state = {}

  componentWillMount () {
    window.fetch('/api/data').then(res => res.json()).then(data => {
      data.save = this.save
      this.setState({ loaded: true, data })
    })
  }

  save = (updatedData) => {
    return window.fetch(`/api/data`, {
      method: 'put',
      body: JSON.stringify(updatedData)
    }).then(res => {
      if (!res.ok) {
        throw Error(res.statusText)
      }
      return res
    }).then(res => res.json()).then(data => {
      data.save = this.save
      this.setState({ data })

      // Reload frame if split screen and in playground mode
      if (window.DFBD.playgroundMode) {
        const parent = window.parent
        if (parent.location.pathname === '/split') {
          const frames = window.parent.frames

          if (frames.length === 2) {
            const preview = window.parent.frames[1]
            preview.location.reload()
          }
        }
      }

      return data
    }).catch(err => {
      console.error(err)
      window.alert('Save failed')
    })
  }

  render () {
    if (this.state.loaded) {
      return (
        <div id='app'>
          <Menu data={this.state.data} playgroundMode={window.DFBD.playgroundMode} />
          <Visualisation data={this.state.data} />
        </div>
      )
    } else {
      return <div>Loading...</div>
    }
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
)
