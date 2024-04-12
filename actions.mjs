import AWS from 'aws-sdk';

let PLAYERS = {};
let ROOMS = {};



const default_Rooms = {
	gameStarted : false,
	ids : [],
	CURRENT_DRAWER : null,
	CURRENT_WORD : ''
}
const ENDPOINT = process.env.URL;
const client = new AWS.ApiGatewayManagementApi({endpoint: ENDPOINT});
 
const sendToAll = async (ids, payload) => {
  const all = ids.map(id => sendToOne(id, payload));
  return Promise.all(all);
};


const createMessage = (type, meta, message) => {
	return{
		type: type,
        player_connectionId: meta,
        message: message
	}
}

const sendToOne = async (connectionId, payload) => {
    try {
        await client.postToConnection({
            "ConnectionId": connectionId,
            "Data": typeof payload === 'string' ? payload : Buffer.from(JSON.stringify(payload)),
        }).promise();
    } catch (error) {
        console.log(error);
    }
}

export const $connect = async(meta) => {

	const message = createMessage(
		"connect",
		meta,
		`Welcome to Pictionary Game ${meta}`
	);
	
	PLAYERS[meta] = { "connection_Id": meta, "score": 0, "roomId": null };
	const playerIds = Object.keys(PLAYERS).filter(id => id !== meta);

	await sendToAll(playerIds, message);
}

export const joinGroup = async(meta, payload) => {
	const roomId = payload.roomId;
	PLAYERS[meta] = PLAYERS[meta] || { "connection_Id": meta, "score": 0, "roomId": null };
	PLAYERS[meta].roomId = roomId;
	ROOMS[roomId] = ROOMS[roomId] || default_Rooms;
	if(ROOMS[roomId].gameStarted) {
		await sendToOne(meta, createMessage(
			"error",
			meta,
			`Can't join the group the game has already started`

		));
		return;
	}
	ROOMS[roomId].ids.push(meta);

	const messageToAll = createMessage(
        "JoinGroup",
        null,
        {
            playerIds: ROOMS[roomId].ids,
            room: roomId,
            message: `Welcome to Room ${roomId}, player ${meta}!`
        }
    );

    const messageToOne = createMessage(
        "JoinGroup",
        meta,
        "You have successfully joined the group"
    );
	

	await Promise.all([
        sendToAll(Object.values(ROOMS[roomId].ids), messageToAll),
        sendToOne(meta, messageToOne)
    ]);
}

export const handleDisconnect = async (meta) => {
    // Logic to handle player disconnection
    const player = PLAYERS[meta];
    if (!player){
		// Player not found
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: `Player Not Found`
			}
		));
		return;
	}; 

    const roomId = player.roomId;
    delete PLAYERS[meta];
    if (roomId) {
		ROOMS[roomId] = ROOMS[roomId].ids.filter(id => id !== meta);
    	await sendToAll(Object.values(ROOMS[roomId].ids), createMessage(
			"disconnect",
			meta,
			{
				room: roomId,
				message: `Player ${meta} has left Room ${roomId}.`
			}
		));
	}else{
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: `Can't Start the Round since there is no room`
			}
		));
		return;
	}
    // If the disconnected player was the current drawer, start a new round
    if (meta === ROOMS[roomId].CURRENT_DRAWER) {
        await startRound();
    }
};

const currentDrawerSelection = (PlayerInRoom) => {
	return PlayerInRoom[Math.floor(Math.random() * PlayerInRoom.length)]
}

const currentWordSelection = () => {
	const word = ['apple', 'banana', 'car', 'dog', 'house', 'tree', 'water', 'air', 'ant', 'bike', 'cat', 'chair', 'doll', 'elephant', 'flower', 'garden', 'hat', 'ice', 'jump', 'kite', 'lake', 'monkey', 'night', 'orange', 'pen', 'queen', 'rainbow', 'snake', 'train', 'umbrella', 'violin', 'wagon', 'xylophone', 'yak', 'zebra', 'basket', 'castle', 'dinosaur', 'frog', 'grape', 'honey', 'island', 'jewel', 'kangaroo', 'lemon', 'mountain', 'nest', 'ocean', 'penguin', 'queen', 'rabbit', 'sun', 'tiger', 'umbrella', 'violin', 'worm', 'xylophone', 'yacht', 'zoo', 'antelope', 'balloon', 'crocodile', 'dolphin', 'elevator', 'fire', 'giraffe', 'hamburger', 'island', 'jewelry', 'kite', 'leopard', 'monster', 'noodle', 'oasis', 'pizza', 'queen', 'rhinoceros', 'snow', 'turtle', 'umbrella', 'volcano', 'wagon', 'xylophone', 'yarn', 'zebra', 'apple', 'banana', 'car', 'dog', 'house', 'tree', 'water', 'air', 'ant', 'bike', 'cat', 'chair', 'doll', 'elephant', 'flower', 'garden', 'hat', 'ice', 'jump', 'kite', 'lake', 'monkey', 'night', 'orange', 'pen', 'queen', 'rainbow', 'snake', 'train', 'umbrella', 'violin', 'wagon', 'xylophone', 'yak', 'zebra'];
	return word[Math.floor(Math.random() * word.length)];
}

export const startGame = async (meta) => {
	const roomId = PLAYERS[meta].roomId;

	if(roomId == null) {
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: `Can't Start the Round since there is no room`
			}
		));
		return;
	}
	const PlayerInRoom = ROOMS[roomId].ids;

	if(PlayerInRoom.length < 2) {
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: `Can't Start the Round since the room has only 1 player`
			}
		));
		return;
	}  
	ROOMS[roomId].CURRENT_DRAWER = currentDrawerSelection(PlayerInRoom);
	ROOMS[roomId].CURRENT_WORD = currentWordSelection();
	await sendToAll(Object.values(ROOMS[roomId].ids), createMessage(
		"startGame",
		meta,
		{
			message: `The current Drawer is ${ROOMS[roomId].CURRENT_DRAWER}`,
			current_drawer : ROOMS[roomId].CURRENT_DRAWER
		}
	));
	await sendToOne(ROOMS[roomId].CURRENT_DRAWER, createMessage(
		"startGame",
		meta,
		{
			word: ROOMS[roomId].CURRENT_WORD
		}
	));
	ROOMS[roomId].gameStarted = true;
}

// Todos ----
// EndGame ----



export const endGame = async (meta) => {
	const roomId = PLAYERS[meta].roomId;
	const PlayerScore = [];

	if(roomId === null ){
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: `Can't End the Game`
			}
		));
		return;
	} 


	ROOMS[roomId].ids.map((id) => {
		PlayerScore.push({
			"connectionId" : PLAYERS[id].connectionId, 
			"Score" : PLAYERS[id].score
		});
	})

	ROOMS[roomId].CURRENT_DRAWER = null;
	ROOMS[roomId].CURRENT_WORD = '';
	ROOMS[roomId].gameStarted = false;
	
	await sendToAll(	
		Object.values(ROOMS[roomId].ids), 
		createMessage(
		"endGame",
		meta,
		{
			message: `${JSON.stringify(PlayerScore)}`
		}
	)
	);
}



// handleGuess ----
export const handleGuess = async(meta, payload) => {
	const roomId = PLAYERS[meta].roomId;
	const guess = payload.guessWord.toLowerCase();
  	const correctGuess = guess === ROOMS[roomId].CURRENT_WORD;
	const PlayerScore = [];

	if(meta == ROOMS[roomId].CURRENT_DRAWER){
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: "You can not guess since you are a Drawer"
			}
		));
		return;
	}

	if(roomId === null ){
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: `Can't End the Game`
			}
		));
		return;
	} 

	ROOMS[roomId].ids.map((id) => {
		PlayerScore.push({
			"connectionId" : PLAYERS[id].connectionId, 
			"Score" : PLAYERS[id].score
		});
	})

	if(correctGuess){
		PLAYERS[meta].score++;
		startGame();
	}
	// Notify all players about the guess and whether it was correct
	await sendToAll(Object.keys(PLAYERS), createMessage(
		"handleGuess",
		null,
		{
			guesser: meta,
			guess: guess,
			correct: correctGuess,
			score: JSON.stringify(PlayerScore)
		}
	));
} 


// handle Drawing -----
export const handleDrawing = async (meta, payload) => {
	const roomId = PLAYERS[meta].roomId;
	if(roomId === null ){
		await sendToOne(meta, createMessage(
			"error",
			meta,
			{
				message: `You can not draw right Now`
			}
		));
		return;
	} 
	const GuesserList = ROOMS[roomId].ids.filter((id) => id !== meta);
	await sendToAll(GuesserList, createMessage(
		"handleDrawing",
		null,
		{
			drawing: payload
		}
	));
}

