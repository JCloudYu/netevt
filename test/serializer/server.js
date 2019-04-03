/**
 *	Author: JCloudYu
 *	Create: 2018/10/05
**/
(()=>{
	"use strict";
	
	const {NetEvtServer} = require('../../index');
	const ServerInst = new NetEvtServer();
	ServerInst._serializer = (input)=>{return JSON.stringify(input);};
	ServerInst._deserializer = (input)=>{return JSON.parse(input);};
	
	
	
	ServerInst
	.on('connected', (e)=>{
		let client = e.sender;
		client.id = Date.now();
		
		console.log( `Client (${client.id}) has connected!` );
	})
	.on('disconnected', (e)=>{
		let client = e.sender;
		console.log( `Client (${client.id}) has disconnected!` );
	})
	.on('data', (e, data)=>{
		const {sender:client} = e;
		let parsed = data;
		console.log(`Receiving data from client (${client.id})`);
		console.log(parsed);
		
		e.sender.sendData({
			a:"1", b:"2",
			c:"3", d:"4",
			e:"5", f:123456
		});
	})
	.on('client-event', (e, parsed)=>{
		const {type, sender:client} = e;
		console.log(`Receiving event: ${type} from ${client.id} `, parsed);
		
    	client.triggerEvent( "server-event", parsed );
	})
	.listen( 12334, 'localhost' );
})();
