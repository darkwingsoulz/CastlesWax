# Castles on Wax
Scripts for the Castles game on wax

## Prerequisites

NODE required
https://nodejs.org/en/download/

WAX account with private key
Wax accounts can be created here
https://wax.bloks.io/

Wax Cloud accounts are not supported since you do not own your keys
This script is intended to be run via command line not through a browser

## Objectives

- Recharge Barons, Castles, Lumberjacks, Carpenters
- Mint for Barons, Castles, Lumberjacks, Carpenters
- Auto claim land from fine wood
- Auto claim MSOURCE
 
## Configuration
```bash
#.ENV file example

#wax address should be in all lowercase
WAX_ADDRESS=mywaxaddress

#private key should look something like this
#PVT_K1_XXXXXXXXXXXX
WAX_PRIVATE_KEY=INSERT_WAX_PRIVATE_KEY_HERE

CONFIG_ENABLE_RECHARGE_CASTLE = true
CONFIG_ENABLE_RECHARGE_ROYALBARON = true
CONFIG_ENABLE_RECHARGE_LUMBERJACK = false
CONFIG_ENABLE_RECHARGE_CARPENTER = false
CONFIG_ENABLE_LAND_AUTO_CRAFT = false

```

## Running The Script

```bash
# clone the repo
$ git clone https://github.com/darkwingsoulz/CastlesWax.git
$ cd CastlesWax

# install dependencies
$ npm install

# run script
node autoplay.js

```