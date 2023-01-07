const uuid = () => {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

var host = window.location.href;
console.log(host);
//var socket = io.connect('http://18.139.89.76');
 var socket = io.connect('localhost:8888');

let game_state;

//Changes text on searching for match page
let i = '';
let interval = setInterval(() => {
	document.getElementById('searching-for-match').innerHTML =
		'Game is started. \n Wating for other user' + i;
	i += '.';
	if (i == '.....') i = '';
}, 500);

window.onload = function (e) {
	let userId = localStorage.getItem('user_id');
	if (!userId) {
		localStorage.setItem('user_id', uuid());
		userId = localStorage.getItem('user_id');
	}

	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		document.getElementById('twoplayers').style.display = 'none';
	}

	let savedUserName = localStorage.getItem('user_name');
	if (savedUserName) {
		console.log(userId, savedUserName);
		document.getElementById('input-username').value = savedUserName;
		socket.emit('get-game-history', savedUserName);
		setTimeout(() => {
			socket.emit('change-username', {userId: userId, username: savedUserName});
		}, 1000);
	}
	let inputUserName = document.getElementById('input-username');
	if(!inputUserName.value.trim().length) {
		showHideStartGame(false);
	} else {
		showHideStartGame(true);
	}
	if(inputUserName) {
		inputUserName.oninput = function() {
			localStorage.setItem('user_name', inputUserName.value.trim());
			if(!inputUserName.value.trim().length) {
				showHideStartGame(false);
			} else {
				showHideStartGame(true);
			}
		  };
	}
};

function showHideStartGame(showElements) {
	var hideElements = document.getElementsByClassName('hideFunc');
	for (let i = 0; i < hideElements.length; i++) {
		if(showElements) {
			hideElements[i].classList. remove('hide-form');
		} else {
			hideElements[i].classList.add('hide-form');
		}
	}
}

//Control Ping
let ping_interval = setInterval(() => {
	// let time = Date.now();
	// socket.emit('get-ping', callback => {
	// 	document.getElementById('ping').innerHTML = `Ping: ${Date.now() -
	// 		time}ms`;
	// });
}, 500);

var gameAudio = null;
function playSound(soundUrl) {
	if(gameAudio) {
		gameAudio.stop();
	}
	gameAudio = new Audio(soundUrl);
	gameAudio.play();
}

//Gets number of online players
socket.on('player-broadcast', players => {
	document.getElementById('online-players').innerHTML = `Users online: ${players}`;
});

//Gets number of online players
socket.on('new-connection-client', () => {
	let userId = localStorage.getItem('user_id');
	if (!userId) {
		localStorage.setItem('user_id', uuid());
		userId = localStorage.getItem('user_id');
	}

	socket.emit("set-user-id", userId);
});

//Game has begun
socket.on('game-started', data => {

	//Play sound when start game
	var audio = new Audio('./assets/raw/start_match.mp3');
	audio.play();

	clearInterval(interval);
	game_state = new Pong(
		data.username,
		data.player,
		data.opp_username,
		data.ball
	);
	interval = setInterval(() => {
		game_state.update();
	}, (1 / 60) * 1000);
	document.getElementById('match-making').remove();
	document.getElementById('gameplay').style.display = 'flex';
	fit_canvas();
});

//Gets new game data and mutates gamestate
socket.on('game-data', (data, callback) => {
	game_state.game.self.score = data.score;
	game_state.game.opp.score = data.opp_score;
	game_state.game.ball = data.ball;
	game_state.game.opp.pos = data.opp_pos;
	game_state.game.self.winGames = data.self_win;
	game_state.game.opp.winGames = data.opp_win;
	callback(game_state.game.self.pos);

	if (data.game_state == 2) {
		if(game_state.game.self.username == data.winner) {
			playSound('./assets/raw/winner.mp3');
		}
		setTimeout(() => {
			document.getElementById('gameplay').style.display = 'none';
			// alert(`Player ${data.winner} win!`);
			openModal(ENUM_MODAL_TYPE.win, data.winner);
			// location.reload();
		}, 1000);
	}
});

//Makes matchmaking div visible
socket.on('matchmaking-begin', () => {
	document.getElementById('match-making').style.display = 'block';
});

//Fit canvas to screen on resize
window.addEventListener('resize', fit_canvas);
function fit_canvas() {
	let canvas = document.getElementById('drawing-canvas');
	let parent = document.getElementById('gameplay');
	canvas.height = parent.offsetHeight - 10;
	canvas.width = parent.offsetWidth - 10;
}

//Sends username to server
function playOnline() {
	let savedUserName = localStorage.getItem('user_name');
	if (!savedUserName) {
		localStorage.setItem('user_name', document.getElementById('input-username').value);
		savedUserName = localStorage.getItem('user_name');
	}

	socket.emit(
		'play-online',
		savedUserName,
		callback => {
			if (callback) {
				document.getElementById('start-screen').remove();
				console.log('username changed successfully');
			}
		}
	);
}

//Sends username to server
function changeUsername() {
	let userId = localStorage.getItem('user_id');
	if (!userId) {
		localStorage.setItem('user_id', uuid());
		userId = localStorage.getItem('user_id');
	}
	socket.emit(
		'change-username',
		{userId: userId, username: document.getElementById('input-username').value},
		callback => {
			if (callback) {
				console.log('username changed successfully!');
			}
			else {
				console.log('username changed unsuccessfully!!!');
			}
		}
	);

	localStorage.setItem('user_name', document.getElementById('input-username').value);
}

// create room
function createRoom() {
	socket.emit(
		'create-room',
		document.getElementById('input-username').value,
		callback => {
			console.log(callback);
			if (callback) {
				console.log("Create room successfully.");
			}
		}
	);
}


// create room
function joinRoom() {
	socket.emit(
		'join-room',
		{
			roomId: document.getElementById('input-room').value,
			username: document.getElementById('input-username').value
		},
		callback => {
			console.log(callback);
			if (callback) {
				console.log("Joined room.");
			}
		}
	);
}

//Single Player vs CPU
function singlePlayer() {
	//Controls
	//Keyboard
	let KEYMAP = {};
	KEYMAP[87] = false;
	KEYMAP[83] = false;
	KEYMAP[38] = false;
	KEYMAP[40] = false;
	document.addEventListener('keydown', function (event) {
		KEYMAP[event.keyCode] = true;
	});
	document.addEventListener('keyup', function (event) {
		KEYMAP[event.keyCode] = false;
	});
	game = new Game(
		0,
		2,
		1,
		4
	)
	game_state = new Pong(
		"Player One",
		1,
		"Player Two",
		[50, 50]
	);
	clearInterval(interval);
	interval = setInterval(() => {
		if (KEYMAP[87] || KEYMAP[38]) game_state.upSelf();
		if (KEYMAP[83] || KEYMAP[40]) game_state.downSelf();
		game_state.update();
		game.update();
		game_state.game.self.score = game.players[0].score;
		game.players[0].pos = game_state.game.self.pos
		game_state.game.opp.score = game.players[1].score;
		game.players[1].pos = game_state.game.opp.pos
		game_state.game.ball = game.ball;
		if (game_state.game.opp.pos < game_state.game.ball[1]) game_state.game.opp.pos += 0.65;
		if (game_state.game.opp.pos > game_state.game.ball[1]) game_state.game.opp.pos -= 0.65;
	}, (1 / 60) * 1000);

	document.getElementById('match-making').remove();
	document.getElementById('gameplay').style.display = 'flex';
	fit_canvas();
}

//Two Player 1v1
function oneVerseOne() {
	//Controls
	//Keyboard
	let KEYMAP = {};
	KEYMAP[87] = false;
	KEYMAP[83] = false;
	KEYMAP[38] = false;
	KEYMAP[40] = false;
	document.addEventListener('keydown', function (event) {
		KEYMAP[event.keyCode] = true;
	});
	document.addEventListener('keyup', function (event) {
		KEYMAP[event.keyCode] = false;
	});
	game = new Game(
		0,
		2,
		1,
		4
	)
	game_state = new Pong(
		"Player One",
		1,
		"Player Two",
		[50, 50]
	);
	clearInterval(interval);
	interval = setInterval(() => {
		if (KEYMAP[87]) game_state.upSelf();
		if (KEYMAP[83]) game_state.downSelf();
		if (KEYMAP[38]) game_state.upOpp();
		if (KEYMAP[40]) game_state.downOpp();
		game_state.update();
		game.update();
		game_state.game.self.score = game.players[0].score;
		game.players[0].pos = game_state.game.self.pos
		game_state.game.opp.score = game.players[1].score;
		game.players[1].pos = game_state.game.opp.pos
		game_state.game.ball = game.ball;
	}, (1 / 60) * 1000);

	document.getElementById('match-making').remove();
	document.getElementById('gameplay').style.display = 'flex';
	fit_canvas();
}

function copyRoomIdToClipboard() {
	const roomId = document.getElementById('room_id').textContent;
	copyToClipboard(roomId)
    .then(() => alert("Room Id is copied"))
    .catch(() => alert("Room Id is not copied"));
}

// return a promise
function copyToClipboard(textToCopy) {
    // navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        // navigator clipboard api method'
        return navigator.clipboard.writeText(textToCopy);
    } else {
        // text area method
        let textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        // make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            // here the magic happens
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}

//Handles opponent leaving game
socket.on('player-left', () => {
	socket.disconnect();
	document.location.reload();
});

//Mouse
$('#drawing-canvas').mousemove(function (e) {
	let mouse_pos = getMousePos(e);
	game_state.game.self.pos =
		(mouse_pos.y / document.getElementById('drawing-canvas').height) * 100;
});

function getMousePos(evt) {
	let canvas = document.getElementById('drawing-canvas');
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function searchUserOnline() {
	let searchUser = document.getElementById('input-search-user').value;
	console.log('searchUserOnline: ', searchUser);
	socket.emit('search-users', searchUser);
}

//Mobile
document.addEventListener('touchstart', touchHandler);
document.addEventListener('touchmove', touchHandler);

function touchHandler(e) {
	if (e.touches) {
		let playerY =
			e.touches[0].pageY -
			document.getElementById('drawing-canvas').offsetTop;
		game_state.game.self.pos =
			(playerY / document.getElementById('drawing-canvas').height) * 100;
		e.preventDefault();
	}
}

document.getElementById('input-search-user').addEventListener('change', (data) => {
	socket.emit('search-users', data.target.value);
});


socket.on('search-users-result', (result = []) => {
	console.log("TVT result = " + JSON.stringify(result));
	openModal(ENUM_MODAL_TYPE.selectUser, '', result);
	// if(!!result.length)
	// let items = "";
	
	// if (result && result.length > 0) {
	// 	result.forEach((e) => {
	// 		if (e.playing != true) {
	// 			// to do
	// 		}
	// 	})
	// }
})

socket.on('create-room-result', roomId => {
	console.log(roomId);
	document.getElementById("room_id").textContent = roomId;
	document.getElementById("room_info").style.display = "block";
});

socket.on('game-history-changed', data => {
	console.log('game histories', data);
	if (data && data.length > 0) {
		// const historyEl = document.getElementById('game-history');
		let historyArr = [];
		data.sort(function (a, b) { return b.created_date - a.created_date }).forEach(history => {
			const value = `${new Date(history.created_date).toString()} | ${history.player1} vs ${history.player2} (${history.player1_score}-${history.player2_score})`;
			// historyEl.innerHTML += `<p>${new Date(history.created_date).toString()} | ${history.player1} vs ${history.player2} (${history.player1_score}-${history.player2_score})</p>`;
			historyArr = [...historyArr, value];
		});
		localStorage.setItem('history_data', JSON.stringify(historyArr));
	}
});

socket.on('change-username-result', userInfo => {
	console.log(userInfo);
	localStorage.setItem("user_name", userInfo.username);
	document.getElementById('input-username').value = userInfo.username;
});


function showHistoryPopup() {
	openModal(4);
}

socket.on('user-playing', () => {
	location.reload();
})
