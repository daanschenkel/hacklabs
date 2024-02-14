<script>
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Terminal } from 'xterm';
	import { FitAddon } from 'xterm-addon-fit';
	const fitAddon = new FitAddon();

	let authed;
	let term;
	let cmd = '';
	let userSwitching = false;

	let cwd = '/';
	let user = 'bart';
	let hostname = 'bakkerscollege';
	const history = [];
	let historyIndex = 0;

	const users = [
		{
			name: 'bart',
			password: 'bart'
		},
		{
			name: 'root',
			password: 'RoetRoet123!'
		}
	];
	const fileSystem = {
		home: {
			bart: {
				'user.txt': 'tr6s9r4bn61nvmloq109'
			},
			root: {
				'root.txt': 'cjykcf4i9a7fwradlqhp'
			},
			'.rootpass':
				'Bart, ik heb het root wachtwoord gereset! Hier is het nieuwe wachtwoord:\r\nRoetRoet123!\r\nVerwijder dit bestand als je het hebt gelezen!\r\n\r\n- Bert'
		}
	};

	function canAccess(path, user) {
		if (user === 'root') return true;

		//parse cwd
		const cwdArr = path.split('/');

		//get last directory
		const lastDir = cwdArr[cwdArr.length - 1];

		//check if the user has access to the directory
		if (lastDir === user) return true;
		return false;
	}

	const commands = [
		{
			name: ['clear', 'cls'],
			description: 'Clear the terminal',
			action: () => {
				sendHelp();
			}
		},
		{
			name: ['ls'],
			description: 'List directory contents, add -a to show hidden files',
			action: (args) => {
				//parse cwd
				const cwdArr = cwd.split('/');

				console.log(cwdArr);

				//dynamicly get the current directory
				let currentDir = fileSystem.home;
				cwdArr.forEach((dir) => {
					if (dir === '') return;
					currentDir = currentDir[dir];
				});

				let dirs = Object.keys(currentDir);
				if (!args.includes('-a')) dirs = dirs.filter((d) => !d.startsWith('.'));
				term.write(dirs.join(' ') + '\r\n');
			}
		},
		{
			name: ['cd'],
			description: 'Change directory',
			action: (args) => {
				if (!args[0]) {
					cwd = '/';
					return;
				}

				if (args[0] === '..') {
					const cwdArr = cwd.split('/');
					cwdArr.pop();
					cwd = cwdArr.join('/') + '/';

					return;
				}

				//check if the directory exists
				const dirs = Object.keys(fileSystem.home);
				if (dirs.includes(args[0])) {
					//check if the user has access to the directory
					if (canAccess(cwd + args[0], user)) {
						cwd += args[0];
					} else {
						term.write('cd: ' + args[0] + ': Permission denied\r\n');
					}
				} else {
					term.write('cd: ' + args[0] + ': No such directory\r\n');
				}
			}
		},
		{
			name: ['cwd'],
			description: 'Print the current working directory',
			action: () => {
				term.write(cwd + '\r\n');
			}
		},
		{
			name: ['cat'],
			description: 'Print the contents of a file',
			action: (args) => {
				//parse cwd
				const cwdArr = cwd.split('/');

				if (!args[0]) return term.write('cat: missing file operand\r\n');

				//dynamicly get the current directory
				let currentDir = fileSystem.home;
				cwdArr.forEach((dir) => {
					if (dir === '') return;
					currentDir = currentDir[dir];
				});

				if (currentDir[args[0]]) {
					term.write(currentDir[args[0]] + '\r\n');
				} else {
					term.write('cat: ' + args[0] + ': No such file\r\n');
				}
			}
		},
		{
			name: ['echo'],
			description: 'Print a string',
			action: (args) => {
				if (args.length === 0) return term.write('echo: missing string operand\r\n');

				term.write(args.join(' ') + '\r\n');
			}
		},
		{
			name: ['touch'],
			description: 'Create a file',
			action: (args) => {
				//parse cwd
				const cwdArr = cwd.split('/');
				const lastDir = cwdArr[cwdArr.length - 1];

				if (!args[0]) return term.write('touch: missing file operand\r\n');

				if (lastDir === 'bart') {
					fileSystem.home.bart[args[0]] = '';
				} else {
					term.write("touch: cannot touch '" + args[0] + "': Permission denied\r\n");
				}
			}
		},
		{
			name: ['rm'],
			description: 'Remove a file',
			action: (args) => {
				//parse cwd
				const cwdArr = cwd.split('/');
				const lastDir = cwdArr[cwdArr.length - 1];

				if (!args[0]) return term.write('rm: missing file operand\r\n');

				if (lastDir === 'bart') {
					delete fileSystem.home.bart[args[0]];
				} else {
					term.write("rm: cannot remove '" + args[0] + "': Permission denied\r\n");
				}
			}
		},
		{
			name: ['tofile'],
			description: 'Write to a file',

			action: (args) => {
				//parse cwd
				const cwdArr = cwd.split('/');
				const lastDir = cwdArr[cwdArr.length - 1];

				if (!args[0]) return term.write('tofile: missing file operand\r\n');
				if (!args[1]) return term.write("tofile: missing content after '" + args[0] + "'\r\n");

				if (lastDir === user) {
					fileSystem.home[user][args[0]] = args.slice(1).join(' ');
				} else {
					term.write("tofile: cannot write to '" + args[0] + "': Permission denied\r\n");
				}
			}
		},

		{
			name: ['whoami'],
			description: 'Have an existential crisis',
			autoComplete: ['--serious'],
			action: (args) => {
				if (args[0] === '--serious') {
					term.write('You are ' + user + '\r\n');
				} else {
					term.write("I'm a terminal, what are you?\r\n");
					term.write('Add the --serious flag to get a serious answer\r\n');
				}
			}
		},

		{
			name: ['su'],
			description: 'Switch user',
			autoComplete: [users.map((u) => u.name)],
			action: (args) => {
				if (args.length === 0) return term.write('su: missing operand\r\n');

				//check if the user exists
				const userObj = users.find((u) => u.name === args[0]);
				if (!userObj) return term.write('su: ' + args[0] + ': No such user\r\n');

				userSwitching = args[0];
				term.write('Password: ');
			}
		},
		{
			name: ['reset', 'reload', 'refresh'],
			description: 'Clear the terminal and flush the filesystem',
			action: async () => {
				location.reload();
				//await forever
				await new Promise(() => {});
			}
		},
		{
			name: ['exit', 'logout'],
			description: 'Exit the terminal',
			action: async () => {
				cmd = '';
				term.write('👋  Goodbye! \r\n');
				await new Promise((r) => setTimeout(r, 1000));
				term.dispose();
				goto('/dashboard');
			}
		},
		{
			name: ['hostname', 'host', 'name'],
			description: "Print the system's hostname or set the hostname",
			action: (args) => {
				if (args.length === 0) {
					term.write(hostname + '\r\n');
				} else {
					if (args[0].trim() === '') {
						term.write('hostname: hostname may not be empty\r\n');
						return;
					}
					hostname = args[0];
				}
			}
		},
		{
			name: ['ip'],
			description: ':)',
			action: async () => {
				await fetch('https://icanhazip.com')
					.then((res) => res.text())
					.then((ip) => {
						term.write('Your IP is: ' + ip + '\r');
					})
					.catch(() => {
						term.write('Failed to get your IP\r\n');
					});
			}
		},
		{
			name: ['help'],
			description: 'Show this help message',
			action: () => {
				commands.forEach((c) => {
					term.write(c.name.join(' / ') + ' - ' + c.description + '\r\n');
				});
			}
		}
	];

	onMount(async () => {
		const auth = localStorage.getItem('auth');
		const res = await fetch(`${env.PUBLIC_API_URL}/authed?auth=${auth}`).then((res) => res.json());
		authed = res.authed;

		if (!authed) goto('/login');

		term = new Terminal({
			cursorBlink: true,
			theme: {
				background: '#000000',
				foreground: '#ffffff'
			}
		});

		term.loadAddon(fitAddon);

		//focus the terminal

		term.onKey(async (e) => {
			if (cmd.length === 0 && e.domEvent.key === 'Enter')
				return term.write(`\r\n${user}@${hostname}:~$ `);

			if (e.domEvent.key === 'Tab') {
				if (cmd.length === 0) return;

				if (cmd.includes(' ')) {
					const commandMatch = commands.find((c) => c.name.includes(cmd.split(' ')[0]));

					if (!commandMatch) return;
					console.log(commandMatch);

					const args = cmd.split(' ');
					const argIndex = args.length - 2;

					console.log(argIndex);

					const autoComplete = commandMatch.autoComplete[argIndex];
					if (autoComplete) {
						const matches = autoComplete.filter((a) => a.startsWith(args[argIndex + 1]));

						if (matches.length === 1) {
							args[argIndex + 1] = matches[0];
							cmd = args.join(' ');

							//empty line
							term.write('\x1b[2K\r');

							//replace line
							term.write(`${user}@${hostname}:~$ ${cmd}`);
						} else if (matches.length > 1) {
							term.write('\r\n');
							matches.forEach((m) => {
								term.write(m + ' ');
							});
							term.write('\r\n');
							term.write(`${user}@${hostname}:~$ ${cmd}`);
						} else {
							term.write('\r\n');
							term.write(`${user}@${hostname}:~$ ${cmd}`);
						}

						return;
					}
				} else {
					//find closest match, if multiple matches, print them
					const matches = commands.filter((c) => c.name[0].startsWith(cmd));

					if (matches.length === 1) {
						cmd = matches[0].name[0];

						//empty line
						term.write('\x1b[2K\r');

						//replace line
						term.write(`${user}@${hostname}:~$ ${cmd}`);
					} else if (matches.length > 1) {
						term.write('\r\n');
						matches.forEach((m) => {
							term.write(m.name[0] + ' ');
						});
						term.write('\r\n');
						term.write(`${user}@${hostname}:~$ ${cmd}`);
					}

					return;
				}
			}

			//arrowup & down if possible
			if (e.domEvent.key === 'ArrowUp') {
				if (historyIndex < history.length) {
					term.write('\x1b[2K\r');
					term.write(`${user}@${hostname}:~$ ${history[history.length - historyIndex - 1]}`);
					cmd = history[history.length - historyIndex - 1];
					historyIndex++;
				}
				return;
			} else if (e.domEvent.key === 'ArrowDown') {
				//if historyIndex is 0, the user is at the last command
				if (historyIndex > 1) {
					term.write('\x1b[2K\r');
					term.write(`${user}@${hostname}:~$ ${history[history.length - historyIndex + 1]}`);
					cmd = history[history.length - historyIndex + 1];
					historyIndex--;
				} else {
					term.write('\x1b[2K\r');
					term.write(`${user}@${hostname}:~$ `);
					cmd = '';
				}

				return;
			}

			if (e.domEvent.key === 'Enter') {
				historyIndex = 0;
				term.write('\r\n');
				if (userSwitching) {
					const userObj = users.find((u) => u.name === userSwitching);
					if (userObj && userObj.password === cmd) {
						user = userSwitching;
						cwd = '/';
						userSwitching = false;
					} else {
						term.write('su: Authentication failure\r\n');
						userSwitching = false;
					}
					cmd = '';
					return term.write(`${user}@${hostname}:~$ `);
				}

				const args = cmd.split(' ');
				const command = args.shift();
				const commandObj = commands.find((c) => c.name.includes(command));

				if (commandObj) {
					if (commandObj.name[0] === 'clear' || commandObj.name[0] === 'cls') {
						cmd = '';
						return sendHelp();
					} else {
						await commandObj.action(args);

						history.push(cmd);

						if (userSwitching) return (cmd = '');
					}
				} else {
					term.write(`bash: ${command}: command not found\r\n`);
				}
				term.write(`${user}@${hostname}:~$ `);
				cmd = '';
			} else if (e.domEvent.key === 'Backspace') {
				if (cmd.length > 0) {
					term.write('\b \b');
					cmd = cmd.slice(0, -1);
				}
			} else {
				if (!userSwitching) term.write(e.key);
				else term.write('*');
				cmd += e.key;
			}
		});
	});

	function loadTerminal(node) {
		term.open(node);
		term.focus();
		fitAddon.fit();

		sendHelp();
	}
	function sendHelp() {
		term.clear();
		term.write('Need help? Type "help" and press enter\r\n');
		term.write(`${user}@${hostname}:~$ `);
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="/xterm.css" />
</svelte:head>

{#if !authed && authed !== false}
	<p class="loading">// Terminal laden...</p>
{:else if authed}
	<div id="terminal" use:loadTerminal class="term" />
{:else}
	<p class="loading">Je bent niet ingelogd</p>
{/if}

<p class="notif">
	Verbonden met <b>{hostname}</b> als <b>{user}</b>
</p>

<style>
	.loading {
		background-color: black;
		color: white;
		text-align: center;
		font-size: 1.5rem;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.term {
		background-color: black;
		min-height: 100vh;
	}
	.notif {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		text-align: center;
		color: white;
	}
</style>
