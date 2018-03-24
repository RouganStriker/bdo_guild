/*
  Chip Field is a combo text field and list of chips.
*/
import React from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'throttle-debounce';
import { flash } from 'react-animations';
import { StyleSheet, css } from 'aphrodite';

import Chip from 'material-ui/Chip';
import TextField from 'material-ui/TextField';

const animationStyle = StyleSheet.create({
  flash: {
    animationName: flash,
    animationDuration: '1s'
  }
});


class ChipField extends React.Component {
  constructor() {
    super()

    this.state = {
      textValue: '',
      flashValue: '',
    }
    this.handleTextChange = debounce(100, (e, value) => this.setState({textValue: value}));
  }

  handleRequestDelete(deletedItem) {
    const { onChange, value } = this.props;

    onChange && onChange(value.filter(item => item != deletedItem));
  }

  handleKeyPress(event) {
    const { onChange, value } = this.props;
    // Use the value from event since value from state is debounced
    // and may not be up-to-date.
    const textValue = event.target.value;

    if (!textValue || !onChange || event.key !== 'Enter') {
      return;
    }
    if (value.find(val => val.toLowerCase() == textValue.toLowerCase())) {
      this.setState({flashValue: textValue}, () => {
        const self = this;
        setTimeout(() => self.setState({flashValue: ''}), 1000);
      });

      return;
    }

    onChange([...value, textValue]);
    event.preventDefault();

    this.setState({
      textValue: '',
    })
  }

  render() {
    const {
      style,
      textStyle,
      value,
      onBlur,
      onChange,
      onDrop,
      onDragStart,
      ...others
    } = this.props;

    const {
      flashValue
    } = this.state;

    return (
      <div>
        <TextField {...others}
                   onChange={this.handleTextChange.bind(this)}
                   onKeyPress={this.handleKeyPress.bind(this)}
                   value={this.state.textValue} />
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {
            value.map((val, index) => {
              return (
                <Chip key={index}
                      onRequestDelete={() => this.handleRequestDelete(val)}
                      className={flashValue.toLowerCase() === val.toLowerCase() ? css(animationStyle.flash) : ''}>
                  {val}
                </Chip>
              );
            })
          }
        </div>
      </div>
    );
  }
}

ChipField.propTypes = {
  style: PropTypes.object,      // Style for ChipField
  textStyle: PropTypes.object,  // Style passed to TextField
  onChange: PropTypes.func,     // List of values
  value: PropTypes.array,       // List of values
};

ChipField.defaultProps = {
  value: [],
};

export default ChipField;
