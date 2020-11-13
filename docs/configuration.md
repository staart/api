# Configuration

## Optional services

### ElasticSearch

ElasticSearch is used for tracking API key logs.

If you have a public ElasticSearch instance (this is not recommended), you only need to specify the node:

```env
ELASTICSEARCH_NODE = "https://your-endpoint.example"
```

If your endpoint uses HTTP basic authentication, you can add the credentials:

```env
ELASTICSEARCH_AUTH_USERNAME = "Your username"
ELASTICSEARCH_AUTH_PASSWORD = "Your password"
```

Or, if you're using an ElasticSearch-hosted instance with an API key, you can provide only the API key or a combination of the API key and ID:

```env
ELASTICSEARCH_AUTH_API_KEY = "Your API key"
ELASTICSEARCH_AUTH_API_KEY_ID = "Your API key ID"
```

Alternately, if you're using the Amazon Elasticsearch Service, you can specify the AWS credentials:

```env
ELASTICSEARCH_NODE = "https://search-your-endpoint.us-east-1.es.amazonaws.com"
ELASTICSEARCH_AWS_ACCESS_KEY_ID = "Your AWS access key ID"
ELASTICSEARCH_AWS_SECRET_ACCESS_KEY = "Your AWS secret access key"
ELASTICSEARCH_AWS_REGION = "us-east-1"
```
