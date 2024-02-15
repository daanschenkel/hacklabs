import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const path = url.searchParams.get('path');
	const res = await fetch(`http://localhost:6969/${path}`);
	const data = await res.json();

	return json(data);
}
