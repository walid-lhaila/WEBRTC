import { Server } from "./server";

const server = new Server();

server.listen(port => {
    console.log(`Server Is Listening on http://localhost:${port}`);
});