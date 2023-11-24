const express = require("express");
const {v4: uuid } = require("uuid");
const { ExpressPeerServer } = require("peer");
const app = express();

const server = require("http").Server(app);
const io = require("socket.io")(server);
const peerServer = ExpressPeerServer(server, {
    debug: true
});

const PORT = process.env.PORT || 5002;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use("/peerjs", peerServer);
app.get("/", ( req, res ) => {
    res.redirect(`/${uuid()}`);
});

app.get("/:room", ( req, res ) => {
    res.render("room", { roomId: req.params.room });
});

io.on("connection", socket => {
    socket.on("join-room", ( roomId, userId ) => {
        console.log("Joined the room", roomId);
        console.log("new userId", userId);
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);
    });
    socket.on("message", ( roomId, messageText ) => {
        console.log("message", roomId, messageText);
        socket.to(roomId).emit("create-message", messageText);
    });
});

server.listen(PORT);
