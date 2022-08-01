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

const COLLECTION_NAME = "castlesnftgo"
const LAND_CASTLE = 436421
const CRAFTER_LUMBERJACK = 456608
const CRAFTER_CARPENTER = 481431
const MAT_ROYAL_SEAL = 411437
const RECIPE_LUMBER = 1
const RECIPE_FINE_WOOD = 2
const MINT_TIMER = 24

async function main() {
    console.log(`MSource Balance (Before Claim): ${await getMSourceBalance()}`)

    //claiming MSOURCE
    console.log("Claiming MSOURCE...")
    await claimMSource()

    //wait after claiming so balance can update
    await delay(5000)

    //get current aether balance
    console.log(`MSource Balance (After Claim): ${await getMSourceBalance()}`)
    console.log(`Lumber Balance: ${await getLumberBalance()}`)
    console.log(`Fine Wood Balance: ${await getFineWoodsBalance()}`)

    let royalSeals = await getRoyalSeals()

    console.log(`Total royal seals: ${royalSeals.length}`)

    //get list of castles we can mint
    console.log("get list of castles we can mint")
    let { elgibleToMint: eligibleCastles, uneligibleToMint: uneligibleCastles } =
        await getCraftByTemplate(LAND_CASTLE)

    if (eligibleCastles.length > 0) {
        //mint royal seal
        console.log(`Minting royal seals for ${eligibleCastles.length} castle(s)...`)

        await createRoyalSeal(eligibleCastles)
    } else {
        console.log("No castles eligible for minting a royal seal")
    }

    //get list of lumberjacks we can mint
    console.log("get list of lumberjacks we can craft")
    let { elgibleToMint: eligibleLumberJacks, uneligibleToMint: uneligibleLumberJacks } =
        await getCraftByTemplate(CRAFTER_LUMBERJACK)

    if (eligibleLumberJacks.length > 0) {
        //mint lumber
        console.log(`Crafting wood for ${eligibleLumberJacks.length} lumberjacks(s)...`)

        await craft(eligibleLumberJacks, RECIPE_LUMBER)
    } else {
        console.log("No lumberjacks eligible for crafting wood")
    }

    //get list of carpenters we can mint
    console.log("get list of carpenters we can craft")

    let { elgibleToMint: eligibleCarpenters, uneligibleToMint: uneligibleCarpenters } =
        await getCraftByTemplate(CRAFTER_CARPENTER)

    if (eligibleCarpenters.length > 0) {
        //mint fine wood
        console.log(`Crafting fine wood for ${eligibleCarpenters.length} carpenter(s)...`)

        await craft(eligibleCarpenters, RECIPE_FINE_WOOD)
    } else {
        console.log("No carpenters eligible for crafting wood")
    }

    console.log("AutoPlay complete!")
}

async function claimMSource() {
    let claimAction = {
        actions: [
            {
                account: "msourcestake",
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

async function createRoyalSeal(castles) {
    let createRoyalSealAction = {
        actions: [
            {
                account: "msourcekings",
                name: "craft",
                authorization: [
                    {
                        actor: process.env.WAX_ADDRESS,
                        permission: "active",
                    },
                ],
                data: {
                    owner: process.env.WAX_ADDRESS,
                    asset_ids: castles,
                    recipe_id: 1, //1 is recipe ID of royal seal
                },
            },
        ],
    }

    try {
        await api.transact(createRoyalSealAction, tapos)
        console.log("Royal Seal minted successfully!")
        return true
    } catch (e) {
        console.log("Error while minting royal seal: " + e.details[0].message)
        return false
    }
}

async function craft(assets, recipeId) {
    let craftAction = {
        actions: [
            {
                account: "msourcegoods",
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
                MAT_ROYAL_SEAL
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
    return await rpc.get_currency_balance("msourcetoken", process.env.WAX_ADDRESS, "MSOURCE")
}
async function getLumberBalance() {
    return await rpc.get_currency_balance("msourcetoken", process.env.WAX_ADDRESS, "CLUMBER")
}
async function getFineWoodsBalance() {
    return await rpc.get_currency_balance("msourcetoken", process.env.WAX_ADDRESS, "CFWTEMP")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
