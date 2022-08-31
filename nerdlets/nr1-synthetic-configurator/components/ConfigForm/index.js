import React, { useState } from 'react';
import Form from "react-jsonschema-form";
import MyBaseInput from '../Customisations/BaseInput.js'
import { Icon } from 'nr1'



export default class ConfigForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = { hasError: false, formData:props.data };
      }

     static getDerivedStateFromError(error) {    // Update state so the next render will show the fallback UI.  
          return { hasError: true }; 
     }

     componentWillReceiveProps(nextProps) {
      // You don't have to do this check first, but it can help prevent an unneeded render
      if (this.props.data !== nextProps.data) {
        this.setState({ formData: nextProps.data });
      }
    }

    componentDidCatch(error, errorInfo) {    // You can also log the error to an error reporting service 
      this.setState({
        error: error,
        errorInfo: errorInfo
      })
        console.log(error, errorInfo);  
    }



render() {

    const {formData} = this.state
    if(this.state.hasError) {
      return <div>Form schema error</div>
    } else {
      
      let schema
      try {
        schema = JSON.parse(this.props.schema);
      } catch {
        schema = ""
      }

      let data = {} //{"foo":"eek", "bar": "bim"}
      const widgets = {
        BaseInput: MyBaseInput //a hack to allow us to remove the nr styles on text inputs
    };

    const log = (type) => console.log.bind(console, type)

    const onSubmit = ({formData}, e) => {
      this.props.saveHandler(formData)
    }

      const onChange = ({formData}, e) => {
        this.setState({formData: formData})
        this.props.onChange(formData)
      }

      if (schema == ""){
        return <div>Unable to parse schema as json: {this.props.schema}</div>
      } else {
        let form = <Form schema={schema} 
        uiSchema="" 
        widgets={widgets} 
        formData={formData} 
        onChange={onChange}
        onSubmit={onSubmit}
        onError={log("errors")}
        >
        <button className="u-unstyledButton btn btn-primary" type="submit"><Icon spacingType={[Icon.SPACING_TYPE.SMALL]} type={Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__UPSTREAM_CONNECTION} inline />Save</button></Form>
        return <div>{form}</div>
      }
  }
 }     
}

//export default ConfigForm;