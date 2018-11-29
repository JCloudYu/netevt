/**
 *	Author: JCloudYu
 *	Create: 2018/10/04
**/
(()=>{
	"use strict";
	
	const net = require( 'net' );
	const {EventEmitter} = require( 'jsboost/native/event-emitter' );
	const {NetEvtSocket} = require( './socket' );
	
	
	class NetEvtServer extends EventEmitter {
		constructor() {
			super();
			
			this.server = net.createServer()
			.on( 'connection', ___HANDLE_CONNECTION.bind(this) )
			.on( 'close', ___HANDLE_CLOSE.bind(this) )
			.on( 'error', ___HANDLE_ERROR.bind(this) );
			
			this._serializer = null;
			this._deserializer = null;
		}
		listen(...args) {
			this.server.listen(...args);
			return this;
		}
	}
	module.exports = {NetEvtServer};
	
	
	
	function ___HANDLE_CONNECTION(socket) {
		let netSock = new NetEvtSocket(socket, this);
		netSock._serializer	  = this._serializer;
		netSock._deserializer = this._deserializer;
		
		this.emit( 'connected', {type:'connected', sender:netSock});
	}
	function ___HANDLE_CLOSE() {
		this.emit('close', {type:'close', sender:this});
	}
	function ___HANDLE_ERROR() {
		this.emit('close', {type:'close', sender:this});
	}
})();
