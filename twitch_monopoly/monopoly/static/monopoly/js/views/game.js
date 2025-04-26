import { GameController } from "../game_views/game_controller.js";

class GameView {
  constructor() {
    this.initComponents();
    this.gameInProcess = true;
  }

  initComponents() {
    //this.showModal(null, "Welcome to Monopoly", "", "Loading game resources...", []);

    this.$helpControl = document.getElementById("help-control");
    this.$helpControl.addEventListener("click", this.showHelp.bind(this));
    this.$helpOverlay = document.getElementById("rules-overlay");
    this.showingHelp = false;

    this.initBoard();
  }

  initBoard() {
    this.gameController = new GameController({
      containerEl: document.getElementById("game-container"),
      onBoardPainted: console.log("Board initialized"),
    });

    window.addEventListener(
      "resize",
      () => {
        this.gameController.resizeBoard();
      },
      false
    );
  }

  onDiceRolled() {
    console.log("Dice rolled");
  }

  handleStatusChange(message) {
    const messageHandlers = {
      init: this.handleInit,
      add_err: this.handleAddErr,
      roll_res: this.handleRollRes,
      buy_land: this.handleBuyLand,
      construct: this.handleConstruct,
      cancel_decision: this.handleCancel,
      game_end: this.handleGameEnd,
      chat: this.handleChat,
    };

    if (!this.gameInProcess) return;

    messageHandlers[message.action].bind(this)(message);
  }

  /*
   * Init game status, called after ws.connect
   * players: @see initPlayers
   * amount: @see changeCashAmount
   * */
  initGame(players, amount, posChange) {
    // Init players
    this.initPlayers(players, posChange);

    // Init cash amount
    this.changeCashAmount(amount);
  }

  /*
   * Display players on the top
   * players: [{
   *   fullName: string, // user full name
   *   userName: string, // username
   *   avatar: string // user avatar url
   * }]
   * */
  initPlayers(players, initPos) {
    this.players = players;
    this.currentPlayer = null;

    for (let i = 0; i < players.length; i++) {
      if (this.userName === players[i].userName) this.myPlayerIndex = i;
      const avatarTemplate = players[i].avatar
        ? `<img class="user-avatar" src="${players[i].avatar}">`
        : `<div class="user-group-name">${players[i].fullName.charAt(0)}</div>`;

      this.$usersContainer.innerHTML += `
                <div id="user-group-${i}" class="user-group" style="background: ${GameView.PLAYERS_COLORS[i]}">
                    <a href="/monopoly/profile/${players[i].userName}" target="_blank">
                        ${avatarTemplate}
                    </a>
                    <span class="user-cash">
                        <div class="monopoly-cash">M</div>
                        <div class="user-cash-num">1500</div>
                    </span>
                    <img class="user-role" src="/static/images/player_${i}.png">
                </div>`;
    }

    this.gameLoadingPromise = this.gameController.addPlayer(
      players.length,
      initPos
    );
  }

  /*
   * Change the cash balance
   * amounts: [int]
   * */
  changeCashAmount(amounts) {
    for (let i in amounts) {
      const $cashAmount = document.querySelector(
        `#user-group-${i} .user-cash-num`
      );
      $cashAmount.innerText = amounts[i] >= 0 ? amounts[i] : 0;
    }
  }

  /*
   * Change player
   * nextPlayer: int,
   * onDiceRolled: function
   * */
  changePlayer(nextPlayer, onDiceRolled) {
    // update user indicator
    if (this.currentPlayer !== null) {
      let $currentUserGroup = document.getElementById(
        `user-group-${this.currentPlayer}`
      );
      $currentUserGroup.classList.remove("active");
    }

    let $nextUserGroup = document.getElementById(`user-group-${nextPlayer}`);
    $nextUserGroup.classList.add("active");

    this.currentPlayer = nextPlayer;
    let title = this.currentPlayer === this.myPlayerIndex ? "Your Turn!" : "";

    // role dice
    const button =
      nextPlayer !== this.myPlayerIndex
        ? []
        : [
            {
              text: "Roll",
              callback: () => {
                document.getElementById("roll").checked = true;
                document.querySelector(
                  "#modal-buttons-container button"
                ).disabled = true;
                document.querySelector(
                  "#modal-buttons-container button"
                ).innerText = "Hold on...";

                this.audioManager.play("dice");

                onDiceRolled();
              },
            },
          ];
    this.showModal(nextPlayer, title, "", this.diceMessage, button);
  }

  /*
   * Display a pop-up modal
   * message: a snippet of text or HTML
   * playerIndex: int,
   * buttons: [{
   *   text: string, // "button text"
   *   callback: function
   * }],
   * displayTime: int // seconds to display
   * */
  showModal(playerIndex, title, subTitle, message, buttons, displayTime) {
    return new Promise((resolve) => {
      if (playerIndex === null) {
        this.$modalAvatar.src = GameView.DEFAULT_AVATAR;
      } else {
        this.$modalAvatar.src = `/static/images/player_${playerIndex}.png`;
        this.$modalAvatar.style.background =
          GameView.PLAYERS_COLORS[playerIndex];
      }

      if (playerIndex === this.myPlayerIndex) {
        this.$modalAvatar.classList.add("active");
      } else {
        this.$modalAvatar.classList.remove("active");
      }

      this.$modalMessage.innerHTML = message;
      this.$modalButtons.innerHTML = "";

      this.$modalTitle.innerText = title;
      this.$modalSubTitle.innerText = subTitle;

      for (let i in buttons) {
        let button = document.createElement("button");
        button.classList.add("large-button");
        button.id = `modal-button-${i}`;
        button.innerText = buttons[i].text;

        button.addEventListener("click", () => {
          buttons[i].callback();
          resolve();
        });

        button.addEventListener("mouseover", () => {
          this.audioManager.play("hover");
        });

        this.$modalButtons.appendChild(button);
      }

      this.$modalCard.classList.remove("hidden");
      this.$modalCard.classList.remove("modal-hidden");

      // hide modal after a period of time if displayTime is set
      if (displayTime !== undefined && displayTime > 0) {
        setTimeout(async () => {
          await this.hideModal(true);
          resolve();
        }, displayTime * 1000);
      } else {
        resolve();
      }
    });
  }

  /*
   * Hide the modal
   * */
  hideModal(delayAfter) {
    return new Promise((resolve) => {
      this.$modalCard.classList.add("modal-hidden");
      if (delayAfter === true) {
        setTimeout(() => {
          resolve();
        }, 500);
      } else {
        resolve();
      }
    });
  }

  showHelp() {
    this.showingHelp = !this.showingHelp;
    //this.sendAJAX({"data":"zhopa"},  (message) => {alert(message);});
    if (this.showingHelp) {
      this.$helpControl.classList.remove("control-off");
      this.$helpOverlay.classList.remove("hidden");
    } else {
      this.$helpControl.classList.add("control-off");
      this.$helpOverlay.classList.add("hidden");
    }
  }
  
  sendAJAX(message, callback = () => {}) {
    $.ajax({
      url: "./" /* Куда пойдет запрос */,
      method: "get" /* Метод передачи (post или get) */,
      dataType: "json" /* Тип данных в ответе (xml, json, script, html). */,
      data: message /* Параметры передаваемые в запросе. */,
      cache: false,
      success: function (answer) {
        /* функция которая будет выполнена после успешного запроса.  */
        return answer;
        if (callback){
        callback(answer); /* В переменной data содержится ответ от index.php. */
        }
      },
    });
  }

  endGame() {
    console.log("End game");
  }
}

window.onload = () => {
  new GameView();
};

GameView.DEFAULT_AVATAR = "/static/images/favicon.png";

GameView.PLAYERS_COLORS = ["#FFD54F", "#90CAF9", "#E0E0E0", "#B39DDB"];
