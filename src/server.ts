import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";
import cors from "cors";

export class Server {
    private httpServer!: HTTPServer;
    private app!: Application;
    private io!: SocketIOServer;

    private readonly DEFAULT_PORT = 1000;
    private activeSockets: string[] = []; // Track active socket connections

    constructor() {
        this.initialize();
        this.handleRoutes();
        this.handleSocketConnection();
    }

    private initialize(): void {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new SocketIOServer(this.httpServer, {
            cors: {
                origin: "*", // Allow all origins for now (update for production)
                methods: ["GET", "POST"],
            },
        });

        this.configureApp();
    }

    private configureApp(): void {
        this.app.use(cors()); // Enable CORS
        this.app.use(express.static(path.join(__dirname, "../public"))); // Serve static files
    }

    private handleRoutes(): void {
        this.app.get("/", (req, res) => {
            res.send(`<h1>EXPRESS APP</h1>`);
        });
    }

    private handleSocketConnection(): void {
        this.io.on("connection", (socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // Add new socket to activeSockets if not already present
            if (!this.activeSockets.includes(socket.id)) {
                this.activeSockets.push(socket.id);
                this.io.emit("update-user-list", {
                    users: this.activeSockets,
                });
            }

            // Handle call initiation
            socket.on("call-user", (data) => {
                console.log(`Call initiated from ${socket.id} to ${data.to}`);
                this.io.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id,
                });
            });

            // Handle answer from called user
            socket.on("make-answer", (data) => {
                console.log(`Answer sent from ${socket.id} to ${data.to}`);
                this.io.to(data.to).emit("answer-made", {
                    answer: data.answer,
                    socket: socket.id,
                });
            });

            // Handle disconnection
            socket.on("disconnect", () => {
                console.log(`Socket disconnected: ${socket.id}`);
                this.activeSockets = this.activeSockets.filter((id) => id !== socket.id);
                this.io.emit("update-user-list", {
                    users: this.activeSockets,
                });
            });
        });
    }

    public listen(callback: (port: number) => void): void {
        this.httpServer.listen(this.DEFAULT_PORT, () => callback(this.DEFAULT_PORT));
    }
}
