<script>
	import { PUBLIC_API_URL } from '$env/static/public';
	import { goto } from '$app/navigation';
	let username = '';
	let password = '';
</script>

<div class="login">
	<h1 class="text">Login</h1>
	<form
		on:submit={async (e) => {
			e.preventDefault();
			const res = await fetch(
				`/back?path=${encodeURIComponent(`auth?username=${username}&password=${password}`)}`
			).then((res) => res.json());
			if (res.auth) {
				localStorage.setItem('auth', res.auth);
				goto('/dashboard');
			} else {
				alert('Gebruikersnaam of wachtwoord is onjuist');
			}
		}}
	>
		<input type="text" bind:value={username} placeholder="Gebruikersnaam" />
		<input type="password" bind:value={password} placeholder="Wachtwoord" />
		<button type="submit">Login</button>
	</form>
	<a href="/" class="back">Terug</a>
</div>

<style>
	.login {
		margin-left: auto;
		margin-right: auto;
		max-width: 400px;
		background-color: #f0f0f0;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 1rem;
	}
	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}
	input:disabled {
		background-color: #f0f0f0;
	}

	button {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #e0e0e0;
		background-color: #ffffff;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		transition: background-color 0.3s;
	}

	button:hover {
		background-color: #e0e0e0;
	}

	.text {
		text-align: center;
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}

	.back {
		display: block;
		text-align: center;
		margin-top: 1rem;
	}
</style>
