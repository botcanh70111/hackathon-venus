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

function randomSkinChar() {
	const list_skin = ['default', 'cat', 'godzilla'];
	const randomCharNum = Math.floor(Math.random() * list_skin.length);
	console.log("randomCharNum: ", randomCharNum);
	switch (randomCharNum) {
		case 1:
			document.getElementById('skin_char').innerHTML = `<img id="offline-resources-1x" src="./assets/cat.png"><img id="offline-resources-2x" src="./assets/catx2.png">`;
			break;
		
		case 2:
			document.getElementById('skin_char').innerHTML = `<img id="offline-resources-1x" src="./assets/godzilla.png"><img id="offline-resources-2x" src="./assets/godzillax2.png">`;
			break;
	
		default:
			document.getElementById('skin_char').innerHTML = `<img id="offline-resources-1x" src="./assets/default_100_percent/100-offline-sprite.png"><img id="offline-resources-2x" src="./assets/default_200_percent/200-offline-sprite.png">`;
			break;
	}
}

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

		  var typingTimer;                //timer identifier
		  var doneTypingInterval = 500;  //time in ms
		 
		  //on keyup, start the countdown
		  inputUserName.onkeyup = function () {
				
				clearTimeout(typingTimer);
				
				typingTimer = setTimeout(function(){
					doneTyping(inputUserName.value.trim())
				}, doneTypingInterval);
			}
		  //on keydown, clear the countdown
		  inputUserName.onkeydown = function () {
			clearTimeout(typingTimer);
			}
		  //user is "finished typing," do something
		  function doneTyping (value) {
				console.log("TVT fdfsdf")
			  handleEmitChangeUserName(value);
		  }
	}

	randomSkinChar();

	// var audio = new Audio('./assets/raw/start_match.mp3');
	// audio.play();
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

// create
function createMatch() {
	let roomId = uuid();
	localStorage.setItem('room_id', roomId);
	document.getElementById("room_id").textContent = roomId;
	document.getElementById("room_info").style.display = "block";
	socket.emit('create-match', roomId);
}

// join
function joinMatch() {
	console.log("join match");
	const newValue = document.getElementById('input-room').value;
	const currentValue = localStorage.getItem('room_id');
	if(currentValue !== newValue) {
		socket.emit('join-match', document.getElementById('input-room').value);
	} else {
		alert('Cannot invite yourself')
	}
	
}

function quickGame() {
	let roomId = uuid();
	console.log(roomId)
	socket.emit('quick-game', roomId);
}

// die
function imDie(score) {
	socket.emit('im-die', score);
}

// game over
function gameOver() {
	let isWin = false;
	socket.emit('game-over', isWin);
}

function showHistoryPopup() {
    openModal(4);
}

//Gets number of online players
socket.on('new-connection-client', () => {
	let userId = localStorage.getItem('user_id');
	if (!userId) {
		localStorage.setItem('user_id', uuid());
		userId = localStorage.getItem('user_id');
	}

	socket.emit("set-user-id", userId);
});

socket.on('change-username-result', userInfo => {
	console.log(userInfo);
	localStorage.setItem("user_name", userInfo.username);
	document.getElementById('input-username').value = userInfo.username;
});

socket.on('game-start', payload => {
	console.log("start game from client");
	console.log(payload);
	startgame();
});


// t-rex 
function startgame() {
    console.log('start-game');

    // remove lobby
    document.querySelector(".main").style.display = "none";
    document.querySelector(".figure").style.display = "none";

    document.getElementById("content-wrapper").classList.add("dinosaur-active");

	document.getElementById("content-wrapper").innerHTML += `
	<div class="score" id="score">
		<span class="block enermy-point">Match Point: <span id="match_point">0</span></span>
		<span class="block enermy-point">Set Point: <span id="me_point">0</span> - <span id="enermy_point">0</span></span>
		<span class="block full">
			<span class="inline-block name-me">ME</span>
			<span class="inline-block point">10</span>
			<span class="inline-block dash">-</span>
			<span class="inline-block point">09</span>
            <span class="inline-block name-e">ENERMY</span>
		</span>
	</div>`;

	document.getElementById("content-wrapper").innerHTML += `<a id="back" href="${window.location.href}">BACK</a>`;

    // mount to the dom
	console.log('dinosour', dinosour);
    var dinosour = new Runner('#content-wrapper');
    // do start background
    dinosour.playIntro();

    // do start character
    dinosour.play();
}

function changeUsername() {
	let userId = localStorage.getItem('user_id');
	if (!userId) {
		localStorage.setItem('user_id', uuid());
		userId = localStorage.getItem('user_id');
	}
	let username = document.getElementById('input-username').value;
	console.log('change username:', username);
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

function handleEmitChangeUserName(value) {
	let userId = localStorage.getItem('user_id');
	if (!userId) {
		localStorage.setItem('user_id', uuid());
		userId = localStorage.getItem('user_id');
	}
	socket.emit(
		'change-username',
		{userId: userId, username: value},
		callback => {
			if (callback) {
				console.log('username changed successfully!');
			}
			else {
				console.log('username changed unsuccessfully!!!');
			}
		}
	);
}

//Handles opponent leaving game
socket.on('player-left', () => {
	socket.disconnect();
	document.location.reload();
});


socket.on('return-home', () => {
	document.querySelector(".main").style.display = "block";
    document.querySelector(".figure").style.display = "block";
    document.querySelector("#room_info").style.display = "none";
	document.getElementById("score").remove();
	document.getElementById("back").remove();
    document.getElementById("content-wrapper").classList.remove("dinosaur-active");
});

socket.on('player-broadcast', players => {
	document.getElementById('online-players').innerHTML = `Users online: ${players}`;
});