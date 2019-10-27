/*
	copyright 2019 uchenna ajah,
	referenced as ucscode,
	website https://ucscode.com,
	released on github : 27/10/2019
	version: 1.0.0
*/

"use strict";

/* 
	LIVECHATFREEDOM OBJECT KEYS FOR CONSTRUCTOR
	============================================
	
	theme = color of chat box; 
	values: crimson, leaf, dark or blue
	----------------------------------
	name = company name of chat,
	value: user defined
	-----------------------------------
	action = path/to/livechatfreedom.php [relative|absolute]
	value: user defined
	-------------------------------------
	message = default message on the chat box that will show to visitor on their first visit
	value: user defined
	--------------------------------------
	admin = tell LiveChatFreedom App that you are admin and will be replying to visitor's chats from backend, 
	value: true
	--------------------------------------
	password = a valid password for authorization and verification that you are an admin
	value: user defined
	
*/

var currentScript = document.currentScript; // The current script running

function scriptPath(dir = '') {
	var script = currentScript.src.split("/"), x;
	script = script.filter(function(val, key) {
		if(val == '') val = '\/';
		if(key !== script.length - 1) return val;
	});
	dir = dir.split('/');
	for(x = 0; x < dir.length; x++) {
		if(dir[x] == '..') {
			script.pop();
			dir[x] = null;
		};
	}
	dir = dir.filter(function(val) {
		if(val) return val;
	})
	script = script.join('/');
	dir = dir.join('/');
	var href = script + '/' + dir;
	return href;
}

function LiveChatFreedom(e) {
	
	function isObject(el) {
		return typeof el === "object" && !Array.isArray(el) && el !== null; // verify that a value is strictly an object `{}`
	}
	
	if(typeof e === 'undefined') return console.error('Missing object argument in LiveChatFreedom Constructor');
	else if(!isObject(e)) return console.error('Argument is not an object in LiveChatFreedom Constructor');
	
	if(document.querySelector('.lcf-app') !== null) return; // prevent unwanted recreation of chatapp
	
	if(!e.action) return console.error("Missing key \"action\" in argument of LiveChatFreedom Constructor");
	
	if(e.admin) {
		if(e.password == undefined || e.password == null) {
			console.error("Running LiveChatFreedom as Admin Requires a valid Password to be set as key in the Constructor's Object");
			return;
		}
	};
	
	var f = (function(e) {
		return e.admin === true ? false : true;
	})(e);
	
	var isValidAdmin = false, i, interval = [];
	
	function createElementNodes(classArray) { 
		/* 
			# argument of this function must be an array with values having a format 'tagName:ClassName'
			# value format for multiple elements = 'tagName:ClassName, tagName:ClassName, ...';
		*/
		
		var x, y, nodeAttr, nodes = [];
		
		for(x = 0; x < classArray.length; x++) { // for each value in the array
			
			var nodeList = classArray[x].split(','); // split the current value by comma
			
			for(y = 0; y < nodeList.length; y++) { 
				
				// for each of the comma splited values...
			
				nodeAttr = nodeList[y].split(':'); // split the sub values by colon
				
				nodes[x] = document.createElement(nodeAttr[0].trim()); // create an Element using the tagName
				nodes[x].setAttribute('class', nodeAttr[1].trim()); // set class Attribute using the className
				
				if(x != 0) {
					nodes[x - 1].appendChild(nodes[x]); // append the newly created element to the previous created
				}
			}
		}
		return nodes[0];
	}
	
	var $a = (f) ? ' lcf-default' : ' lcf-admin'; 
	
	var node = []; // empty array;
	
	/* create the chat app elements and push them into the empty array */
	
	node.push(createElementNodes(['div:lcf-origin' + $a, 'div:lcf-app']));
	node.push(createElementNodes(['div:lcf-board', 'div:lcf-header, button:lcf-minimize']));
	node.push(createElementNodes(['div:lcf-chatbox', 'div:lcf-chatflow']));
	node.push(createElementNodes(['div:lcf-sendbox', 'form:lcf-form', 'textarea:lcf-input, input:lcf-btn']));
	node.push(createElementNodes(['div:lcf-footer']));
	
	function developLiveChat(nodes, e) {
		
		var x;
		for(x = 1; x < nodes.length; x++) {
			node[0].querySelector('.lcf-app').appendChild(nodes[x]); // append all the created elements to the first node created
		};
		
		/* create a function to store the elements as an app */
		
		function app($elem, A = false) {
			if(!$elem) return node[0].querySelector('.lcf-app');
			else {
				if(A) return node[0].querySelector('.lcf-app').querySelectorAll($elem);
				else return node[0].querySelector('.lcf-app').querySelector($elem);
			}
		};
		
		/* allow easier implementation of new attributes */
		
		var el = app('*', true);
		for(x = 0; x < el.length; x++) {
			el[x].__proto__.attr = function(a) {
				var key;
				for(key in a) {
					this.setAttribute(key, a[key])
				}
				return this;
			};
		}
		
		/* SET THEME FOR THE APP */
		
		var themes = ['crimson', 'leaf', 'blue', 'dark'], theme;
		if(!e.theme || !themes.includes(e.theme) || e.theme == 'default') e.theme = 'lcf-crimson';
		else e.theme = 'lcf-' + e.theme;
		app().classList.add(e.theme);
		
		/* SET NAME FOR THE APP */
		
		if(typeof e.name == 'string') app('.lcf-header').innerText = e.name;
		else app('.lcf-header').innerText = 'LIVECHAT FREEDOM';
		
		// ADD SOME REQUIRED ATTRIBUTES
		
		app('.lcf-minimize').innerHTML = "&minus;";
		app('.lcf-sendbox textarea.lcf-input').attr({name:'message', placeholder:'message...', rows:1});
		app('.lcf-sendbox input.lcf-btn').attr({name:'send', value:'send', type:'submit'});
		app('.lcf-footer').innerHTML = 'powered by <a href="https://ucscode.com" target="_blank">UCSCODE</a>';
		app('form').attr({method:"post", action:e.action});
		
		// allow message to send when ``ENTER`` key is pressed.
		
		app('textarea').addEventListener('keyup', function(e) {
			var keyCode = e.which || e.keyCode;
			if(keyCode === 13) {
				this.value = this.value.slice(0, -1);
				app('input.lcf-btn').click();
			}
		});
		
		// send the message when submitted
		
		app('form').onsubmit = function(e) {
			e.preventDefault();
			var message = app('textarea').value.trim();
			if(!message) return;
			else {
				if(this.action == location.href) return console.warn('LiveChatFreedom requires action to be set');
				var chat = newChat(true, message); // see [later] the newChat function constructor below
				var f = isValidAdmin ? false : true;
				var msg = JSON.stringify({ 
					front : f,
					message : message,
					id : ID
				});
				send(msg, chat); // see [later] the send function constructor below
			}
		}
		
		/* function to minimize or maximize (pop up) the chat app */
		
		function minimize(M) {
			var Area = [];
			Area[0] = app('.lcf-chatbox');
			Area[1] = app('.lcf-sendbox');
			Area[2] = app('.lcf-footer');
			
			var isHidden = Area[0].classList.contains('lcf-hidden');
			if(M !== undefined) isHidden = M; 
			
			// IF M == true; CHAT APP POPS OUT;
			// IF M === false; CHAT APP POPS OFF
			// IF M === undefined; CHAT APP TOGGLES (default)
			
			var x;
			for(x = 0; x < Area.length; x++) {
				if(isHidden) Area[x].classList.remove('lcf-hidden');
				else Area[x].classList.add('lcf-hidden');
			}
			
			if(isHidden) app().classList.add('lcf-expanded');
			else app().classList.remove('lcf-expanded');
		}
		
		if(f) minimize(false);
		app('.lcf-minimize').onclick = function() { 
			// When minimize button is clicked
			minimize();
		};
		
		if(e.message && e.admin !== true) setTimeout(function() {
			// if there is a custom message for user (like "Hello! How can we assist you today"), chat atomatically pops out
			minimize(true);
		}, (1000 * 10))
		
		document.body.appendChild(node[0]); // append the newly created app to the document body
		
		return app; // return the app as a closure so that it can be accessed outside this function.
		
	}
	
	/* CREATE AN AJAX REQUESTING FUNCTION */
	
	function runAjax(obj) {
		
		// argument must be valid object `{}`
		
		var ajax = new XMLHttpRequest();
		ajax.onreadystatechange = function() {
			if(this.readyState ===  4) {
				if(this.status === 200) {
					try {
						var response = JSON.parse(this.responseText);
					} catch(e) {
						obj.fail(response);
						return
					}
					if(!response.status) obj.fail(response);
					else obj.success(response);
				} else {
					if(this.status == 404) {
						var x;
						for(x = 0; x < interval.length; x++) {
							clearInterval(interval[x]);
						}
						console.warn("error: " + this.status + ", " + obj.url + " " + this.statusText);
						destroyChat(); // see below
					}
					return;
				}
			}
		}
		obj.data = JSON.stringify(obj.data); // convert to json to send over server
		ajax.open('POST',obj.url, true);
		ajax.setRequestHeader('content-type', 'application/json');
		ajax.send(obj.data); 
	}
	
	/* When a new user visits the chat app page, a unique id is created or retained */
	
	function getChatID() {
		
		if(e.admin === true) return;
		
		var x, id, result = '';
		
		// create a new unique id
		
		for(x = 0; x < 3; x++) {
			id = Math.random().toString().slice(2);
			result += id;
		};
		
		// send the id as a request 
		
		runAjax({
			url: e.action,
			data: {
				request: 'session',
				args: {
					id: result
				}
			},
			success: function(a){
				
				// `a` returns back the newly created id or an id previously set for the user
				
				ID = a.id;
				
				if(a.new_session) { // if it is the user's first visit
					if(e.message) { // if there is a custom message for user
						setTimeout(function() {
							var chat = newChat(false, e.message); // send the message as chat to the user.
							var msg = JSON.stringify({ 
								front : false,
								message : e.message,
								id : ID,
								default_msg : true
							});
							/* SET DEFAULT MESSAGE */
							send(msg, chat); // send the message to server for storage
						}, 1000);
					}
				} else if(e.admin !== true && ID) setTimeout(function() {
					activeChat(ID); //
				}, 300);
			},
			
			fail: function(a) {
				
				/* if request fails */
				
				if(f) destroyChat(); // remove the chat app from document body
				console.warn("unknown or bad response received from " + e.action);
			}
		});
		return result;
	}
	
	function stopInterval() { 
		/* STOP CHECKING FOR NEW MESSAGES AND UPDATES */
		var x;
		for(x = 0; x < interval.length; x++) {
			clearInterval(interval[x]);
		}
	}
	
	var app = developLiveChat(node, e); // CREATE THE APP AND ADD IT TO DOCUMENT BODY
	
	var ID;
	
	getChatID();
	
	
	/* function to delete the chat app by removing it from document body */
	
	function destroyChat() {
		var lcf = document.querySelector('.lcf-origin');
		if(lcf) document.body.removeChild(lcf);
		console.log('chat destroyed');
	}
	
	/* function to add new chats */
	
	function newChat(pos, chat) {
		
		/* 
			@ `pos` specifies the direction of the chat
			# false goes to the left: Means it's a chat received from the other user
			# true goes to the right: Means it's a chat sent from you
			
			@ `chat` is the message you or the user typed in the input field
		*/
		
		/* create a new DIV element and set it's position */
		
		var block = document.createElement('div');
		pos = (!pos) ? 'lcf-leftbox' : 'lcf-rightbox'; 
		block.setAttribute('class', pos);
		
		/* append the message to the DIV element */
		
		var Text = document.createTextNode(chat);
		block.appendChild(Text);
		
		/* create the time when message was sent */
		
		var date = new Date(), hour = date.getHours(), min = date.getMinutes(), M = 'AM';
		if(hour > 12) {
			hour = hour - 12;
			M = "PM";
		};
		if(hour.toString().length == 1) hour = '0' + hour;
		if(min.toString().length == 1) min = '0' + min;
		var Time = hour + ':' + min + ' ' + M + ' &#9679;';
		
		/* put the time in span element */
		
		var span = document.createElement('span');
		span.innerHTML = Time;
		
		/* append the time to the DIV element */
		
		block.appendChild(span);
		
		
		/* 
			# check if there is an `IS TYPING` element and move it to the bottom
			# Appending the DIV element to the chat box
		*/
		
		var is_typing = app('.lcf-isTyping');
		
		if(pos && is_typing != null) {
			app('.lcf-chatflow').removeChild(is_typing);
			app('.lcf-chatflow').appendChild(block);
			app('.lcf-chatflow').appendChild(is_typing);
		} else
			app('.lcf-chatflow').appendChild(block);
		
		if(pos) app('textarea').value = ''; // Clear the input field
		block.scrollIntoView(); // scroll the chat box to the most recent chat
		
		return block; // return the DIV element;
	}
	
	// FUNCTION TO LET USER KNOW THAT THE MESSAGE WAS SENT OR FAILED
		
	function chatStat(el, stat) {
		
		stat = (stat) ? '&#10004;' : '&#10006;';
		
		// `el` is the DIV element returned from newChat 
		// stat : true = sent, false = failed
		
		var span = el.querySelector('span');
		var newSpanText = span.innerHTML.slice(0, -1) + stat;
		span.innerHTML = newSpanText;
	}
	
	// Append a new block to the chat box having a message "Chatting with x" [NOT AVAILABLE]
	
	function chatPartner(name) {
		var block = createElementNodes(['div:lcf-chatpartner']);
		var Text = "Chatting with " + name;
		var TNode = document.createTextNode(Text);
		block.appendChild(TNode);
		app('.lcf-chatflow').appendChild(block);
		return name;
	}
	
	// Add an "X is typing..." block to show that the other user is typing [NOT AVAILABLE]
	
	function isTyping(name) {
		
		var is_typing = app('.lcf-isTyping');
		if(is_typing != null) return;
		
		var block = createElementNodes(['div:lcf-isTyping']);
		var Text = name + " is typing...";
		var TNode = document.createTextNode(Text);
		block.appendChild(TNode);
		app('.lcf-chatflow').appendChild(block);
		return block;
	}
	
	// SEND THE MESSAGE AND VERIFY IF IT WAS SENT OR NOT
	
	function send(JsonMsg, chat) {
		var ajax = new XMLHttpRequest();
		ajax.onreadystatechange = function() {
			if(this.readyState === 4) {
				if(this.status === 200) {
					var response = this.responseText;
					try {
						response = JSON.parse(response);
					} catch(e) {
						chatStat(chat, false);
						return;
					}
					if(response.status) chatStat(chat, true);
					else {
						chatStat(chat, false);
						if(response.error) console.error("error: " + response.error);
					}
				} else
					chatStat(chat, false);
			}
		}
		var url = e.action;
		ajax.open('POST', url, true);
		ajax.setRequestHeader('content-type', 'application/json');
		ajax.send(JsonMsg);
	}
	
	// FOR ADMIN ONLY! RUNS ONLY IF ADMIN PASSWORD IS VALID
	
	function verifyAdmin(func) {
		var ajax = new XMLHttpRequest();
		ajax.onreadystatechange = function() {
			if(this.readyState == 4) {
				if(this.status === 200) {
					var response = this.responseText;
					try {
						response = JSON.parse(response);
					} catch(e) {
						console.log(e);
					}
					if(!response.status) {
						console.warn('WRONG PASSWORD');
						destroyChat();
					}
					else func();
				} 
				else {
					var probs = (this.status === 404) ? e.action : '';
					console.error("error: " + this.status + ', ' + probs + ' ' + this.statusText);
				}
			};
		};
		var data = JSON.stringify({password:e.password});
		ajax.open('POST', e.action, true);
		ajax.setRequestHeader('content-type', 'application/json');
		ajax.send(data);
	}
	
	// remove all children of an element based on children class
	
	function removeAllChildren(elem, childClass) {
		var x;
		var children = document.querySelectorAll(childClass);
		if(!children.length) return;
		for(x = 0; x < children.length; x++) {
			elem.removeChild(children[x]);
		};
	}
	
	// Add new Chat to the chat box that is newly received from the other user
	
	function putPreviousChat(msg, Time, pos) {
		var block = document.createElement('div');
		pos = (!pos) ? 'lcf-leftbox' : 'lcf-rightbox';
		block.setAttribute('class', pos);
		var Text = document.createTextNode(msg);
		block.appendChild(Text);
		
		var date = Time.split(" ")[1].split(":");
		var hour = parseInt(date[0]), min = parseInt(date[1]), M = 'AM';
		if(hour > 12) {
			hour = hour - 12;
			M = "PM";
		};
		
		if(hour.toString().length == 1) hour = '0' + hour;
		if(min.toString().length == 1) min = '0' + min;
		var Time = hour + ':' + min + ' ' + M + ' &#9679;';
		var span = document.createElement('span');
		span.innerHTML = Time;
		block.appendChild(span);
		
		app('.lcf-chatflow').appendChild(block);
		chatStat(block, true);
		if(!i) {
			block.scrollIntoView();
		}
		return block;
	}
	
	// clear all existing chats in the chat app
	
	function clearChats() {
		var chatblock = app('.lcf-chatflow');
		removeAllChildren(chatblock, '.lcf-leftbox');
		removeAllChildren(chatblock, '.lcf-rightbox');
	}
	
	
	/* get the current chat that admin is reponding to */
	
	function activeChat(ID, def = false) {
		runAjax({
			url: e.action,
			data: {
				request: 'activeChat',
				args: {
					id: ID,
					front: f,
					default_msg: def
				}
			},
			success: function(a) {
				try {
					var chats = JSON.parse(a.chat);
				} catch(x) {
					noChats();
					return;
				}
				
				if(!chats.length) return noChats();
				
				clearChats();
				
				var x, pos;
				for(x = 0; x < chats.length; x++) {
					(function(x) {
						var chat = chats[x];
						if(e.admin !== true) {
							pos = (chat.front == false) ? false : true;
						} else {
							pos = (chat.front == false) ? true : false;
						}
						putPreviousChat(chat.message, chat.time, pos);
					})(x)
				}
			},
			fail: function(a) {
				if(!f) {
					var name = document.querySelector('[data-id="' + ID + '"]').dataset.name;
					console.warn("NO CHAT FOUND FOR " + name);
					clearChats();
				}
				else chatTerminated();
			}
		});
	}
	
	function hasParent(el, Parent, isParent = false) {
		var r;
		if(!el || !Parent) return false;
		do {
			if(el == document.documentElement) return false;
			r = el.parentElement == Parent;
			if(isParent && el == Parent) r = true;
			if(r) return true;
			else el = el.parentElement;
		} while(el != document.documentElement);
		return false;
	}
	
	function alterClass(elem, classname, add) {
		if(add === true) elem.classList.add(classname);
		else if(add === false) elem.classList.remove(classname);
		else {
			if(elem.classList.contains(classname)) elem.classList.remove(classname);
			else elem.classList.add(classname);
		}
		return elem;
	}
	
	function chatTerminated() {
		//console.log("chat terminated");
	}

	
	if(e.admin) verifyAdmin(function() {
		
		var node = [], x;
		
		/* create elements that list the available front end users */
		
		node.push(createElementNodes(['div:lcf-visitors-chatlist', 'div:lcf-visitors-area', 'div:lcf-visitors', 'button:']));
		node.push(createElementNodes(['div:lcf-visitors-board lcf-hideboard']));

		/* store in chatlist function */
		
		function chatList(elem, a = false) {
			if(!elem) return node[0].querySelector('.lcf-visitors-area');
			else {
				if(a) return node[0].querySelector('.lcf-visitors-area').querySelectorAll(elem);
				else return node[0].querySelector('.lcf-visitors-area').querySelector(elem);
			}
		}
		
		var el = chatList('*', true);
		for(x = 0; x < el.length; x++) {
			el[x].__proto__.attr = function(a) {
				var key;
				for(key in a) {
					this.setAttribute(key, a[key])
				}
				return this;
			};
		}
		
		chatList('.lcf-visitors').classList.add(e.theme);
		chatList('.lcf-visitors').innerHTML = 'CHATS \n <button> &#9776; </button>';
		chatList().appendChild(node[1]); 
		(function(a) {
			chatList('.lcf-visitors button').onclick = function() {
				var board = a.querySelector('.lcf-visitors-board');
				alterClass(board, 'lcf-hideboard');
			};
		})(chatList());
		document.querySelector('.lcf-origin').appendChild(chatList());
		
		
		/* if there are no available chats. add a block that signifies */
		
		function noChats(verify = true) {
			
			var previousBlock = document.querySelector('.lcf-nochats');
			var listbox = document.querySelector('.lcf-visitors-area .lcf-visitors-board');
			
			if(!verify) {
				if(previousBlock) removeAllChildren(listbox, '.lcf-nochats');
				return;
			}
			
			var block = document.createElement('div');
			block.setAttribute('class', 'lcf-nochats');
			
			var Text = document.createTextNode('NO CHATS');
			block.appendChild(Text);
			
			if(listbox.children.length) removeAllChildren(listbox, 'lcf-person');
			
			if(previousBlock) return;
			removeAllChildren(app('.lcf-chatflow'), '.lcf-person');
			listbox.appendChild(block);
		}
		
		
		/* create a micro pop up box */
		
		function microBox(statement, a) {
			
			var origin = document.querySelector('.lcf-origin');
			
			var child = origin.querySelector('.lcf-micro-box');
			if(child) origin.removeChild(child);
			
			if(statement === false) return;
			
			var elem = createElementNodes(['div:lcf-micro-box', 'div:lcf-chat-statement, div:lcf-chat-statement-handle']);
			var child = elem.querySelectorAll('div');
			
			child[0].innerHTML = statement;
			child[1].innerHTML = (typeof a == 'function' || !a) ? "<button> OK </button>" : "<button> NO </button> <button> YES </button>";

			origin.appendChild(elem);
			
			var btn = child[1].querySelectorAll('button');
			
			if(typeof a == 'function' || !a) {
				btn[0].onclick = function() {
					origin.removeChild(elem);
					if(typeof a == 'function') a();
				}
			}
			
			btn[0].onclick = function() {
				origin.removeChild(elem);
				if(typeof a.no == "function") a.no();
			}
			btn[1].onclick = function() {
				origin.removeChild(elem);
				if(typeof a.yes == "function") a.yes();
			}
		}
		
		window.addEventListener('click', function(event) {
			var Parent = document.querySelector('.lcf-micro-box');
			var el = event.target;
			var mBox = hasParent(el, Parent, true);
			if(!mBox) microBox(false);
		});
	
		var TrueChat = 0, ai = [];
		
		/*
			create a function to get a list of available chats and number of new messages coming in
		*/
		
		function getChats() {

			function chatList(elem, a = false) {
				if(!elem) return document.querySelector('.lcf-visitors-area');
				else {
					if(a) return document.querySelector('.lcf-visitors-area').querySelectorAll(elem);
					else return document.querySelector('.lcf-visitors-area').querySelector(elem);
				}
			}
			
			runAjax({
				url: e.action,
				data: {
					request: 'getChatList',
					args: {
						front: f
					},
				},
				success: function(z) {

					removeAllChildren(chatList('.lcf-visitors-board'), '.lcf-person');
					
					var x, y;
					for(x in z) {
						if(x == 'status') continue;
						
						(function(z,x) {
							
							var chat = z[x];
							
							if(!chat.id) return;
							else ai[x] = chat.id;
							
							var node = createElementNodes(['div:lcf-person']); 
							node.setAttribute('data-id', chat.id);
							node.setAttribute('data-name', chat.displayName);
							
							var el = []; 
							
							if(chat.id && ID == undefined) ID = chat.id;
							
							var board = chatList('.lcf-visitors-board');
							
							el[0] = document.createElement('i');
							if(z[x].isOnline) el[0].setAttribute('online', '');
							else if(z[x].isOnline === null) el[0].setAttribute('exit', '');
							
							el[1] = document.createTextNode(' ' + chat.displayName);
							
							el[2] = document.createElement('button'); 
							el[2].innerHTML = "&#10008;";
							el[2].onclick = function(a) {
								a.stopPropagation();
								alterClass(board, 'lcf-hideboard', true);
								var statement = "DELETE CHAT <br> ( " + chat.displayName + " )";
								microBox(statement, {
									yes : function() {
										runAjax({
											url: e.action,
											data: {
												request: "deletechat",
												args: {
													id: chat.id
												}
											},
											success: function(s) {
												document.querySelector('.lcf-origin .lcf-visitors-board').removeChild(node);
												ai[x] = null;
												ai = ai.filter(function(value) {
													if(value) return value;
												});
												if(!ai.length) {
													ID = null;
													noChats();
												} else {
													ID = ai[0];
													activeChat(ID);
													changeActiveClass(0);
												}
											},
											fail: function(s) {
												var statement = "( " + chat.displayName + " ) was not deleted";
												modalBox(statement);
											}
										});
									}
								});
							}
							
							if(chat.newMessages) {
								el[3] = document.createElement('span');
								el[3].innerHTML = chat.newMessages;
							} else el[3] = false
							
							for(y = 0; y < el.length; y++) {
								if(y == 3 && !el[y]) continue;
								node.appendChild(el[y]);
							};
							
							node.onclick = function() {
								ID = chat.id;
								activeChat(ID);
								TrueChat = x;
								changeActiveClass(x);
								alterClass(board, 'lcf-hideboard', true);
							}
							
							noChats(false);
							chatList('.lcf-visitors-board').appendChild(node);
						
						})(z,x);
					};
					
					if(!ID) noChats();
					else {
						changeActiveClass(TrueChat);
					}
					
				},
				fail: function(e) { 
					noChats();
				}
			});
			
			return;
		}
		
		function changeActiveClass(index) {
			var activeClass = document.querySelector('.lcf-person.lcf-active-chat');
			if(activeClass) activeClass.classList.remove('lcf-active-chat');
			var newActiveClass = document.querySelectorAll('.lcf-person')[index];
			newActiveClass.classList.add('lcf-active-chat');
		}
		
		getChats();
		
		var FirstChat = setInterval(function() {
			if(ID) {
				activeChat(ID);
				clearInterval(FirstChat);
			}
		}, 2000);
		
		/* GET CHAT CONTROLS THE USERS LIST */
		/* ACTIVECHAT CONTROLS THE CURRENT CHAT */
		
		setInterval(function() {
			getChats();
		}, (1000 * 15));
		
		isValidAdmin = true;
		
		var node1 = document.querySelector('.lcf-visitors-area');
		var node2 = document.querySelector('.lcf-app');
		node1.after(node2);
		
		alterClass(document.body, 'lcf-body', true);
		var bg = scriptPath('img/02.jpg');
		document.body.style.backgroundImage = "url('" + bg + "')";
		
	});
	
	
	/* get the most recent chat received */
	
	function getNewChats(ID) {
		runAjax({
			url: e.action,
			data: {
				request: 'getNewChats',
				args: {
					id: ID,
					front: f
				}
			},
			success: function(z) {
				try {
					var chats = JSON.parse(z.chat);
				} catch(a) {
					return;
				};
				if(!chats.length) return;
				var x;
				for(x = 0; x < chats.length; x++) {
					(function(x) {
						var chat = chats[x];
						putPreviousChat(chat.message, chat.time, false);
					})(x);
				}
			},
			fail: function(e) {
				
			}
		});
	}
	
	interval[0] = setInterval(function() {
		getNewChats(ID);
	}, 5000);
	
	function isAvailable() {
		runAjax({
			url: e.action,
			data: {
				request: "isAvailable",
				args: {
					front: f
				}
			},
			success: function(z) {
				if(f) {
					var STATUS = (z.online) ? 'Online' : 'Offline';
					app('.lcf-header').innerText = "We Are " + STATUS;
				}
			},
			fail: function(z) { }
		});
	}
	
	isAvailable();
	interval[1] = setInterval(function() {
		/* WE ARE `OFFLINE | ONLINE` */
		isAvailable(); // Let front end user know your admin online status:
	}, (1000 * 60));
	
	
}