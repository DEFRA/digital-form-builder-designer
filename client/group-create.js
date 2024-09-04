import React from 'react'
import { clone } from './helpers'

class GroupCreate extends React.Component {
  state = {}

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const formData = new window.FormData(form)
    const name = formData.get('name').trim()
    const colour = formData.get('colour').trim()
    const title = formData.get('title').trim()
    const condition = formData.get('condition').trim()
    const { data } = this.props
    const copy = clone(data)

    const group = { name, colour, title, condition }
    copy.groups.push(group)

    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onCreate({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  onBlurName = e => {
    const input = e.target
    const { data } = this.props
    const newName = input.value.trim()

    // Validate it is unique
    if (data.groups.find(s => s.name === newName)) {
      input.setCustomValidity(`Name '${newName}' already exists`)
    } else {
      input.setCustomValidity('')
    }
  }

  render () {
    const { data } = this.props
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
            type='text' required pattern='^\S+'
            onBlur={this.onBlurName}
          />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='group-colour'>Colour</label>
          <input
            className='govuk-input' id='group-colour' name='colour'
            type='color' required
          />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='group-title'>Title</label>
          <input
            className='govuk-input' id='group-title' name='title'
            type='text' required
          />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='group-condition'>Condition (optional)</label>
          <div id='group-condition-hint' className='govuk-hint'>
            The group will only be used if the expression evaluates to truthy
          </div>
          <select className='govuk-select' id='group-condition' name='condition'>
            <option />
            {conditions.map(condition => (<option key={condition.name} value={condition.name}>{condition.name}</option>))}
          </select>
        </div>

        <button className='govuk-button' type='submit'>Save</button>
      </form>
    )
  }
}

export default GroupCreate
