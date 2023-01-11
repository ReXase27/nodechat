import { Server } from "net";
import { fileURLToPath } from "url";

const stopConnWords = ["exit", "close", "end"];
const host = "127.0.0.1";

const connections = new Map();

function error(msg) {
	console.error(`\x1b[31mError: ${msg}\x1b[0m`);
	process.exit(1);
}

function broadcastMessage(message, origin) {
	for (const socket of connections.keys()) {
		if (socket !== origin) {
			socket.write(message);
		}
	}
}

function listen(port) {
	const server = new Server();

	server.on("connection", (socket) => {
		const remoteSocket = `${socket.remoteAddress}:${socket.remotePort}`;
		console.log(`\x1b[32mNew connection from ${remoteSocket}.\x1b[0m`);
		socket.setEncoding("utf-8");

		let username;
		let fullMessage;

		socket.on("data", (msg) => {
			if (!connections.has(socket)) {
				for (const v of connections.values()) {
					if (v === msg) {
						socket.write(`Error, username ${v} already exists!`);
						socket.end();
					}
				}
				console.log(`Username ${msg} set for connection ${remoteSocket}`);
				connections.set(socket, msg);
				username = connections.get(socket);
				return;
			} else if (stopConnWords.includes(msg.toString().toLocaleLowerCase())) {
				socket.end(() => {
					console.log(`\x1b[31m${username} has disconnected.\x1b[0m`);
				});
				connections.delete(socket);
			} else {
				fullMessage = `[${username}]: ${msg}`;
				broadcastMessage(fullMessage, socket);
			}
			console.log(`${remoteSocket} -> ${fullMessage}`);
		});

		socket.on("error", (err) => error(err.message));
	});

	server.listen({ port, host }, () => {
		console.log(`Listening on ${host}:${port}...`);
	});

	server.on("error", (err) => error(err.message));
}

function main() {
	console.log(process.argv);
	if (process.argv.length !== 3) {
		error(
			`Not enough arguments, port might be missing\nUsage: node ${new URL(
				import.meta.url,
			).pathname
				.split("/")
				.pop()} port`,
		);
	}

	const port = process.argv[2];

	if (isNaN(port)) {
		error("Port is not a number");
	}

	listen(port);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}
