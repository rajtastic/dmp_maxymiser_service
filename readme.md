# Table of Contents

[1 Overview](#1-Overview)

[2 Repo Contents Description](#2-repo-contents-description)

[3 Logging](#3-logging)

[4 Architecture](#4-Architecture)

[5 Deployment Instructions](#5-Deployment-Instructions)

[6 Testing](#6-Testing)

# 1 Overview

## 1.1 Introduction

This repo contains two [Docker](http://www.docker.com) Images (both using [NodeJS](https://nodejs.org/en/) and [ExpressJS](https://expressjs.com/)) and required config files for the Oracle DMP > Maxymiser Service Proof-Of-Concept. This is a service designed to receive data from the Oracle DMP (via real-time [Server Data Transfer](https://docs.oracle.com/en/cloud/saas/data-cloud/data-cloud-help-center/#IntegratingBlueKaiPlatform/DataDelivery/intro_to_sdt.html)) and forward it to the Maxymiser [Customer Data API](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCGD/Overview.html) as end-user controlled Custom Attributes.

Optimising returning visitors' landing pages are a key opportunity for conversion. This means the existing client-side DMP > Maxymiser integration is sub-optimal because it will either slow loading time for the first page view or delay optimisation for subsequent page views.

This solution provides a middleware app which can be deployed on your infrastructure (e.g. Oracle Cloud Infrastructure) to allow the DMP to send data to Maxymiser server-side. As long as there is a match key between the DMP & Maxymiser (e.g. customer ID or cookie ID), data can be sent from the DMP before the user lands on the page making the landing page ready for immediate optimisation).

Please note, this solution will only provide substantial benefit for returning customers (especially if offline data is sent to the DMP without the customer revisiting the page). For example, if a customer hits 30 days before their car insurance renewal - this data may be sent to the DMP and we may want this information to be immediately sent to Maxymiser so that on their next website visit the landing page is immediately optimised.

## 1.2 Demo Video

This video shows the app in action with Maxymiser:

[![Demo](http://img.youtube.com/vi/iZ9UfjUY1gk/0.jpg)](http://www.youtube.com/watch?v=iZ9UfjUY1gk "Demo Video")

# 2 Repo Contents Description
This repo contains two services which both run on Docker:

## 2.1 Auth Service
The Auth Service (dmp_mm_auth_service) is powered by a Docker Image which can be run as a service on your server(s). It consists of:

* A MongoDB database (running as a separate Docker container) to store Maxymiser credentials per client
* An Auth Service container which contains:
	* a UI for submitting/deleting Maxymiser credentials
	* APIs for requesting Maxymiser Authorisation Tokens for using the [Customer Data API](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCGD/Overview.html)

## 2.2 Visitor Service
The Visitor Service (dmp_mm_visitor_service) is powered by a Docker Image which can be run as a service on your server(s). It consists of:

* A Visitor Service container which contains an API which will:
	* Receive DMP [Server Data Transfer](https://docs.oracle.com/en/cloud/saas/data-cloud/data-cloud-help-center/#IntegratingBlueKaiPlatform/DataDelivery/intro_to_sdt.html) (real-time) data 
	* Check for valid Maxymiser Credentials/Auth Token
	* Request new Auth Tokens if expired
	* Call the correct [Maxymiser Customer Data API](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCGD/Overview.html) endpoint and send data as Maxymiser Custom Attributes per visitor

# 3 Logging
Both services can be specified to log requests/results to your own server (providing you can specify an endpoint capable of receiving POST requests with a JSON formatted payload). For example:

```Javascript
{
  status: 'OK',
  message: 'Credentials Set/Updated : Token Available and stored',
  token: 'eyJ0eXAikajshdKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVCVl9Sb3k5ODB2N0hQYjllMUVTQ184dVNGbyJ9.eyJzdWIiOiJ2cHJpb25hQGdtYWlsLmNvbSIsImlhdCI6MTU3NzExNjEyMSwiaXNzIjoiTWF4eW1pc2VyIiwiZXhwIjoxNTc3MTE5NzIxfQ.aJ1UEvQuD0t1DmRxNWdcI37DByHorjaI5ea9h3uC6yUaQvcaJRaOpwZUPXQIqLLHbP5x7pDw6PlL6yro-Eov2nZ80GiaJqSuHrCzk6mQwhtE73PKjdskq8ZdPy_GpHmTVJdqCjQ2iLy_NdeO5sEKEWTQXlVgPrN7waObtjNLstvJbB5ntGIFGdHL4qL0n31i1OHnW_6os_qOWRVWenKfjzp1KLRIp6LVNA9odIiU9mQjWlCsIMaiBEFi_KKbydiv-EoglsiJB_PJWiVxnOj5jDSTMlDmu0uBW2-Uj1YWrExO7uQ9sinOwHKeGdcjeCo1wclKJLL4bn4QQ_3BZvEmMw',
  mmSiteId: 'MDAxNTk3',
  serviceName: 'Auth Service'
}
```

# 4 Architecture

The architecture description is split into the following areas:

[4.1 - Current Architecture](#41-Current-Architecture)

[4.2 - Limitations](#42-Limitations)

[4.3 - Recommended Infrastructure for Production](#43-Recommended-Infrastructure-for-Production)


## 4.1 Current Architecture

![logical_archicture](https://www.evernote.com/shard/s142/sh/ed352628-030d-48b6-9c3f-e34dc3a35f96/9056e6c1d897a037/res/a9efb95c-4e1f-4c4f-b59b-520e945f9cb4/skitch.png)

**Auth Service Flow**

* Firstly, the Maxymiser end-user must open the Auth Service Page ([MYAUTHSERVICE]/auth) and enter in their Maxymiser Credentials (see [6.1 Testing The Auth Service](#61-Testing-the-Auth-Service) for more details).
* The Auth Service will then call Maxymiser to check if they are valid and then store them in Maxymiser if valid (credentials can also be deleted from the Auth Service in the same way)
* These Maxymiser Credentials will then be used by the Visitor Service when the DMP sends data over (which needs to be forwarded on to Maxymiser)

**Visitor Service Flow**

* The DMP needs to be configured to pass data (via an app using DMP Server Data Transfer) through to the Visitor Service so that POST requests can be parsed by the service (and then sent over to the correct Site ID in Maxymiser). Please see [6.2 Testing The Visitor Service](#62-Testing-the-Visitor-Service) for more details).
* The Visitor Service will call the Auth Service to check if there are valid credentials/an active token for that Maxymiser Container (it will grab a new auth token if it has expired)
* It will then forward the DMP data to the appropriate SiteID via the [Maxymiser Customer Data API](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCGD/Overview.html)

**Logging**

Please note that all successes/failures will be appropriately logged your Error Logging Server (see [3 Logging](#3-logging) for details) if you have configured your Docker Containers (via docker-prod.env) to turn on logging.

## 4.2 Limitations

Primary limitations/concerns are:

* **Not set up https** (the service should be updated to run on https)

* There is **no authentication in the service itself** - it stores credentials in the MongoDB as long as they are valid in Maxymiser (it checks). Once credentials are submitted, they cannot be returned via API though so provided the service runs on https - they are secure (the service should probably run its own authentication as well).

* The **MongoDB**: 
	* is **running on the same server** as the Auth Service (so cannot be scaled out - only up). It is running as a container in the Docker Service which is running on the same server (see [docker-compose.yaml](https://github.com/rajtastic/dmp_maxymiser_service/blob/master/dmp_mm_auth_service/docker-compose.yaml))
	* runs **reads and writes on the same container** - it does not run read-replicas or have any durabibilty/disaster recovery
	* Ideally, this should:
		* be run on a separate set of servers
    * these would run in a private subnet (and only the Auth Service could talk to these on port 27017)
		* split reads to read-replicas (and only write to the main DB when needed)
		* Have some form of disaster recovery/fail-over

* **Logging** is currently fired from the Auth Service & Visitor Service containers. They should run in separate *Logging* containers within the Docker Service the Auth Service/Visitor Service Docker Services (this will reduce load on the main Auth/Visitor Services)

## 4.3 Recommended Infrastructure for Production

The below architecture improves on the current architecture as follows:

* **Durability** : It should withstand complete failure in a whole availability zone and fail over to the same infrastructure running in another availability zone.

* **Scalability** : The Docker Containers/Services should scale out automatically in auto-scaling groups of servers leveraging load balancers in front of each service.

* **Security** : The entire service should be https only and appropriate firewalls (Security Groups/Network Access Control Lists etc) should be configured to allow only minimum required access to each service.

* **Stateful Infrastructure should be private** : The database should be run on its own set of servers and be in a private subnet (only accessible by the Auth Service).

* **Read vs Write Database** : The database should be split between read-replicas and write instances to reduce load on the DB for writes (and allow all reading to be made solely from the read-replicas).

* **Backup Database to fail-over infrastructure** : The write DB needs to both replicated to read-replicas in the same availability zone and a completely separate DB in another availability zone for disaster recovery/fail over.

* **Logging Containers** : New 'Logging' containers per service should be set up to allow server logs to be fired off to a server logging service (to reduce load on the primary containers which are performing workflow). 

*Recommended Production Architecture*

![recommended_production_architecture](https://www.evernote.com/shard/s142/sh/d40d2da7-2559-48d5-a4da-8724ca1a7978/f1a3e91d49a20e42/res/df8aa277-be75-467b-88a0-c1ff285c25a1/skitch.png)


# 5 Deployment Instructions

## 5.1 Prerequisites

In order for this to work, you'll need:

1. **Two Servers with Public IPs** to run the docker services on

2. A **Maxymiser App\*** built in production which will accept data via the Maxymiser [Customer Data API](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCGD/Overview.html).

3. (Optional) **Logging Server\*** endpoint to send server logs to (must accept POST requests). For example, you could use AWS API Gateway to send your logs to

> \*If you don't have an app/logging endpoints, don't worry suggestions on how to use dummy ones for testing purposes are provided in the deployment instructions.


## 5.2 Set up two servers with public IPs

> This guide sets up servers using Ubuntu 18.04 images but feel free to use whatever you want

> In production, I assume you'll have a load balancer per service and then run auto-scaling servers behind them to scale the Auth Service/Visitor Service as required

Ensure you open port 80 to allow requests to your servers:

> This guide just opens up port 80 for this POC - you should ensure 443 is open too (assuming you run this on a secure server)

```console
sudo iptables -I INPUT -p tcp -s 0.0.0.0/0 --dport 80 -j ACCEPT
sudo service netfilter-persistent start 
sudo netfilter-persistent save
```


## 5.3 Set up the required services on each server

Firstly, set up two servers and set up the following services on each.

Install Docker:

```console
sudo apt update
sudo apt-get remove docker docker-engine docker.io
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

```
Install Docker-Compose:

```console
sudo curl -L https://github.com/docker/compose/releases/download/1.17.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

```
Install Nano:

```console
sudo apt install nano

```

## 5.4 Install Auth Service
On your Auth Service Server, you can now install the Auth Service.

Download the Docker Container/Service:
```console
sudo docker pull rajtastic/dmp_mm_auth_service

```

Download the docker-compose.yaml file:

```console
sudo curl https://raw.githubusercontent.com/rajtastic/dmp_maxymiser_service/master/dmp_mm_auth_service/docker-compose.yaml --output docker-compose.yaml

```

Create an "env" folder and download the **docker-prod.env** file (you will configure your server using the docker env files here):

```console
sudo mkdir env
cd env
sudo curl https://raw.githubusercontent.com/rajtastic/dmp_maxymiser_service/master/dmp_mm_auth_service/env/docker-prod.env --output docker-prod.env

```

Nano into your file and edit the config:

![docker-prod.env file](https://www.evernote.com/shard/s142/sh/c9f35e7d-0dcb-4b8c-b7bb-dadcb0478f7d/8903d48c9f61743e/res/cc74a2e0-2c22-401f-aa43-ff1dbccc513e/skitch.png)

Change the endpoints as per the screenshot:

> Leave **DB_DOMAIN** as default

> Change **MM_AUTH_ENDPOINT** to your Maxymiser token endpoint (e.g. https://api-auth-env.maxymiser.com/oauth2/v1/tokens) (see [5.6.1 Mock Endpoint for the Auth Service](#561-Mock-Endpoint-for-the-Auth-Service) if you want to fake this).


> Change **LOG_SERVER_STATUS** and **LOG_ENDPOINT** as per above if you have an endpoint to send logging requests to then you can keep an eye on what the server is doing - useful for testing (see [5.6.3 Mock Endpoint for receiving Logging](#563-Mock-Endpoint-for-receiving-Logging) if you want to fake this).

Now, turn the Docker Service to get the Auth Service up and running:

```console
sudo docker-compose up -d
```

Finally, check your server IP/domain to see if the service is up and running. For example:

<Your Server IP/Domain>/health

![Auth Service Health Check](https://www.evernote.com/shard/s142/sh/679dce3a-0500-47e1-87be-f1ece695812b/ab77a26cd9dc69e9/res/feaf30a7-6bdf-4f57-8176-8105dee0b4d9/skitch.png)

## 5.5 Install Visitor Service
Go to your Visitor Service server and begin installing the Visitor Service:

Download the Docker Container/Service:
```console
sudo docker pull rajtastic/dmp_mm_visitor_service

```

Download the docker-compose.yaml file:

```console
sudo curl https://raw.githubusercontent.com/rajtastic/dmp_maxymiser_service/master/dmp_mm_visitor_service/docker-compose.yaml --output docker-compose.yaml

```

Create an "env" folder and download the **docker-prod.env** file (you will configure your server using the docker env files here):

```console
sudo mkdir env
cd env
sudo curl https://raw.githubusercontent.com/rajtastic/dmp_maxymiser_service/master/dmp_mm_visitor_service/env/docker-prod.env --output docker-prod.env

```

Nano into your file and edit the config:

![docker-prod.env](https://www.evernote.com/shard/s142/sh/5103d7f6-76d1-4376-9be3-ae5aa590f481/16aa362087688585/res/67a85fd7-2775-4535-a18e-aff8817adddf/skitch.png)

> Change **AUTH_SERVICE_DOMAIN** to your Auth Service URL, e.g. https://myauth.com>

> Change **MM_VISITOR_API** to your Maxymiser Customer Data API domain, e.g. https://api-data-eu.maxymiser.com (see [5.6.2 Mock Endpoint for the Visitor Service](#562-Mock-Endpoint-for-the-Visitor-Service) if you want to fake this).

> Change **LOG_SERVER_STATUS** and **LOG_ENDPOINT** as per above if you have an endpoint to send logging requests to then you can keep an eye on what the server is doing - useful for testing (see [5.6.3 Mock Endpoint for receiving Logging](#563-Mock-Endpoint-for-receiving-Logging) if you want to fake this).


Now, turn the Docker Service to get the Auth Service up and running:

```console
sudo docker-compose up -d
```

Finally, check your server IP/domain to see if the service is up and running. For example:

<Your Server IP/Domain>/health

![Visitor Service Health Check](https://www.evernote.com/shard/s142/sh/9669b6a0-2bfc-404a-9fb5-163e80cf3f3d/066fc566bbf4c6db/res/2e287414-e7dc-4314-8063-a5aee6021b69/skitch.png)

## 5.6 (optional) Using your own endpoints for testing

If you don't have a Maxymiser app, you can create your own endpoints on [beeceptor.com](https://beeceptor.com/) which you can post data to (and they will return an appropriate response). See below:

### 5.6.1 Mock Endpoint for the Auth Service
Create an endpoint on [beeceptor.com](https://beeceptor.com/) which will return the following response:

```Javascript
{
  "expires_in":3600,
  "token_type":"Bearer",
  "access_token":"FAKE_MM_TOKEN_FROM_BEECEPTOR"
}
```
Enter the following URL as your "MM_AUTH_ENDPOINT" in the *docker-prod.env*:

```console
MM_AUTH_ENDPOINT=https://CHANGETOYOURAUTHENDPOINT.free.beeceptor.com
```

### 5.6.2 Mock Endpoint for the Visitor Service
Create an endpoint on [beeceptor.com](https://beeceptor.com/) which will return the following response:

```Javascript
{
    "customerId":"HARD-CODED_VISITOR_ID_BEECEPTOR",
    "profile":{
        "hardCodedAttributeNameBeeceptor":"hardCodedAttributeValueBeeceptor"        
    }
}
```
Enter the following URL as your "MM_VISITOR_API" in the *docker-prod.env*:

```console
MM_VISITOR_API=https://CHANGETOYOURVISITORENDPOINT.free.beeceptor.com
```

### 5.6.3 Mock Endpoint for receiving Logging
Create any endpoint on [beeceptor.com](https://beeceptor.com/) and set your *LOG_ENDPOINT* to this URL in the *docker-prod.env*:. For example:

```console
LOG_ENDPOINT=https://CHANGETOYOURLOGGINGENDPOINT.free.beeceptor.com
```

# 6 Testing

## 6.1 Testing the Auth Service

> You'll need a set of valid Maxymiser Credentials to for a Maxymiser app to use this (i.e. Username, Password, Site ID, Client ID and client Secret)

Go to your Auth Server IP/domain "auth" endpoint (e.g. www.mydomain.com/auth):

![Auth Service](https://www.evernote.com/shard/s142/sh/b6ba4f83-94d6-4871-b21a-5bc049e7eeea/8d0f399a32a459b7/res/3cfd2e78-11f1-41d0-a825-6e2b4b0363e1/skitch.png)

Enter some valid credentials and check for a successful message:

![Auth Service Success](https://www.evernote.com/shard/s142/sh/0d88eb9b-5e58-4704-a4b9-8739616b8327/121ece244fccaa3d/res/35e916b3-5e6c-4cbe-95cc-04aea4a5f58b/skitch.png)

Optionally, you can check the console or your logging server for issues.

> Console

![Console Log](https://www.evernote.com/shard/s142/sh/1d32512d-fd69-4332-9b3d-0dbae374350d/dd9f5139c984c4d9/res/27dedc62-0d00-4fe6-b8fe-95e571340f61/skitch.png)

> Server Logs

```Javascript
{
  status: 'FAIL',
  message: "Maxymiser Call has failed - see 'error'",
  error: {
    name: 'StatusCodeError',
    statusCode: 400,
    message: '400 - {"error":"invalid_header","error_description":"Failed to validate client secret."}',
    error: {
      error: 'invalid_header',
      error_description: 'Failed to validate client secret.'
    },
    options: {
      method: 'POST',
      uri: 'https://api-auth-eu.maxymiser.com/oauth2/v1/tokens',
      json: true,
      form: [Object],
      headers: [Object],
      simple: true,
      resolveWithFullResponse: false,
      transform2xxOnly: false
    },
    response: {
      statusCode: 400,
      body: [Object],
      headers: [Object],
      request: [Object]
    }
  },
  serviceName: 'Auth Service'
}
```

## 6.2 Testing the Visitor Service

Now, let's simulate the DMP sending data to the service.

> For a real customer, Oracle DMP Services would work with Maxymiser to post DMP data to this endpoint directly via the DMP. For testing, you can just make a POST request in the correct format


> **Warning** This request will fail if you haven’t sent in valid Maxymiser Credentials in the first step


**Endpoint**

{VISITOR SERVICE PUBLIC IP}/receive_data/mm

**Request Type**

POST

**Headers**

```Javascript
{"Content-Type":"application/json"}
```

**Body (sample)**

```Javascript
{
	"DeliveryTime": "Fri Nov 15 14:08:12 UTC 2019",
	"DestinationId": 83111,
	"PixelCount": 1,
	"Pixels": [{
		"BkUuid": "db8cv5g/9xeabX25",
		"IP": "160.34.126.217",
		"CampaignId": "ABC123456",
		"Categories": [{
			"Id": 1099808,
			"Utc": 1573826548
		}],
		"PartnerUuid": "<RANDOM_MAXYMISER_CUSTOMER_ID_HERE>",
		"PixelUrl": "http://tags.bluekai.com/site/83112?mmSiteId=<YOUR_MAXYMISER_SITE_ID>&attributeName=<ATTRIBUTE_NAME>&attributeValue=<ATTRIBUTE_VALUE>",
		"Referrer": "",
		"TagUri": "/site/83110",
		"SiteId": 83110,
		"Timestamp": "Fri Nov 15 14:08:12 UTC 2019",
		"UtcSeconds": 1573826892
	}]
}
```
> Replace **<RANDOM_MAXYMISER_CUSTOMER_ID_HERE>** with anything here, e.g. "12345"

> Replace **<YOUR_MAXYMISER_SITE_ID>** with valid site ID from previous Auth Service test, e.g. "Xyz134"

> Replace **<ATTRIBUTE_NAME>** with a Maxymiser Attribute Name, e.g. "customer_type" - it doesn't matter

> Replace **<ATTRIBUTE_VALUE>** with a Maxymiser Attribute Value, e.g. "vip_customer" - it doesn't matter

When you push data to the DMP > Maxymiser Service endpoint, it will then fire data to the Maxymiser API. For example:

**Endpoint**

https://api-data-eu.maxymiser.com/Xyz134/customer-profiles/12345

**Request Type**

PUT

**Headers**

```Javascript
{
  "content-length": "44",
  "authorization": "Bearer SAMPLE_MAXYMISER_AUTHTOKEN",
  "accept-encoding": "gzip",
  "content-type": "application/json",
  "accept": "application/json"
}
```

**Body**

```Javascript
{
"customer_type":"big_spender"
}
```

**Response**
```Javascript
{
 "customerId": "RANDOM_MAXYMISER_CUSTOMER_ID",
 "profile": {
"customer_type":"big_spender"
 }
}
```
### 6.2.1 Checking the Service for successes/failures

If you have logging set up, you can check these requests and the response from Maxymiser on your Logging Server. For example:

> Failed Call

```Javascript
{
  status: 'FAIL',
  message: "Maxymiser Call has failed - see 'error'",
  error: {
    name: 'StatusCodeError',
    statusCode: 403,
    message: '403 - {"errors":[{"code":"403","message":"programmatic access to customer data disabled"}]}',
    error: { errors: [Array] },
    options: {
      method: 'PUT',
      uri: 'https://api-data-eu.maxymiser.com/api/v1/sites/MDAxNTk3/customer-profiles/RANDOM_MAXYMISER_CUSTOMER_ID',
      json: true,
      body: [Object],
      headers: [Object],
      simple: true,
      resolveWithFullResponse: false,
      transform2xxOnly: false
    },
    response: {
      statusCode: 403,
      body: [Object],
      headers: [Object],
      request: [Object]
    }
  },
  site_id: 'MDAxNTk3',
  token: 'uhkjasdkjasdh.eyJzdWIiOiJ2cHJpb25hQGdtYWlsLmNvbSIsImlhdCI6MTU3NzExMjU0OSwiaXNzIjoiTWF4eW1pc2VyIiwiZXhwIjoxNTc3MTE2MTQ5fQ.XsMKOjYLKLALsDXnfBfgagZ4-_mYQAIvyG44cIici3SDREVOTSWcteL62UJ0do9-54A-f8xZTPzG67U5YCSFS3YdMa4TGBksZGqMhkLGLIKC-3oZB4yAx-vHx1Ba15rck6294Kgvs_8QAAp_moMiXcPgQNy6DS6-mH0wS28uaGuOER9Xo3e9zhtaL2OwNaFKfu3nIaxjTVvrCO94AWUzHYaEcBQmunTGwcOauzLOTmljLq6xU_FXZMghuUWasXlFQNVfjMKgEK8fgaRZDWtiIAFKUjGTfjAmnn3nS8ZiY5xvDeslvrLSUjGed7UAHWjdX_zouXBlv8r5TX3Id7fzfw',
  maxymiser_visitor_id: 'RANDOM_MAXYMISER_CUSTOMER_ID',
  dmp_delivery_id: 'RANDOM_DMP_DELIVERY_ID',
  serviceName: 'Visitor Service'
}
```


