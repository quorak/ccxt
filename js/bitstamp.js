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
            'hasWithdraw': true,
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
                        'bch_withdrawal/',
                        'bch_address/',
                        'user_transactions/',
                        'user_transactions/{pair}/',
                        'open_orders/all/',
                        'open_orders/{pair}/',
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
                        'ripple_withdrawal/',
                        'ripple_address/',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    'taker': 0.25 / 100,
                    'maker': 0.25 / 100,
                    'tiers': {
                        'taker': [
                            [0, 0.25 / 100],
                            [20000, 0.24 / 100],
                            [100000, 0.22 / 100],
                            [400000, 0.20 / 100],
                            [600000, 0.15 / 100],
                            [1000000, 0.14 / 100],
                            [2000000, 0.13 / 100],
                            [4000000, 0.12 / 100],
                            [20000000, 0.11 / 100],
                            [20000001, 0.10 / 100],
                        ],
                        'maker': [
                            [0, 0.25 / 100],
                            [20000, 0.24 / 100],
                            [100000, 0.22 / 100],
                            [400000, 0.20 / 100],
                            [600000, 0.15 / 100],
                            [1000000, 0.14 / 100],
                            [2000000, 0.13 / 100],
                            [4000000, 0.12 / 100],
                            [20000000, 0.11 / 100],
                            [20000001, 0.10 / 100],
                        ],
                    },
                },
                'funding': {
                    'tierBased': false,
                    'percentage': false,
                    'withdraw': {
                        'BTC': 0,
                        'LTC': 0,
                        'ETH': 0,
                        'XRP': 0,
                        'USD': 25,
                        'EUR': 0.90,
                    },
                    'deposit': {
                        'BTC': 0,
                        'LTC': 0,
                        'ETH': 0,
                        'XRP': 0,
                        'USD': 25,
                        'EUR': 0,
                    },
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
            let baseId = base.toLowerCase ();
            let quoteId = quote.toLowerCase ();
            let symbolId = baseId + '_' + quoteId;
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
                'baseId': baseId,
                'quoteId': quoteId,
                'symbolId': symbolId,
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
            timestamp = this.parse8601 (trade['datetime']);
        }
        let side = (trade['type'] == 0) ? 'buy' : 'sell';
        let order = undefined;
        if ('order_id' in trade)
            order = trade['order_id'].toString ();
        if ('currency_pair' in trade) {
            let marketId = trade['currency_pair'];
            if (marketId in this.markets_by_id)
                market = this.markets_by_id[marketId];
        }
        let price = this.safeFloat (trade, 'price');
        price = this.safeFloat (trade, market['symbolId'], price);
        let amount = this.safeFloat (trade, 'amount');
        amount = this.safeFloat (trade, market['baseId'], amount);
        let id = this.safeValue (trade, 'tid');
        id = this.safeValue (trade, 'id', id);
        if (id)
            id = id.toString ();
        return {
            'id': id,
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
        return this.parseTrades (response, market, since, limit);
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

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let market = undefined;
        if (symbol)
            market = this.market (symbol);
        let pair = market ? market['id'] : 'all';
        let request = this.extend ({ 'pair': pair }, params);
        let response = await this.privatePostUserTransactionsPair (request);
        return this.parseTrades (response, market, since, limit);
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

    getCurrencyName (code) {
        if (code == 'BTC')
            return 'bitcoin';
        if (code == 'XRP')
            return 'ripple';
        return code.toLowerCase ();
    }

    isFiat (code) {
        if (code == 'USD')
            return true;
        if (code == 'EUR')
            return true;
        return false;
    }

    async withdraw (code, amount, address, params = {}) {
        let isFiat = this.isFiat (code);
        if (isFiat)
            throw new ExchangeError (this.id + ' fiat withdraw() for ' + code + ' is not implemented yet');
        let name = this.getCurrencyName (code);
        let request = {
            'amount': amount,
            'address': address,
        };
        let v1 = (code == 'BTC') || (code == 'XRP');
        let method = v1 ? 'v1' : 'private'; // v1 or v2
        method += 'Post' + this.capitalize (name) + 'Withdrawal';
        let query = params;
        if (code == 'XRP') {
            let tag = this.safeString (params, 'destination_tag');
            if (tag) {
                request['destination_tag'] = tag;
                query = this.omit (params, 'destination_tag');
            } else {
                throw new ExchangeError (this.id + ' withdraw() requires a destination_tag param for ' + code);
            }
        }
        let response = await this[method] (this.extend (request, query));
        return {
            'info': response,
            'id': response['id'],
        };
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
