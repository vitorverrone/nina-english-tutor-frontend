import { NextRequest } from 'next/server';
import { getServerAuthToken } from '@/lib/actions';
import { BASE_URL } from '@/lib/api';

export async function POST(req: NextRequest) {
    const token = await getServerAuthToken();
    const body = await req.json();

    const upstream = await fetch(`${BASE_URL}/chat/message-stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    if (!upstream.ok || !upstream.body) {
        return new Response(JSON.stringify({ error: 'Stream unavailable' }), { status: upstream.status });
    }

    return new Response(upstream.body, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
}
