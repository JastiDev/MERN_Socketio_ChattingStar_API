const modelMsgReco = require("./model/MsgReco");
const socketio = require("socket.io");

let io;
let dicStar = {}; // idSocket 에 대하여 Star객체를 돌려주는 역할을 하는 사전

const MAX_MSG_LEN = 200;
const MAX_MSG_N = 10;

const ROOM_W = 2000;
const ni = 10;
const randX = () => parseInt((Math.random() * ni * ROOM_W) / 5);
const randY = () => parseInt((Math.random() * ni * ROOM_W) / 5);
// x, y 좌표로부터 머무를 방의 이름을 대주는 함수
const xy2room = (x, y) => {
  let roomX = parseInt(x / ROOM_W);
  let roomY = parseInt(y / ROOM_W);
  let room = `${roomX}_${roomY}`;
  return room;
};

class CStar {
  constructor(
    username,
    idSocket,
    x = randX(),
    y = randY(),
    room = "",
    arrMsg = []
  ) {
    this.username = username;
    this.idSocket = idSocket;
    this.x = x;
    this.y = y;
    this.room = room;
    this.arrMsg = arrMsg;
  }
}

const initSocketServer = (server) => {
  io = socketio(server);

  // 이것은 별의 이동을 구현하기 위한 네임스페이스 이다.
  const nspMove = io.of("/star-move");

  nspMove.on("connection", (socket) => {
    socket.on("i-connected", ({ username }) => {
      // entered Main page

      let arrStar = Object.values(dicStar);
      let k = arrStar.findIndex((star) => star.username == username);
      if (k > -1) {
        socket.emit("you-are-already-in", { username });
        return;
      }

      let x = randX();
      let y = randY();
      let room = xy2room(x, y);
      let star = joinRoom(username, x, y, room);
      nspMove.emit("star-connected", { star });
    });

    socket.on("i-disconnected", ({ username }) => {
      // logout or leave the Main page
      let star = dicStar[socket.id];
      if (star) {
        nspMove.emit("star-disconnected", { username: star.username });
        leaveRoom(star.room, star.username);
      }
    });

    socket.on("disconnect", () => {
      // refresh or close browser
      let star = dicStar[socket.id];
      if (star) {
        nspMove.emit("star-disconnected", { username: star.username });
        leaveRoom(star.room, star.username);
      }
    });

    //  한명이 움직이면
    socket.on("i-moved", ({ username, x, y }) => {
      // 그가 새 자리표를 가지고 어느 방에 속할것인지 판정하고
      let newRoom = xy2room(x, y);

      // 그의 소켓이 등록되여 있지 않으면 그는 새로 들어온 사람이므로
      if (!dicStar[socket.id]) {
        // 그를 새방에 넣는다. joinRoom()
        joinRoom(username, x, y, newRoom);
      } else {
        // 그의 소켓이 이미 등록되여 있으면 그는 이미 있은 사람이므로 그의 이전 방을 얻을수 있다.
        let oldRoom = dicStar[socket.id].room;
        if (dicStar[socket.id].username != username) console.log("ERRRRORRRR!"); //로파심

        // 그의 이전방과 새방이 같은 방이면
        if (newRoom == oldRoom) {
          // 그를 그방안에서 이동시키는 처리 moveInsideRoom()
          moveInsideRoom(username, x, y, newRoom);
        } else {
          // 그의 이전방과 새방이 다른 방이면
          // 그를 이전방에서 탈퇴시키는 처리 leaveRoom()
          leaveRoom(oldRoom, username);

          // 그를 새방에 넣는 처리           joinRoom()
          joinRoom(username, x, y, newRoom);
        }
      }
    });

    const joinRoom = (username, x, y, room) => {
      // 써버에서 그를 그방에 join 시킨다.
      socket.join(room);

      let star = new CStar(username, socket.id, x, y, room);
      dicStar[socket.id] = star;

      let arrMate = [];
      if (nspMove.adapter.rooms[room]) {
        for (idSocket in nspMove.adapter.rooms[room].sockets) {
          let mate = dicStar[idSocket];
          if (mate && mate.username != username) arrMate.push(mate);
        }
      }

      socket.emit("you-joined-room", {
        room,
        me: star,
        arrMate,
      });

      socket.to(room).emit("mate-joined-room", { mate: star });
      return star;
    };

    const moveInsideRoom = (username, x, y, room) => {
      // 그방에 있는 성원들에게 "나 움직였어"하고 말하면서 나의 이름, 위치를 보낸다.
      dicStar[socket.id].x = x;
      dicStar[socket.id].y = y;
      socket.to(room).emit("mate-moved", { username, x, y });
    };

    const leaveRoom = (room, username) => {
      // 그방에 있는 성원들에게 "난 가" 하고 인사한다.
      socket.to(room).emit("mate-leaved-room", { username });

      // 써버에서 그를 그방에서 leave 시킨다.
      socket.leaveAll();
      delete dicStar[socket.id];
    };

    ///////====================== Chat ================================////////
    socket.on("chat-msg", ({ sender, receiver, receiverSocketId, content }) => {
      // server 에 기억, 이것은 새로 들어오는 room mate들에 의하여 마지막문장이 읽혀진다. 리력을 보고싶은 사람이 누르면 전체가 읽어진다.
      let arrMsg = dicStar[receiverSocketId].arrMsg; //주소넘기기
      if (!arrMsg) arrMsg = [];

      if (content.length > MAX_MSG_LEN)
        content = content.substr(0, MAX_MSG_LEN);
      if (arrMsg.length == MAX_MSG_N) arrMsg.shift();
      arrMsg.push({ sender, content });

      // 자기를 포함한 모든 room mate 들에게 통지
      let room = dicStar[socket.id].room;
      nspMove.to(room).emit("chat-msg", { sender, receiver, content });
    });
  });
};

module.exports = { initSocketServer, dicStar };
