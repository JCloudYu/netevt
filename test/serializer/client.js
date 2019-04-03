/**
 *	Author: JCloudYu
 *	Create: 2018/10/05
**/
(()=>{
	"use strict";
	
	const crypto = require( 'crypto' );
	const {NetEvtClient} = require( '../../index' );
	const clientInst = new NetEvtClient();
	
	
	clientInst._serializer = (input)=>{return JSON.stringify(input);};
	clientInst._deserializer = (input)=>{return JSON.parse(input);};
	
	clientInst
	.on( 'connected', (e)=>{
		console.log( "Connected to server!" );
		let data = crypto.randomBytes(((Math.random()*1526)|0) + 512);
		console.log(`Sending data with ${data.length} bytes to server`);
		e.sender.triggerEvent( "client-event", {
			buff: data.toString('hex')
		});
	})
	.on( 'disconnected', (e)=>{
		console.log( `Disconnected from server!` );
	})
	.on( 'data', (e, data)=>{
		let parsed = data;
		console.log( `Receiving data from server` );
		console.log(parsed);
	})
	.on( 'server-event', (e, parsed)=>{
		const {type, sender:server} = e;
		console.log( `Receiving event: ${type} from server:`, parsed );
		
		server.sendData({
			a:1, b:2, c:3,
			d:4, e:5, f:"123456"
		});
	})
	.connect( 12334, 'localhost' );
})();
