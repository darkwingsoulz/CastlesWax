## Donations
If you find this script helpful, donations are appreciated

WAX Address: https://wax.bloks.io/account/darkwingsoul

## Castles on Wax
Scripts to automate gameplay for Castles on wax blockchain

Link to game: https://castlesnft.io/

## Prerequisites

NODE required
https://nodejs.org/en/download/

Wax account with private key

Wax accounts can be created here: https://wax.bloks.io/

Wax Cloud accounts are not supported since you do not own your keys

This script is intended to be run via command line and not through a browser

## Objectives

- Recharge Barons, Castles, Lumberjacks, Carpenters, Miners
- Mint for Barons, Castles, Lumberjacks, Carpenters, Miners
- Auto claim land from fine wood
- Auto claim MSOURCE
- Runs in indefinite loop until you quit the program
- Merge up all available land types (farms, ranches, villages, towns, cities)
 
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

#Timers for assets are on 24 hour cycles
#but the loop should be run at least a couple times per day for assets
#that are staggered over different times
CONFIG_LOOP_TIME_IN_MINUTES = 5

#land merge fees
CONFIG_LAND_MERGE_MSOURCE_BASE_FEE = 2160
CONFIG_LAND_FARM_FEE_MULTIPLIER = 1
CONFIG_LAND_RANCH_FEE_MULTIPLIER = 3
CONFIG_LAND_VILLAGE_FEE_MULTIPLIER = 9
CONFIG_LAND_TOWN_FEE_MULTIPLIER = 27
CONFIG_LAND_CITY_FEE_MULTIPLIER = 243

#recharge fees
CONFIG_RECHARGE_BARON_ROYAL_SEAL_FEE = 1
CONFIG_RECHARGE_CASTLE_ROYAL_SEAL_FEE = 1
CONFIG_RECHARGE_CARPENTER_LUMBER_FEE = 6
CONFIG_RECHARGE_CARPENTER_ROYAL_SEAL_FEE = 1
CONFIG_RECHARGE_LUMBERJACK_ROYAL_SEAL_FEE = 4
CONFIG_RECHARGE_LUMBERJACK_MSOURCE_FEE = 400000
CONFIG_RECHARGE_MINER_LUMBER_FEE = 6
CONFIG_RECHARGE_MINER_ROYAL_SEAL_FEE = 1

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