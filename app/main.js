let guilds = [];
let current_guild = "732633809241243679";
let blockedusers = [];
let addonnames = [];
let addons = [];
let wl_tags = ["i", "/i", "b", "/b", "text", "/text", "h2", "/h2", "h3", "/h3", "h4", "/h4", "h5", "/h5", "strike", "/strike", "u", "/u", "p", "/p", "code", "/code"];
let themes = [];
let typing = false;

/*function setStatus() {
	var popup = new JSONPopup({
		title: "Status",
		submit: "OK",
		fields: [
			{type: 0, name: "Setze deinen Status."},
			{type: 1, name: "Text", length: -1}
		]
	});
	PopupManager.setPopup(popup);
	popup.submit = function() {
		PopupManager.closePopup();
		// this.fields[1].e.value;
		client.user.setPresence({
			status: 'online',
			activity: {
				name: this.fields[1].e.value,
				type: "PLAYING"
			}
		});
		setTimeout(function() {
			updateUserRegion();
		}, 100);
	};
}*/

function setStatus() {
	var popup = new JSONPopup({
		title: "Change Status",
		submit: "OK",
		fields: [
			{type: 1, name: "Name: ", length: -1},
			{type: 4, name: "Typ: ", options: ["PLAYING", "STREAMING", "WATCHING", "LISTENING"]},
			{type: 1, name: "URL: ", length: -1},
			{type: 4, name: "Onlinestatus: ", options: ["online", "dnd", "idle", "invisible"]}
		]
	});
	PopupManager.setPopup(popup);
	popup.submit = function() {
		PopupManager.closePopup();
		client.user.setPresence({
			status: this.fields[3].e.value,
			activity: {
				name: this.fields[0].e.value,
				type: this.fields[1].e.value,
				url: this.fields[2].e.value
			}
		});
		setTimeout(function() {
			updateUserRegion();
		}, 100);
	};
}

function sendMsg() {
	$("typing").innerHTML = "";
	var channel = client.channels.cache.get(current_channel); // uff das war eig. so ez fix xD
	//if(!channel) channel = client.users.cache.get($("channelid").value); // for DMs
	/*if(!channel) {
		$("channelid").value = "Invalid Channel/User ID";
		return;
	}*/
	/*if($("inputbox-inner").value.startsWith("/embed") && channel) {
		channel.send(embed($("inputbox-inner").value.split(" ")[1], $("inputbox-inner").value.split(" ")[2], "success", $("inputbox-inner").value.split(" ")[3]));
		$("inputbox-inner").value = "";
		return;
	}*/
	if($("inputbox-inner").value && channel) channel.send(parseMsg($("inputbox-inner").value)).catch(error => {
		if(error.message == "Missing Permissions")  {
			alert("You don't have permissions to write in this channel!");
		}
	});
	for(var i = 0; i < addons.length; i++) {
		if(addons[i].onmsg) addons[i].onmsg($("inputbox-inner").value);
	}
	$("inputbox-inner").value = "";
}

function switchChannel(id) {
	$("typing").innerText = "";
	var channel = client.channels.cache.get(id);
	var guild = channel.guild;
	if(!channel) return;
	if(channel.type == "text" || channel.type == "voice") {
		console.log(channel.permissionsFor(guild.me).toArray());
		current_channel = channel.id;
		while($("chat-history").children.length > 0) {
			$("chat-history").removeChild($("chat-history").children[0]);
		}
		if(channel.viewable && channel.permissionsFor(guild.me).has("VIEW_CHANNEL") && channel.permissionsFor(guild.me).has("READ_MESSAGE_HISTORY")) {
			if(channel.type == "text") {
				channel.messages.fetch(20)
					.then(msgs => {
						var history = msgs.array();
						for(var i = history.length - 1; i >= 0; i--) {
							$("chat-history").appendChild(createMessageDiv(history[i]))
						}
						$("chat-history").children[$("chat-history").children.length-1].scrollIntoViewIfNeeded();
					})
					.catch(error => console.log("Could not load message history: " + error));
			} else if(channel.type == "voice") {
				$("chat-history").appendChild(createMessageDiv("Voice Channel view work in progress..."))
			}
		} else {
			if(channel.type == "text") {
				$("chat-history").appendChild(createMessageDiv("You can't read the message history of this channel."));
			} else {
				$("chat-history").appendChild(createMessageDiv("You can't view this channel!"));
			}
		}
		reloadChannelList();
		for(var i = 0; i < addons.length; i++) {
			if(addons[i].onchannelswitched) addons[i].onchannelswitched();
		}
		$("inputbox-inner").focus();
		if(!guild) {
			$("inputbox-inner").placeholder = "Guild error.";
			$("inputbox-inner").disabled = true;
		} else if(channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
			$("inputbox-inner").placeholder = "Send messages to #" + channel.name;
			$("inputbox-inner").disabled = false;
		} else {
			$("inputbox-inner").placeholder = "You don't have permissions to write in this channel.";
			$("inputbox-inner").disabled = true;
		}
	}
}

function reloadChannelList() {
	var channelsDiv = $("channel-list");
	var guild = client.guilds.cache.get(current_guild);
	var channels = guild.channels.cache.array();
	while(channelsDiv.children.length > 0) {
		channelsDiv.removeChild(channelsDiv.children[0]);
	}
	for(var i = 0; i < channels.length; i++) {
		if(!channels[i].parent && channels[i].type != "category") {
			channelsDiv.appendChild(createChannelDiv(channels[i]));
		}
	}
	for(var i = 0; i < channels.length; i++) {
		if(!channels[i].parent && channels[i].type == "category") {
			channelsDiv.appendChild(createChannelDiv(channels[i]));
		}
	}
}

function updateUserRegion() {
	$("user-region-name").innerText = client.user.tag;
	$("user-region-avatar").style.backgroundImage = "url('" + client.user.displayAvatarURL() + "')";
	var status = "CustomDiscord";
	var prefix = "\u2753"; // question mark
	if(client.user.presence.activities[0]) {
		status = client.user.presence.activities[0].name;
		if(client.user.presence.activities[0].type == "PLAYING") prefix = "\u{1F3AE}"; // game controller
		if(client.user.presence.activities[0].type == "WATCHING") prefix = "\u{1F5A5}"; // monitor
		if(client.user.presence.activities[0].type == "LISTENING") prefix = "\u{1F3A7}"; // headphones
		if(client.user.presence.activities[0].type == "STREAMING") prefix = "\u{1F3A5}"; // video camera
	}
	$("user-region-status").innerText = prefix + "\u00A0" + status.replaceAll(" ", "\u00A0"); // replaces spaces with no-break-spaces
}

window.addEventListener("load", () => {
	$("inputbox-inner").addEventListener('keydown', function (e){
		if($("inputbox-inner").value == "") {
			typing = false;
			return;
		} else {
			var channel = client.channels.cache.get(current_channel);
			if(channel.type == "text") {
				channel.startTyping();
			}
		}
	});
	/*addonnames = bg.get("addons").split(", ");*/
	//console.log(addonnames);
		
	$("client").addEventListener("keydown", (event) => {
		if(!event.ctrlKey) {
			$("inputbox-inner").focus();
		}
		console.log("keydown on client");
	});
	
	$("inputbox").addEventListener("keydown", function(event) { // to make sure \n isnt at the end
	  	if(event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
		}
		$("inputbox-a").innerText = "#" + $("inputbox-inner").value + "#";
		$("inputbox-inner").style.height = $("inputbox-a").clientHeight + 5;
	});
	
	$("inputbox").addEventListener("keyup", function(event) {
	  	if(event.keyCode === 13 && !event.shiftKey) {
	   		sendMsg();
		}
		$("inputbox-a").innerText = "#" + $("inputbox-inner").value + "#";
		$("inputbox-inner").style.height = $("inputbox-a").clientHeight + 5;
	});
	
	$("btnstatuschange").addEventListener("click", function(event) {
		//setStatus();
	});
	
	$("user-region-settings").addEventListener("click", event => {
		var popup = new JSONPopup({
			title: "Settings",
			submit: "Save",
			fields: [
				{type: 0, name: "Willkommen in den Benutzereinstellungen."},
				{type: 5, name: "Status", action: "setStatus"},
				{type: 4, name: "Theme: ", options: ["theme-dark", "theme-default"], default: bg.getSetting("theme")}
			]
		});
		popup.submit = () => {
			bg.setSetting("theme", popup.fields[2].e.value);
			setTheme(popup.fields[2].e.value);
		}
		PopupManager.setPopup(popup);
	});
	$("user-region-settings").title = "Benutzereinstellungen";
	$("user-region-status").addEventListener("click", setStatus);
	
	PopupManager.init();
	
	setTheme(bg.getSetting("theme") || "theme-default");
});
// #RoadTo500Lines