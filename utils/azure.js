const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const endpoint = process.env.AZURE_API_ENDPOINT;
const azureApiKey = process.env.AZURE_API_KEY;

if (!endpoint || !azureApiKey) {
  throw new Error("AZURE_API_ENDPOINT or AZURE_API_KEY not found in env.");
}

const Client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));

exports.AzureOpenAIClient = Client;