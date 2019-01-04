var port = process.env.PORT || 8080;

var http = require('http');

var clientId = process.env.CLIENT_ID
var clientSecret = process.env.CLIENT_SECRET
var region = process.env.API_REGION || "us"
var token = null;
var axios = require("axios")
var tokenURL = "https://" + region + ".battle.net/oauth/token"

var white_list = [
    "https://us.api.blizzard.com/",
    "https://tw.api.blizzard.com/",
    "https://kr.api.blizzard.com/",
    "https://gateway.battlenet.com.cn/",
    "https://eu.api.blizzard.com/"
]

var noauth_white_list = [
    "http://auction-api-us.worldofwarcraft.com/",
    "http://auction-api-eu.worldofwarcraft.com/",
    "http://auction-api-tw.worldofwarcraft.com/",
    "http://auction-api-kr.worldofwarcraft.com/"
]

if (clientId == null) {
    console.log("Error: CLIENT_ID not set")
    return
}

if (clientSecret == null) {
    console.log("Error: CLIENT_SECRET not set")
    return
}

function validURL(u) {

    if (u != null) {
        for (var i = 0; i < white_list.length; ++i) {
            if (u.toLowerCase().startsWith(white_list[i])) {
                return true
            }
        }

        return isNoAuth(u)
    }

    return false
}

function isNoAuth(u) {

    if (u != null) {
        for (var i = 0; i < noauth_white_list.length; ++i) {
            if (u.toLowerCase().startsWith(noauth_white_list[i])) {
                return true
            }
        }
    }

    return false
}

http.createServer(function (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Request-Method', '*');
	response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');
    
    if (request.method == 'OPTIONS') {
        response.writeHead(200);
		response.end();
		return;
    }

    var url = request.url.substr(1)
    console.log("Request", url)

    if (url === 'favicon.ico') {
        response.writeHead(200, {'Content-Type': 'image/x-icon'} );
        response.end();
        return;
    }

    if (!validURL(url)) {
        console.log("Invalid URL", url)
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify({ error: "Invalid Proxy URL." }))
        response.end()
    } else {
        getToken()
            .then((token) => {

                if (token == null) {
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.write(JSON.stringify({ error: "Unable to get Token. Check logs for details." }))
                    response.end()
                } else {

                    var opts = {
                        url: url
                    }

                    if (!isNoAuth(url))  {
                        opts["headers"] = {
                            'Authorization': 'Bearer ' + token.access_token
                        }
                    }

                    axios(opts)
                        .then((resp) => {
                            response.writeHead(200, { 'Content-Type': 'application/json' });
                            response.write(JSON.stringify(resp.data))
                            response.end()
                        })
                        .catch((error) => {

                            if (error.response != null) {
                                console.log("Error", error.response)
                                response.writeHead(error.response.status, { 'Content-Type': 'application/json' });
                                response.write(JSON.stringify(error.response.data))
                                response.end()
                            } else {
                                console.log("Error", error)
                                response.writeHead(500, { 'Content-Type': 'application/json' });
                                response.write(JSON.stringify({ error: "Exception on server. Check logs for details." }))
                                response.end()
                            }
                        })
                }
            }
            )
            .catch((error) => {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify({ error: "Exception on server. Check logs for details." }))
                response.end()
            })
    }
}).listen(port);

console.log("Server listening on port " + port);

function getToken() {

    return new Promise((resolve, reject) => {
        if ((token == null) || (token.expires <= new Date().getTime())) {

            var data = "grant_type=client_credentials"

            var opts = {
                url: tokenURL,
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: data,
                auth: {
                    username: clientId,
                    password: clientSecret
                }
            }

            axios(opts)
                .then((res) => {

                    if ((res != null) && (res.data != null) && (res.data.access_token != null) && (res.data.expires_in != null) && (res.data.token_type == "bearer")) {
                        token = res.data
                        token.expires = new Date().getTime() + ((token.expires_in - 3600) * 1000)
                    } else {
                        console.log("Unable to get token", res);
                        token = null;
                    }
                    resolve(token)
                })
                .catch((error) => {
                    console.log("Axios Error", error)
                    reject(error)
                })
        } else {
            resolve(token)
        }
    })
}

