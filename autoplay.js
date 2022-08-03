const fetch = require("node-fetch")
const { Api, JsonRpc, RpcError } = require("eosjs")
const { JsSignatureProvider } = require("eosjs/dist/eosjs-jssig") // development only
const { TextEncoder, TextDecoder } = require("util")
const delay = (time) => new Promise((res) => setTimeout(res, time))
require("dotenv").config()

const rpc = new JsonRpc("https://wax.greymass.com", { fetch })
const signatureProvider = new JsSignatureProvider([process.env.WAX_PRIVATE_KEY])
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
const CONFIG_ENABLE_RECHARGE_LUMBERJACK = process.env.CONFIG_ENABLE_RECHARGE_LUMBERJACK.toLowerCase() == "true"
const CONFIG_ENABLE_RECHARGE_CARPENTER = process.env.CONFIG_ENABLE_RECHARGE_CARPENTER.toLowerCase() == "true"
const CONFIG_ENABLE_RECHARGE_CASTLE = process.env.CONFIG_ENABLE_RECHARGE_CASTLE.toLowerCase() == "true"
const CONFIG_ENABLE_RECHARGE_ROYALBARON = process.env.CONFIG_ENABLE_RECHARGE_ROYALBARON.toLowerCase() == "true"

const CONFIG_ENABLE_LAND_AUTO_CRAFT = process.env.CONFIG_ENABLE_LAND_AUTO_CRAFT.toLowerCase() == "true"

const COLLECTION_NAME = "castlesnftgo"

//templates
const TEMPLATE_LAND_CASTLE = 436421
const TEMPLATE_ROYALBARON = 391837
const TEMPLATE_CRAFTER_LUMBERJACK = 456608
const TEMPLATE_CRAFTER_CARPENTER = 481431
const TEMPLATE_MAT_ROYAL_SEAL = 411437
const TEMPLATE_PACK_2LANDS = 527506

const RECIPE_LUMBER = 1
const RECIPE_FINE_WOOD = 2
const RECIPE_BARON = 1
const RECIPE_CASTLE = 1

const MINT_TIMER = 24

const LAND_CLAIM_FINE_WOOD_FEE = 16
const TOKEN_FINEWOOD = "CFWTEMP"
const TOKEN_LUMBER = "CLUMBER"
const TOKEN_MSOURCE = "MSOURCE"
const ACCOUNT_MSOURCETOKEN = "msourcetoken"
const ACCOUNT_MSOURCESTAKE = "msourcestake"
const ACCOUNT_MSOURCEKINGS = "msourcekings"
const ACCOUNT_MSOURCEGOODS = "msourcegoods"
const ACCOUNT_MSOURCEGUILD = "msourceguild"
const ACCOUNT_MSOURCEBARON = "msourcebaron"

const MINT_MAX = 10
const RECHARGE_MAX = 9
const RECHARGE_CARPENTER_LUMBER_FEE = 6
const RECHARGE_CARPENTER_ROYAL_SEAL_FEE = 1

async function main() {
    console.log(`MSource Balance (Before Claim): ${await getMSourceBalance()}`)

    //claiming MSOURCE
    console.log("Claiming MSOURCE...")
    await claimMSource()

    //wait after claiming so balance can update
    console.log("Waiting for transaction...")
    await delay(5000)

    //get current aether balance
    console.log(`MSource Balance (After Claim): ${await getMSourceBalance()}`)

    let castles = await getCraftByTemplate(TEMPLATE_LAND_CASTLE)
    let barons = await getCraftByTemplate(TEMPLATE_ROYALBARON)
    let lumberjacks = await getCraftByTemplate(TEMPLATE_CRAFTER_LUMBERJACK)
    let carpenters = await getCraftByTemplate(TEMPLATE_CRAFTER_CARPENTER)

    /* if (castles.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_CASTLE) {
        console.log(`Recharging ${castles.needsCharging.length} castles...`)
        await recharge(castles.needsCharging, royalSeals)
    }
    if (barons.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_ROYALBARON) {
        console.log(`Recharging ${castles.needsCharging.length} barons...`)
        await recharge(barons.needsCharging, royalSeals)
    }
    if (lumberjacks.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_LUMBERJACK) {
        console.log(`Recharging ${castles.needsCharging.length} lumberjacks...`)
        await recharge(lumberjacks.needsCharging, royalSeals)
    }
    }*/

    let royalSeals = await getRoyalSeals()
    let royalSealsUsed = 0
    let rechargeCount = 0

    if (carpenters.needsCharging.length > 0 && CONFIG_ENABLE_RECHARGE_CARPENTER) {
        let lumberBalance = await Number(getLumberBalance())

        console.log(`Recharging ${carpenters.needsCharging.length} carpenters`)

        for (let i = 0; i < carpenters.needsCharging.length; i++) {
            //if we run out of minimum number of lumber or seals to recharge, then stop charging
            if (lumberBalance < RECHARGE_CARPENTER_LUMBER_FEE || royalSeals.length - royalSealsUsed < RECHARGE_CARPENTER_ROYAL_SEAL_FEE) {
                console.log("Cannot continue charging carpenters: minimum resources not met")
                break
            }

            let royalSealsForCarpenterRecharge = []
            let tmpRoyalSealsUsed = royalSealsUsed

            for (let j = 0; j < RECHARGE_CARPENTER_ROYAL_SEAL_FEE; j++) {
                royalSealsForCarpenterRecharge[j] = royalSeals[tmpRoyalSealsUsed]
                tmpRoyalSealsUsed++
            }

            if (await rechargeCarpenter(carpenters.needsCharging[i], royalSealsForCarpenterRecharge)) {
                lumberBalance -= RECHARGE_CARPENTER_LUMBER_FEE
                royalSealsUsed += tmpRoyalSealsUsed
                rechargeCount++
            } else {
                break
            }
        }
    }

    if (rechargeCount > 0) {
        console.log("Waiting for recharge transactions...")
        await delay(5000)
    }

    if (castles.elgibleToMint.length > 0) {
        console.log("Minting for Castles...")
        await mint(castles.elgibleToMint, RECIPE_CASTLE, ACCOUNT_MSOURCEKINGS)
    } else console.log("No castles to mint")

    if (barons.elgibleToMint.length > 0) {
        console.log("Minting for Barons...")
        await mint(barons.elgibleToMint, RECIPE_BARON, ACCOUNT_MSOURCEBARON)
    } else console.log("No barons to mint")

    if (lumberjacks.elgibleToMint.length > 0) {
        console.log("Minting for Lumberjacks...")
        await mint(lumberjacks.elgibleToMint, RECIPE_LUMBER, ACCOUNT_MSOURCEGOODS)
    } else console.log("No lumberjacks to mint")

    if (carpenters.elgibleToMint.length > 0) {
        console.log("Minting for Carpenters...")
        await mint(carpenters.elgibleToMint, RECIPE_FINE_WOOD, ACCOUNT_MSOURCEGOODS)
    } else console.log("No carpenters to mint")

    console.log("Waiting on transactions...")
    await delay(5000)

    if (CONFIG_ENABLE_LAND_AUTO_CRAFT) {
        console.log("Waiting on transactions...")
        await delay(5000)

        let fineWoodBalance = await getFineWoodsBalance()

        while (fineWoodBalance >= LAND_CLAIM_FINE_WOOD_FEE) {
            console.log(`${fineWoodBalance} fine woods remaining, so claiming for land`)
            if (await claimLand()) {
                fineWoodBalance -= LAND_CLAIM_FINE_WOOD_FEE
            } else {
                console.log("Errors occurred claiming land, so will try again later")
                break
            }
        }
    }
    console.log("AutoPlay complete!")
}

async function mint(eligibleToMint, recipeId, contract) {
    if (eligibleToMint.length > 0) {
        let counter = 0
        while (counter < eligibleToMint.length) {
            let assets = []
            let groupSize = MINT_MAX
            if (counter + MINT_MAX > eligibleToMint.length) groupSize = eligibleToMint.length - counter

            for (let i = counter; i < counter + groupSize; i++) {
                assets.push(eligibleToMint[i])
            }

            await craft(assets, recipeId, contract)
            await delay(1000)

            counter += MINT_MAX
        }
    }
}

async function rechargeCarpenter(carpenterId, royalSeals) {
    let rechargeAction = {
        actions: [
            {
                account: ACCOUNT_MSOURCETOKEN,
                name: "transfer",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    from: process.env.WAX_ADDRESS,
                    to: ACCOUNT_MSOURCEGOODS,
                    quantity: `${RECHARGE_CARPENTER_LUMBER_FEE} ${TOKEN_LUMBER}`,
                    memo: "deposit",
                },
            },
            {
                account: "atomicassets",
                name: "transfer",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    from: process.env.WAX_ADDRESS,
                    to: ACCOUNT_MSOURCEGOODS,
                    asset_ids: royalSeals,
                    memo: `fix:${carpenterId}`,
                },
            },
        ],
    }

    try {
        await api.transact(rechargeAction, tapos)
        console.log("Recharge successful!")

        return true
    } catch (e) {
        console.log("Error while recharging: " + e)
        return false
    }
}

async function claimMSource() {
    let claimAction = {
        actions: [
            {
                account: ACCOUNT_MSOURCESTAKE,
                name: "claim",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    player: process.env.WAX_ADDRESS,
                },
            },
        ],
    }

    try {
        await api.transact(claimAction, tapos)
        console.log("Claimed MSOURCE successfully!")
        return true
    } catch (e) {
        console.log("Error while claiming MSOURCE: " + e.details[0].message)
        return false
    }
}

async function craft(assets, recipeId, contract) {
    let craftAction = {
        actions: [
            {
                account: contract,
                name: "craft",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    owner: process.env.WAX_ADDRESS,
                    asset_ids: assets,
                    recipe_id: recipeId,
                },
            },
        ],
    }

    try {
        await api.transact(craftAction, tapos)
        console.log("Craft successful!")

        return true
    } catch (e) {
        console.log("Error while crafting: " + e.details[0].message)
        return false
    }
}

async function claimLand(assets, recipeId) {
    let claimLandAction = {
        actions: [
            {
                account: ACCOUNT_MSOURCETOKEN,
                name: "transfer",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    from: process.env.WAX_ADDRESS,
                    to: ACCOUNT_MSOURCEGUILD,
                    quantity: `${LAND_CLAIM_FINE_WOOD_FEE} ${TOKEN_FINEWOOD}`,
                    memo: "deposit",
                },
            },
            {
                account: ACCOUNT_MSOURCEGUILD,
                name: "craftwtoken",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    owner: process.env.WAX_ADDRESS,
                    pack_to_craft_template_id: TEMPLATE_PACK_2LANDS,
                },
            },
        ],
    }

    try {
        await api.transact(claimLandAction, tapos)
        console.log("Land claimed successful!")

        return true
    } catch (e) {
        console.log("Error while claiming land: " + e.details[0].message)
        return false
    }
}

async function payInstantFor2PackLand(royalSealAsset) {
    let claimLandAction = {
        actions: [
            {
                account: "atomicassets",
                name: "transfer",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    from: process.env.WAX_ADDRESS,
                    to: ACCOUNT_MSOURCEGUILD,
                    asset_ids: [royalSealAsset],
                    memo: "instant:1",
                },
            },
        ],
    }

    try {
        await api.transact(claimLandAction, tapos)
        console.log("Land claimed successful!")

        return true
    } catch (e) {
        console.log("Error while claiming land: " + e.details[0].message)
        return false
    }
}

async function getCraftByTemplate(templateId) {
    let elgibleToMint = []
    let uneligibleToMint = []
    let needsCharging = []

    let page = 1
    let keepLooking = true

    while (keepLooking) {
        let nftItems = await fetch(
            "https://wax.api.atomicassets.io/atomicassets/v1/assets?page=" +
                page +
                "&limit=40&owner=" +
                process.env.WAX_ADDRESS +
                "&collection_name=" +
                COLLECTION_NAME +
                "&template_id=" +
                templateId
        )
        nftItems = await nftItems.json()

        if (nftItems.data.length == 0) break

        for (let j = 0; j < nftItems.data.length; j++) {
            let currentCharges = Number(nftItems.data[j].data["Current Charges"])
            let claimRef = nftItems.data[j].data["Claim Reference Number"].padEnd(13, "0")
            let hoursPassed = parseInt(new Date() - new Date(Number(claimRef))) / 1000 / 60 / 60

            if (currentCharges == 0) needsCharging.push(nftItems.data[j].asset_id)
            else if (hoursPassed < MINT_TIMER) uneligibleToMint.push(nftItems.data[j].asset_id)
            else elgibleToMint.push(nftItems.data[j].asset_id)
        }

        page++

        if (nftItems.length < 40) keepLooking = false
        else await delay(20)
    }

    return { elgibleToMint, uneligibleToMint, needsCharging }
}

async function getRoyalSeals() {
    let royalSeals = []

    let page = 1
    let keepLooking = true

    while (keepLooking) {
        let nftItems = await fetch(
            "https://wax.api.atomicassets.io/atomicassets/v1/assets?page=" +
                page +
                "&limit=40&owner=" +
                process.env.WAX_ADDRESS +
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
        else await delay(20)
    }

    return royalSeals
}

async function getMSourceBalance() {
    return await rpc.get_currency_balance(ACCOUNT_MSOURCETOKEN, process.env.WAX_ADDRESS, TOKEN_MSOURCE)
}
async function getLumberBalance() {
    return await rpc.get_currency_balance(ACCOUNT_MSOURCETOKEN, process.env.WAX_ADDRESS, TOKEN_LUMBER)
}
async function getFineWoodsBalance() {
    return await rpc.get_currency_balance(ACCOUNT_MSOURCETOKEN, process.env.WAX_ADDRESS, TOKEN_FINEWOOD)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
