# Table of Contents

[1 Introduction](#1-introduction)

[2 Repo Contents Description](#2-repo-contents-description)

[3 Logging](#3-logging)

[4 Limitations/Concerns](#4-Limitations-/-Concerns)

[5 Deployment Instructions](#5-Deployment-Instructions)

# 1 Introduction 

This repo contains two Docker Images and required config files for the Oracle DMP > Maxymiser Service Proof-Of-Concept. This is a service designed to receive data from the Oracle DMP (via real-time [Server Data Transfer](https://docs.oracle.com/en/cloud/saas/data-cloud/data-cloud-help-center/#IntegratingBlueKaiPlatform/DataDelivery/intro_to_sdt.html)) and forward it to the Maxymiser [Customer Data API](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCGD/Overview.html) as end-user controlled Custom Attributes.

Optimising returning visitors' landing pages are a key opportunity for conversion. This means the existing client-side DMP > Maxymiser integration is sub-optimal because it will either slow loading time for the first page view or delay optimisation for subsequent page views.

As this integration would be server-side, as long as there is a match key between the DMP & Maxymiser (i.e. returning visitors only), by the time a user returns to the website Maxymiser will already have received the DMP data (making the landing page ready for optimsation).

[Introduction](#repo-contents-description)
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
	* Call the correct Maxymiser Customer Data API](https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCGD/Overview.html) endpoint and send data as Maxymiser Custom Attributes per visitor

# 3 Logging
Both services can be specified to log requests/results to your own server (providing you can specify an endpoint capable of receiving POST requests with a JSON formatted payload). For example:

```Javascript
{
  status: 'OK',
  message: 'Credentials Set/Updated : Token Available and stored',
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVCVl9Sb3k5ODB2N0hQYjllMUVTQ184dVNGbyJ9.eyJzdWIiOiJ2cHJpb25hQGdtYWlsLmNvbSIsImlhdCI6MTU3NzExNjEyMSwiaXNzIjoiTWF4eW1pc2VyIiwiZXhwIjoxNTc3MTE5NzIxfQ.aJ1UEvQuD0t1DmRxNWdcI37DByHorjaI5ea9h3uC6yUaQvcaJRaOpwZUPXQIqLLHbP5x7pDw6PlL6yro-Eov2nZ80GiaJqSuHrCzk6mQwhtE73PKjdskq8ZdPy_GpHmTVJdqCjQ2iLy_NdeO5sEKEWTQXlVgPrN7waObtjNLstvJbB5ntGIFGdHL4qL0n31i1OHnW_6os_qOWRVWenKfjzp1KLRIp6LVNA9odIiU9mQjWlCsIMaiBEFi_KKbydiv-EoglsiJB_PJWiVxnOj5jDSTMlDmu0uBW2-Uj1YWrExO7uQ9sinOwHKeGdcjeCo1wclKJLL4bn4QQ_3BZvEmMw',
  mmSiteId: 'MDAxNTk3',
  serviceName: 'Auth Service'
}
```

# 4 Limitations / Concerns
Primary limitations/concerns are:

* **Not set up https** (the service should be updated to run on https)
* There is **no authentication in the service itself** - it stores credentials in the MongoDB as long as they are valid in Maxymiser (it checks). Once credentials are submitted, they cannot be returned via API though so provided the service runs on https - they are secure (the service should probably run its own authentication as well).
* The **MongoDB**: 
	* is **running on the same server** as the Auth Service (so cannot be scaled out - only up). 
	* runs **reads and writes on the same container** - it does not run read-replicas or have any durabibilty/disaster recovery
	* Ideally, this should:
		* be run on a separate set of servers
		* split reads to read-replicas (and only write to the main DB when needed)
		* Have some form of disaster recovery/fail-over

# 5 Deployment Instructions

You'll need to deploy the Auth Service and then the Visitor Service (because the Visitor Service needs the IP/domain of the Auth Service).

## 5.1 Set up Two Servers with the required services on each one

> This guide assumes you are deploying to Ubuntu 18.04 servers and you have opened up all the required ports (i.e. ports 80, 443 and 27017).

Firstly, set up two servers and set up the following services on each:

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

## 5.2 Install Auth Service
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

> Leave "DB_DOMAIN" as default

> Change "LOG_SERVER_STATUS" and "LOG_ENDPOINT" as per above if you have an endpoint to send logging requests to then you can keep an eye on what the server is doing - useful for testing

Now, turn the Docker Service to get the Auth Service up and running:

```console
sudo docker-compose up -d
```

Finally, check your server IP/domain to see if the service is up and running. For example:

<Your Server IP/Domain>/health

![Auth Service Health Check](https://www.evernote.com/shard/s142/sh/679dce3a-0500-47e1-87be-f1ece695812b/ab77a26cd9dc69e9/res/feaf30a7-6bdf-4f57-8176-8105dee0b4d9/skitch.png)

## 5.3 Install Visitor Service

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

Change the endpoints as per the screenshot above.

Now, turn the Docker Service to get the Auth Service up and running:

```console
sudo docker-compose up -d
```

Finally, check your server IP/domain to see if the service is up and running. For example:

<Your Server IP/Domain>/health

![Visitor Service Health Check](https://www.evernote.com/shard/s142/sh/9669b6a0-2bfc-404a-9fb5-163e80cf3f3d/066fc566bbf4c6db/res/2e287414-e7dc-4314-8063-a5aee6021b69/skitch.png)
