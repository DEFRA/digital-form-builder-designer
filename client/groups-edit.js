import React from 'react'
import GroupEdit from './group-edit'
import GroupCreate from './group-create'

class GroupsEdit extends React.Component {
  state = {}

  onClickGroup = (e, group) => {
    e.preventDefault()

    this.setState({
      group
    })
  }

  onClickAddGroup = (e, group) => {
    e.preventDefault()

    this.setState({
      showAddGroup: true
    })
  }

  render () {
    const { data } = this.props
    const { groups } = data
    const group = this.state.group

    return (
      <div className='govuk-body'>
        {!group
          ? (
            <div>
              {this.state.showAddGroup
                ? (
                  <GroupCreate
                    data={data}
                    onCreate={e => this.setState({ showAddGroup: false })}
                    onCancel={e => this.setState({ showAddGroup: false })}
                  />
                  )
                : (
                  <ul className='govuk-list'>
                    {groups.map((group, index) => (
                      <li key={group.name}>
                        <a className='govuk-link govuk-link--no-visited-state' href='#' onClick={e => this.onClickGroup(e, group)}>
                          {group.title}
                        </a>
                      </li>
                    ))}
                    <li>
                      <hr />
                      <a className='govuk-link govuk-link--no-visited-state' href='#' onClick={e => this.onClickAddGroup(e)}>Add group</a>
                    </li>
                  </ul>
                  )}
            </div>
            )
          : (
            <GroupEdit
              group={group} data={data}
              onEdit={e => this.setState({ group: null })}
              onCancel={e => this.setState({ group: null })}
            />
            )}
      </div>
    )
  }
}

export default GroupsEdit
