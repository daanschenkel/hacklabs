<script>
	let logs = [];
	let loading = false;

	async function generateResponse(prompt) {
		const query = new URLSearchParams();
		query.set('prompt', prompt);
		query.set('logs', JSON.stringify(logs));

		const res = await fetch(`/back?path=${encodeURIComponent(`chat?${query.toString()}`)}`).then(
			(res) => res.json()
		);

		logs = res.logs;
	}
</script>

<main>
	<div class="notif">
		Als school moeten we natuurlijk ook megaan in de tijd, dus hebben wij door onze ICT afdeling een
		handige chatbot laten ontwikkelen! Je kan hem van alles vragen over elk vak dat je kan bedenken,
		en hij zal je <b>altijd</b> een antwoord geven. Hij is nog niet perfect, maar we werken er hard
		aan!
		<br /><br />
		<b
			>Let op, de chatbot spreekt op dit moment nog geen Nederlands, maar alleen Engels! Ons ai-team
			vind dit een goede kans om Engels te leren!</b
		>
	</div>

	<h1>Chat</h1>
	<div class="chat">
		{#each logs as log}
			{#if log.type === 'L'}
				<div class="sent">{log.message}</div>
			{:else if log.type === 'D'}
				<div class="received">{log.message}</div>
			{/if}
		{/each}
	</div>

	<div class="send">
		<input
			type="text"
			on:keydown={(e) => {
				if (e.target.value.length > 0) {
					if (e.key === 'Enter') {
						loading = true;
						generateResponse(e.target.value).then(() => {
							loading = false;
						});
						e.target.value = '';
					}
				}
			}}
			disabled={loading}
		/>
		<button
			on:click={(e) => {
				if (document.querySelector('input').value.length > 0) {
					loading = true;
					generateResponse(document.querySelector('input').value).then(() => {
						loading = false;
					});
					document.querySelector('input').value = '';
				}
			}}
			disabled={loading}
		>
			Verstuur
		</button>
	</div>

	<!-- 
		TODO: inlog uit trainingsdata halen
	-->
	<a href="/login" class="login"> Beheer </a>
</main>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.sent {
		/*green background*/
		background-color: #e0f0e0;
		padding: 0.5rem;
		border-radius: 0.5rem;
	}
	.received {
		background-color: #e0e0e0;
		padding: 0.5rem;
		border-radius: 0.5rem;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 0.5rem;
	}

	input:disabled {
		background-color: #f0f0f0;
	}

	main {
		padding: 1rem;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}

	.notif {
		background-color: #f0f0f0;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
	}

	.login {
		display: block;
		text-align: center;

		background-color: #f0f0f0;
		padding: 0.5rem;
		border-radius: 0.5rem;
		margin-left: auto;
		margin-right: auto;
		margin-top: 1rem;
		max-width: 100px;
	}

	.login:hover {
		background-color: #e0e0e0;
	}

	.send {
		display: flex;
		gap: 0.5rem;
	}

	button {
		padding: 0.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 0.5rem;
	}
</style>
