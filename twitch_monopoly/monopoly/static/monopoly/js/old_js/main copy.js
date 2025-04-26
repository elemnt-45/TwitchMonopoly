import * as THREE from "three";
import { OBJLoader } from "./three_addons/OBJLoader.js";
import { OrbitControls } from "./three_addons/OrbitControls.js";

var MONOPOLY = {
  WHITE: "White",
  BLACK: "Black",
};

MONOPOLY.Game = function (options) {
  /**********************************************************************************************/
  /* Private properties *************************************************************************/

  /** @type CHECKERS.BoardController */
  var boardController = null;

  /**
   * The board representation.
   * @type Array
   */
  var board = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  /**********************************************************************************************/
  /* Private methods ****************************************************************************/

  /**
   * Initializer.
   */
  function init() {
    boardController = new MONOPOLY.BoardController();
    boardController.drawBoard(onBoardReady);
  }

  /**
   * On board ready.
   */
  function onBoardReady() {
    // setup the board pieces
    let row, col, piece;
    //
    piece = {
      color: MONOPOLY.BLACK,
      pos: [0, 0],
    };
    //boardController.addPiece(piece);
    //boardController.movePiece([0,0], [0,0]);
    //console.log( boardController.board);
  }

  init();
};

MONOPOLY.BoardController = function (options) {
  let camera, scene, renderer, groundModel;
  let light_square_mat, dark_square_mat;
  var squareSize = 7.3;
  var objects = {};
  var materials = {};
  this.board = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  this.drawBoard = function (callback) {
    initEngine();
    initLights();
    initMaterials(
      ["board", "light_square", "dark_square", "ground", "piece"],
      initObjects(["board", "piece"], function () {
        onAnimationFrame();
        callback();
      })
    );
  };

  this.addPiece = function (piece_arg) {
    let newPiece = objects["piece"].clone();
    if (piece_arg.color === "White") {
      newPiece.material = materials.light_square;
    } else {
      newPiece.material = materials.dark_square;
    }

    const newPosition = new THREE.Matrix4();
    newPosition.setPosition(this.boardToWorld([0, 0, 0], piece_arg.pos));
    newPiece.applyMatrix4(newPosition);
    //console.log(this.boardToWorld([0,0,0],piece_arg.pos));
    this.board[piece_arg.pos[0]][piece_arg.pos[1]] = newPiece;
    scene.add(newPiece);
  };

  this.movePiece = function (piece_pos, new_pos) {
    let piece = this.board[piece_pos[0]][piece_pos[1]];
    let old_pos = piece.position;
    const newPosition = new THREE.Matrix4();
    newPosition.setPosition(this.boardToWorld(old_pos, new_pos));
    //console.log(this.boardToWorld(new_pos));
    piece.applyMatrix4(newPosition);
  };

  function initEngine() {
    camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(squareSize * 4, 150, squareSize * 4);
    scene = new THREE.Scene();
    scene.add(camera);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.center = new THREE.Vector3(squareSize * 4, 0, squareSize * 4);
    controls.addEventListener("change", function () {
      renderer.render(scene, camera);
    });
    window.addEventListener("resize", onWindowResize);
  }

  // PLACE LIGHTS
  function initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 15);
    camera.add(pointLight);
  }

  // LOAD MATERIALS
  function initMaterials(materialsToLoad, callback) {
    console.log("Starting loading materials");
    const textures_num = materialsToLoad.length;
    var loadedTextures = 0;
    const textureLoader = new THREE.TextureLoader();

    function checkLoad() {
      loadedTextures++;
      if (loadedTextures == textures_num && callback) {
        callback();
      }
    }

    dark_square_mat = new THREE.MeshLambertMaterial({
      map: THREE.ImageUtils.loadTexture(
        "../static/monopoly/3d_assets/dark_square_texture.jpg"
      ),
    });

    light_square_mat = new THREE.MeshLambertMaterial({
      map: THREE.ImageUtils.loadTexture(
        "../static/monopoly/3d_assets/light_square_texture.jpg"
      ),
    });

    for (let i = 0; i < textures_num; i++) {
      textureLoader.load(
        "../static/monopoly/3d_assets/" + materialsToLoad[i] + "_texture.jpg",
        function (texture) {
          materials[materialsToLoad[i]] = new THREE.MeshBasicMaterial({
            map: texture,
          });
          console.log("onLoad" + i);
          checkLoad();
        },
        function (xhr) {
          console.log(
            "Material " +
              (i + 1) +
              " of " +
              objects_num +
              " " +
              (xhr.loaded / xhr.total) * 100 +
              "% loaded"
          );
        },
        function (error) {
          console.log("Error while loading texture!");
        }
      );
    }
  }

  function initObjects(objectsToLoad, callback) {
    // LOADING OBJECTS
    const objects_num = 2;
    var loadedObjects = 0;
    console.log("Starting loading objects");
    const loader = new OBJLoader();

    function checkLoad() {
      loadedObjects++;
      if (loadedObjects == objects_num && callback) {
        //objects["board"].position.y=-0.02
        callback();
      }
    }

    // Загружаем доску
    loader.load("../static/monopoly/3d_assets/board.obj", function (object) {
      object.traverse(function (child) {
        if (child.isMesh) child.material = materials["board"];
      });
      object.position.y = -0.02;
      scene.add(object);
      objects["board"] = object;
      checkLoad();
    });

    // Загружаем фишку
    loader.load("../static/monopoly/3d_assets/piece.obj", function (object) {
      object.traverse(function (child) {
        if (child.isMesh) child.material = materials["piece"];
      });
      //scene.add(object);
      objects["piece"] = object;
      checkLoad();
    });

    /*
    groundModel = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 1, 1),
      materials.ground
    );
    groundModel.position.set(squareSize * 5.5, -1.52, squareSize * 5.5);
    groundModel.rotation.x = (-90 * Math.PI) / 180;
    scene.add(groundModel);
    */
    let squareMaterial;
    console.log(materials);
    for (var row = 0; row < 11; row++) {
      for (var col = 0; col < 11; col++) {
        if (col == 0 || col == 10 || row == 0 || row == 10) {
          if ((row + col) % 2 === 0) {
            // light square
            squareMaterial = light_square_mat;
            //addPiece({ color: "Black", pos: [row, col] });
          } else {
            // dark square
            squareMaterial = dark_square_mat;
            //addPiece({ color: "White", pos: [row, col] });
          }
          var square = new THREE.Mesh(
            new THREE.PlaneGeometry(squareSize, squareSize, 1, 1),
            squareMaterial
          );
          square.position.x = col * squareSize + squareSize / 2;
          square.position.z = row * squareSize + squareSize / 2;
          square.position.y = -0.01;
          square.rotation.x = (-90 * Math.PI) / 180;
          scene.add(square);
        }
      }
    }
    scene.add(new THREE.AxesHelper(10));
  }

  this.boardToWorld = function (old_pos, pos) {
    var x = (1 + pos[1]) * squareSize - squareSize / 2 - old_pos[0];
    var z = (1 + pos[0]) * squareSize - squareSize / 2 - old_pos[2];
    return new THREE.Vector3(x, 0, z);
  };

  function onAnimationFrame() {
    requestAnimationFrame(onAnimationFrame);
    //controls.update();
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  }
};

(function () {
  "use strict";

  var game = new MONOPOLY.Game();
})();
