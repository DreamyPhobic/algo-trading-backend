"use strict";

import axios from 'axios';
import sha256 from 'crypto-js/sha256.js';

import API from "./config.js";
import WS  from "./WebSocket.js";

var NorenRestApi = function(params) {
  var self = this;
  self.__susertoken = "";
  self.__username   = "";
  self.__accountid  = "";

  var endpoint = API.endpoint
  var debug  = API.debug
  var routes = {
    'authorize': '/QuickAuth',
    'logout': '/Logout',
    'forgot_password': '/ForgotPassword',
    'watchlist_names': '/MWList',
    'watchlist': '/MarketWatch',
    'watchlist_add': '/AddMultiScripsToMW',
    'watchlist_delete': '/DeleteMultiMWScrips',
    'placeorder': '/PlaceOrder',
    'modifyorder': '/ModifyOrder',
    'cancelorder': '/CancelOrder',
    'exitorder': '/ExitSNOOrder',
    'orderbook': '/OrderBook',
    'tradebook': '/TradeBook',          
    'singleorderhistory': '/SingleOrdHist',
    'searchscrip': '/SearchScrip',
    'TPSeries' : '/TPSeries',     
    'optionchain' : '/GetOptionChain',     
    'holdings' : '/Holdings',
    'limits' : '/Limits',
    'positions': '/PositionBook',
    'scripinfo': '/GetSecurityInfo',
    'getquotes': '/GetQuotes',
  }
  
  //   axios.interceptors.request.use(req => {
  //     console.log(`${req.method} ${req.url} ${req.data}`);
  //   // Important: request interceptors **must** return the request.
  //   return req;
  // });
    // Add a response interceptor
    axios.interceptors.response.use(response => {
        if (API.debug)
          console.log(response);
        if (response.status === 200) {
            return response;
        }
    }
  , error => {
        let errorObj = {};

        if (error.response)  {
           errorObj.status = error.response.status;
           errorObj.message = error.response.statusText;
        } else {
            errorObj.status = 500;
            errorObj.message = "Error";
        }
        return Promise.reject(errorObj);
    });


  function post_request(route, params, token) {
        let url = endpoint + routes[route];        
        let payload = 'jData=' + JSON.stringify(params);
        //if(usertoken.isEmpty == false)
          payload = payload + `&jKey=${token}`;
        return axios.post(url, payload);
        
        //return requestInstance.request(options);
    }

    self.setSessionDetails = function(response) {
        self.__susertoken = response.susertoken;
        self.__username   = response.actid
        self.__accountid  = response.actid
        
    };

   /**
     * Description
     * @method login
     * @param {string} userid
     * @param {string} password
     * @param {string} twoFA
     * @param {string} vendor_code
     * @param {string} api_secret
     * @param {string} imei
     */
     
    self.login = async function (params) {       

        let pwd       = sha256(params.password).toString(); 
        let u_app_key =  `${params.userid}|${params.api_secret}`
        let app_key   = sha256(u_app_key).toString();

        let authparams = {
            "source": "API" , 
            "apkversion": "js:1.0.0",
            "uid": params.userid,
            "pwd": pwd,
            "factor2": params.twoFA,
            "vc": params.vendor_code,
            "appkey": app_key,
            "imei": params.imei            
        };

        console.log(authparams);

        let response = null
        try {
          response = await post_request("authorize", authparams, "")
        }
        catch(err) {
          throw err
        }

        if(response == null) {
          throw Error("Unexpected error occured during login")
        }

        if (response.data.stat === 'Ok') {
          return response
        }
        else if (response.data.stat === 'Not_Ok'){
          throw Error(response.data.emsg)
        }
        else {
          throw Error("Unexpected error occured during login")
        }
    };



    /**
         * Description
         * @method searchscrip
         * @param {string} exchange
         * @param {string} searchtext
         */
         
    self.searchscrip = function (exchange, searchtext) {
            
            let values              = {};
            values["uid"]       = self.__username;
            values["exch"]      = exchange;
            values["stext"]     = searchtext;     
          
            let reply = post_request("searchscrip", values, self.__susertoken);

            reply
                .then(response => {              
                    if (response.stat == 'Ok') {                    
                        
                    }
                }).catch(function (err) {
                    throw err
                });

            return reply;
          };

    /**
         * Description
         * @method get_quotes
         * @param {string} exchange
         * @param {string} token
         */
         
    self.get_quotes = function (exchange, token) {

          let values          = {}
          values["uid"]       = self.__username
          values["exch"]      = exchange
          values["token"]     = token              
          
          let reply = post_request("getquotes", values, self.__susertoken);
          return reply;
        };

    /**
         * Description
         * @method get_time_price_series
         * @param {string} exchange
         * @param {string} token
         * @param {string} starttime
         * @param {string} endtime
         * @param {string} interval
         */
         
    self.get_time_price_series = function (params) {

          let values          = {}
          values["uid"]       = self.__username;
          values["exch"]      = params.exchange;
          values["token"]     = params.token;          
          values["st"]        = params.starttime;
          if(params.endtime !== undefined)
            values["et"]        = params.endtime;
          if(params.interval !== undefined)
            values["intrv"]     = params.interval;
          
          let reply = post_request("TPSeries", values, self.__susertoken);
          return reply;
        };
        
    /**
         * Description
         * @method place_order
         * @param {string} buy_or_sell
         * @param {string} product_type
         */
    self.place_order = function (order, token) {

          let values          = {'ordersource':'API'};
          values["uid"]       = order.uid;
          values["actid"]     = order.actid;
          values["trantype"]  = order.buy_or_sell;
          values["prd"]       = order.product_type;
          values["exch"]      = order.exchange;
          values["tsym"]      = order.tradingsymbol;
          values["qty"]       = order.quantity.toString();
          values["prctyp"]    = order.price_type
          values["prc"]       = order.price.toString();
          values["remarks"]   = order.remarks;

          if(order.amo !== undefined)
            values["ret"]       = order.retention;
          else
            values["ret"]       = 'DAY';

          if(order.trigger_price !== undefined)
              values["trgprc"]    = order.trigger_price.toString();
    
          if(order.amo !== undefined)
            values["amo"]       = order.amo;
          
          //if cover order or high leverage order
          if(order.product_type == 'H')
          {
              values["blprc"]       = order.bookloss_price.toString();
              //trailing price
              if(order.trail_price != 0.0)
              {
                  values["trailprc"] = order.trail_price.toString();
              }
          }
          //bracket order
          if(order.product_type == 'B')
          {
              values["blprc"]       = order.bookloss_price.toString();
              values["bpprc"]       = order.bookprofit_price.toString();
              //trailing price
              if(order.trail_price != 0.0)
              {
                  values["trailprc"] = order.trail_price.toString();
              }
           }     
          
          let reply = post_request("placeorder", values, token);
          return reply;
        };
    /**
         * Description
         * @method modify_order
         * @param {string} orderno
         * @param {string} exchange
         * @param {string} tradingsymbol
         * @param {integer} newquantity
         * @param {string} newprice_type
         * @param {integer} newprice
         * @param {integer} newtrigger_price
         * @param {integer} bookloss_price
         * @param {integer} bookprofit_price
         * @param {integer} trail_price
         */
         
    self.modify_order = function (modifyparams) {

          let values                  = {'ordersource':'API'};
          values["uid"]           = self.__username;
          values["actid"]         = self.__accountid;
          values["norenordno"]    = modifyparams.orderno;
          values["exch"]          = modifyparams.exchange;
          values["tsym"]          = modifyparams.tradingsymbol;
          values["qty"]           = modifyparams.newquantity.toString();
          values["prctyp"]        = modifyparams.newprice_type;        
          values["prc"]           = modifyparams.newprice.toString();

          if((modifyparams.newprice_type == 'SL-LMT') || (modifyparams.newprice_type == 'SL-MKT'))
          {        
            values["trgprc"] = modifyparams.newtrigger_price.toString();        
          }

          //#if cover order or high leverage order
          if( modifyparams.bookloss_price !== undefined)
          {
              values["blprc"]       = modifyparams.bookloss_price.toString();    
          }
          //#trailing price
          if(modifyparams.trail_price !== undefined)
          {
              values["trailprc"] = modifyparams.trail_price.toString();    
          }
          //#book profit of bracket order   
          if(modifyparams.bookprofit_price !== undefined)
          {
              values["bpprc"]       = modifyparams.bookprofit_price.toString();    
          }            

          let reply = post_request("modifyorder", values, self.__susertoken);
          return reply;
        };

    /**
         * Description
         * @method cancel_order
         * @param {string} orderno     
         */
         
    self.cancel_order = function (orderno) {

          let values            = {'ordersource':'API'};
          values["uid"]         = self.__username;
          values["norenordno"]  = orderno;
          
          let reply = post_request("cancelorder", values, self.__susertoken);
          return reply;
        };   
    /**
         * Description
         * @method exit_order
         * @param {string} orderno
         * @param {string} product_type
         */
         
    self.exit_order = function (orderno, product_type) {

          let values          = {};
          values["uid"]       = self.__username;
          values["norenordno"]  = orderno;
          values["prd"]         = product_type;
          
          let reply = post_request("exitorder", values, self.__susertoken);
          return reply;
        };
    /**
         * Description
         * @method get_orderbook
         * @param no params
         */
         
    self.get_orderbook = function () {

          let values          = {};
          values["uid"]       = self.__username ;
          
          let reply = post_request("orderbook", values, self.__susertoken);
          return reply;
        };
    /**
         * Description
         * @method get_tradebook
         * @param no params
         */
         
    self.get_tradebook = function () {

          let values          = {};
          values["uid"]       = self.__username   ;
          values["actid"]     = self.__accountid   ;       
          
          let reply = post_request("tradebook", values, self.__susertoken);
          return reply;
        };
    /**
         * Description
         * @method get_holdings
         * @param product_type
         */
         
    self.get_holdings = function (product_type='C') {

          let values          = {};
          values["uid"]       = self.__username   ;
          values["actid"]     = self.__accountid   ;       
          values["prd"]       = product_type;

          let reply = post_request("holdings", values, self.__susertoken);
          return reply;
        };
    /**
         * Description
         * @method get_positions
         * @param no params
         */
         
    self.get_positions = function (uid, actid, token) {

          let values          = {};
          values["uid"]       = uid   ;
          values["actid"]     = actid   ;   
          return post_request("positions", values, token);
        };
    /**
         * Description
         * @method get_limits
         * @param optional params
         */
         
    self.get_limits = function (product_type = '', segment = '', exchange = '') {

          let values          = {};
          values["uid"]       = self.__username   ;
          values["actid"]     = self.__accountid   ;

          if (product_type != '')
          {
            values["prd"]       = product_type       
          }
        
        if (product_type != '')
        {
            values["seg"]       = segment       
        }
        
        if (exchange != '')
        {
            values["exch"]       = exchange       
        }
        
          let reply = post_request("limits", values, self.__susertoken);
          return reply;
        };
    /**
         * Description
         * @method start_websocket
         * @param no params
         */
    self.start_websocket = function (callbacks) {

        
        let web_socket = new WS({'url' : API.websocket, 'apikey' : self.__susertoken});
        
        self.web_socket = web_socket;
        let params = {
          'uid' : self.__username,
          'actid' : self.__username,
          'apikey' : self.__susertoken,
        }
        
        web_socket.connect(params, callbacks)
          .then(() => {            
                console.log('ws is connected');
            }); 
     };

    self.subscribe = function (instrument, feedtype) {
          let values = {};
          values['t'] =  't';
          values['k'] = instrument
          self.web_socket.send(JSON.stringify(values));         
    }

    
}


export default NorenRestApi;