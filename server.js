var port = 8080;

var express = require("express");
var favicon = require('serve-favicon')
var path = require('path')
var app = express();
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
var clientId = process.env.CLIENT_ID
var clientSecret = process.env.CLIENT_SECRET
var region = "us"
var token = null;
var axios = require("axios")

if (process.env.API_REGION != null) {
    region = process.env.API_REGION
}

var tokenURL = "https://" + region + ".battle.net/oauth/token"

if (clientId == null) {
    console.log("Error: CLIENT_ID not set")
    return
}

if (clientSecret == null) {
    console.log("Error: CLIENT_SECRET not set")
    return
}

app.get("/*", function (req, res) {

    getToken()
        .then((token) => {

            if (token == null) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: "Unable to get Token. Check logs for details." }))
            } else {
                var url = req.url.substr(1)
                console.log("Request", url)

                var opts = {
                    url: url,
                    headers: {
                        'Authorization': 'Bearer ' + token.access_token
                    }
                }

                axios(opts)
                    .then((resp) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(resp.data))
                    })
                    .catch((error) => {
                        res.setHeader('Content-Type', 'application/json');

                        if (error.response != null) {
                            console.log("Error", error.response)
                            res.send(JSON.stringify({ status: error.response.status, statusText: error.response.statusText, headers: error.response.headers, data: error.response.data }))
                        } else {
                            console.log("Error", error)
                            res.send(JSON.stringify({ error: "Exception on server. Check logs for details." }))
                        }
                    })
            }
        })
        .catch((error) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ error: "Exception on server. Check logs for details." }))
        })
})

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

app.listen(port, () => console.log("Listining on port " + port))