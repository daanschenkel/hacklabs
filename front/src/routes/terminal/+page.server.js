import { redirect } from '@sveltejs/kit';
export async function load({ url }) {
	const secret = url.searchParams.get('secret');

	const res = await fetch(`http://localhost:6969/authed?auth=${secret}`).then((res) => res.json());

	if (!res.authed) return redirect(303, '/login');
}
