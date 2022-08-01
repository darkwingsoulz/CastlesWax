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

async function main() {
    //claiming MSOURCE
    console.log("Claiming MSOURCE...")
    await claimMSource()

    //get list of castles we can mint
    console.log("get list of castles we can mint")
    let castles = await getNftByTemplate(LAND_CASTLE)

    if (castles.length > 0) {
        //mint royal seal
        console.log(`Minting royal seals for ${castles.length} castle(s)...`)

        //TODO some castles may not be eligible due to timer, unable to track this for now, so lets attempt 1 at at ime
        for (const castle of castles) {
            await createRoyalSeal([castle])
        }
    } else {
        console.log("No castles eligible for minting a royal seal")
    }

    //get list of lumberjacks we can mint
    console.log("get list of lumberjacks we can craft")
    let lumberjacks = await getNftByTemplate(CRAFTER_LUMBERJACK)

    if (lumberjacks.length > 0) {
        //mint royal seal
        console.log(`Crafting wood for ${lumberjacks.length} lumberjacks(s)...`)

        //TODO some lumberjacks may not be eligible due to timer, unable to track this for now, so lets attempt 1 at at ime
        for (const lumberjack of lumberjacks) {
            await craft([lumberjack], RECIPE_LUMBER)
        }
    } else {
        console.log("No lumberjacks eligible for crafting wood")
    }

    //get list of carpenters we can mint
    console.log("get list of carpenters we can craft")
    let carpenters = await getNftByTemplate(CRAFTER_CARPENTER)

    if (carpenters.length > 0) {
        //mint royal seal
        console.log(`Crafting fine wood for ${carpenters.length} carpenter(s)...`)

        //TODO some carpenters may not be eligible due to timer, unable to track this for now, so lets attempt 1 at at ime
        for (const carpenter of carpenters) {
            await craft([carpenter], RECIPE_FINE_WOOD)
        }
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

async function getNftByTemplate(templateId) {
    let nfts = []

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

            if (currentCharges > 0) nfts.push(nftItems.data[j].asset_id)
        }

        page++

        if (nftItems.length < 40) keepLooking = false
        else await delay(20)
    }

    return nfts
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
