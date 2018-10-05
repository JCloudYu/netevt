/**
 *	Author: JCloudYu
 *	Create: 2018/10/04
**/
(()=>{
	"use strict";
	
	Object.defineProperties(module.exports = {}, {
		NetEvtClient: {get:()=>{return require('./client').NetEvtClient;}, enumerable:true},
		NetEvtServer: {get:()=>{return require('./server').NetEvtServer;}, enumerable:true}
	});
})();
