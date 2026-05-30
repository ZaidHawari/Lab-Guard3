import http from "http";
import cron from "node-cron";

import app from "./app.js";

import { registerNotificationSocket } from "./socket.io/notifications.js";
import { processDueDateNotifications } from "./utils/notifications.js";

const server = http.createServer(app);

const io = registerNotificationSocket(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});

cron.schedule("0 * * * *", async () => {
    await processDueDateNotifications(io);
});

server.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});