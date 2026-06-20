import { NextRequest } from 'next/server';
import { registerSSEClient, unregisterSSEClient } from '@/lib/sse';

export async function GET(request: NextRequest) {
    const clientUuid = Math.random().toString(36).substring(2, 11);
    
    const stream = new ReadableStream({
        start(controller) {
            registerSSEClient(clientUuid, controller);
            
            // Send connection established confirmation
            const msg = `event: connected\ndata: ${JSON.stringify({ clientUuid })}\n\n`;
            controller.enqueue(new TextEncoder().encode(msg));
            
            // Keep connection alive with heartbeats every 15 seconds
            const interval = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
                } catch (e) {
                    clearInterval(interval);
                    unregisterSSEClient(clientUuid);
                }
            }, 15000);
            
            request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                unregisterSSEClient(clientUuid);
            });
        },
        cancel() {
            unregisterSSEClient(clientUuid);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        }
    });
}
