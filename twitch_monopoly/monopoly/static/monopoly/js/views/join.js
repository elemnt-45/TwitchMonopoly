"use strict";

/**
 *WebSocket Interface
 */

/*const receivedMessage = {
    action: "join" | "start",
    data: [{
        id: "user_id",
        name: "user_name",
        avatar: "user_url"
    }]
};

const sentMessage = {
    action: "start"
};*/

class JoinView {
    constructor() {
        this.userName = document.getElementById("user-name").value;
        this.hostName = document.getElementById("host-name").value;
        this.players = [this.userName];
        this.initComponents();
        this.initConnection();
    }

    initComponents() {
        this.$usersContainer = document.getElementById("joined-users-container");
        this.$newGameNotice = document.getElementById("new-game-notice");
        this.$startGame = document.getElementById("start-game");
        this.$startGame.addEventListener("click", () => {
            this.startGame();
        });

        if (this.userName === this.hostName) {
            this.$invitationLink = document.getElementById("invitation-url");
            this.$invitationLink.value = `${window.location.host}/join/${this.hostName}`;

            this.$copyTooltip = document.getElementById("copied-tooltip");
            this.$copyButton = document.getElementById("share-invitation");
            this.$copyButton.addEventListener("click", () => {
                this.copyToClipboard();
            })
        }

        const isProfileInited = document.getElementById("user-avatar").getAttribute("src").length !== 0;
        if (!isProfileInited) {
            const $addProfileButton = document.getElementById("init-profile");
            $addProfileButton.classList.remove("hidden");
        }
    }

    initConnection() {
        this.socket = new WebSocket(`ws://${window.location.host}/join/${this.hostName}`);
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            //const message = event.data;
            this.handleStatus(message);
        }
    }

    handleStatus(message) {
        console.log(message);
        if (message.action === "join") {
            this.addPlayer(message.data);

            if (this.players.length > 1) {
                if (this.hostName !== this.userName) {
                    this.$startGame.innerText = "Ожидание начала игры";
                } else {
                    this.$startGame.disabled = false;
                    this.$startGame.innerText = "Начать игру";
                }
            }
        } else if (message.action === "start") {
            this.navigateToGame();
        } else if (message.action === "fail_join") {
            this.$startGame.disabled = true;
            this.$startGame.innerText = "Navigating back... Create your own game!";
            this.$newGameNotice.innerText = "4 Players Max Per Game!";
            this.$newGameNotice.style.color = "#F44336";
            setTimeout(this.navigateBack, 2000);
        }
    }

    addPlayer(players) {
        for (let player of players) {
            //console.log("username: ", player.username);
            if (this.players.indexOf(player.username) !== -1 || player.username === this.userName) continue;
            
            this.players.push(player.username);
            //console.log("players: ", players);
            this.$usersContainer.innerHTML += `
                <a href="/monopoly/profile/${player}" target="_blank">
                <img class="joined-user-avatar" src="${player.profile_pic}" title="${player}">
                </a>
            `; 
        }
    }

    startGame() {
        this.socket.send(JSON.stringify({
            action: "start"
        }));
    }

    navigateToGame() {
        window.location = `http://${window.location.host}/game/${this.hostName}`;
    }

    navigateBack() {
        window.location = `http://${window.location.host}/join`;
    }

    copyToClipboard() {
        let copyText = this.$invitationLink;
        copyText.select();
        document.execCommand("Copy");

        this.$copyTooltip.classList.add("shown");
        setTimeout(() => {
            this.$copyTooltip.classList.remove("shown");
        }, 2000);
    }

    sendAJAX(message, callback = () => {}) {
    $.ajax({
      url: "" /* Куда пойдет запрос */,
      method: "get" /* Метод передачи (post или get) */,
      dataType: "json" /* Тип данных в ответе (xml, json, script, html). */,
      data: message /* Параметры передаваемые в запросе. */,
      cache: false,
      success: function (answer) {
        /* функция которая будет выполнена после успешного запроса.  */
        if (callback){
        callback(answer);
        }
        return answer;
      },
    });
  }
}

window.onload = () => {
    new JoinView();
};