import React from 'react'
import { clone } from './helpers'

class GroupEdit extends React.Component {
  state = {}

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const formData = new window.FormData(form)
    const newName = formData.get('name').trim()
    const newColour = formData.get('colour').trim()
    const newTitle = formData.get('title').trim()
    const condition = formData.get('condition').trim()
    const { data, group } = this.props

    const copy = clone(data)
    const nameChanged = newName !== group.name
    const copyGroup = copy.groups[data.groups.indexOf(group)]

    if (nameChanged) {
      copyGroup.name = newName

      // Update any references to the group
      copy.pages.forEach(p => {
        if (p.group === group.name) {
          p.group = newName
        }
      })
    }

    copyGroup.colour = newColour
    copyGroup.title = newTitle
    copyGroup.condition = condition

    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onEdit({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  onClickDelete = e => {
    e.preventDefault()

    if (!window.confirm('Confirm delete')) {
      return
    }

    const { data, group } = this.props
    const copy = clone(data)

    // Remove the group
    copy.groups.splice(data.groups.indexOf(group), 1)

    // Update any references to the group
    copy.pages.forEach(p => {
      if (p.group === group.name) {
        delete p.group
      }
    })

    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onEdit({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  onBlurName = e => {
    const input = e.target
    const { data, group } = this.props
    const newName = input.value.trim()

    // Validate it is unique
    if (data.groups.find(s => s !== group && s.name === newName)) {
      input.setCustomValidity(`Name '${newName}' already exists`)
    } else {
      input.setCustomValidity('')
    }
  }

  render () {
    const { group, data } = this.props
    const { conditions } = data

    return (
      <form onSubmit={e => this.onSubmit(e)} autoComplete='off'>
        <a
          className='govuk-back-link' href='#'
          onClick={e => this.props.onCancel(e)}
        >Back
        </a>
        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='group-name'>Name</label>
          <div className='govuk-hint'>Use `camelCasing` e.g. licenceDetails or personalDetails.</div>
          <input
            className='govuk-input' id='group-name' name='name'
            type='text' defaultValue={group.name} required pattern='^\S+'
            onBlur={this.onBlurName}
          />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='group-colour'>Colour</label>
          <input
            className='govuk-input' id='group-colour' name='colour'
            type='color' defaultValue={group.colour} required
          />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='group-title'>Title</label>
          <input
            className='govuk-input' id='group-title' name='title'
            type='text' defaultValue={group.title} required
          />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='group-condition'>Condition (optional)</label>
          <div id='group-condition-hint' className='govuk-hint'>
            The group will only be used if the expression evaluates to truthy
          </div>
          <select className='govuk-select' id='group-condition' name='condition' defaultValue={group.condition}>
            <option />
            {conditions.map(condition => (<option key={condition.name} value={condition.name}>{condition.name}</option>))}
          </select>
        </div>

        <button className='govuk-button' type='submit'>Save</button>{' '}
        <button className='govuk-button' type='button' onClick={this.onClickDelete}>Delete</button>
      </form>
    )
  }
}

export default GroupEdit
