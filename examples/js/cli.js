"use strict";

//-----------------------------------------------------------------------------

const [processPath, , exchangeId, methodName, ... params] = process.argv.filter (x => !x.startsWith ('--'))
const verbose = process.argv.includes ('--verbose')

//-----------------------------------------------------------------------------

const ccxt      = require ('../../ccxt.js')
    , fs        = require ('fs')
    , path      = require ('path')
    , asTable   = require ('as-table')
    , util      = require ('util')
    , log       = require ('ololog').configure ({ locate: false })

//-----------------------------------------------------------------------------

require ('ansicolor').nice;

//-----------------------------------------------------------------------------

process.on ('uncaughtException',  e => { log.bright.red.error (e); process.exit (1) })
process.on ('unhandledRejection', e => { log.bright.red.error (e); process.exit (1) })

//-----------------------------------------------------------------------------

const exchange = new (ccxt)[exchangeId] ({ verbose })

//-----------------------------------------------------------------------------

// set up keys and settings, if any
const keysGlobal = path.resolve ('keys.json')
const keysLocal = path.resolve ('keys.local.json')

let globalKeysFile = fs.existsSync (keysGlobal) ? keysGlobal : false
let localKeysFile = fs.existsSync (keysLocal) ? keysLocal : globalKeysFile
let settings = localKeysFile ? (require (localKeysFile)[exchangeId] || {}) : {}

Object.assign (exchange, settings)

//-----------------------------------------------------------------------------

let printSupportedExchanges = function () {
    log ('Supported exchanges:', ccxt.exchanges.join (', ').green)
}

//-----------------------------------------------------------------------------

 function printUsage () {
    log ('This is an example of a basic command-line interface to all exchanges')
    log ('Usage: node', process.argv[1], 'id'.green, 'method'.yellow, '"param1" param2 "param3" param4 ...'.blue)
    log ('Examples:')
    log ('node', process.argv[1], 'okcoinusd fetchOHLCV BTC/USD 15m')
    log ('node', process.argv[1], 'bitfinex fetchBalance')
    log ('node', process.argv[1], 'kraken fetchOrderBook ETH/BTC')
    printSupportedExchanges ()
}

//-----------------------------------------------------------------------------

async function main () {

    const requirements = exchangeId && methodName
    if (!requirements) {

        printUsage ()

    } else {

        let args = params.map (param =>
            param.match (/[a-zA-Z]/g) ? param : parseFloat (param))

        if (typeof exchange[methodName] == 'function') {
            log (await exchange[methodName] (... args))
        } else {
            log (exchange[methodName])
        }

    }
}

//-----------------------------------------------------------------------------

main ()
