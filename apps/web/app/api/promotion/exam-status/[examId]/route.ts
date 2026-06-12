import { NextRequest } from 'next/server';
import { getServerAuthToken } from '@/lib/actions';
import { BASE_URL } from '@/lib/api';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
    const { examId } = await params;
    const token = await getServerAuthToken();

    const upstream = await fetch(`${BASE_URL}/promotion/exam-status/${examId}`, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));
    return Response.json(data, { status: upstream.status });
}
