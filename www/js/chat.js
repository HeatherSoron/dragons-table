function onChat(msg) {
	var d=document.createElement('div');
	d.className='chat-message';
	d.innerHTML=msg.data;
	var el=document.getElementById('chat-scroll');
	el.appendChild(d);
	el.scrollTop = el.scrollHeight
}

function initChatLog() {
	var chat=document.getElementById('chat-text');
	chat.addEventListener('keydown',function(evt){
		// enter
		if (evt.keyCode == 13) {
			handleChatMessage(evt,chat);
		}
	})
}

function handleChatMessage(evt,chat) {
	// TODO: Check for option or something to insert a literal newline.
	app.socket.emit('chat',{type:'chat',data:chat.value});
	chat.value=''
	evt.preventDefault();
}