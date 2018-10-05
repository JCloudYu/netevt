/**
 *	Author: JCloudYu
 *	Create: 2018/10/05
**/
(()=>{
	"use strict";
	
	const {NetEvtClient} = require( '../index' );
	const clientInst = new NetEvtClient();
	
	clientInst
	.on( 'connected', (e)=>{
		console.log( "Connected to server!" );
    	e.sender.triggerEvent( "client-event", "asdfasdfasdf" );
	})
	.on( 'disconnected', (e)=>{
		console.log( `Disconnected from server!` );
	})
	.on( 'data', (e)=>{
		let parsed = JSON.parse(e.rawData);
		console.log( `Receiving data from server` );
		console.log(parsed);
	})
	.on( 'server-event', (e)=>{
		const {type, rawData, sender:server} = e;
		console.log( `Receiving event: ${type} from server: ${rawData.toString()}` );
		
		server.sendData(JSON.stringify({
			a:1, b:2, c:3,
			d:4, e:5, f:"123456"
		}));
	})
	.connect( 12334, 'localhost' );
})();
