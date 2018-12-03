/**
 *	Author: JCloudYu
 *	Create: 2018/10/04
**/
(()=>{
	"use strict";
	
	const {UniqueTimeout} = require( './_lib' );
	const {Socket} = require( 'net' );
	const {EventEmitter} = require( 'jsboost/native/event-emitter' );
	
	const _NO_DATA = new ArrayBuffer(0);
	const _DATA_PROCESS_LOOP = 15;
	const _WEAK_REL = new WeakMap();
	class NetEvtSocket extends EventEmitter {
		constructor(socket=null, serverInst=null) {
			super();
			
			socket = socket || new Socket();
			_WEAK_REL.set(this, {
				_parent: serverInst,
				_socket: socket,
				_connected: false,
				_error: null,
				_chunk: Buffer.alloc(0),
				_timeout: UniqueTimeout()
			});
			
			socket
			.on( 'connect', ___HANDLE_CONNECT.bind(this) )
			.on( 'close', ___HANDLE_CLOSE.bind(this) )
			.on( 'error', ___HANDLE_ERROR.bind(this) )
			.on( 'data', ___HANDLE_DATA.bind(this) );
			
			this._serializer = null;
			this._deserializer = null;
		}
		sendData(data) {
			const {_socket} = _WEAK_REL.get(this);
			if ( this._serializer ) {
				data = this._serializer(data);
			}
			
			const buffer = Buffer.from(data);
			const header = Buffer.alloc(1 + 4);
			header[0] = 0;
			header.writeUInt32LE(buffer.length, 1);
			_socket.write(Buffer.concat([header, buffer]));
		}
		triggerEvent(event, data=null) {
			const {_socket} = _WEAK_REL.get(this);
			const eventBuffer = Buffer.from(event);
			const eventHeader = Buffer.alloc(2);
			eventHeader.writeUInt16LE(eventBuffer.length, 0);
			
			
			if ( arguments.length < 2 ) {
				data = _NO_DATA;
			}
			else
			if ( this._serializer ) {
				data = this._serializer(data);
			}
			
			const dataBuffer = Buffer.from(data);
			const dataHeader = Buffer.alloc(4);
			dataHeader.writeUInt32LE(dataBuffer.length, 0);
			_socket.write(Buffer.concat([Buffer.from([1]), eventHeader, eventBuffer, dataHeader, dataBuffer]));
		}
		connect(...args) {
			const {_socket} = _WEAK_REL.get(this);
			return _socket.connect(...args);
		}
		close() {
			const {_socket} = _WEAK_REL.get(this);
			return _socket.end();
		}
		
		get lastError() {
			const {_error} = _WEAK_REL.get(this);
			return _error;
		}
		get connected() {
			const {_connected} = _WEAK_REL.get(this);
			return _connected;
		}
		get connecting() {
			const {_socket} = _WEAK_REL.get(this);
			return _socket.connecting;
		}
		get _socket() {
			const {_socket} = _WEAK_REL.get(this);
			return _socket;
		}
	}
	module.exports = {NetEvtSocket};
	
	
	
	function ___HANDLE_CONNECT() {
		const _PRIVATES = _WEAK_REL.get(this);
		_PRIVATES._connected = true;
		
		this.emit( 'connected', { type:'connected', sender:this });
		
		// The connect event won't fire in server's request socket, so the server-side connected event is handled in server directly
		/*
		if ( _PRIVATES._parent ) {
			_PRIVATES._parent.emit( 'connected', {type:'connected', sender:this} );
		}
		*/
	}
	function ___HANDLE_CLOSE(withError) {
		const _PRIVATES = _WEAK_REL.get(this);
		_PRIVATES._connected = false;
		
		let error = withError ? (_PRIVATES._error||null) : null;
		this.emit( 'disconnected', { type:'disconnected', sender:this, error });
		if ( _PRIVATES._parent ) {
			_PRIVATES._parent.emit( 'disconnected', {type:'disconnected', sender:this, error} );
		}
	}
	function ___HANDLE_ERROR(error) {
		const _PRIVATES = _WEAK_REL.get(this);
		_PRIVATES._connected = false;
		_PRIVATES._error = error;
		
		this.emit( 'error', { type:'error', sender:this, error });
		if ( _PRIVATES._parent ) {
			_PRIVATES._parent.emit( 'error', {type:'error', sender:this, error} );
		}
	}
	function ___HANDLE_DATA(chunk) {
		const _PRIVATES = _WEAK_REL.get(this);
		_PRIVATES._chunk = Buffer.concat([_PRIVATES._chunk, chunk]);
		_PRIVATES._timeout(___PROCESS_MESSAGE.bind(this), 0, _PRIVATES);
	}
	function ___PROCESS_MESSAGE(PRIVATES) {
		let repeat	 = _DATA_PROCESS_LOOP;
		let messages = [];
		let result	 = false;
		while ( repeat-- > 0 ) {
			result	= ___EAT_MESSAGE(PRIVATES._chunk);
			if ( !result ) break;
			
			let {event, raw, anchor} = result;
			PRIVATES._chunk = PRIVATES._chunk.slice(anchor);
			messages.push({event, raw});
		}
	
	
		// Emit message
		if ( !this._deserializer ) {
			for (let msg of messages) {
				const EVT_ARGS = [
					msg.event,
					{ type:msg.event, sender:this, rawData:msg.raw }
				];
			
				this.emit( ...EVT_ARGS );
				if ( PRIVATES._parent ) {
					PRIVATES._parent.emit( ...EVT_ARGS );
				}
			}
		}
		else {
			for (let msg of messages) {
				const EVT_ARGS = [
					msg.event,
					{ type:msg.event, sender:this, rawData:msg.raw }
				];
				
				if ( msg.raw.length > 0 ) {
					EVT_ARGS.push(this._deserializer(msg.raw));
				}
				this.emit( ...EVT_ARGS );
				if ( PRIVATES._parent ) {
					PRIVATES._parent.emit( ...EVT_ARGS );
				}
			}
		}
		
		// Hook next processing loop if there's still remaining data
		if ( PRIVATES._chunk.length > 0 && result ) {
			PRIVATES._timeout(___PROCESS_MESSAGE.bind(this), 0, PRIVATES);
		}
	}
	function ___EAT_MESSAGE(chunk) {
		if ( chunk.length <= 0 ) {
			return false;
		}
		
		const type = chunk[0];
		switch( type ) {
			case 1:
			{
				let content, result, anchor=1;
				
				result = ___EAT_EVENT_TAG(chunk, anchor);
				if ( !result ) { return false; }
				({content, anchor} = result);
				let event = content.toString( 'utf8' );
				
				result = ___EAT_EVENT_DATA(chunk, anchor);
				if ( !result ) { return false; }
				({content, anchor} = result);
				
				return { event, raw:content, anchor };
			}
			
			case 0:
			default:
			{
				let result, content, anchor = 1;
				result = ___EAT_EVENT_DATA(chunk, anchor);
				if ( !result ) { return false; }
				({content, anchor} = result);
				
				return { event:'data', raw:content, anchor };
			}
		}
	}
	function ___EAT_EVENT_TAG(buff, anchor) {
		if ( buff.length < (anchor + 2) ) {
			return false;
		}
	
		let contentLength = buff.readUInt16LE(anchor);
		anchor += 2;
		
		if ( buff.length < (anchor + contentLength)) {
			return false;
		}
		
		let content = buff.slice(anchor, anchor+contentLength);
		anchor += contentLength;
		
		return {content, anchor};
	}
	function ___EAT_EVENT_DATA(buff, anchor) {
		if ( buff.length < (anchor + 4) ) {
			return false;
		}
	
		let contentLength = buff.readUInt32LE(anchor);
		anchor += 4;
		
		if ( buff.length < (anchor + contentLength)) {
			return false;
		}
		
		let content = buff.slice(anchor, anchor+contentLength);
		anchor += contentLength;
		
		return {content, anchor};
	}
})();
