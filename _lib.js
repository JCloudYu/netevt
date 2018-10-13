/**
 *	Author: JCloudYu
 *	Create: 2018/10/13
**/
(()=>{
	"use strict";
	
	module.exports = {
		UniqueTimeout(){
			let _active_timeout = null;
	
			return (...args)=>{
				if ( _active_timeout ) {
					clearTimeout(_active_timeout);
				}
				
				return _active_timeout = setTimeout(...args);
			};
		}
	};
})();
