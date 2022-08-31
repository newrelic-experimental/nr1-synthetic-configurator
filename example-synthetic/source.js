
/*
*  ========== LOCAL TESTING CONFIGURATION ===========================
*  This section allows you to run the script from your local machine
*  mimicking it running in the new relic environment. Much easier to develop!
*/

const IS_LOCAL_ENV = typeof $http === 'undefined';
if (IS_LOCAL_ENV) {  
  var $http = require("request");
  console.log("Running in local mode",true)
} 

/*
*  ======================== END =====================================
*/
async function grabConfig(DOCUMENT_ID, ACCOUNT_ID, REGION, PACKAGE_UUID, QUERY_KEY) {
  const GRAPHQL_URL= REGION=="US" ? "https://api.newrelic.com/graphql" : "https://api.eu.newrelic.com/graphql"
  if(typeof $util !=='undefined') {
    $util.insights.set("configurator",`${PACKAGE_UUID}-${DOCUMENT_ID}`)
  }
  function isObject(val) {
    if (val === null) { return false;}
    return ( (typeof val === 'function') || (typeof val === 'object') );
  }
  
  const genericServiceCall =  function(options,success) {
    !('timeout' in options) && (options.timeout = 10000) //add a timeout if not already specified 
    return new Promise((resolve, reject) => {
        $http(options, function callback(error, response, body) {
        if(error) {
            reject(`Connection error on url '${options.url}'`)
        } else {
            if(response.statusCode!=200 ) {
                console.log(response.body)
                reject(`API did not respond with a 200 OK, got ${response.statusCode}`)
            } else {
                resolve(success(body,response,error))
            }
          }
        });
    })
  }
  
  const gqlQuery = async (query, variables) => {
    const options =  {
        url: GRAPHQL_URL,
        method: 'POST',
        headers :{
          "Content-Type": "application/json",
          "API-Key": QUERY_KEY,
          "NewRelic-Package-Id" : PACKAGE_UUID
        },
        body: JSON.stringify({ "query": query, "variables": variables })
    }
  
    let body = await genericServiceCall(options,(body)=>{ return body})
    let jsonBody={}
    try {
      if(isObject(body)) {
        jsonBody = body
      } else {
        jsonBody = JSON.parse(body)
      }  
  
      //check for errors
      if(jsonBody.errors && jsonBody.errors.length > 0) {
        GQL_ERROR_DETECTED=true
        console.log("!! GQL Query error detected:",jsonBody.errors)
      }
      return jsonBody
  
    } catch(e) {
        console.log("Error: Response from New Relic failed to parse as JSON.",e)
    }
  }

const query = `query($accountId: Int!, $documentId: String!) {actor {account(id: $accountId){nerdStorage{document(collection: "SyntheticConfigurator",documentId:$documentId)}}}}`
const vars = { "accountId": parseInt(ACCOUNT_ID), "documentId": DOCUMENT_ID}

let grab_config=await gqlQuery(query,vars)
let config= JSON.parse(grab_config.data.actor.account.nerdStorage.document.config)
return config
}