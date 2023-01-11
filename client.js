import { Socket } from "net";
import { fileURLToPath } from "url";

import readline from "readline";

function error(msg) {
	console.error(`\x1b[31mError: ${msg}\x1b[0m`);
	process.exit(1);
}

const safewords = ["exit", "close", "end"];

function main() {
	if (process.argv.length !== 4) {
		error(
			`Not enough arguments, host and port might be missing\nUsage: node ${new URL(
				import.meta.url,
			).pathname
				.split("/")
				.pop()} host port`,
		);
	}
	const [, , host, port] = process.argv;

	if (isNaN(port)) {
		error("Port is not a number");
	}

	connect(host, port);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}

function connect(host, port) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log(`Connecting to ${host}:${port}`);

	const socket = new Socket();

	socket.setEncoding("utf-8");
	socket.connect({ host, port });

	socket.on("connect", () => {
		socket.on("error", (err) => {
			error(err.message);
			socket.end();
		});

		console.log(`Successfully connected to ${host}:${port}`);

		rl.question("Enter your username: ", (username) => {
			socket.write(username);
			console.log(
				"Type any message to send it, type end, close or exit to finish",
			);
		});

		rl.on("line", (line) => {
			socket.write(line);
			if (safewords.includes(line.toLocaleLowerCase())) {
				socket.end(() => {
					console.log("\x1b[31mYou have disconnected from the server.\x1b[0m");
				});
				process.exit(0);
			}
		});

		socket.on("data", (data) => {
			console.log(data);
		});
	});
}
