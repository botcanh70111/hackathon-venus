var express = require('express');
const { emit } = require('process');
const uuid = require('uuid');
var app = express();
const port = 8888;
var server = require('http')
	.createServer(app)
	.listen(port);
var io = require('socket.io')(server);
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res, next) {
	res.sendFile(__dirname + '/public/index.html');
});

//User class
const UserStatus = {
	WaitingQuickGame: 1,
	Playing: 2,
	WaitingForInviting: 3,
	InMatch: 4
}

const MatchStatus = {
	Playing: 1,
	WaitingForQuickGame: 2,
	Inviting: 3
}

class User {
	constructor(socket) {
		this.socket = socket;
		this.username = "";
		this.userId = "";
		this.status = UserStatus.WaitingForInviting,
		this.matchId = "";
	}
}

class Match {
	constructor(roomId) {
		this.matchId = roomId;
		this.status = MatchStatus.Inviting,
		this.player1GameWins = 0;
		this.player1SetWins = 0;
		this.player2GameWins = 0;
		this.player2SetWins = 0;
	}
}



//Stores all connected users
let users = {};
let matches = {};


io.on('connection', socket => {
	users[socket.id] = new User(socket);

	console.log(socket.id);
	socket.broadcast.emit('player-broadcast', Object.keys(users).length);
	socket.emit('player-broadcast', Object.keys(users).length);

	socket.on('change-username', (userInfo) => {
		console.log('userinfo:', userInfo.userId);
		for (var key in users) {
			var user = users[key];
			console.log('userid:', user.userId);
			console.log('socketid:', user.socket.id,  socket.id);
			if (user.username == userInfo.username) {
				if (user.userId != userInfo.userId) {
					console.log('same username:', user.userId, userInfo.userId);
					same_username = true;
				}
			}
			if (user.userId == userInfo.userId) {
				console.log('change username:', user.userId, userInfo.username);
				console.log('change username, socketId', socket.id);
				users[key].username = userInfo.username;
				users[key].socket.to(socket.id).emit('change-username-result', userInfo);
			}
		}
	});

	socket.on('quick-game', (roomId) => {
		for (key in matches) {
			if (matches[key] && matches[key].status == MatchStatus.WaitingForQuickGame) {
				socket.join(matches[key].matchId);
				matches[key].guestId = socket.id;
				users[socket.id].status = UserStatus.Playing;
				users[matches[key].ownerId].status = UserStatus.Playing;
				io.in(key).emit('game-start', {
					userId1: matches[key].ownerId,
					userId2: matches[key].guestId,
					player1GameWins: matches[key].player1GameWins,
					player1SetWins: matches[key].player1SetWins,
					player2GameWins: matches[key].player2GameWins,
					player2SetWins: matches[key].player2SetWins,
				});

				return;
			}
		}

		socket.join(roomId);
		matches[roomId] = new Match(roomId);
		users[socket.id].matchId = roomId;
		users[socket.id].status = UserStatus.WaitingQuickGame;
		matches[roomId].ownerId = socket.id;
		matches[roomId].status = MatchStatus.WaitingForQuickGame,
		matches[roomId].player1GameWins = 0;
		matches[roomId].player1SetWins = 0;
		matches[roomId].player2GameWins = 0;
		matches[roomId].player2SetWins = 0;
	});

	socket.on('create-match', (roomId) => {
		socket.join(roomId);
		console.log("Join room: ", roomId, socket.id);
		matches[roomId] = new Match(roomId);
		users[socket.id].matchId = roomId;
		users[socket.id].status = UserStatus.InMatch;
		matches[roomId].ownerId = socket.id;
		matches[roomId].status = MatchStatus.Inviting,
		matches[roomId].player1GameWins = 0;
		matches[roomId].player1SetWins = 0;
		matches[roomId].player2GameWins = 0;
		matches[roomId].player2SetWins = 0;

		console.log(matches);
	});

	socket.on('join-match', (roomId) => {
		if (!matches[roomId] || matches[roomId].status != MatchStatus.InMatch) {
			// send error
		}

		console.log("matches", matches);
		console.log("room", roomId);
		console.log("join", matches[roomId]);

		socket.join(roomId);
		
		users[socket.id].matchId = roomId;
		users[socket.id].status = UserStatus.Playing;
		matches[roomId].guestId = socket.id;
		matches[roomId].status = MatchStatus.Playing,
		matches[roomId].player1GameWins = 0;
		matches[roomId].player1SetWins = 0;
		matches[roomId].player2GameWins = 0;
		matches[roomId].player2SetWins = 0;
		io.in(roomId).emit('game-start', {
			userId1: matches[roomId].ownerId,
			userId2: matches[roomId].guestId,
			player1GameWins: matches[roomId].player1GameWins,
			player1SetWins: matches[roomId].player1SetWins,
			player2GameWins: matches[roomId].player2GameWins,
			player2SetWins: matches[roomId].player2SetWins,
		});
	});

	socket.on('im-die', (score) => {
		let roomId = users[socket.id];
		let match = matches[roomId];
		let ownerId = match.ownerId;
		let guestId = match.guestId;
		let enemyId = "";
		if (socket.id == ownerId) {
			enemyId = guestId;
		}
		else {
			enemyId = ownerId;
		}
		socket.to(enemyId).emit('enemy-die', {
			socketId: socket.id,
			score: score
		});
	});

	socket.on('game-over', (isWin) => {
		let roomId = users[socket.id];
		
		if (isWin) {
			if (socket.id == matches[roomId].ownerId) {
				matches[roomId].player1GameWins++;
				if (matches[roomId].player1GameWins == 5) {
					matches[roomId].player1SetWins++;
					if (matches[roomId].player1SetWins == 3) {
						console.log(matches[roomId].ownerId, " win");
						clearMatch(matches[roomId]);
						return;
					}
				}

				io.in(roomId).emit('game-start', {
					userId1: matches[roomId].ownerId,
					userId2: matches[roomId].guestId,
					player1GameWins: matches[roomId].player1GameWins,
					player1SetWins: matches[roomId].player1SetWins,
					player2GameWins: matches[roomId].player2GameWins,
					player2SetWins: matches[roomId].player2SetWins,
				});
			}
			else {
				matches[roomId].player2GameWins++;
				if (matches[roomId].player2GameWins == 5) {
					matches[roomId].player2SetWins++;
					if (matches[roomId].player2SetWins == 3) {
						console.log(matches[roomId].guestId, " win");
						clearMatch(matches[roomId]);
						return;
					}
				}

				io.in(roomId).emit('game-start', {
					userId1: matches[roomId].ownerId,
					userId2: matches[roomId].guestId,
					player1GameWins: matches[roomId].player1GameWins,
					player1SetWins: matches[roomId].player1SetWins,
					player2GameWins: matches[roomId].player2GameWins,
					player2SetWins: matches[roomId].player2SetWins,
				});
			}
		}
		else {
			if (socket.id == matches[roomId].ownerId) {
				matches[roomId].player2GameWins++;
				if (matches[roomId].player2GameWins == 5) {
					matches[roomId].player2SetWins++;
					if (matches[roomId].player2SetWins == 3) {
						console.log(matches[roomId].guestId, " win");
						clearMatch(matches[roomId]);
						return;
					}
				}

				io.in(roomId).emit('game-start', {
					userId1: matches[roomId].ownerId,
					userId2: matches[roomId].guestId,
					player1GameWins: matches[roomId].player1GameWins,
					player1SetWins: matches[roomId].player1SetWins,
					player2GameWins: matches[roomId].player2GameWins,
					player2SetWins: matches[roomId].player2SetWins,
				});
			}
			else {
				matches[roomId].player1GameWins++;
				if (matches[roomId].player1GameWins == 5) {
					matches[roomId].player1SetWins++;
					if (matches[roomId].player1SetWins == 3) {
						console.log(matches[roomId].ownerId, " win");
						clearMatch(matches[roomId]);
						return;
					}
				}

				io.in(roomId).emit('game-start', {
					userId1: matches[roomId].ownerId,
					userId2: matches[roomId].guestId,
					player1GameWins: matches[roomId].player1GameWins,
					player1SetWins: matches[roomId].player1SetWins,
					player2GameWins: matches[roomId].player2GameWins,
					player2SetWins: matches[roomId].player2SetWins,
				});
			}
		}
	});

	//Disconnects user
	socket.on('disconnect', () => {
		console.log(`Client Disconnected: ${socket.id} - ${users[socket.id]}`);
		let matchId = users[socket.id].matchId;
		delete users[socket.id];

		if (matchId) {
			delete matches[matchId];
			io.in(matchId).emit('return-home');
		}

		let user = users[socket.id];
		if (user && user.socket) {
			user.socket.emit('player-left');
			console.log('t3')
			user.socket.emit('game-history-changed', getUserGameHistory(user.username));
		}

		socket.broadcast.emit('player-broadcast', Object.keys(users).length);
	});
})

function clearMatch(match) {
	users[match.ownerId].matchId = "";
	users[match.ownerId].status = UserStatus.WaitingForInviting;
	users[match.guestId].matchId = "";
	users[match.guestId].status = UserStatus.WaitingForInviting;
	delete matches[match.matchId];
}