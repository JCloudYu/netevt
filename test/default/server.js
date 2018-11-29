/**
 *	Author: JCloudYu
 *	Create: 2018/10/05
**/
(()=>{
	"use strict";
	
	const {NetEvtServer} = require('../../index');
	
	(new NetEvtServer())
	.on('connected', (e)=>{
		let client = e.sender;
		client.id = Date.now();
		
		console.log( `Client (${client.id}) has connected!` );
	})
	.on('disconnected', (e)=>{
		let client = e.sender;
		console.log( `Client (${client.id}) has disconnected!` );
	})
	.on('data', (e)=>{
		const {sender:client, rawData} = e;
		let parsed = JSON.parse(rawData.toString());
		console.log(`Receiving data from client (${client.id})`);
		console.log(parsed);
		
		e.sender.sendData(JSON.stringify({
			a:"1", b:"2",
			c:"3", d:"4",
			e:"5", f:123456
		}));
	})
	.on('client-event', (e)=>{
		const {type, sender:client, rawData} = e;
		let data = rawData.toString();
		console.log(`Receiving event: ${type} from ${client.id}: ${data} (${data.length})`);
		
    	client.triggerEvent( "server-event", rawData );
	})
	.listen( 12334, 'localhost' );
})();
