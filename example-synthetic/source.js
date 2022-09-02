
async function grabConfig(DOCUMENT_ID, ACCOUNT_ID, REGION, PACKAGE_UUID, QUERY_KEY) {
  
  const GRAPHQL_URL= REGION=="US" ? "https://api.newrelic.com/graphql" : "https://api.eu.newrelic.com/graphql"

  //Record the config used by this monitor so that it can be queried with NRQL
  if(typeof $util !=='undefined') {
    $util.insights.set("configurator",`${PACKAGE_UUID}-${DOCUMENT_ID}`)
  }

  //util function for determining if var is an object
  function isObject(val) {
    if (val === null) { return false;}
    return ( (typeof val === 'function') || (typeof val === 'object') );
  }
  
  //Simple promise based http call
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
  
  // GraphQL query
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

  const grab_config=await gqlQuery(query,vars)
  const config=JSON.parse(grab_config.data.actor.account.nerdStorage.document.config)
  return config
}