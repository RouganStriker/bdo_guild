import React from 'react';
import TextField from 'material-ui/TextField'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import Checkbox from 'material-ui/Checkbox'
import DatePicker from 'material-ui/DatePicker';
import SelectField from 'material-ui/SelectField';
import Toggle from 'material-ui/Toggle';
import MenuItem from 'material-ui/MenuItem';

import ChipField from './ChipField';
import Time from './Time';
import utils from './customDateUtils';


export const renderTextField = ({ input, label, meta: { touched, error }, ...custom }) => {
  return (
    <TextField hintText={label}
               floatingLabelText={label}
               errorText={touched && error}
               {...input}
               {...custom}
               onChange={(event, value) => {
                 input.onChange && input.onChange(event, value);
                 custom.onChange && custom.onChange(event, value);
               }} />
  )
}

export const renderChipField = ({ input, meta: { touched, error }, ...custom }) => (
  <ChipField errorText={touched && error}
             value={input.value}
             {...input}
             {...custom}
  />
)


export const renderDateField = ({ input, label, meta: { touched, error }, ...custom }) => {
  const { modifyDate, onChange, ...others } = custom;
  const customDate = (date) => {
    if (modifyDate && modifyDate) {
      return modifyDate(date)
    }
    return date;
  }

  return <DatePicker hintText={label}
                     autoOk={true}
                     floatingLabelText={label}
                     errorText={touched && error}
                     {...input}
                     value = {input.value !== ''? new Date(input.value) : null}
                     onChange = {(event, value) => {
                       onChange && onChange(customDate(value));
                       return value && input.onChange(customDate(value))
                     }}
                     onBlur = {(event, value) => (value && input.onBlur(customDate(value)))}
                     utils={utils}
                     {...others}
  />
}

export const renderCheckbox = ({ input, label, ...custom }) => (
  <Checkbox label={label}
            checked={input.value ? true : false}
            onCheck={(e, isChecked) => input.onChange(isChecked)}
            {...custom} />
)

export const renderToggle = ({ input, label, ...custom }) => (
  <Toggle label={label}
          toggled={input.value ? true : false}
          onToggle={input.onChange}
          {...custom} />
)

export const renderRadioGroup = ({ input, ...custom }) => {
  const { onChange } = custom;

  return (
    <RadioButtonGroup {...input} {...custom}
      valueSelected={input.value}
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: 'auto',
      }}
      onChange={(event, value) => {
        onChange && onChange(value)
        return input.onChange(value)
      }} />
  )
}

export const renderRadioButton = field => {
  const horizontalStyle = {
    ...field.style,
    display: 'inline-block',
    width: 'auto',
    whiteSpace: 'nowrap',
    paddingRight: '24px'
  };

  const newProps = {
    ...field,
    horizontal: undefined,
    style: field.horizontal ? horizontalStyle : field.style
  };

  return <RadioButton {...mergeProps(newProps)} />;
};

export const renderSelectField = ({ input, label, meta: { touched, error }, children, ...custom }) => {
  return (
    <SelectField
      floatingLabelText={label}
      errorText={touched && error}
      {...input}
      onChange={(event, index, value) =>  input.onChange(value)}
      children={children}
      {...custom}/>
  )
}