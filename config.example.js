// View your statistics on https://lu1t.nl

module.exports = {
	"deviceID": null,					// When set to null, an anonymous device id will be asigned.	
	"enableLogging": true,				// When set to true, all events will be logged. When sent to false, only special events will be logged.
	"debug": false,						// Enable debug options (extra reporting)
	"interval": 1000,					// The amount of delay between each request in ms (milliseconds).			
	"enableHeartbeat": true,		// Please enable heartbeat to share and receive anonymous statistics about the amount of requests being made.
	"autoUpdateData": true,			// Please enable to make sure you always get the latest dataset.
	"proxy": {
		"useProxy": false,			// Enable proxy support (NOT READY YET BUT YOU CAN USE CUSTOM PROXY)
		"customProxy": null			// When set to null, a random proxy will be used every 10 seconds
	}
};
