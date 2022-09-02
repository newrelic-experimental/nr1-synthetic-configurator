  //local testing suppport, these are already included in the syntehtic monitor runtime
  const IS_LOCAL_ENV = typeof $http === 'undefined';
  if (IS_LOCAL_ENV) {  
    var $http = require("request");
  } 

// ** Paste the uglified.js code in here ** 

async function run()  {
    //grabConfig(DOCUMENT_ID, ACCOUNT_ID, REGION, PACKAGE_UUID, QUERY_KEY)
    let config = await grabConfig("your-doc-id", 12345678, "US", "xxx-xxx-xxx-xxx","NRAK-xxx")
    console.log("Config is",config)
}
run()