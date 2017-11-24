require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

"use strict";

var utils = require('./utils/utils.js');

var Admin = function (neb) {
	this._requestHandler = neb._requestHandler;
};

Admin.prototype.newAccount = function (passphrase) {
	var params = {"passphrase": passphrase};
	return this.request("post", "/v1/account/new", params);
};

Admin.prototype.unlockAccount = function (address, passphrase) {
	var params = {"address": address,
	 "passphrase": passphrase};
	return this.request("post", "/v1/account/unlock", params);
};

Admin.prototype.lockAccount = function (address) {
	var params = {"address": address};
	return this.request("post", "/v1/account/lock", params);
};

Admin.prototype.signTransaction = function (from, to, value, nonce, source, args, gasPrice, gasLimit) {
	var params = {"from": from,
	"to": to,
	"value": utils.toString(value),
	"nonce": nonce,
	"source": source,
	"args": args,
	"gasPrice": utils.toString(gasPrice),
	"gasLimit": utils.toString(gasLimit)
	};
	return this.request("post", "/v1/sign", params);
};

Admin.prototype.sendTransactionWithPassphrase = function (from, to, value, nonce, source, args, gasPrice, gasLimit, passphrase) {
	var params = {"from": from,
	"to": to,
	"value": utils.toString(value),
	"nonce": nonce,
	"source": source,
	"args": args,
	"gasPrice": utils.toString(gasPrice),
	"gasLimit": utils.toString(gasLimit),
	"passphrase": passphrase
	};
	return this.request("post", "/v1/transactionWithPassphrase", params);
};

Admin.prototype.request = function (method, api, params) {
	return this._requestHandler.request(method, api, params);
};

module.exports = Admin;
},{"./utils/utils.js":6}],2:[function(require,module,exports){

"use strict";

var utils = require('./utils/utils.js');

var API = function (neb) {
	this._requestHandler = neb._requestHandler;
};

API.prototype.getNebState = function () {
	return this.request("get", "/v1/neb/state");
};

API.prototype.nodeInfo = function () {
	return this.request("get", "/v1/node/info");
};

API.prototype.accounts = function () {
	return this.request("get", "/v1/accounts");
};

API.prototype.blockDump = function (count) {
	var params = {"count":count};
	return this.request("post", "/v1/block/dump", params);
};

API.prototype.getAccountState = function (address) {
	var params = {"address":address};
	return this.request("post", "/v1/account/state", params);
};

API.prototype.sendTransaction = function (from, to, value, nonce, source, args, gasPrice, gasLimit) {
	var params = {"from": from,
	"to": to,
	"value": utils.toString(value),
	"nonce": nonce,
	"source": source,
	"args": args,
	"gasPrice": utils.toString(gasPrice),
	"gasLimit": utils.toString(gasLimit)
	};
	return this.request("post", "/v1/transaction", params);
};

API.prototype.call = function (from, to, nonce, func, args, gasPrice, gasLimit) {
	var params = {"from": from,
	"to": to,
	"nonce": nonce,
	"function": func,
	"args": args,
	"gasPrice": utils.toString(gasPrice),
	"gasLimit": utils.toString(gasLimit)
	};
	return this.request("post", "/v1/call", params);
};

API.prototype.sendRawTransaction = function (data) {
	var params = {"data": data};
	return this.request("post", "/v1/rawtransaction", params);
};

API.prototype.getBlockByHash = function (hash) {
	var params = {"hash": hash};
	return this.request("post", "/v1/getBlockByHash", params);
};

API.prototype.getTransactionReceipt = function (hash) {
	var params = {"hash": hash};
	return this.request("post", "/v1/getTransactionReceipt", params);
};

API.prototype.request = function (method, api, params) {
	return this._requestHandler.request(method, api, params);
};

module.exports = API;
},{"./utils/utils.js":6}],3:[function(require,module,exports){

"use strict";

var XMLHttpRequest;

// browser
if (typeof window !== "undefined" && window.XMLHttpRequest) {
  XMLHttpRequest = window.XMLHttpRequest;
// node
} else {
  XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  // XMLHttpRequest = require('xhr2');
}

var HttpRequest = function (host, timeout) {
	this.host = host || "http://localhost:8191";
	this.timeout = timeout || 0;
};

HttpRequest.prototype.setHost = function (host) {
	this.host = host || "http://localhost:8191";
};

HttpRequest.prototype._newRequest = function (method, api, async) {
	var request = new XMLHttpRequest();
	var m = "GET";
	if (method.toUpperCase() === "POST") {
		m = "POST";
	}
	var url = this.host + api;
	request.open(m, url, async);
	return request;
};

HttpRequest.prototype.request = function (method, api, payload) {
	var request = this._newRequest(method, api, false);
	try {
		if (payload === undefined || payload === "") {
			request.send();
		} else {
			request.send(JSON.stringify(payload));
		}
	} catch (error) {
		throw error;
	}

	var result = request.responseText;
	try {
		result = JSON.parse(result);
	} catch (e) {
		throw e;
	}

	return result;
};

HttpRequest.prototype.asyncRequest = function (method, api, payload, callback) {
	var request = this._newRequest(method, api, true);
	request.onreadystatechange = function () {
	    if (request.readyState === 4 && request.timeout !== 1) {
	      var result = request.responseText;
	      var error = null;

	      try {
	        result = JSON.parse(result);
	      } catch (e) {
	        var message = !!result && !!result.error && !!result.error.message ? result.error.message : "Invalid response: " + JSON.stringify(result);
        	error = new Error(message);
	      }

	      callback(error, result);
	    }
	};

	request.ontimeout = function () {
		callback(new Error("connection timeout"));
	};

	try {
		if (payload === undefined || payload === "") {
		request.send();
	} else {
		request.send(JSON.stringify(payload));
	}
	} catch (error) {
		callback(error);
	}
};

module.exports = HttpRequest;
},{"xmlhttprequest":5}],4:[function(require,module,exports){

"use strict";

var HttpRequest = require("./httprequest.js");

var API = require("./api.js");
var Admin = require("./admin.js");

var Neb = function (request) {
	if (request) {
		this._requestHandler = request;
	} else {
		this._requestHandler = new HttpRequest();
	}

	this.api = new API(this);
	this.admin = new Admin(this);
};

Neb.prototype.setRequestHandler = function (request) {
	this._requestHandler = request;
};

module.exports = Neb;
},{"./admin.js":1,"./api.js":2,"./httprequest.js":3}],5:[function(require,module,exports){
"use strict";

if (typeof XMLHttpRequest === "undefined") {
    exports.XMLHttpRequest = {};
} else {
    exports.XMLHttpRequest = XMLHttpRequest; // jshint ignore:line
}


},{}],6:[function(require,module,exports){


var BigNumber = require('bignumber.js');

var isBigNumber = function (obj) {
    return obj instanceof BigNumber ||
        (obj && obj.constructor && obj.constructor.name === 'BigNumber');
};

var isString = function (obj) {
    return typeof obj === 'string' && obj.constructor === String;
};

var isObject = function (obj) {
    return obj !== null && typeof obj === 'object';
};

var toBigNumber = function (number) {
	number = number || 0;
	if (isBigNumber(number)) {
		return number;
	}
	if (isString(number) && number.indexOf('0x') === 0) {
        return new BigNumber(number.replace('0x',''), 16);
    }
    return new BigNumber(number.toString(10), 10);
};

var toString = function (obj) {
	if (isString(obj)) {
		return obj;
	} else if (isBigNumber(obj)) {
		return obj.toString(10);
	} else if (isObject(obj)) {
		return JSON.stringify(obj);
	} else {
		return obj + "";
	}
};

module.exports = {
	isBigNumber: isBigNumber,
	isString: isString,
	isObject: isObject,
	toBigNumber: toBigNumber,
	toString: toString
};

},{"bignumber.js":"bignumber.js"}],7:[function(require,module,exports){

},{}],"bignumber.js":[function(require,module,exports){
'use strict';

module.exports = BigNumber; // jshint ignore:line


},{}],"neb":[function(require,module,exports){
var Neb = require('./lib/neb');

// dont override global variable
if (typeof window !== 'undefined' && typeof window.Neb === 'undefined') {
    window.Neb = Neb;
}

module.exports = Neb;

},{"./lib/neb":4}]},{},["neb"])
//# sourceMappingURL=neb-light.js.map
