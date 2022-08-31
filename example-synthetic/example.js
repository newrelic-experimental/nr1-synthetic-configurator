// ** Paste the uglified.js code in here ** 

async function run()  {
    //grabConfig(DOCUMENT_ID, ACCOUNT_ID, REGION, PACKAGE_UUID, QUERY_KEY)
    let config = await grabConfig("your-doc-id", 12345678, "US", "xxx-xxx-xxx-xxx","NRAK-xxx")
    console.log("Config is",config)
}
run()