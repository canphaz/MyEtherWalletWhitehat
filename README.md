# MyEtherWallet Whitehat

*Spam fake MyEtherWallet sites with random private keys to prevent them from finding real ones*

## Usage

**This is not a DDOS tool! Connect to a VPN or proxy and use at your own risk.**

If you haven't already, click [here](https://nodejs.org/en/download/) to download Node.JS

- Download the latest release from [here](https://github.com/MrLuit/MyEtherWalletWhitehat/archive/master.zip).
- You can change any setting in config.json before continuing to the next step
- Go ahead and open a command line in the release folder
- Install all necessary packages by running ```npm install```
- When all packages are installed, enter ```npm start```
 
The script will now tell you some statistics and start after 5 seconds.

## Configuration

The config is stored in ```config.json```. It contains the following properties:
- **config.interval**: The interval in milliseconds. Please don't set it lower than 1000. Our purpose isn't to DDOS the scammers! 1 request/second is enough.
- **config.enableHeartbeat**: When enabled, every 60 seconds an **anonymous** request to my server will be made containing the amount of requests and the server will return some statistics about you.
- **config.autoUpdateData**: Automatically update the dataset from Github every 10 minutes + on start. It is very important you enable this to make sure you will always be targeting the right scammers.

## Dataset

All the malicious websites are stored in the ```data.json```. If you want to propose changes go ahead and [create a PR](https://github.com/MrLuit/MyEtherWalletWhitehat/compare).

## Statistics

Click [here](https://lu1t.nl/) to view all the statistics.

## Donations

A donation to secure the anti-scammers network and speed up development can go to [0x1337c87265286195752257bf09cc4689d5cdb826](https://etherscan.io/address/0x1337c87265286195752257bf09cc4689d5cdb826) :sparkles: