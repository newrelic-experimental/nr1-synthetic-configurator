import React, { useState } from 'react';
import {Spinner, HeadingText, AreaChart, PieChart, BillboardChart, Dropdown, DropdownItem, Toast, AccountStorageMutation, AccountStorageQuery, Card, CardHeader, Grid, GridItem, navigation} from 'nr1';
import Configurator from '../../components/Configurator';
import defaultConfig from "../defaults.json";
import ConfigForm from "./components/ConfigForm";
import Editor from "react-simple-code-editor";
import NerdletUUID from "../../nr1.json"
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another
import UglifiedSource from "!raw-loader!../../example-synthetic/uglified.js";
import {CopyToClipboard} from 'react-copy-to-clipboard';


function ConfiguratorSimpleNerdlet() {

  const accountId = 0 //put your account id for storing config here!

  const [config, setConfig] = useState(false);
  const [chosenSchema, setChosenSchema] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showTools, setshowTools] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = React.useState(
    `// loading code snippet....`
  );

  let nerdpackUUID = NerdletUUID.id ? NerdletUUID.id : "your-nerdlet-id"

  const collectionName='SyntheticConfigurator'
  const schema = {
      "type": "object",
      "properties": {
        "schemas": {
          "type":"array",
          "title":"Schemas",
          "items": {
            "type": "object",
            "properties": {
              "name": {             
                  "type": "string",
                  "title": "Config name"
              },
              "id": {                
                "type": "string",
                "title": "Config ID"
              },
              "schema": {           
                  "type": "string",
                  "title": "Schema",
              }
            }
          }
        }
      }
  }
 
  function openChartBuilder( uuid, documentId ) {
    const nerdlet = {
      id: 'data-exploration.query-builder',
      urlState: {
        initialActiveInterface: 'nrqlEditor',
        initialAccountId: accountId,
        initialNrqlValue: `SELECT count(*) from SyntheticCheck where custom.configurator ='${uuid}-${documentId}' facet monitorName, result since 1 day ago `,
        isViewingQuery: true
      }
    };
    navigation.openStackedNerdlet(nerdlet);
  }
    
  const buildSchemaSelector = ()=> {
      //determine title of dropdown
      let dropDownTitle="Select..."
      if(chosenSchema) {
        dropDownTitle=chosenSchema.name
      }

      //build dropdown values
      let schemaOptions=[]
      if(config.schemas) {
        schemaOptions=config.schemas.map((schema,idx)=>{             //iterate over each chart in the config and draw to screen
              return(<DropdownItem onClick={(evt) => { schemaSelected(schema);}}>{schema.name}</DropdownItem>)
          })
      }
     return <Dropdown label="Synthetic configuration:" title={dropDownTitle}>{schemaOptions}</Dropdown>
  }

  const schemaSelected = (schema) => {
    setChosenSchema(schema);
    let conf = loadConfiguration(schema.id);
    setCurrentConfig(conf)
  }

  const loadConfiguration = (id) => {
    setCurrentConfig(null)
    AccountStorageQuery.query({
      accountId: accountId,
      collection: collectionName,
      documentId: id,
    }).then(({ data }) => { if(data == null) {setCurrentConfig("");} else {setCurrentConfig(JSON.parse(data.config));} });
    setCode(`//Configuration loader code\n`+UglifiedSource+`

// Example calling code to gather configuration at start of script
async function run()  {
  // We recommend specifying your User API key using secure credentials: https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/using-monitors/store-secure-credentials-scripted-browsers-api-tests/
  // let config = await grabConfig(CONFIG_ID, ACCOUNT_ID, REGION, NERDPACK_PACKAGE_UUID, USER_API_KEY)
  let config = await grabConfig("${id}", ${accountId}, "US", "${nerdpackUUID}","NRAK-xxxx")
  console.log("Config laoded is:",config)
}
run()   
    ` )
  }

  const saveConfig = (data) => {
    setSaving(true)
    setCurrentConfig(data)
    AccountStorageMutation.mutate({
      accountId: accountId,
      actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: collectionName,
      documentId: chosenSchema.id,
      document: {
        config: JSON.stringify(data)
      },
    }).then(()=>{
      setSaving(false)
      Toast.showToast({
        title: `Data saved for configuration ${chosenSchema.name}`,
        type: Toast.TYPE.NORMAL,
    });
    });
  }

  

 // testing if i need loaded config and edited config!
  const renderForm = () => {
    
    let toolsPanel
    if(showTools) {
      toolsPanel=<div className='codeEditor'>
      <span>Raw JSON configuration (you can edit this but it must be valid JSON):</span>
      <Editor
       className='language-json'
        value={JSON.stringify(currentConfig)}
        onValueChange={code => {
            try { 
              let parsedCode=JSON.parse(code)
              setCurrentConfig(parsedCode)
            } catch {}
          }}
          highlight={code => highlight(code, languages.js)}
        padding={10}
        style={{
          fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
          fontSize: 12,
        }}
      /> 
       <CopyToClipboard text={JSON.stringify(currentConfig)}>
        <button>Copy JSON to clipboard</button>
      </CopyToClipboard>
      </div>
    }

    let snippetPanel
    if(showSnippet) {
      snippetPanel=<div className='codeEditor'>
      <span>Copy the code snippet below into your synthetic monitor. Configure it with you API key which you should provide via a secure credential if possible.</span>
      <Editor
       className='language-javascript'
        value={code}
        onValueChange={code => setCode(code)}
        highlight={code => highlight(code, languages.js)}
        padding={10}
        style={{
          fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
          fontSize: 12,
        }}
      /> 
       <CopyToClipboard text={code}
        onCopy={() => setCopied(true)}>
        <button>Copy code to clipboard</button>
      </CopyToClipboard>
      </div>
    }
    let buttonText= showTools ?  "Hide JSON" : "Show JSON"
    let snippetButtonText= showSnippet ?  "Hide Snippet" : "Show Code Snippet for Synthetic Monitor Loader"

    if(chosenSchema && currentConfig!== undefined) {
      return<div> 
        <Grid>
          <GridItem columnSpan={10}>
          <Grid>
        <GridItem columnSpan={2}>
          <Card>
            <CardHeader title="Synthetic" subtitle={chosenSchema.name} />
          </Card>
        </GridItem>
        <GridItem  columnSpan={2}>
          <Card>
            <CardHeader title="DOCUMENT ID" subtitle={chosenSchema.id} />
          </Card>
        </GridItem>
        <GridItem  columnSpan={6}>
          <Card>
            <CardHeader title="PACKAGE UUID" subtitle={nerdpackUUID} />
          </Card>
        </GridItem>
      
      </Grid>

      <Grid>
        <GridItem  columnSpan={10}>
          <div className="formInnerContainer">
            <ConfigForm schema={chosenSchema.schema} data={currentConfig} saveHandler={saveConfig} onChange={(data)=>{setCurrentConfig(data)}}/>
            <div className='toolsPanelContainer'>
              <a href="#" onClick={(e)=>{e.preventDefault();  setshowTools(false); setShowSnippet(!showSnippet);}}>{snippetButtonText}</a> | <a href="#" onClick={(e)=>{e.preventDefault(); setShowSnippet(false); setshowTools(!showTools);}}>{buttonText}</a>
              <div className='innerToolsPanelContainer'>
                {toolsPanel}
                {snippetPanel}
              </div>
            </div>
          </div>
        </GridItem>
        
      </Grid>
          </GridItem>
          <GridItem  columnSpan={2}>
          <HeadingText type={HeadingText.TYPE.HEADING_4}>Usage Statistics</HeadingText>
            <span>{`Data below is for monitors in this account (${accountId}) only. Other accounts maybe using the configuration and will not show here.`} </span>
            <hr />
            <HeadingText type={HeadingText.TYPE.HEADING_5}>Monitors using this config last week</HeadingText>
            <BillboardChart 
              accountIds={[accountId]}
              query={`SELECT uniqueCount(monitorName) as 'Monitors' from SyntheticCheck where custom.configurator ='${nerdpackUUID}-${chosenSchema.id}' since 1 week ago`}
            />

            <hr />
            <HeadingText type={HeadingText.TYPE.HEADING_5}>Requests for config last week</HeadingText>
            <PieChart
              accountIds={[accountId]}
              query={`SELECT count(*) as 'Requests' from SyntheticCheck where custom.configurator ='${nerdpackUUID}-${chosenSchema.id}' facet monitorName since 1 week ago limit 100`}
            />

            <hr />
            <HeadingText type={HeadingText.TYPE.HEADING_5}>Requests and check result last week </HeadingText>
            <AreaChart
              accountIds={[accountId]}
              query={`SELECT count(*) as 'Requests' from SyntheticCheck where custom.configurator ='${nerdpackUUID}-${chosenSchema.id}' facet monitorName, result since 1 week ago timeseries limit 100`}
            />
          <div style={{marginTop:"2em"}}>Explore data in <a href="#" onClick={(e)=>{e.preventDefault(); openChartBuilder(nerdpackUUID,chosenSchema.id);}}>Query builder</a></div>
        </GridItem>
        </Grid>
      

      </div>
    } else if(chosenSchema) {
      return <div className='pleaseSelectConfig'><Spinner inline /> Loading configuration for {chosenSchema.name}</div>
    } else {
      return <div className='pleaseSelectConfig'>Please select a configuration to load above.</div>
    }    
  }


        //Some default values if there is no config
        let renderVal=<div className="configLoading"><Spinner inline /> Loading synthetic schema configurations...</div>

        //Hydrate using the config once it has been loaded
        if(config) {

            renderVal= <div className='formEditorContainer'>
               {buildSchemaSelector()}
               {renderForm()}
            </div>
        }

        if (accountId == 0) {
          return <div className="OuterNerdletContainer"><strong>accountId not set!</strong> This application must have an accountId configured in order to store configuration settings. Please update the source code with your account Id and re-deploy.</div>
        } else {
        return <div className="OuterNerdletContainer">
            {renderVal}
            <hr />
            <div className="configuratorPanel">
                    <Configurator  
                        schema={schema}                                // schema for the config form data
                        default={defaultConfig}                                    // optional prop to initialise storage if it is empty, this should be wired to the config data from this.state
                        dataChangeHandler={(data)=>{setConfig(data)}}        // callback function run when config changes

                        accountId={accountId}                                 // 1606862 demotron v2
                        storageCollectionId="SchemaConfig"             // the nerdstorage colelciton name to store config
                        documentId="config"                                 // the nerstorage document id prefix

                        buttonTitle="Manage Synthetic Schemas"                         // Some customisation of the configurator UI
                        modalTitle="Manage Synthetic Schemas"
                        modalHelp="Manage your synthetic configuration schemas here. For help with schema definitions visit https://rjsf-team.github.io/react-jsonschema-form/"

                        uiSchema={{
                            "schemas": {
                              "items": {
                              "schema": {
                                "ui:widget": "textarea",
                                "ui:options": {
                                  rows: 10
                                }
                              }
                            }
                          }
                        }}
                    />
            </div>
        </div>
      }
    
}
export default ConfiguratorSimpleNerdlet;