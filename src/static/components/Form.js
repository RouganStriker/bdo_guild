import { gettext } from 'django-i18n';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import cookie from 'react-cookie';
import FlatButton from 'material-ui/FlatButton';

/**
 * Function which will auto-scroll to field with validation error
 * Pass to reduxForm() as onSubmitForm
 */
export const scrollToErrorOnSubmitFail = errors => {
  function getFieldName(obj) {
    const key = Object.keys(obj)[0];
    const value = obj[key];

    if (typeof value === 'string') {
      return key;
    }

    return key + '.' + getFieldName(value);
  }

  const fieldName = getFieldName(errors);
  const field = document.querySelector(`*[name="${fieldName}"]`);
  field && field.focus();
};


class Form extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      maxHeight: null,
      contentMaxHeight: null
    };

  }

  componentDidMount() {
    this.setHeight();
  }

  handleResize() {
    this.setHeight();
  }

  setHeight() {

    const {
      container,
      footer
    } = this.refs;

    if (!container) {
      return;
    }

    const node = ReactDOM.findDOMNode(container);
    const footerNode = ReactDOM.findDOMNode(footer);
    const parent = node.parentElement;

    // A named parent might have styling we do not know what to do with
    if (!parent || parent.className) {
      return;
    }

    setTimeout(() => {

      const maxHeight = window.getComputedStyle(parent)
                              .getPropertyValue('max-height');
      const footerHeight = footerNode.clientHeight;

      // we need to keep room for the footer by limiting the content
      this.setState({
        maxHeight,
        contentMaxHeight: `${Math.floor(parseInt(maxHeight, 10) - parseInt(footerHeight, 10))}px`
      });

      // prevent scrollbars from showing up
      parent.style.overflow = 'hidden';

    }, 0);

  }

  renderFooterActions() {

    const {
      isLoading,
      onBack,
      onSubmit,
      onCancel,
      backLabel,
      submitWarning,
      submitLabel,
      submitTitle,
      disableBack,
      disableCancel,
      disableSubmit,
      cancelLabel,
      cancelWarning,
      renderSubmit,
      renderCancel,
      renderBack,
      renderButtons,
    } = this.props;

    const backButton = <FlatButton className="sde-form-onback"
                                   label={backLabel}
                                   onClick={onBack}
                                   disabled={isLoading || disableBack}
                                   tabIndex={-1} />;

    const submitButton = <FlatButton type="submit"
                                     primary={true}
                                     warning={submitWarning}
                                     label={submitLabel}
                                     onClick={onSubmit}
                                     title={submitTitle}
                                     disabled={isLoading || disableSubmit} />;

    const cancelButton = <FlatButton label={cancelLabel}
                                     warning={cancelWarning}
                                     disabled={disableCancel}
                                     onClick={onCancel}
                                     tabIndex={-1} />;

    const defaultOrder =
      <div className="footer-actions">
        { onBack &&
          (renderBack && renderBack(backButton, this.props) || backButton)
        }
        { onSubmit &&
          (renderSubmit && renderSubmit(submitButton, this.props) || submitButton)
        }
        { onCancel &&
          (renderCancel && renderCancel(cancelButton, this.props) || cancelButton)
        }
      </div>;

    return renderButtons && renderButtons(backButton, submitButton, cancelButton) || defaultOrder;

  }

  renderContents() {

    const {
      headerActions,
      children,
      title,
      content,
      secondary,
      subtitle,
      contentStyle,
      primaryStyle,
      secondaryStyle
    } = this.props;

    const {
      contentMaxHeight
    } = this.state;

    let contents =
      <div style={{ maxHeight: contentMaxHeight }}>
        {children}
      </div>
    ;

    if (content) {
      contents = content;
    }

    return contents;

  }

  render() {

    let csrfToken;

    const {
      action,
      formRef,
      encType,
      method,
      target,
      isLoading,
      secondary
    } = this.props;

    const {
      maxHeight
    } = this.state;

    const formProps = {
      ref: formRef,
      method,
      action,
      target,
      encType
    };

    if (method || action) {
      csrfToken =
        <input type="hidden"
               name="csrfmiddlewaretoken"
               value={cookie.load('bdo-csrftoken')} />
      ;
    }

    const width = this.props.width || (secondary ? '930px' : '640px');

    return (
      <form autoComplete="off" {...formProps}>
        {csrfToken}
        {this.renderContents()}
      </form>
    );
  }

}

Form.propTypes = {
  secondary: PropTypes.node,
  content: PropTypes.node,
  formRef: PropTypes.func,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  onBack: PropTypes.func,
  renderSubmit: PropTypes.func,
  renderCancel: PropTypes.func,
  renderBack: PropTypes.func
};

Form.defaultProps = {
  submitLabel: gettext('Done'),
  cancelLabel: gettext('Cancel'),
  backLabel: gettext('Previous')
};

export default Form;
