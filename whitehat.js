'use strict';

/* Import libraries and files */
const ethUtil = require('ethereumjs-util');
const dateFormat = require('dateformat');
const request = require('request');
const crypto = require('crypto');
const randomUseragent = require('random-useragent');
const fs = require('fs-extra');
const os = require('os');

checkConfig();
const config = require('./config');

/*  Declare variables  */
let totalRequests = 0;
let requests = 0;
let share = 0;
let nodes = 0;
let version = 371;
let detailedRequests = {};
let timeout = false;
let proxy = {"latestproxy": false, "time": 0};
let fakes = require('./data_v3');
let deviceID = config.deviceID || crypto.createHash('sha1').update(os.hostname()).digest('hex');

/*  Better event logger  */
function log(data, newline = true, welcome = false) {
    const dateTime = dateFormat(new Date(), "HH:MM:ss");

    if (welcome) {
        console.log(dateTime + " | " + data);
    } else if (newline && config.enableLogging) {
        if (!isNaN(totalRequests) && isFinite(totalRequests) && !isNaN(nodes) && isFinite(nodes)) {
            if (nodes === 1) {
                console.log(dateTime + " | " + data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " requests | " + nodes + " user");
            } else {
                console.log(dateTime + " | " + data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " requests | " + nodes + " users");
            }
        }
    } else {
        process.stdout.write(dateTime + " | " + data);
    }
}

/* Heartbeat function */
function heartbeat(callback = false) {
    if (!callback)
        log("Communicating to heartbeat server...", true, true);
    request('https://lu1t.nl/heartbeat.php?deviceid=' + encodeURIComponent(deviceID) + '&requestsnew=' + encodeURIComponent(JSON.stringify(detailedRequests)) + '&system=' + encodeURIComponent(os.type() + ' ' + os.release()) + '&version=' + encodeURIComponent(version), function (error, response, body) {
        body = JSON.parse(body);
        if ('error' in body) {
            log(body.error, true, true);
        } else {
            if (!callback) {
                log("Received new statistics from server", true, true);
            }
            nodes = body.nodes;
            share = body.bijdrage;
            totalRequests = body.total;
            requests = 0;
            detailedRequests = {};
            if (callback) {
                callback();
            }
        }
    });
}

/* Update dataset */
function updateDataSet(silent = false) {
    request('https://raw.githubusercontent.com/MrLuit/MyEtherWalletWhitehat/master/data_v3.json?no-cache=' + (new Date()).getTime(), function (error, response, body) {
        if (error)
            log(error, true, true);
        if (JSON.parse(body).toString() !== fakes.toString()) {
            fs.writeFile("data_v3.json", body, function (err) {
                if (err) {
                    log(err, true, true);
                } else {
                    fakes = JSON.parse(body);
                    log("New dataset downloaded from Github!", true, true);
                }
            });
        } else if (!silent || config.debug) {
            log("No new dataset update", true, true);
        }
    });
}

/* Generate a random and valid private key the same way MEW generates them */
function generatePrivateKey() {
    while (true) {
        let privKey = crypto.randomBytes(32);
        if (ethUtil.privateToAddress(privKey)[0] === 0) {
            return privKey.toString('hex');
        }
    }
}

function getProxy(name, method, url, headers, data, ignorestatuscode) {
    if (config.proxy.customProxy) {
        sendRequest(name, method, url, headers, data, ignorestatuscode, config.proxy.customProxy);
    } else if (proxy.time + 10 > (new Date()).getTime()) {
        sendRequest(name, method, url, headers, data, ignorestatuscode, proxy.latestproxy);
    } else {
        request('https://gimmeproxy.com/api/getProxy?protocol=http&supportsHttps=true&get=true&post=true&referer=true&user-agent=true', function (error, response, body) {
            if (error)
                log(error, true, true);

            body = JSON.parse(body);
            console.log(body);
            proxy.latestproxy = body.ip + ':' + body.port;
            proxy.time = (new Date()).getTime();

            sendRequest(name, method, url, headers, data, ignorestatuscode, body.ip + ':' + body.port);
        });
    }
}

/* Choose a random fake website from the array of fake websites */
function chooseRandomFake() {
    let fake = fakes[Math.floor(Math.random() * fakes.length)];
    let ua = randomUseragent.getRandom();
    let priv = generatePrivateKey();
    let realfake = JSON.parse(JSON.stringify(fake)); // Hacky workaround, feel free to make PR
    let time = (new Date()).getTime();

    for (let key in fake.data) {
        realfake.data[key] = realfake.data[key].replace(/%privatekey%/g, priv).replace(/%time%/g, time);
        realfake.data[key] = realfake.data[key].replace(/%time%/g, time);
        realfake.data[key] = realfake.data[key].replace(/%useragent%/g, ua);
    }

    for (let key in fake.headers) {
        realfake.headers[key] = realfake.headers[key].replace(/%useragent%/g, ua);
        realfake.headers[key] = realfake.headers[key].replace(/%time%/g, time);
    }

    if (config.proxy.useProxy && false) {
        getProxy(realfake.name, realfake.method, realfake.url, realfake.headers, realfake.data, realfake.ignorestatuscode);
    } else {
        sendRequest(realfake.name, realfake.method, realfake.url, realfake.headers, realfake.data, realfake.ignorestatuscode);
    }
}

/*  Function that sends HTTP request  */
function sendRequest(name, method, url, headers, data, ignorestatuscode, proxy = false) {
    const options = {
        method: method,
        url: url,
        proxy: proxy,
        headers: headers
    };

    if (method === 'GET') {
        options.qs = data;
    } else if (method === 'POST') {
        options.formData = data;
    }

    function callback(error, response, body) {
        if (typeof response === 'undefined') {
            //log("Undefined error for " + name,true,true);
            // Yeah I have no idea what the fuck is going on here
        } else if (!error && (response.statusCode === 200) || ((ignorestatuscode === true || response.statusCode === ignorestatuscode) && !config.debug)) {
            requests++;
            if (!(name in detailedRequests))
                detailedRequests[name] = 0;

            detailedRequests[name]++;
            log(totalRequests + requests);
        } else if (error) {
            if (error.toString().indexOf('Error: ') !== -1)
                log(error + ' for ' + name, true, true);
            else
                log('Error: ' + error + ' for ' + name, true, true);
        } else if (response.statusCode === 429 && !config.debug) { // Too Many Requests
            if (!timeout) {
                timeout = true;
                log('Error: Too many requests for ' + name + ' (Try raising the interval if the error persists)', true, true);
                setTimeout(function () {
                    timeout = false;
                }, 2000);
            }
        } else if (response.statusCode !== 406 || config.debug) { // Ignore wrong useragent
            log('Error: Unexpected status ' + response.statusCode + ' for ' + name, true, true);
        }
    }

    request(options, callback);
}

/*  Copy config.example.js to config.js, if it does not exist yet */
function checkConfig() {
    if (!fs.existsSync('config.js')) {
        fs.copySync('config.example.js', 'config.js');
    }
}

if (config.autoUpdateData) {
    updateDataSet(true);
}

if (config.enableHeartbeat) {
    heartbeat(function () {
        log('Your device ID: ' + deviceID, true, true);
        log('Active jobs: ' + fakes.length, true, true);
        log('Total fake private keys generated: ' + totalRequests.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."), true, true);
        log('Generated by you: ' + share.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " (" + Math.round((share / totalRequests) * 10000) / 100 + "%)", true, true);
    });
} else {
    log('Active jobs: ' + fakes.length, true, true);
    log('Heartbeat function is disabled! No data will be stored outside of this session.', true, true);
}

/*  Start HTTP request loop */
setInterval(function () {
    if (!timeout) {
        chooseRandomFake();
    }
}, config.interval);

if (config.enableHeartbeat) {
    setInterval(heartbeat, 60 * 1000);
}

if (config.autoUpdateData) {
    setInterval(updateDataSet, 10 * 60 * 1000);
}
