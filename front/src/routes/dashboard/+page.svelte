<script>
	import { PUBLIC_API_URL } from '$env/static/public';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	let authed;

	onMount(async () => {
		const auth = localStorage.getItem('auth');
		const res = await fetch(`${PUBLIC_API_URL}/authed?auth=${auth}`).then((res) => res.json());
		authed = res.authed;

		if (!authed) goto('/login');
	});
</script>

{#if !authed && authed !== false}
	<p class="loading">Laden...</p>
{:else if authed}
	<div class="dashboard">
		<h1 class="text">Welkom Bart!</h1>
		<a class="btn" href="/terminal"> Onderhoud uitvoeren </a>

		<button
			on:click={() => {
				localStorage.removeItem('auth');
				goto('/login');
			}}
			class="logout"
		>
			Uitloggen</button
		>
	</div>
{:else}
	<p class="loading">Je bent niet ingelogd</p>
{/if}

<style>
	.loading {
		text-align: center;
		margin-top: 1rem;
		font-size: 1.5rem;
	}

	.dashboard {
		margin-left: auto;
		margin-right: auto;
		max-width: 400px;
		background-color: #f0f0f0;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 1rem;
	}

	.text {
		text-align: center;
		font-size: 1.5rem;
		font-weight: bold;
	}

	.btn {
		display: block;
		background-color: #000000;
		color: #ffffff;
		padding: 0.5rem;
		border-radius: 0.5rem;
		text-align: center;
		text-decoration: none;
		margin-top: 1rem;
	}

	.logout {
		background-color: #ff0000;
		color: #ffffff;
		padding: 0.5rem;
		border-radius: 0.5rem;
		text-align: center;
		text-decoration: none;
		margin-top: 1rem;
		display: block;
		width: 100%;
	}
</style>
