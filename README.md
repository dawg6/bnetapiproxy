# Battle.net API Proxy

> Simple NodeJS App to proxy API requests to battle.net API. 

Environment variables CLIENT_ID and CLIENT_SECRET 
are used to request an access token. You can also set the environment variable API_REGION to use a different region (default is "us") for the token request.

Application can be run as standalone NodeJS application, or built as a Docker image.

## Build

### Build as standalone NodeJS application

```
npm install
```

### Build Docker Image

```
docker build . -t bnetapiproxy
```

## Running 

Set the following environment variables:

* CLIENT_ID - (required) set to battle.net API client Id 
* CLIENT_SECRET - (required) set to battle.net API secret 
* API_REGION - (optional) set to battle.net API region (e.g. "us" or "eu"; default is "us")
* PORT - (optional) set to port to listen on (default is 8080)

### Run as stand alone NodeJS application

```
CLIENT_ID=my-client-id -e CLIENT_SECRET=my-client-secret npm start
```

### Run Docker Image

```
docker run -e CLIENT_ID=my-client-id -e CLIENT_SECRET=my-client-secret -p 8080:8080 bnetapiproxy
```

## Using the Proxy

To access any of the battle.net APIs, prefix the Battel.Net API URL with "http://localhost:8080/"

e.g.,

http://localhost:8080/https://us.api.blizzard.com/wow/realm/status?locale=en_US
