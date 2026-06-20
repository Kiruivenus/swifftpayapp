import { NextRequest } from 'next/server';

type SSEClient = {
    id: string;
    controller: ReadableStreamDefaultController;
};

// Global clients list surviving hot reloads
const globalRef = global as any;
if (!globalRef.sseClients) {
    globalRef.sseClients = [];
}

export function registerSSEClient(id: string, controller: ReadableStreamDefaultController) {
    globalRef.sseClients.push({ id, controller });
}

export function unregisterSSEClient(id: string) {
    globalRef.sseClients = globalRef.sseClients.filter((c: any) => c.id !== id);
}

export function broadcastSSE(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    
    // Create copy to iterate over safely in case of mutation during traversal
    const activeClients = [...globalRef.sseClients];
    activeClients.forEach((client: SSEClient) => {
        try {
            client.controller.enqueue(encoder.encode(message));
        } catch (e) {
            // Remove broken/closed controllers
            unregisterSSEClient(client.id);
        }
    });
}
