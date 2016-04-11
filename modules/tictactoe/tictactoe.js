/** 
 * Hopefully plays TicTacToe
 *
 * Written By: Jay Harris
 * Date Written: 29/07/2015
 */
var games = [];

/**
 * Maps a coordinate to something a programmer would use
*/
function mapToCoord(coord) {
    var rows = {"A":0, "B":1, "C":2},
        columns = {"1":0, "2":1, "3":2};

    if (rows[coord] !== undefined){
        return rows[coord];
    }
    else if (columns[coord] !== undefined){
        return columns[coord];
    }
}

/**
 * Removes a game
*/
function removeGame(game) {
    for (var i = 0; i < games.length; ++i) {
        if (games[i] === game) {
            games.splice(i, 1);
            return;
        }
    }
}

/**
 * Finds a game given a player and a thread id. 
 * Returns undefined if no games are found
*/
function findGame(thread, player) {
    for (var i in games) {
        var game = games[i];

        //If the game has a different thread, exit
        if (game.thread !== thread) {
            continue;
        }

        //If there is already a game with this player, return it
        if (game.noughts === player || game.crosses === player) {
            return game;
        }
    } 
}

/**
 * Places a piece in a certain game
*/
function place(game, player, move) {
    //Work out what piece we are using.
    var piece = "X",
        board = game.board;

    if (player === game.noughts) {
        piece = "O";
    }

    //It's not even your turn
    if (player !== game.turn) {
        return "Invalid Move! (it's not your turn " + player + ")";
    }

    //You tried to put it on top of an existing piece
    if (board[move[0]][move[1]] !== '-') {
        return "Invalid Move! (there's already something there " + player + ")";
    }

    //Make your move
    board[move[0]][move[1]] = piece;

    //Swap the current player
    if (player === game.noughts) {
        game.turn = game.crosses;
    } else {
        game.turn = game.noughts;
    }
}

/**
 * Creates a new TicTacToe game
*/
function createGame(player1, player2, thread) {
    var board = [['-','-','-'],['-','-','-'],['-','-','-']],
        noughts = player1,
        crosses = player2,
        game = {
            thread: thread,
            board: board,
            noughts: player1,
            crosses: player2,
            turn: crosses
        };

    return game;
}

/**
*prints the game to the chat
*/
function printGame(game) {
    var output = "",
        board = game.board,
        rows = ["A", "B", "C"];

    output += "  1 2 3\n";

    for (var i = 0; i < board.length; ++i) {
        for (var j = 0; j < board[i].length; ++j) {
            if (j === 0) {
                output += rows[i] + " ";
            }
            else {
                output += "|";
            }

            output += board[i][j];
        }

        if (i < 2) {
            output += "\n";
        }
    }

    return output;
}

/**
* Checks to see if a player has won. Returns the winner or undefined
*/
function checkWin(game, player) {
    var board = game.board,
        piece = player === game.nought ? "O" : "X";

    //Check rows
    for (var i in board) {
        var row = board[i];

        if (row[0] === piece && row[1] === piece && row[2] === piece) {
            return player;
        }
    }   

    //Check columns
    for (var i = 0; i < 3; ++i) {
        if (board[0][i] === piece && board[1][i] === piece && board[2][i] === piece) {
            return player;
        }
    }

    //Check Diagonal
    if (board[0][0] === piece && board[1][1] === piece && board[2][2] === piece) {
        return player;
    }

    //Check Anti-Diagonal
    if (board[0][2] === piece && board[1][1] === piece && board[2][0] === piece) {
        return player;
    }
}

exports.match = function(text, commandPrefix) {
    return text.startsWith(commandPrefix + 'tictactoe')
        || text.startsWith(commandPrefix + 'move')
        || text.startsWith(commandPrefix + 'surrender');
};

exports.run = function(api, event) {
    "use strict";
    var command = event.body,
        commandPrefix = api.commandPrefix;

    // If we are creating a new game
    if (command.startsWith(commandPrefix + "tictactoe")) {
        var split = command.split('"');

        //There are way to many quotes for this to end well
        if (split.length !== 3 && split.length !== 5)  {
            api.sendMessage('And just what do you expect me to do with that?', event.thread_id);
            return;
        }

        var player1 = event.sender_name.trim(),
            player2 = split[1],
            game = createGame(player1, player2, event.thread_id);

        if (findGame(event.thread_id, player1)) {
            api.sendMessage(player1 + " is already in a game on this thread!", event.thread_id);
            return;
        }

        if (findGame(event.thread_id, player2)) {
            api.sendMessage(player2 + " is already in a game on this thread!", event.thread_id);
            return;
        }

        games[games.length] = game;

        var output = printGame(game);
        api.sendMessage(output, event.thread_id);
    }

    //If we are trying to make a move
    if (command.startsWith(commandPrefix + "move")) {
        var offset = commandPrefix.length + "move".length + 1,
            move = command.substr(offset),
            game = findGame(event.thread_id, event.sender_name.trim());

        if (!game) {
            api.sendMessage("You're not even playing " + event.sender_name.trim(), event.thread_id);
            return;
        }

        if (move.length !== 2) {
            api.sendMessage("Um. Is that even a coordinate?");
        }

        console.log(move);
        var y = mapToCoord(move.substr(0, 1)),
            x = mapToCoord(move.substr(1, 1));

        move = {
            0: y,
            1: x
        };

        if (move[0] === undefined || move[1] === undefined) {
            api.sendMessage("Do at least TRY and pick a coordinate on the board", event.thread_id);
            return;
        }

        var output = place(game, event.sender_name.trim(), move);
        if (output) {
            api.sendMessage(output, event.thread_id);
            return;
        }

        output = printGame(game);
        api.sendMessage(output, event.thread_id);

        output = checkWin(game, event.sender_name.trim());
        if (output) {
            api.sendMessage("Game Over! " + output + " wins!", event.thread_id);
            removeGame(game);
        } else {
            api.sendMessage(game.turn + "'s turn!", event.thread_id);
        }
    }

    //If we are surrendering
    if (command.startsWith(commandPrefix + "surrender")) {
        var game = findGame(event.thread_id, event.sender_name.trim());

        if (!game) {
            api.sendMessage("You're not even in a game! Why are you surrendering?");
            return;
        }

        removeGame(game);
        
        api.sendMessage(event.sender_name.trim() + " surrenders! " + (event.sender_name.trim() !== game.noughts ? game.noughts : game.crosses) + " wins!");
    }
};