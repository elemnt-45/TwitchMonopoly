import {BoardController} from "./board_controller.js"

export class GameController {

    constructor(options) {
        this.initGame(options);
    }

    initGame(options) {
        const onBoardPainted = options.onBoardPainted;
        this.boardController = new BoardController({containerEl: options.containerEl});
        this.boardController.drawBoard(onBoardPainted);
    }

    addPlayer(count, initPos) {
        return this.boardController.drawPlayers(count, initPos);
    }

    movePlayer(playerIndex, newTileId) {
        // TODO: change viewport
        this.boardController.movePlayer(playerIndex, newTileId);
    }

    addProperty(type, tileId, playerIndex) {
        if (type === PropertyManager.PROPERTY_OWNER_MARK) {
            this.boardController.addLandMark(playerIndex, tileId);
        } else {
            this.boardController.addProperty(type, tileId);
        }
    }

    resizeBoard() {
        this.boardController.resize();
    }
}
