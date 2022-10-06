const fetch = require("node-fetch")
const { Api, JsonRpc, RpcError } = require("eosjs")
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig") // development only
const { TextEncoder, TextDecoder } = require("util")

require("dotenv").config()

const CONFIG_ENABLE_RECHARGE_LUMBERJACK = process.env.CONFIG_ENABLE_RECHARGE_LUMBERJACK.toLowerCase() == "true"
const CONFIG_ENABLE_RECHARGE_CARPENTER = process.env.CONFIG_ENABLE_RECHARGE_CARPENTER.toLowerCase() == "true"
const CONFIG_ENABLE_RECHARGE_CASTLE = process.env.CONFIG_ENABLE_RECHARGE_CASTLE.toLowerCase() == "true"
const CONFIG_ENABLE_RECHARGE_ROYALBARON = process.env.CONFIG_ENABLE_RECHARGE_ROYALBARON.toLowerCase() == "true"
const CONFIG_ENABLE_RECHARGE_MINER = process.env.CONFIG_ENABLE_RECHARGE_MINER.toLowerCase() == "true"
const CONFIG_ENABLE_LAND_AUTO_CRAFT = process.env.CONFIG_ENABLE_LAND_AUTO_CRAFT.toLowerCase() == "true"
const CONFIG_WAX_PRIVATE_KEY = process.env.WAX_PRIVATE_KEY
const CONFIG_WAX_ADDRESS = process.env.WAX_ADDRESS.toLowerCase()
const CONFIG_LOOP_TIME_IN_MINUTES = process.env.CONFIG_LOOP_TIME_IN_MINUTES || 6
const CONFIG_LAND_MERGE_MSOURCE_BASE_FEE = process.env.CONFIG_LAND_MERGE_MSOURCE_BASE_FEE
const CONFIG_RECHARGE_BARON_ROYAL_SEAL_FEE = process.env.CONFIG_RECHARGE_BARON_ROYAL_SEAL_FEE
const CONFIG_RECHARGE_CASTLE_ROYAL_SEAL_FEE = process.env.CONFIG_RECHARGE_CASTLE_ROYAL_SEAL_FEE
const CONFIG_RECHARGE_CARPENTER_LUMBER_FEE = process.env.CONFIG_RECHARGE_CARPENTER_LUMBER_FEE
const CONFIG_RECHARGE_CARPENTER_ROYAL_SEAL_FEE = process.env.CONFIG_RECHARGE_CARPENTER_ROYAL_SEAL_FEE
const CONFIG_RECHARGE_LUMBERJACK_ROYAL_SEAL_FEE = process.env.CONFIG_RECHARGE_LUMBERJACK_ROYAL_SEAL_FEE
const CONFIG_RECHARGE_LUMBERJACK_MSOURCE_FEE = process.env.CONFIG_RECHARGE_LUMBERJACK_MSOURCE_FEE
const CONFIG_RECHARGE_MINER_LUMBER_FEE = process.env.CONFIG_RECHARGE_MINER_LUMBER_FEE
const CONFIG_RECHARGE_MINER_ROYAL_SEAL_FEE = process.env.CONFIG_RECHARGE_MINER_ROYAL_SEAL_FEE
const CONFIG_LAND_FARM_FEE_MULTIPLIER = process.env.CONFIG_LAND_FARM_FEE_MULTIPLIER
const CONFIG_LAND_RANCH_FEE_MULTIPLIER = process.env.CONFIG_LAND_RANCH_FEE_MULTIPLIER
const CONFIG_LAND_VILLAGE_FEE_MULTIPLIER = process.env.CONFIG_LAND_VILLAGE_FEE_MULTIPLIER
const CONFIG_LAND_TOWN_FEE_MULTIPLIER = process.env.CONFIG_LAND_TOWN_FEE_MULTIPLIER
const CONFIG_LAND_CITY_FEE_MULTIPLIER = process.env.CONFIG_LAND_CITY_FEE_MULTIPLIER
const CONFIG_FREE_BANQUET_CLAIM_FEE = process.env.CONFIG_FREE_BANQUET_CLAIM_FEE
const CONFIG_EXPLORERS_PACK_FINE_WOOD_FEE = process.env.CONFIG_EXPLORERS_PACK_FINE_WOOD_FEE
const CONFIG_SEAFARERS_PACK_FINE_WOOD_FEE = process.env.CONFIG_SEAFARERS_PACK_FINE_WOOD_FEE
const CONFIG_SEAFARERS_PACK_SEAFARER_MAP_FEE = process.env.CONFIG_SEAFARERS_PACK_SEAFARER_MAP_FEE
const CONFIG_USE_ATOMIC_ASSETS_BACKUP_URL = process.env.CONFIG_USE_ATOMIC_ASSETS_BACKUP_URL.toLowerCase() == "true"

const rpc = new JsonRpc("https://wax.greymass.com", { fetch })
const signatureProvider = new JsSignatureProvider([CONFIG_WAX_PRIVATE_KEY])
const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
})
const tapos = {
    blocksBehind: 3,
    expireSeconds: 30,
}
const delay = (time) => new Promise((res) => setTimeout(res, time))

const COLLECTION_NAME = "castlesnftgo"

//templates
const TEMPLATE_LAND_FARM = 411716
const TEMPLATE_LAND_RANCH = 411717
const TEMPLATE_LAND_VILLAGE = 411718
const TEMPLATE_LAND_TOWN = 411719
const TEMPLATE_LAND_CITY = 411720
const TEMPLATE_LAND_CASTLE = 436421

const TEMPLATE_ROYALBARON = 391837

const TEMPLATE_CRAFTER_LUMBERJACK = 456608
const TEMPLATE_CRAFTER_CARPENTER = 481431
const TEMPLATE_CRAFTER_MINER = 552311

const TEMPLATE_MAT_ROYAL_SEAL = 411437

//packs
const TEMPLATE_EXPLORERS_PACK = 527506
const TEMPLATE_SEAFARERS_PACK = 527513

//maps
const TEMPLATE_MAT_SEAFARER_MAP_FRAGMENT = 527097
const TEMPLATE_MAT_SEAFARER_MAP = 527102

const RECIPE_LUMBER = 1
const RECIPE_FINE_WOOD = 2
const RECIPE_BARON = 1
const RECIPE_CASTLE = 1
const RECIPE_METAL = 3

//global timer constraint to determine eligible mints
//we add an hour to accommodate edge cases of time sync
const MINT_TIMER = 24

const TOKEN_FINEWOOD = "CFWTEMP"
const TOKEN_LUMBER = "CLUMBER"
const TOKEN_MSOURCE = "MSOURCE"
const TOKEN_METAL = "CMFTEMP"

const LAND_FARM_NAME = "farms1"
const LAND_RANCH_NAME = "ranches1"
const LAND_VILLAGE_NAME = "villages1"
const LAND_TOWN_NAME = "towns1"
const LAND_CITY_NAME = "cities1"

const ACCOUNT_MSOURCETOKEN = "msourcetoken"
const ACCOUNT_MSOURCESTAKE = "msourcestake"
const ACCOUNT_MSOURCEKINGS = "msourcekings"
const ACCOUNT_MSOURCEGOODS = "msourcegoods"
const ACCOUNT_MSOURCEGUILD = "msourceguild"
const ACCOUNT_MSOURCEBARON = "msourcebaron"
const ACCOUNT_MSOURCEMERGE = "msourcemerge"
const ACCOUNT_MSOURCEROYAL = "msourceroyal"

const MINT_MAX = 10
const BILLING_ERROR_WAIT = 60000

//needed to give enough time for blockchain transactions to be confirmed
const TXN_WAIT_TIME_MS = 20000

const ATOMIC_ASSETS_URL = CONFIG_USE_ATOMIC_ASSETS_BACKUP_URL
    ? "https://wax.eosusa.io/atomicassets/v1/assets"
    : "https://wax.api.atomicassets.io/atomicassets/v1/assets"

async function main() {
    let msourceClaimCheck = 0

    // constantly runs the program on a configurable timed loop
    while (true) {
        try {
            console.log("Retrieving wax balance")
            let waxBalance = await getWaxBalance()

            console.log("F2P calls")
            if (waxBalance > Number(CONFIG_FREE_BANQUET_CLAIM_FEE)) {
                await contract_free2playBanquetClaim()
            }
            await contract_free2playPowerClaim()

            if (msourceClaimCheck == 0) {
                //claiming MSOURCE
                console.log("Claiming MSOURCE...")
                await contract_claimMSource()
            }
            msourceClaimCheck++

            if (msourceClaimCheck > 50) msourceClaimCheck = 0

            console.log("Recharging assets...")
            let rechargeCount = await rechargeAssets()

            if (rechargeCount > 0) {
                console.log("Waiting on blockchain transaction confirmations")
                await delay(TXN_WAIT_TIME_MS)
            }

            console.log("Minting assets...")
            let didMint = await mintAssets()
            if (didMint) {
                console.log("Waiting on blockchain transaction confirmations")
                await delay(TXN_WAIT_TIME_MS)
            }

            console.log("Recharging assets again...")
            //check for assets needing a recharge after mint
            rechargeCount = await rechargeAssets()
            if (rechargeCount > 0) {
                console.log("Waiting on blockchain transaction confirmations")
                await delay(TXN_WAIT_TIME_MS)
            }

            console.log("Merging lands...")
            await mergeLands()

            console.log("Crafting maps...")
            let mapsCreated = await craftMaps()
            if (mapsCreated) {
                console.log("Waiting on blockchain transaction confirmations")
                await delay(TXN_WAIT_TIME_MS)
            }

            if (CONFIG_ENABLE_LAND_AUTO_CRAFT) {
                console.log("Processing land pack crafting...")
                await craftLandPacks()
            }

            console.log("Claiming packs...")
            if (await claimAllPacks()) {
                console.log("Waiting on blockchain transaction confirmations")
                await delay(TXN_WAIT_TIME_MS)
            }

            console.log("Unboxing packs...")
            //unboxing packs
            await unboxLandPacks()

            console.log("Revealing packs...")
            //reveal packs
            await revealLandPacks()
        } catch (err) {
            console.log(`Main Loop: Error - ${err}`)
            await handleError(err)
        }

        console.log(`Waiting ${CONFIG_LOOP_TIME_IN_MINUTES} minute(s) before next cycle.`)
        await delay(Number(CONFIG_LOOP_TIME_IN_MINUTES) * 60 * 1000)
        console.log(`Resuming cycle.`)
    }
}

async function revealLandPacks() {
    try {
        let getReveals = await rpc.get_table_rows({
            json: true,
            code: "atomicpacksx",
            scope: "atomicpacksx",
            reverse: false,
            show_payer: false,
            lower_bound: CONFIG_WAX_ADDRESS,
            upper_bound: CONFIG_WAX_ADDRESS,
            limit: 200,
            table: "unboxpacks",
            index_position: 2,
            key_type: "name",
        })
        for (let i = 0; i < getReveals.rows.length; i++) {
            let packId = getReveals.rows[i].pack_id
            let rollIds = []

            if (Number(packId) == 7636) rollIds = [2, 3, 4]
            else rollIds = [0, 1]

            let reveal = await contract_revealLandPack(getReveals.rows[i].pack_asset_id, rollIds)
            if (!reveal) {
                console.log("Error occurred revealing land pack, will try again later.")
                break
            }
        }
    } catch (err) {
        console.log(`revealLandPacks: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function unboxLandPacks() {
    console.log("Unboxing available explorer packs...")

    let explorerPacks = await getNftsByTemplate(TEMPLATE_EXPLORERS_PACK)

    for (let i = 0; i < explorerPacks.length; i++) {
        await contract_unboxLandPack(explorerPacks[i])
    }

    console.log("Unboxing available seafarer packs...")

    let seafarerPacks = await getNftsByTemplate(TEMPLATE_SEAFARERS_PACK)

    for (let i = 0; i < seafarerPacks.length; i++) {
        await contract_unboxLandPack(seafarerPacks[i])
    }
}

async function claimAllPacks() {
    try {
        let getPacks = await rpc.get_table_rows({
            json: true,
            code: "msourceguild",
            scope: CONFIG_WAX_ADDRESS,
            reverse: false,
            show_payer: false,
            limit: 1000,
            table: "crafts",
            index_position: 1,
        })

        for (let i = 0; i < getPacks.rows.length; i++) {
            let row = await getPacks.rows[i]

            if (row.pack_to_craft.template_id == TEMPLATE_EXPLORERS_PACK || row.pack_to_craft.template_id == TEMPLATE_SEAFARERS_PACK) {
                let formatClaimTime = row.time_to_claim.toString().padEnd(13, "0")

                let checkTime = parseInt(new Date() - new Date(Number(formatClaimTime))) / 1000 / 60 / 60
                if (checkTime > 0) {
                    let attemptClaim = await contract_claimLandPack(row.row_id)
                    if (!attemptClaim) {
                        console.log("Error occurred claiming land pack, will try again later.")
                        break
                    }
                }
            }
        }
    } catch (err) {
        console.log(`claimAllPacks: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function craftMaps() {
    let seafarerMapFragments = await getNftsByTemplate(TEMPLATE_MAT_SEAFARER_MAP_FRAGMENT)
    let fragmentCounter = 0
    let mergeCount = 0

    while (fragmentCounter < seafarerMapFragments.length) {
        if (fragmentCounter + 3 > seafarerMapFragments.length) break

        let fragmentsToMerge = []
        fragmentsToMerge.push(seafarerMapFragments[fragmentCounter])
        fragmentCounter++
        fragmentsToMerge.push(seafarerMapFragments[fragmentCounter])
        fragmentCounter++
        fragmentsToMerge.push(seafarerMapFragments[fragmentCounter])
        fragmentCounter++

        if (await contract_blendSeafarerMapFragments(fragmentsToMerge)) {
            mergeCount++
            await delay(1000)
        } else return false
    }

    return mergeCount > 0
}

async function craftLandPacks() {
    let fineWoodBalance = await getFineWoodsBalance()
    let seafarerMaps = await getNftsByTemplate(TEMPLATE_MAT_SEAFARER_MAP)
    let seafarerMapsBalance = seafarerMaps.length
    let seafarerMapCounterIndex = 0

    while (fineWoodBalance >= CONFIG_SEAFARERS_PACK_FINE_WOOD_FEE && seafarerMapsBalance >= CONFIG_SEAFARERS_PACK_SEAFARER_MAP_FEE) {
        let maps = []
        for (let i = 0; i < CONFIG_SEAFARERS_PACK_SEAFARER_MAP_FEE; i++) {
            maps.push(seafarerMaps[seafarerMapCounterIndex])
            seafarerMapCounterIndex++
        }

        if (await contract_createSeafarersPack(maps)) {
            fineWoodBalance -= CONFIG_SEAFARERS_PACK_FINE_WOOD_FEE
            seafarerMapsBalance -= CONFIG_SEAFARERS_PACK_SEAFARER_MAP_FEE
        } else {
            console.log("Errors occurred create seafarer packs, so will try again later")
            break
        }
    }

    while (fineWoodBalance >= CONFIG_EXPLORERS_PACK_FINE_WOOD_FEE) {
        if (await contract_createExplorersPack()) {
            fineWoodBalance -= CONFIG_EXPLORERS_PACK_FINE_WOOD_FEE
        } else {
            console.log("Errors occurred creating explorer packs, so will try again later")
            break
        }
    }
}

async function mintAssets() {
    let didAnyAssetMint = false

    try {
        let castles = await getCraftByTemplate(TEMPLATE_LAND_CASTLE)
        let barons = await getCraftByTemplate(TEMPLATE_ROYALBARON)
        let lumberjacks = await getCraftByTemplate(TEMPLATE_CRAFTER_LUMBERJACK)
        let carpenters = await getCraftByTemplate(TEMPLATE_CRAFTER_CARPENTER)
        let miners = await getCraftByTemplate(TEMPLATE_CRAFTER_MINER)

        if (castles.eligibleToMint.length > 0) {
            console.log("Minting for Castles...")
            if (await mint(castles.eligibleToMint, RECIPE_CASTLE, ACCOUNT_MSOURCEKINGS)) didAnyAssetMint = true
        } else console.log("No castles to mint")

        if (barons.eligibleToMint.length > 0) {
            console.log("Minting for Barons...")
            if (await mint(barons.eligibleToMint, RECIPE_BARON, ACCOUNT_MSOURCEBARON)) didAnyAssetMint = true
        } else console.log("No barons to mint")

        if (lumberjacks.eligibleToMint.length > 0) {
            console.log("Minting for Lumberjacks...")
            if (await mint(lumberjacks.eligibleToMint, RECIPE_LUMBER, ACCOUNT_MSOURCEGOODS)) didAnyAssetMint = true
        } else console.log("No lumberjacks to mint")

        if (carpenters.eligibleToMint.length > 0) {
            console.log("Minting for Carpenters...")
            if (await mint(carpenters.eligibleToMint, RECIPE_FINE_WOOD, ACCOUNT_MSOURCEGOODS)) didAnyAssetMint = true
        } else console.log("No carpenters to mint")

        if (miners.eligibleToMint.length > 0) {
            console.log("Minting for Miners...")
            if (await mint(miners.eligibleToMint, RECIPE_METAL, ACCOUNT_MSOURCEGOODS)) didAnyAssetMint = true
        } else console.log("No miners to mint")

        return didAnyAssetMint
    } catch (err) {
        console.log(`mintAssets: Error - ${err}`)
        await handleError(err)
    }

    return didAnyAssetMint
}

async function mergeLands() {
    let checkLandMerge = false
    do {
        let farms = await getNftsByTemplate(TEMPLATE_LAND_FARM)
        if ((await mergeLand("farms", CONFIG_LAND_MERGE_MSOURCE_BASE_FEE * CONFIG_LAND_FARM_FEE_MULTIPLIER, LAND_FARM_NAME, farms)) == false) {
            console.log(`Skipping land merge due to merge failures. Will try again next cycle`)
            break
        }
        await delay(5000)
        let ranches = await getNftsByTemplate(TEMPLATE_LAND_RANCH)
        if ((await mergeLand("ranches", CONFIG_LAND_MERGE_MSOURCE_BASE_FEE * CONFIG_LAND_RANCH_FEE_MULTIPLIER, LAND_RANCH_NAME, ranches)) == false) {
            console.log(`Skipping land merge due to merge failures. Will try again next cycle`)
            break
        }
        await delay(5000)
        let villages = await getNftsByTemplate(TEMPLATE_LAND_VILLAGE)
        if (
            (await mergeLand("villages", CONFIG_LAND_MERGE_MSOURCE_BASE_FEE * CONFIG_LAND_VILLAGE_FEE_MULTIPLIER, LAND_VILLAGE_NAME, villages)) ==
            false
        ) {
            console.log(`Skipping land merge due to merge failures. Will try again next cycle`)
            break
        }
        await delay(5000)
        let towns = await getNftsByTemplate(TEMPLATE_LAND_TOWN)
        if ((await mergeLand("towns", CONFIG_LAND_MERGE_MSOURCE_BASE_FEE * CONFIG_LAND_TOWN_FEE_MULTIPLIER, LAND_TOWN_NAME, towns)) == false) {
            console.log(`Skipping land merge due to merge failures. Will try again next cycle`)
            break
        }
        await delay(5000)
        let cities = await getNftsByTemplate(TEMPLATE_LAND_CITY)
        if ((await mergeLand("cities", CONFIG_LAND_MERGE_MSOURCE_BASE_FEE * CONFIG_LAND_CITY_FEE_MULTIPLIER, LAND_CITY_NAME, cities)) == false) {
            console.log(`Skipping land merge due to merge failures. Will try again next cycle`)
            break
        }
        await delay(5000)
        //if any lands were attempted, run the loop one more time
        if (farms.length >= 3 || ranches.length >= 3 || villages.length >= 3 || towns.length >= 3 || cities.length >= 3) {
            console.log("Cycling land merge to check more additional lands")
            checkLandMerge = true
        } else checkLandMerge = false
    } while (checkLandMerge)
}

async function mergeLand(displayName, fee, landName, landNfts) {
    console.log(`You have ${landNfts.length} ${displayName}. ${Math.floor(landNfts.length / 3)} merge transaction(s) available.`)

    let msourceBalance = await getMSourceBalance()
    let landCounter = 0

    while (landCounter < landNfts.length) {
        if (landCounter + 3 > landNfts.length) break

        if (fee > msourceBalance) {
            console.log(`Insufficient MSOURCE ${msourceBalance} to merge land. Need ${fee} MSOURCE`)
            return false
        }

        let landsToMerge = []
        landsToMerge.push(landNfts[landCounter])
        landCounter++
        landsToMerge.push(landNfts[landCounter])
        landCounter++
        landsToMerge.push(landNfts[landCounter])
        landCounter++

        if (await contract_merge(landName, landsToMerge, fee)) {
            msourceBalance -= fee
            console.log("Waiting on blockchain transaction confirmations")
            await delay(5000)
        } else return false
    }

    return true
}

async function rechargeAssets() {
    let rechargeCount = 0

    try {
        let castles = await getCraftByTemplate(TEMPLATE_LAND_CASTLE)
        let barons = await getCraftByTemplate(TEMPLATE_ROYALBARON)
        let lumberjacks = await getCraftByTemplate(TEMPLATE_CRAFTER_LUMBERJACK)
        let carpenters = await getCraftByTemplate(TEMPLATE_CRAFTER_CARPENTER)
        let miners = await getCraftByTemplate(TEMPLATE_CRAFTER_MINER)

        let lumberBalance = await Number(getLumberBalance())
        let royalSeals = await getRoyalSeals()
        let royalSealsUsed = 0

        if (barons.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_ROYALBARON) {
            console.log(`Recharging ${barons.needsCharging.length} barons`)

            for (let i = 0; i < barons.needsCharging.length; i++) {
                //if we run out of seals to recharge, then stop charging
                if (royalSeals.length - royalSealsUsed < CONFIG_RECHARGE_BARON_ROYAL_SEAL_FEE) {
                    console.log("Cannot continue charging barons: minimum resources not met")
                    break
                }

                let royalSealsForRecharge = []
                let tmpRoyalSealsUsed = royalSealsUsed

                for (let j = 0; j < CONFIG_RECHARGE_BARON_ROYAL_SEAL_FEE; j++) {
                    royalSealsForRecharge[j] = royalSeals[tmpRoyalSealsUsed]
                    tmpRoyalSealsUsed++
                }

                if (await contract_rechargeBaron(barons.needsCharging[i], royalSealsForRecharge)) {
                    royalSealsUsed += tmpRoyalSealsUsed
                    rechargeCount++
                } else {
                    break
                }
            }
        }

        if (castles.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_CASTLE) {
            console.log(`Recharging ${castles.needsCharging.length} castles`)

            for (let i = 0; i < castles.needsCharging.length; i++) {
                //if we run out of seals to recharge, then stop charging
                if (royalSeals.length - royalSealsUsed < CONFIG_RECHARGE_CASTLE_ROYAL_SEAL_FEE) {
                    console.log("Cannot continue charging castles: minimum resources not met")
                    break
                }

                let royalSealsForRecharge = []
                let tmpRoyalSealsUsed = royalSealsUsed

                for (let j = 0; j < CONFIG_RECHARGE_CASTLE_ROYAL_SEAL_FEE; j++) {
                    royalSealsForRecharge[j] = royalSeals[tmpRoyalSealsUsed]
                    tmpRoyalSealsUsed++
                }

                if (await contract_rechargeCastle(castles.needsCharging[i], royalSealsForRecharge)) {
                    royalSealsUsed += tmpRoyalSealsUsed
                    rechargeCount++
                } else {
                    break
                }
            }
        }

        if (lumberjacks.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_LUMBERJACK) {
            let msourceBalance = await getMSourceBalance()

            console.log(`Recharging ${lumberjacks.needsCharging.length} lumberjacks`)

            for (let i = 0; i < lumberjacks.needsCharging.length; i++) {
                //if we run out of minimum number of msource or seals to recharge, then stop charging
                if (
                    msourceBalance < CONFIG_RECHARGE_LUMBERJACK_MSOURCE_FEE ||
                    royalSeals.length - royalSealsUsed < CONFIG_RECHARGE_LUMBERJACK_ROYAL_SEAL_FEE
                ) {
                    console.log("Cannot continue charging lumberjacks: minimum resources not met")
                    break
                }

                let royalSealsForRecharge = []
                let tmpRoyalSealsUsed = royalSealsUsed

                for (let j = 0; j < CONFIG_RECHARGE_LUMBERJACK_ROYAL_SEAL_FEE; j++) {
                    royalSealsForRecharge[j] = royalSeals[tmpRoyalSealsUsed]
                    tmpRoyalSealsUsed++
                }

                if (await contract_rechargeLumberjack(lumberjacks.needsCharging[i], royalSealsForRecharge)) {
                    msourceBalance -= CONFIG_RECHARGE_LUMBERJACK_MSOURCE_FEE
                    royalSealsUsed += tmpRoyalSealsUsed
                    rechargeCount++
                } else {
                    break
                }
            }
        }

        if (carpenters.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_CARPENTER) {
            console.log(`Recharging ${carpenters.needsCharging.length} carpenters`)

            for (let i = 0; i < carpenters.needsCharging.length; i++) {
                //if we run out of minimum number of lumber or seals to recharge, then stop charging
                if (
                    lumberBalance < CONFIG_RECHARGE_CARPENTER_LUMBER_FEE ||
                    royalSeals.length - royalSealsUsed < CONFIG_RECHARGE_CARPENTER_ROYAL_SEAL_FEE
                ) {
                    console.log("Cannot continue charging carpenters: minimum resources not met")
                    break
                }

                let royalSealsForRecharge = []
                let tmpRoyalSealsUsed = royalSealsUsed

                for (let j = 0; j < CONFIG_RECHARGE_CARPENTER_ROYAL_SEAL_FEE; j++) {
                    royalSealsForRecharge[j] = royalSeals[tmpRoyalSealsUsed]
                    tmpRoyalSealsUsed++
                }

                if (await contract_rechargeCarpenter(carpenters.needsCharging[i], royalSealsForRecharge)) {
                    lumberBalance -= CONFIG_RECHARGE_CARPENTER_LUMBER_FEE
                    royalSealsUsed += tmpRoyalSealsUsed
                    rechargeCount++
                } else {
                    break
                }
            }
        }

        if (miners.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_MINER) {
            console.log(`Recharging ${miners.needsCharging.length} miners`)

            for (let i = 0; i < miners.needsCharging.length; i++) {
                //if we run out of minimum number of lumber or seals to recharge, then stop charging
                if (lumberBalance < CONFIG_RECHARGE_MINER_LUMBER_FEE || royalSeals.length - royalSealsUsed < CONFIG_RECHARGE_MINER_ROYAL_SEAL_FEE) {
                    console.log("Cannot continue charging miners: minimum resources not met")
                    break
                }

                let royalSealsForRecharge = []
                let tmpRoyalSealsUsed = royalSealsUsed

                for (let j = 0; j < CONFIG_RECHARGE_MINER_ROYAL_SEAL_FEE; j++) {
                    royalSealsForRecharge[j] = royalSeals[tmpRoyalSealsUsed]
                    tmpRoyalSealsUsed++
                }

                if (await contract_rechargeMiner(miners.needsCharging[i], royalSealsForRecharge)) {
                    lumberBalance -= CONFIG_RECHARGE_MINER_LUMBER_FEE
                    royalSealsUsed += tmpRoyalSealsUsed
                    rechargeCount++
                } else {
                    break
                }
            }
        }
    } catch (err) {
        console.log(`rechargeAssets: Error - ${err}`)
        await handleError(err)
    }

    return rechargeCount
}

async function mint(eligibleToMint, recipeId, contract) {
    try {
        if (eligibleToMint.length > 0) {
            let counter = 0
            while (counter < eligibleToMint.length) {
                let assets = []
                let groupSize = MINT_MAX
                if (counter + MINT_MAX > eligibleToMint.length) groupSize = eligibleToMint.length - counter

                for (let i = counter; i < counter + groupSize; i++) {
                    assets.push(eligibleToMint[i])
                }

                if (!(await contract_craft(assets, recipeId, contract))) return false

                counter += MINT_MAX
            }
            return true
        }

        return false
    } catch (err) {
        console.log(`mint: Error - ${err}`)
        await handleError(err)
        return false
    }
}

/********************************************
 *
 *          CONTRACT CALLS
 *
 * ******************************************/

async function contract_rechargeBaron(baronId, royalSeals) {
    try {
        let rechargeAction = {
            actions: [
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEBARON,
                        asset_ids: royalSeals,
                        memo: `fix:${baronId}`,
                    },
                },
            ],
        }

        await api.transact(rechargeAction, tapos)
        console.log("Baron recharge successful!")

        return true
    } catch (err) {
        console.log(`contract_rechargeBaron: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_rechargeCastle(castleId, royalSeals) {
    try {
        let rechargeAction = {
            actions: [
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEKINGS,
                        asset_ids: royalSeals,
                        memo: `fix:${castleId}`,
                    },
                },
            ],
        }

        await api.transact(rechargeAction, tapos)
        console.log("Castle recharge successful!")

        return true
    } catch (err) {
        console.log(`contract_rechargeCastle: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_rechargeCarpenter(carpenterId, royalSeals) {
    try {
        let rechargeAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCETOKEN,
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGOODS,
                        quantity: `${CONFIG_RECHARGE_CARPENTER_LUMBER_FEE} ${TOKEN_LUMBER}`,
                        memo: "deposit",
                    },
                },
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGOODS,
                        asset_ids: royalSeals,
                        memo: `fix:${carpenterId}`,
                    },
                },
            ],
        }

        await api.transact(rechargeAction, tapos)
        console.log("Carpenter recharge successful!")

        return true
    } catch (err) {
        console.log(`contract_rechargeCarpenter: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_rechargeMiner(minerId, royalSeals) {
    try {
        let rechargeAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCETOKEN,
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGOODS,
                        quantity: `${CONFIG_RECHARGE_MINER_LUMBER_FEE} ${TOKEN_LUMBER}`,
                        memo: "deposit",
                    },
                },
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGOODS,
                        asset_ids: royalSeals,
                        memo: `fix:${minerId}`,
                    },
                },
            ],
        }

        await api.transact(rechargeAction, tapos)
        console.log("Miner recharge successful!")

        return true
    } catch (err) {
        console.log(`contract_rechargeMiner: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_rechargeLumberjack(lumberjackId, royalSeals) {
    try {
        let rechargeAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCETOKEN,
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGOODS,
                        quantity: `${CONFIG_RECHARGE_LUMBERJACK_MSOURCE_FEE} ${TOKEN_MSOURCE}`,
                        memo: "deposit",
                    },
                },
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGOODS,
                        asset_ids: royalSeals,
                        memo: `fix:${lumberjackId}`,
                    },
                },
            ],
        }

        await api.transact(rechargeAction, tapos)
        console.log("Lumberjack recharge successful!")

        return true
    } catch (err) {
        console.log(`contract_rechargeLumberjack: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_claimMSource() {
    try {
        let claimAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCESTAKE,
                    name: "claim",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        player: CONFIG_WAX_ADDRESS,
                    },
                },
            ],
        }

        await api.transact(claimAction, tapos)
        console.log("Claimed MSOURCE successfully!")
        return true
    } catch (err) {
        console.log(`contract_claimMSource: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_craft(assets, recipeId, contract) {
    try {
        let actionsArray = []

        for (let i = 0; i < assets.length; i++) {
            actionsArray.push({
                account: contract,
                name: "craft",
                authorization: [
                    {
                        actor: CONFIG_WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    owner: CONFIG_WAX_ADDRESS,
                    asset_ids: [assets[i]],
                    recipe_id: recipeId,
                },
            })
        }

        let craftAction = {
            actions: actionsArray,
        }

        await api.transact(craftAction, tapos)
        console.log("Craft successful!")

        return true
    } catch (err) {
        console.log(`contract_craft: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_merge(landType, landAssets, fee) {
    try {
        let mergeAction = {
            actions: [
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEMERGE,
                        asset_ids: landAssets,
                        memo: `merge:${landType}`,
                    },
                },
                {
                    account: ACCOUNT_MSOURCETOKEN,
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEMERGE,
                        quantity: `${fee} ${TOKEN_MSOURCE}`,
                        memo: "deposit",
                    },
                },
            ],
        }

        await api.transact(mergeAction, tapos)
        console.log(`Land merge successful: (${landType})`)

        return true
    } catch (err) {
        console.log(`contract_merge: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_free2playBanquetClaim() {
    try {
        let banquetClaimAction = {
            actions: [
                {
                    account: "eosio.token",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEROYAL,
                        quantity: `${Number(CONFIG_FREE_BANQUET_CLAIM_FEE).toFixed(8)} WAX`,
                        memo: "deposit",
                    },
                },
                {
                    account: ACCOUNT_MSOURCEROYAL,
                    name: "unbox",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        claimer: CONFIG_WAX_ADDRESS,
                        pack_id: 1,
                    },
                },
            ],
        }

        await api.transact(banquetClaimAction, tapos)
        console.log("Banquet claim successful!")

        return true
    } catch (err) {
        //ignore error here because its time restricted and would get annoying filling up the screen
        //a timer could track when to call this but not worth the effort
        await handleError(err)
        return false
    }
}

async function contract_free2playPowerClaim() {
    try {
        let powerClaimAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCEROYAL,
                    name: "claim",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        player: CONFIG_WAX_ADDRESS,
                    },
                },
            ],
        }

        await api.transact(powerClaimAction, tapos)
        console.log("Power claim successful!")

        return true
    } catch (err) {
        //ignore error here because its time restricted and would get annoying filling up the screen
        //a timer could track when to call this but not worth the effort
        await handleError(err)
        return false
    }
}

async function contract_createSeafarersPack(maps) {
    try {
        let createSeafarersPackAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCETOKEN,
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGUILD,
                        quantity: `${CONFIG_SEAFARERS_PACK_FINE_WOOD_FEE} ${TOKEN_FINEWOOD}`,
                        memo: "deposit",
                    },
                },
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGUILD,
                        asset_ids: maps,
                        memo: `craft:${TEMPLATE_SEAFARERS_PACK}`,
                    },
                },
            ],
        }

        await api.transact(createSeafarersPackAction, tapos)
        console.log("Seafarers pack created!")

        return true
    } catch (err) {
        console.log(`contract_createSeafarersPack: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_createExplorersPack() {
    try {
        let createExplorersPackAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCETOKEN,
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: ACCOUNT_MSOURCEGUILD,
                        quantity: `${CONFIG_EXPLORERS_PACK_FINE_WOOD_FEE} ${TOKEN_FINEWOOD}`,
                        memo: "deposit",
                    },
                },
                {
                    account: ACCOUNT_MSOURCEGUILD,
                    name: "craftwtoken",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        owner: CONFIG_WAX_ADDRESS,
                        pack_to_craft_template_id: TEMPLATE_EXPLORERS_PACK,
                    },
                },
            ],
        }

        await api.transact(createExplorersPackAction, tapos)
        console.log("Explorer pack created!")

        return true
    } catch (err) {
        console.log(`contract_createExplorersPack: Error - ${err}`)
        await handleError(err)
        return false
    }
}

async function contract_claimLandPack(packId) {
    try {
        let claimLandPackAction = {
            actions: [
                {
                    account: ACCOUNT_MSOURCEGUILD,
                    name: "claimcraft",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        owner: CONFIG_WAX_ADDRESS,
                        craft_id: packId,
                    },
                },
            ],
        }

        await api.transact(claimLandPackAction, tapos)
        console.log("Land pack claimed successfully!")
        return true
    } catch (err) {
        await handleError(err)
        return false
    }
}

async function contract_unboxLandPack(packId) {
    try {
        let unboxLandPackAction = {
            actions: [
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: "atomicpacksx",
                        asset_ids: [packId],
                        memo: "unbox",
                    },
                },
            ],
        }

        await api.transact(unboxLandPackAction, tapos)
        console.log("Land pack unboxed successfully!")
        return true
    } catch (err) {
        await handleError(err)
        return false
    }
}

async function contract_revealLandPack(packId, rollIds) {
    try {
        let revealLandPackAction = {
            actions: [
                {
                    account: "atomicpacksx",
                    name: "claimunboxed",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        pack_asset_id: packId,
                        origin_roll_ids: rollIds,
                    },
                },
            ],
        }

        await api.transact(revealLandPackAction, tapos)
        console.log("Land pack revealed successfully!")
        return true
    } catch (err) {
        await handleError(err)
        return false
    }
}

async function contract_blendSeafarerMapFragments(mapFragments) {
    try {
        let blendSeafarerMapFragmentsAction = {
            actions: [
                {
                    account: "atomicassets",
                    name: "transfer",
                    authorization: [
                        {
                            actor: CONFIG_WAX_ADDRESS,
                            permission: "active",
                        },
                    ],
                    data: {
                        from: CONFIG_WAX_ADDRESS,
                        to: "blend.nefty",
                        asset_ids: mapFragments,
                        memo: "blend:8239",
                    },
                },
            ],
        }

        await api.transact(blendSeafarerMapFragmentsAction, tapos)
        console.log("Map fragments blend successful!")

        return true
    } catch (err) {
        console.log(`contract_blendSeafarerMapFragments: Error - ${err}`)
        await handleError(err)
        return false
    }
}

/********************************************
 *
 *          FETCHES
 *
 * ******************************************/

async function getCraftByTemplate(templateId) {
    let eligibleToMint = []
    let uneligibleToMint = []
    let needsCharging = []
    let page = 1
    let keepLooking = true

    try {
        while (keepLooking) {
            let nftItems = await fetch(
                ATOMIC_ASSETS_URL +
                    "?page=" +
                    page +
                    "&limit=40&owner=" +
                    CONFIG_WAX_ADDRESS +
                    "&collection_name=" +
                    COLLECTION_NAME +
                    "&template_id=" +
                    templateId
            )
            nftItems = await nftItems.json()

            if (nftItems.data.length == 0) break

            for (let j = 0; j < nftItems.data.length; j++) {
                let hasMintedBefore = false

                if (nftItems.data[j].data["Current Charges"] != undefined) hasMintedBefore = true

                let claimRef, hoursPassed

                let currentCharges = hasMintedBefore ? Number(nftItems.data[j].data["Current Charges"]) : 1

                if (hasMintedBefore) {
                    claimRef = nftItems.data[j].data["Claim Reference Number"].padEnd(13, "0")
                    hoursPassed = parseInt(new Date() - new Date(Number(claimRef))) / 1000 / 60 / 60
                }

                if (hasMintedBefore && currentCharges == 0) needsCharging.push(nftItems.data[j].asset_id)
                else if (hasMintedBefore && hoursPassed < MINT_TIMER) uneligibleToMint.push(nftItems.data[j].asset_id)
                else eligibleToMint.push(nftItems.data[j].asset_id)
            }

            page++

            if (nftItems.length < 40) keepLooking = false
            else await delay(500)
        }
    } catch (err) {
        console.log(`getCraftByTemplate: Error - ${err}`)
        await handleError(err)

        eligibleToMint = []
        uneligibleToMint = []
        needsCharging = []
    }

    return { eligibleToMint, uneligibleToMint, needsCharging }
}

async function getNftsByTemplate(templateId) {
    let nfts = []
    let page = 1
    let keepLooking = true

    try {
        while (keepLooking) {
            let nftItems = await fetch(
                ATOMIC_ASSETS_URL +
                    "?page=" +
                    page +
                    "&limit=40&owner=" +
                    CONFIG_WAX_ADDRESS +
                    "&collection_name=" +
                    COLLECTION_NAME +
                    "&template_id=" +
                    templateId
            )
            nftItems = await nftItems.json()

            if (nftItems.data.length == 0) break

            for (let j = 0; j < nftItems.data.length; j++) {
                nfts.push(nftItems.data[j].asset_id)
            }

            page++

            if (nftItems.length < 40) keepLooking = false
            else await delay(500)
        }
    } catch (err) {
        console.log(`getNftsByTemplate: Error - ${err}`)
        await handleError(err)

        nfts = []
    }

    return nfts
}

async function getRoyalSeals() {
    let royalSeals = []
    let page = 1
    let keepLooking = true

    try {
        while (keepLooking) {
            let nftItems = await fetch(
                ATOMIC_ASSETS_URL +
                    "?page=" +
                    page +
                    "&limit=40&owner=" +
                    CONFIG_WAX_ADDRESS +
                    "&collection_name=" +
                    COLLECTION_NAME +
                    "&template_id=" +
                    TEMPLATE_MAT_ROYAL_SEAL
            )
            nftItems = await nftItems.json()

            if (nftItems.data.length == 0) break

            for (let j = 0; j < nftItems.data.length; j++) {
                royalSeals.push(nftItems.data[j].asset_id)
            }

            page++

            if (nftItems.length < 40) keepLooking = false
            else await delay(500)
        }

        return royalSeals
    } catch (err) {
        console.log(`getRoyalSeals: Error - ${err}`)
        await handleError(err)
        return []
    }
}

/********************************************
 *
 *          TOKEN BALANCES
 *
 * ******************************************/

async function getMSourceBalance() {
    try {
        let bal = await rpc.get_currency_balance(ACCOUNT_MSOURCETOKEN, CONFIG_WAX_ADDRESS, TOKEN_MSOURCE)
        return Number(bal[0].split(" ")[0])
    } catch (err) {
        console.log(`getMSourceBalance: Error - ${err}`)
        await handleError(err)
        return 0
    }
}
async function getLumberBalance() {
    try {
        let bal = await rpc.get_currency_balance(ACCOUNT_MSOURCETOKEN, CONFIG_WAX_ADDRESS, TOKEN_LUMBER)
        if (bal.length > 0) return Number(bal[0].split(" ")[0])
        return 0
    } catch (err) {
        console.log(`getLumberBalance: Error - ${err}`)
        await handleError(err)
        return 0
    }
}
async function getFineWoodsBalance() {
    try {
        let bal = await rpc.get_currency_balance(ACCOUNT_MSOURCETOKEN, CONFIG_WAX_ADDRESS, TOKEN_FINEWOOD)
        if (bal.length > 0) return Number(bal[0].split(" ")[0])
        return 0
    } catch (err) {
        console.log(`getFineWoodsBalance: Error - ${err}`)
        await handleError(err)
        return 0
    }
}

async function getMetalBalance() {
    try {
        let bal = await rpc.get_currency_balance(ACCOUNT_MSOURCETOKEN, CONFIG_WAX_ADDRESS, TOKEN_METAL)
        if (bal.length > 0) return Number(bal[0].split(" ")[0])
        return 0
    } catch (err) {
        console.log(`getMetalBalance: Error - ${err}`)
        await handleError(err)
        return 0
    }
}

async function getWaxBalance() {
    try {
        let bal = await rpc.get_currency_balance("eosio.token", CONFIG_WAX_ADDRESS, "WAX")
        if (bal.length > 0) return Number(bal[0].split(" ")[0])
        return 0
    } catch (err) {
        console.log(`getWaxBalance: Error - ${err}`)
        await handleError(err)
        return 0
    }
}

/********************************************
 *
 *          Misc
 *
 * ******************************************/
async function handleError(err) {
    if (err.toString().toLowerCase().indexOf("billing") > -1) {
        console.log(
            "Waiting 60 seconds due to billing errors and to prevent spamming failures.  If this occurs often, consider staking more WAX for CPU on the account."
        )
        await delay(BILLING_ERROR_WAIT)
    }
}

//run program
main()
