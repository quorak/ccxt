<?php

namespace ccxt;

include_once ('base/Exchange.php');

class coincheck extends Exchange {

    public function describe () {
        return array_replace_recursive (parent::describe (), array (
            'id' => 'coincheck',
            'name' => 'coincheck',
            'countries' => array ( 'JP', 'ID' ),
            'rateLimit' => 1500,
            'hasCORS' => false,
            'urls' => array (
                'logo' => 'https://user-images.githubusercontent.com/1294454/27766464-3b5c3c74-5ed9-11e7-840e-31b32968e1da.jpg',
                'api' => 'https://coincheck.com/api',
                'www' => 'https://coincheck.com',
                'doc' => 'https://coincheck.com/documents/exchange/api',
            ),
            'api' => array (
                'public' => array (
                    'get' => array (
                        'exchange/orders/rate',
                        'order_books',
                        'rate/{pair}',
                        'ticker',
                        'trades',
                    ),
                ),
                'private' => array (
                    'get' => array (
                        'accounts',
                        'accounts/balance',
                        'accounts/leverage_balance',
                        'bank_accounts',
                        'deposit_money',
                        'exchange/orders/opens',
                        'exchange/orders/transactions',
                        'exchange/orders/transactions_pagination',
                        'exchange/leverage/positions',
                        'lending/borrows/matches',
                        'send_money',
                        'withdraws',
                    ),
                    'post' => array (
                        'bank_accounts',
                        'deposit_money/{id}/fast',
                        'exchange/orders',
                        'exchange/transfers/to_leverage',
                        'exchange/transfers/from_leverage',
                        'lending/borrows',
                        'lending/borrows/{id}/repay',
                        'send_money',
                        'withdraws',
                    ),
                    'delete' => array (
                        'bank_accounts/{id}',
                        'exchange/orders/{id}',
                        'withdraws/{id}',
                    ),
                ),
            ),
            'markets' => array (
                'BTC/JPY' => array ( 'id' => 'btc_jpy', 'symbol' => 'BTC/JPY', 'base' => 'BTC', 'quote' => 'JPY' ), // the only real pair
                // 'ETH/JPY' => array ( 'id' => 'eth_jpy', 'symbol' => 'ETH/JPY', 'base' => 'ETH', 'quote' => 'JPY' ),
                // 'ETC/JPY' => array ( 'id' => 'etc_jpy', 'symbol' => 'ETC/JPY', 'base' => 'ETC', 'quote' => 'JPY' ),
                // 'DAO/JPY' => array ( 'id' => 'dao_jpy', 'symbol' => 'DAO/JPY', 'base' => 'DAO', 'quote' => 'JPY' ),
                // 'LSK/JPY' => array ( 'id' => 'lsk_jpy', 'symbol' => 'LSK/JPY', 'base' => 'LSK', 'quote' => 'JPY' ),
                // 'FCT/JPY' => array ( 'id' => 'fct_jpy', 'symbol' => 'FCT/JPY', 'base' => 'FCT', 'quote' => 'JPY' ),
                // 'XMR/JPY' => array ( 'id' => 'xmr_jpy', 'symbol' => 'XMR/JPY', 'base' => 'XMR', 'quote' => 'JPY' ),
                // 'REP/JPY' => array ( 'id' => 'rep_jpy', 'symbol' => 'REP/JPY', 'base' => 'REP', 'quote' => 'JPY' ),
                // 'XRP/JPY' => array ( 'id' => 'xrp_jpy', 'symbol' => 'XRP/JPY', 'base' => 'XRP', 'quote' => 'JPY' ),
                // 'ZEC/JPY' => array ( 'id' => 'zec_jpy', 'symbol' => 'ZEC/JPY', 'base' => 'ZEC', 'quote' => 'JPY' ),
                // 'XEM/JPY' => array ( 'id' => 'xem_jpy', 'symbol' => 'XEM/JPY', 'base' => 'XEM', 'quote' => 'JPY' ),
                // 'LTC/JPY' => array ( 'id' => 'ltc_jpy', 'symbol' => 'LTC/JPY', 'base' => 'LTC', 'quote' => 'JPY' ),
                // 'DASH/JPY' => array ( 'id' => 'dash_jpy', 'symbol' => 'DASH/JPY', 'base' => 'DASH', 'quote' => 'JPY' ),
                // 'ETH/BTC' => array ( 'id' => 'eth_btc', 'symbol' => 'ETH/BTC', 'base' => 'ETH', 'quote' => 'BTC' ),
                // 'ETC/BTC' => array ( 'id' => 'etc_btc', 'symbol' => 'ETC/BTC', 'base' => 'ETC', 'quote' => 'BTC' ),
                // 'LSK/BTC' => array ( 'id' => 'lsk_btc', 'symbol' => 'LSK/BTC', 'base' => 'LSK', 'quote' => 'BTC' ),
                // 'FCT/BTC' => array ( 'id' => 'fct_btc', 'symbol' => 'FCT/BTC', 'base' => 'FCT', 'quote' => 'BTC' ),
                // 'XMR/BTC' => array ( 'id' => 'xmr_btc', 'symbol' => 'XMR/BTC', 'base' => 'XMR', 'quote' => 'BTC' ),
                // 'REP/BTC' => array ( 'id' => 'rep_btc', 'symbol' => 'REP/BTC', 'base' => 'REP', 'quote' => 'BTC' ),
                // 'XRP/BTC' => array ( 'id' => 'xrp_btc', 'symbol' => 'XRP/BTC', 'base' => 'XRP', 'quote' => 'BTC' ),
                // 'ZEC/BTC' => array ( 'id' => 'zec_btc', 'symbol' => 'ZEC/BTC', 'base' => 'ZEC', 'quote' => 'BTC' ),
                // 'XEM/BTC' => array ( 'id' => 'xem_btc', 'symbol' => 'XEM/BTC', 'base' => 'XEM', 'quote' => 'BTC' ),
                // 'LTC/BTC' => array ( 'id' => 'ltc_btc', 'symbol' => 'LTC/BTC', 'base' => 'LTC', 'quote' => 'BTC' ),
                // 'DASH/BTC' => array ( 'id' => 'dash_btc', 'symbol' => 'DASH/BTC', 'base' => 'DASH', 'quote' => 'BTC' ),
            ),
        ));
    }

    public function fetch_balance ($params = array ()) {
        $balances = $this->privateGetAccountsBalance ();
        $result = array ( 'info' => $balances );
        $currencies = array_keys ($this->currencies);
        for ($i = 0; $i < count ($currencies); $i++) {
            $currency = $currencies[$i];
            $lowercase = strtolower ($currency);
            $account = $this->account ();
            if (array_key_exists ($lowercase, $balances))
                $account['free'] = floatval ($balances[$lowercase]);
            $reserved = $lowercase . '_reserved';
            if (array_key_exists ($reserved, $balances))
                $account['used'] = floatval ($balances[$reserved]);
            $account['total'] = $this->sum ($account['free'], $account['used']);
            $result[$currency] = $account;
        }
        return $this->parse_balance($result);
    }

    public function fetch_order_book ($symbol, $params = array ()) {
        if ($symbol != 'BTC/JPY')
            throw new NotSupported ($this->id . ' fetchOrderBook () supports BTC/JPY only');
        $orderbook = $this->publicGetOrderBooks ($params);
        return $this->parse_order_book($orderbook);
    }

    public function fetch_ticker ($symbol, $params = array ()) {
        if ($symbol != 'BTC/JPY')
            throw new NotSupported ($this->id . ' fetchTicker () supports BTC/JPY only');
        $ticker = $this->publicGetTicker ($params);
        $timestamp = $ticker['timestamp'] * 1000;
        return array (
            'symbol' => $symbol,
            'timestamp' => $timestamp,
            'datetime' => $this->iso8601 ($timestamp),
            'high' => floatval ($ticker['high']),
            'low' => floatval ($ticker['low']),
            'bid' => floatval ($ticker['bid']),
            'ask' => floatval ($ticker['ask']),
            'vwap' => null,
            'open' => null,
            'close' => null,
            'first' => null,
            'last' => floatval ($ticker['last']),
            'change' => null,
            'percentage' => null,
            'average' => null,
            'baseVolume' => floatval ($ticker['volume']),
            'quoteVolume' => null,
            'info' => $ticker,
        );
    }

    public function parse_trade ($trade, $market) {
        $timestamp = $this->parse8601 ($trade['created_at']);
        return array (
            'id' => (string) $trade['id'],
            'info' => $trade,
            'timestamp' => $timestamp,
            'datetime' => $this->iso8601 ($timestamp),
            'symbol' => $market['symbol'],
            'type' => null,
            'side' => $trade['order_type'],
            'price' => floatval ($trade['rate']),
            'amount' => floatval ($trade['amount']),
        );
    }

    public function fetch_trades ($symbol, $since = null, $limit = null, $params = array ()) {
        if ($symbol != 'BTC/JPY')
            throw new NotSupported ($this->id . ' fetchTrades () supports BTC/JPY only');
        $market = $this->market ($symbol);
        $response = $this->publicGetTrades ($params);
        return $this->parse_trades($response, $market);
    }

    public function create_order ($symbol, $type, $side, $amount, $price = null, $params = array ()) {
        $prefix = '';
        $order = array (
            'pair' => $this->market_id($symbol),
        );
        if ($type == 'market') {
            $order_type = $type . '_' . $side;
            $order['order_type'] = $order_type;
            $prefix = ($side == 'buy') ? ($order_type . '_') : '';
            $order[$prefix . 'amount'] = $amount;
        } else {
            $order['order_type'] = $side;
            $order['rate'] = $price;
            $order['amount'] = $amount;
        }
        $response = $this->privatePostExchangeOrders (array_merge ($order, $params));
        return array (
            'info' => $response,
            'id' => (string) $response['id'],
        );
    }

    public function cancel_order ($id, $symbol = null, $params = array ()) {
        return $this->privateDeleteExchangeOrdersId (array ( 'id' => $id ));
    }

    public function sign ($path, $api = 'public', $method = 'GET', $params = array (), $headers = null, $body = null) {
        $url = $this->urls['api'] . '/' . $this->implode_params($path, $params);
        $query = $this->omit ($params, $this->extract_params($path));
        if ($api == 'public') {
            if ($query)
                $url .= '?' . $this->urlencode ($query);
        } else {
            $this->check_required_credentials();
            $nonce = (string) $this->nonce ();
            if ($query)
                $body = $this->urlencode ($this->keysort ($query));
            $auth = $nonce . $url . ($body || '');
            $headers = array (
                'Content-Type' => 'application/x-www-form-urlencoded',
                'ACCESS-KEY' => $this->apiKey,
                'ACCESS-NONCE' => $nonce,
                'ACCESS-SIGNATURE' => $this->hmac ($this->encode ($auth), $this->encode ($this->secret)),
            );
        }
        return array ( 'url' => $url, 'method' => $method, 'body' => $body, 'headers' => $headers );
    }

    public function request ($path, $api = 'public', $method = 'GET', $params = array (), $headers = null, $body = null) {
        $response = $this->fetch2 ($path, $api, $method, $params, $headers, $body);
        if ($api == 'public')
            return $response;
        if (array_key_exists ('success', $response))
            if ($response['success'])
                return $response;
        throw new ExchangeError ($this->id . ' ' . $this->json ($response));
    }
}

?>