"use strict";

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange')
const { ExchangeError, AuthenticationError } = require ('./base/errors')

//  ---------------------------------------------------------------------------

module.exports = class bitstamp extends Exchange {

    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'bitstamp',
            'name': 'Bitstamp',
            'countries': 'GB',
            'rateLimit': 1000,
            'version': 'v2',
            'hasCORS': false,
            'hasFetchOrder': true,
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27786377-8c8ab57e-5fe9-11e7-8ea4-2b05b6bcceec.jpg',
                'api': 'https://www.bitstamp.net/api',
                'www': 'https://www.bitstamp.net',
                'doc': 'https://www.bitstamp.net/api',
            },
            'requiredCredentials': {
                'apiKey': true,
                'secret': true,
                'uid': true,
            },
            'api': {
                'public': {
                    'get': [
                        'order_book/{pair}/',
                        'ticker_hour/{pair}/',
                        'ticker/{pair}/',
                        'transactions/{pair}/',
                        'trading-pairs-info/',
                    ],
                },
                'private': {
                    'post': [
                        'balance/',
                        'balance/{pair}/',
                        'user_transactions/',
                        'user_transactions/{pair}/',
                        'open_orders/all/',
                        'open_orders/{pair}',
                        'order_status/',
                        'cancel_order/',
                        'buy/{pair}/',
                        'buy/market/{pair}/',
                        'sell/{pair}/',
                        'sell/market/{pair}/',
                        'ltc_withdrawal/',
                        'ltc_address/',
                        'eth_withdrawal/',
                        'eth_address/',
                        'transfer-to-main/',
                        'transfer-from-main/',
                        'xrp_withdrawal/',
                        'xrp_address/',
                        'withdrawal/open/',
                        'withdrawal/status/',
                        'withdrawal/cancel/',
                        'liquidation_address/new/',
                        'liquidation_address/info/',
                    ],
                },
                'v1': {
                    'post': [
                        'bitcoin_deposit_address/',
                        'unconfirmed_btc/',
                        'bitcoin_withdrawal/',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'maker': 0.0025,
                    'taker': 0.0025,
                },
            },
        });
    }

    async fetchMarkets () {
        let markets = await this.publicGetTradingPairsInfo ();
        let result = [];
        for (let i = 0; i < markets.length; i++) {
            let market = markets[i];
            let symbol = market['name'];
            let [ base, quote ] = symbol.split ('/');
            let id = market['url_symbol'];
            let precision = {
                'amount': market['base_decimals'],
                'price': market['counter_decimals'],
            };
            let [ cost, currency ] = market['minimum_order'].split (' ');
            let active = (market['trading'] == 'Enabled');
            let lot = Math.pow (10, -precision['amount']);
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'info': market,
                'lot': lot,
                'active': active,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': lot,
                        'max': undefined,
                    },
                    'price': {
                        'min': Math.pow (10, -precision['price']),
                        'max': undefined,
                    },
                    'cost': {
                        'min': parseFloat (cost),
                        'max': undefined,
                    },
                },
            });
        }
        return result;
    }

    async fetchOrderBook (symbol, params = {}) {
        await this.loadMarkets ();
        let orderbook = await this.publicGetOrderBookPair (this.extend ({
            'pair': this.marketId (symbol),
        }, params));
        let timestamp = parseInt (orderbook['timestamp']) * 1000;
        return this.parseOrderBook (orderbook, timestamp);
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        let ticker = await this.publicGetTickerPair (this.extend ({
            'pair': this.marketId (symbol),
        }, params));
        let timestamp = parseInt (ticker['timestamp']) * 1000;
        let vwap = parseFloat (ticker['vwap']);
        let baseVolume = parseFloat (ticker['volume']);
        let quoteVolume = baseVolume * vwap;
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': parseFloat (ticker['high']),
            'low': parseFloat (ticker['low']),
            'bid': parseFloat (ticker['bid']),
            'ask': parseFloat (ticker['ask']),
            'vwap': vwap,
            'open': parseFloat (ticker['open']),
            'close': undefined,
            'first': undefined,
            'last': parseFloat (ticker['last']),
            'change': undefined,
            'percentage': undefined,
            'average': undefined,
            'baseVolume': baseVolume,
            'quoteVolume': quoteVolume,
            'info': ticker,
        };
    }

    parseTrade (trade, market = undefined) {
        let timestamp = undefined;
        if ('date' in trade) {
            timestamp = parseInt (trade['date']) * 1000;
        } else if ('datetime' in trade) {
            // timestamp = this.parse8601 (trade['datetime']);
            timestamp = parseInt (trade['datetime']) * 1000;
        }
        let side = (trade['type'] == 0) ? 'buy' : 'sell';
        let order = undefined;
        if ('order_id' in trade)
            order = trade['order_id'].toString ();
        if ('currency_pair' in trade) {
            if (trade['currency_pair'] in this.markets_by_id)
                market = this.markets_by_id[trade['currency_pair']];
        }
        return {
            'id': trade['tid'].toString (),
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'order': order,
            'type': undefined,
            'side': side,
            'price': parseFloat (trade['price']),
            'amount': parseFloat (trade['amount']),
        };
    }

    parseMyTrade (trade, market = undefined) {
        let timestamp = undefined;
        if ('date' in trade) {
            timestamp = parseInt (trade['date']) * 1000;
        } else if ('datetime' in trade) {
            timestamp = this.parse8601 (trade['datetime']);
        }
        let side = (trade['type'] == 0) ? 'buy' : 'sell';
        let order = undefined;
        let currency_pair = undefined

        if ('order_id' in trade)
            order = trade['order_id'].toString ();

        if(market == undefined){
            for(let key in trade){
                let key_as_market_id = key.replace('_','')
                if(this.markets_by_id[key_as_market_id] != undefined){
                    currency_pair=key
                    market = this.markets_by_id[key_as_market_id];
                    break;
                }
            }
        }else{
            currency_pair = market['base'].toLowerCase()+'_'+market['quote'].toLowerCase()
        }
        let price = trade[currency_pair]
        let amount = trade[market.quote.toLowerCase()]
        return {
            'id': trade['id'].toString(),
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'order': order,
            'type': undefined,
            'side': side,
            'price': parseFloat (price),
            'amount': parseFloat (amount),
        };
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        let response = await this.publicGetTransactionsPair (this.extend ({
            'pair': market['id'],
            'time': 'minute',
        }, params));
        return this.parseTrades (response, market);
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        let response = undefined
        let market = undefined
        if(symbol == undefined){
            await this.loadMarkets ();
            response = await this.privatePostUserTransactions (this.extend ({
                'limit': limit
            }, params));
        }else{
            await this.loadMarkets ();
            market = this.market (symbol);
            response = await this.privatePostUserTransactionsPair (this.extend ({
                'pair': market['id'],
                'limit': limit
            }, params));
        }
        return Object.values (response).map (trade => this.parseMyTrade (trade, market))
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        let balance = await this.privatePostBalance ();
        let result = { 'info': balance };
        let currencies = Object.keys (this.currencies);
        for (let i = 0; i < currencies.length; i++) {
            let currency = currencies[i];
            let lowercase = currency.toLowerCase ();
            let total = lowercase + '_balance';
            let free = lowercase + '_available';
            let used = lowercase + '_reserved';
            let account = this.account ();
            if (free in balance)
                account['free'] = parseFloat (balance[free]);
            if (used in balance)
                account['used'] = parseFloat (balance[used]);
            if (total in balance)
                account['total'] = parseFloat (balance[total]);
            result[currency] = account;
        }
        return this.parseBalance (result);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        let method = 'privatePost' + this.capitalize (side);
        let order = {
            'pair': this.marketId (symbol),
            'amount': amount,
        };
        if (type == 'market')
            method += 'Market';
        else
            order['price'] = price;
        method += 'Pair';
        let response = await this[method] (this.extend (order, params));
        return {
            'info': response,
            'id': response['id'],
        };
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        return await this.privatePostCancelOrder ({ 'id': id });
    }

    parseOrderStatus (order) {
        if ((order['status'] == 'Queue') || (order['status'] == 'Open'))
            return 'open';
        if (order['status'] == 'Finished')
            return 'closed';
        return order['status'];
    }

    async fetchOrderStatus (id, symbol = undefined) {
        await this.loadMarkets ();
        let response = await this.privatePostOrderStatus ({ 'id': id });
        return this.parseOrderStatus (response);
    }

    parseOrder (order,market) {
        let statusCode = order['status'];
        let status = undefined;
        if (statusCode == 'Queue' || statusCode == 'Open') {
            status = 'open';
        } else if (statusCode == "Finished") {
            status = 'closed';
        } else if (statusCode == "Canceled") {
            status = 'canceled';
        } else {
            throw new ExchangeError("unknown order status "+statusCode)
        }

        let price = undefined
        let type = undefined
        let timestamp = undefined
        let amount = undefined
        let side = undefined
        let symbol = undefined
        let filled = 0
        let remaining = undefined

        if(order['type'] != undefined)
            side = (order['type'] == 0) ? 'buy' : 'sell' ;

        // amount is only set, if the userer passes additional infos via createOrderResponse
        if(order['amount'] != undefined)
            amount = order['amount']

        if(order['price'] != undefined)
            price = order['price']

        if(order.transactions.length > 0){
            let t = Object.assign({}, order.transactions[0])

            
            timestamp = order.transactions.map(t => Date.parse(t.datetime)).reduce ( (t1,t2) => Math.max(t1, t2), Date.now());
            
            let transactionType = ["deposit","withdrawal","market"][t["type"]]
            

            if(!market){
                // no market has been set. 
                // Lets try to figure it out, from the keys, set in the transactions
                delete t.type
                delete t.fee
                delete t.tid
                delete t.datetime
                delete t.price
                let quoteAndBase = Object.keys(t)
                if(quoteAndBase.length > 2) throw new ExchangeError('unexpected new variable in transaction object' + quoteAndBase.join(' '))
                market = this.markets_by_id[quoteAndBase[0]+quoteAndBase[1]] || this.markets_by_id[quoteAndBase[1]+quoteAndBase[0]]
            }
            if(!market) throw new ExchangeError('Market not found for' + quoteAndBase.join(' '))
            
            symbol = market['symbol']


            filled = order.transactions.reduce((sum,t2) => sum + this.safeFloat (t2, market['base'].toLowerCase()), 0);
            // corrected price when we have actual transactions
            price = order.transactions.reduce((sum,t2) => sum + parseFloat(t2.price) * this.safeFloat (t2, market['base'].toLowerCase()), 0) / filled ;
            
            // to avoid rounding issues
            filled = this.amountToPrecision(symbol,filled)
            price = this.priceToPrecision(symbol,price)

        }


        if(amount && filled)
            remaining = amount - filled

        let result = {
            'info': order,
            'id': order['id'],
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': timestamp ? this.iso8601 (timestamp) : undefined,
            'side': side,
            'price': price,
            'amount': amount,
            'remaining': remaining,
            'filled': filled,
            'status': status,
        };
        return result;
    }

    async fetchOrder (id, symbol = undefined, params = {}) {

        await this.loadMarkets ();
        let response = await this.privatePostOrderStatus ({id:id});
        let order = response;
        let market = this.markets[symbol]

        // bitfinex does not send many informations like amount,side, price via the privatePostOrderStatus API
        // set params.createResponseParameters to the values returned by the create Endpoint, to have a more unified API
        order = this.extend ({ 'id': id }, params.createOrderResponseRaw || {}, response)
        return this.parseOrder (this.extend ({ 'id': id }, order), market);
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = this.urls['api'] + '/';
        if (api != 'v1')
            url += this.version + '/';
        url += this.implodeParams (path, params);
        let query = this.omit (params, this.extractParams (path));
        if (api == 'public') {
            if (Object.keys (query).length)
                url += '?' + this.urlencode (query);
        } else {
            this.checkRequiredCredentials ();
            let nonce = this.nonce ().toString ();
            let auth = nonce + this.uid + this.apiKey;
            let signature = this.encode (this.hmac (this.encode (auth), this.encode (this.secret)));
            query = this.extend ({
                'key': this.apiKey,
                'signature': signature.toUpperCase (),
                'nonce': nonce,
            }, query);
            body = this.urlencode (query);
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    async request (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let response = await this.fetch2 (path, api, method, params, headers, body);
        if ('status' in response)
            if (response['status'] == 'error')
                throw new ExchangeError (this.id + ' ' + this.json (response));
        return response;
    }
}
