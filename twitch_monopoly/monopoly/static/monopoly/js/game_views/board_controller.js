import * as THREE from "three";
import { OBJLoader } from "../three_addons/OBJLoader.js";
import { OrbitControls } from "../three_addons/OrbitControls.js";
import { Board } from "./board.js";

export class BoardController {
  constructor(options) {
    this.containerEl = options.containerEl;
    this.board = new Board();
    this.players = [];
  }

  drawBoard(callback = () => {}) {
    this.initEngine();
    this.initLights();
    this.initMaterials();

    this.initObjects(() => {
      this.onAnimationFrame();
      callback();
    });
  }

  drawPlayers(number, initPos) {
    let promiseList = [];
    return new Promise((resolve) => {
      for (let i = 0; i < number; i++) {
        let player = new Player({
          index: i,
          modelUrl: `${this.assetsUrl}/players/${i}/model.json`,
          scene: this.scene,
          initTileId: initPos[i],
          initPos: this.boardToWorld({
            tileId: initPos[i],
            type: BoardController.MODEL_PLAYER,
            total: number,
            index: i,
          }),
        });

        this.board.updateTileInfo(initPos[i], {
          type: BoardController.MODEL_PLAYER,
          action: "add",
          playerIndex: i,
        });
        this.players.push(player);
        promiseList.push(player.load());
      }

      Promise.all(promiseList).then(() => {
        resolve();
      });
    });
  }

  movePlayer(index, newTileId) {
    let currTileId = this.players[index].getTileId();
    console.log(
      "index and new tile id is: " +
        currTileId.toString() +
        " " +
        newTileId.toString()
    );

    // Remove previous player position
    this.board.updateTileInfo(currTileId, {
      type: BoardController.MODEL_PLAYER,
      action: "remove",
      playerIndex: index,
    });

    // Register new player position
    this.board.updateTileInfo(newTileId, {
      type: BoardController.MODEL_PLAYER,
      action: "add",
      playerIndex: index,
    });

    // Animation: move the player
    return new Promise((resolve) => {
      let playerMovementInterval = setInterval(() => {
        currTileId += 1;
        currTileId %= BoardController.TILE_MAX + 1;
        const tileInfo = this.board.getTileInfo(currTileId);
        const tilePlayerCount = tileInfo.players.reduce((a, b) => a + b, 0);

        this.players[index].advanceTo(
          currTileId,
          this.boardToWorld({
            tileId: currTileId,
            type: BoardController.MODEL_PLAYER,
            total: tilePlayerCount + 1,
            index: tilePlayerCount,
          })
        );

        if (currTileId === newTileId) {
          clearInterval(playerMovementInterval);
          resolve();
        }
      }, 200);
    });
  }

  addProperty(type, tileId) {
    let tileInfo = this.board.getTileInfo(tileId);
    const tilePropertyCount = tileInfo.propertyManager.getPropertyCount();

    if (type === PropertyManager.PROPERTY_HOUSE) {
      tileInfo.propertyManager.buildHouse(
        this.boardToWorld({
          tileId: tileId,
          type: BoardController.MODEL_PROPERTY,
          total: tilePropertyCount + 2,
        }),
        tileId
      );
    } else if (type === PropertyManager.PROPERTY_HOTEL) {
      tileInfo.propertyManager.buildHotel(
        this.boardToWorld({
          tileId: tileId,
          type: BoardController.MODEL_PROPERTY,
          total: 2,
        }),
        tileId
      );
    }
  }

  addLandMark(playerIndex, tileId) {
    let tileInfo = this.board.getTileInfo(tileId);
    this.board.updateTileInfo(tileId, {
      type: BoardController.MODEL_PROPERTY,
      options: {
        loadedHouseJson: this.houseModelJson,
        loadedHotelJson: this.hotelModelJson,
        scene: this.scene,
      },
    });

    tileInfo.propertyManager.buyLand(
      this.boardToWorld({
        tileId: tileId,
        type: BoardController.MODEL_PROPERTY,
        total: 1,
      }),
      tileId,
      playerIndex
    );
  }

  initEngine() {
    let viewWidth = this.containerEl.offsetWidth;
    let viewHeight = this.containerEl.offsetHeight;
    // instantiate the WebGL this.renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(viewWidth, viewHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.containerEl.appendChild(this.renderer.domElement);
    // create the this.scene
    this.scene = new THREE.Scene();

    // create this.camera
    this.camera = new THREE.PerspectiveCamera(
      25,
      viewWidth / viewHeight,
      1,
      1000
    );
    this.camera.position.set(
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2,
      100,
      160
    );
    // create camera controls
    this.cameraController = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.cameraController.center = new THREE.Vector3(
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2,
      -6,
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2
    );

    this.scene.add(this.camera);
  } // DONE

  initLights() {
    // DONE
    this.lights = {};
    let light_intensity_multiplier = 50000;
    // top light
    this.lights.topLight = new THREE.PointLight();
    this.lights.topLight.position.set(
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2,
      150,
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2
    );
    this.lights.topLight.intensity = light_intensity_multiplier * 0.4;

    // white's side light
    this.lights.whiteSideLight = new THREE.SpotLight();
    this.lights.whiteSideLight.position.set(
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2,
      100,
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2 - 300
    );
    this.lights.whiteSideLight.intensity = light_intensity_multiplier * 1;
    this.lights.whiteSideLight.shadow.camera.Fov = 55;

    // black's side light
    this.lights.blackSideLight = new THREE.SpotLight();
    this.lights.blackSideLight.position.set(
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2,
      100,
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2 + 300
    );
    this.lights.blackSideLight.intensity = light_intensity_multiplier * 1;
    this.lights.blackSideLight.shadow.camera.Fov = 55;

    // light that will follow the this.camera position
    this.lights.movingLight = new THREE.PointLight(0xf9edc9);
    this.lights.movingLight.position.set(0, 20, 0);
    this.lights.movingLight.intensity = light_intensity_multiplier * 0.5;
    this.lights.movingLight.distance = 500;

    // add the this.lights in the this.scene
    this.scene.add(this.lights.topLight);
    this.scene.add(this.lights.whiteSideLight);
    this.scene.add(this.lights.blackSideLight);
    this.scene.add(this.lights.movingLight);
  } // DONE

  initMaterials() {
    // DONE
    this.materials = {};

    // board material
    this.materials.boardMaterial = new THREE.MeshLambertMaterial({
      map: new THREE.TextureLoader().load(
        "../static/monopoly/assets/board_texture.png"
      ),
    });

    // ground material
    this.materials.groundMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      map: new THREE.TextureLoader().load(
        "../static/monopoly/assets/ground_texture.png"
      ),
    });

    const defaultTileMaterial = new THREE.MeshLambertMaterial({
      map: new THREE.TextureLoader().load(
        "../static/monopoly/assets/tiles/-1.png"
      ),
    });

    // tile material
    this.materials.tileMaterial = [];
    for (let row = 0; row < Board.SIZE; row++) {
      let rowMaterial = [];
      for (let col = 0; col < Board.SIZE; col++) {
        const tileModelIndex = Board.posToTileId(row, col);
        const tileMaterial =
          tileModelIndex === -1
            ? defaultTileMaterial
            : new THREE.MeshLambertMaterial({
                map: new THREE.TextureLoader().load(
                  `../static/monopoly/assets/tiles/${tileModelIndex}.png`
                ),
              });
        rowMaterial.push(tileMaterial);
      }
      this.materials.tileMaterial.push(rowMaterial);
    }
  } //DONE

  initObjects(callback = () => {}) {
    let loader = new OBJLoader();
    let totalObjectsToLoad = 1; // board
    let loadedObjects = 0;
    const checkLoading = () => {
      loadedObjects += 1;
      if (loadedObjects === totalObjectsToLoad && callback) {
        callback();
      }
    };

    // load board
    loader.load("../static/monopoly/assets/3d/board.obj", (object) => {
      let boardMaterial = this.materials.boardMaterial;
      this.boardModel = object;
      this.boardModel.traverse(function (child) {
        if (child.isMesh) child.material = boardMaterial;
      });
      this.boardModel.position.y = -0.02;
      this.scene.add(this.boardModel);
      checkLoading();
    });

    // add ground
    this.groundModel = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 1, 1),
      this.materials.groundMaterial
    );
    this.groundModel.position.set(
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2,
      -1.52,
      (BoardController.SQUARE_SIZE * Board.SIZE) / 2
    );
    this.groundModel.rotation.x = (-90 * Math.PI) / 180;
    this.scene.add(this.groundModel);

    for (let row = 0; row < Board.SIZE; row++) {
      for (let col = 0; col < Board.SIZE; col++) {
        let square = new THREE.Mesh(
          new THREE.PlaneGeometry(
            BoardController.SQUARE_SIZE,
            BoardController.SQUARE_SIZE,
            1,
            1
          ),
          this.materials.tileMaterial[row][col]
        );

        square.position.x =
          col * BoardController.SQUARE_SIZE + BoardController.SQUARE_SIZE / 2;
        square.position.z =
          row * BoardController.SQUARE_SIZE + BoardController.SQUARE_SIZE / 2;
        square.position.y = -0.01;

        square.rotation.x = (-90 * Math.PI) / 180;

        this.scene.add(square);
      }
    }

    /*
    // pre-load house model
    let requestModelJson = (type) => {
      let request = new XMLHttpRequest();
      request.open("GET", `${this.assetsUrl}/${type}/model.json`, false);
      request.send(null);

      checkLoading();
      return JSON.parse(request.responseText);
    };

    this.houseModelJson = requestModelJson("house");
    this.hotelModelJson = requestModelJson("hotel");
    */
  } // DONE

  onAnimationFrame() {
    requestAnimationFrame(() => this.onAnimationFrame());

    this.cameraController.update();

    // update moving light position
    this.lights.movingLight.position.x = this.camera.position.x;
    this.lights.movingLight.position.z = this.camera.position.z;

    this.renderer.render(this.scene, this.camera);
  } // DONE

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  } // DONE

  boardToWorld(options) {
    const { tileId, type, total, index } = options;
    const pos = Board.tileIdToPos(tileId);
    let x = 0.5 + pos[1];
    let z = 0.5 + pos[0];

    const side = Board.tileIdToSide(tileId);

    if (type === BoardController.MODEL_PLAYER) {
      if (total === 1) {
        return [
          x * BoardController.SQUARE_SIZE,
          0,
          z * BoardController.SQUARE_SIZE,
        ];
      } else {
        switch (side) {
          case Board.SIDE_TOP:
            z -= BoardController.MODEL_PLAYER_MARGIN;
            x =
              index % 2 === 0
                ? x + BoardController.MODEL_PLAYER_OFFSET
                : x - BoardController.MODEL_PLAYER_OFFSET;
            if (total > 2)
              z =
                index < 2
                  ? z + BoardController.MODEL_PLAYER_OFFSET
                  : z - BoardController.MODEL_PLAYER_OFFSET;
            break;
          case Board.SIDE_BOTTOM:
            z += BoardController.MODEL_PLAYER_MARGIN;
            x =
              index % 2 === 0
                ? x - BoardController.MODEL_PLAYER_OFFSET
                : x + BoardController.MODEL_PLAYER_OFFSET;
            if (total > 2)
              z =
                index < 2
                  ? z - BoardController.MODEL_PLAYER_OFFSET
                  : z + BoardController.MODEL_PLAYER_OFFSET;
            break;
          case Board.SIDE_LEFT:
            x -= BoardController.MODEL_PLAYER_MARGIN;
            z =
              index % 2 === 0
                ? z - BoardController.MODEL_PLAYER_OFFSET
                : z + BoardController.MODEL_PLAYER_OFFSET;
            if (total > 2)
              x =
                index < 2
                  ? x + BoardController.MODEL_PLAYER_OFFSET
                  : x - BoardController.MODEL_PLAYER_OFFSET;
            break;
          case Board.SIDE_RIGHT:
            x += BoardController.MODEL_PLAYER_MARGIN;
            z =
              index % 2 === 0
                ? z + BoardController.MODEL_PLAYER_OFFSET
                : z - BoardController.MODEL_PLAYER_OFFSET;
            if (total > 2)
              x =
                index < 2
                  ? x - BoardController.MODEL_PLAYER_OFFSET
                  : x + BoardController.MODEL_PLAYER_OFFSET;
            break;
        }
      }
    } else if (type === BoardController.MODEL_PROPERTY) {
      switch (side) {
        case Board.SIDE_TOP:
          z += BoardController.MODEL_PROPERTY_TOP_MARGIN;
          x += BoardController.MODEL_PROPERTY_LEFT_MARGIN;
          x -=
            (total - 1) * BoardController.MODEL_PROPERTY_MARGIN +
            BoardController.MODEL_PROPERTY_LEFT_OFFSET * (total > 1);
          break;
        case Board.SIDE_BOTTOM:
          z -= BoardController.MODEL_PROPERTY_TOP_MARGIN;
          x -= BoardController.MODEL_PROPERTY_LEFT_MARGIN;
          x +=
            (total - 1) * BoardController.MODEL_PROPERTY_MARGIN +
            BoardController.MODEL_PROPERTY_LEFT_OFFSET * (total > 1);
          break;
        case Board.SIDE_LEFT:
          x += BoardController.MODEL_PROPERTY_TOP_MARGIN;
          z -= BoardController.MODEL_PROPERTY_LEFT_MARGIN;
          z +=
            (total - 1) * BoardController.MODEL_PROPERTY_MARGIN +
            BoardController.MODEL_PROPERTY_LEFT_OFFSET * (total > 1);
          break;
        case Board.SIDE_RIGHT:
          x -= BoardController.MODEL_PROPERTY_TOP_MARGIN;
          z += BoardController.MODEL_PROPERTY_LEFT_MARGIN;
          z -=
            (total - 1) * BoardController.MODEL_PROPERTY_MARGIN +
            BoardController.MODEL_PROPERTY_LEFT_OFFSET * (total > 1);
          break;
      }
    }
    return [
      x * BoardController.SQUARE_SIZE,
      0,
      z * BoardController.SQUARE_SIZE,
    ];
  }
}

BoardController.SQUARE_SIZE = 7.273;
BoardController.MODEL_PLAYER = 0;
BoardController.MODEL_PROPERTY = 1;
BoardController.MODEL_PLAYER_OFFSET = 0.2;
BoardController.MODEL_PLAYER_MARGIN = 0.1;
BoardController.MODEL_PROPERTY_TOP_MARGIN = 0.39;
BoardController.MODEL_PROPERTY_LEFT_MARGIN = 0.37;
BoardController.MODEL_PROPERTY_MARGIN = 0.24;
BoardController.MODEL_PROPERTY_LEFT_OFFSET = 0.05;
BoardController.TILE_MAX = 39;
