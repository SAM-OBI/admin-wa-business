import { io, Socket } from 'socket.io-client';

class SocketClient {
    private static instance: SocketClient;
    private socket: Socket | null = null;

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    public connect(token?: string) {
        if (this.socket?.connected) return this.socket;

        const baseUrl = import.meta.env.PROD ? 'https://whatsapp-b2b.onrender.com' : 'http://localhost:5000';
        
        this.socket = io(baseUrl, {
            transports: ['websocket'],
            withCredentials: true,
            auth: token ? { token: `Bearer ${token}` } : undefined,
            reconnection: true,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => console.log('✅ Admin Socket Connected'));
        this.socket.on('disconnect', () => console.warn('🔌 Admin Socket Disconnected'));

        return this.socket;
    }

    public getSocket() {
        return this.socket;
    }

    public disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const socketClient = SocketClient.getInstance();
