/**
 * Loads a depthkit capture\
* @namespace depthkit2d-player
 * @component depthkit2d-player
 */
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    TextureLoader,
    AdditiveBlending,
    PointsMaterial,
    Points,
    Vector3,
    CatmullRomCurve3,
    Object3D
  } from 'three'


import "depthkit2d";

//AFrame DepthKit.js wrapper entity
AFRAME.registerComponent('depthkit2d-player', {

    schema: {
      videoPath : {type: 'string'}
    },
  
    player : null,
    character : null,

    /**
     * Called once when component is attached. Generally for initial setup.
     */
    init: function () {
      this.el.sceneEl.addEventListener("environment-scene-loaded", () => {
          this.loadVideo();
      });

      console.log("Depthkit2D init " + this.data.videoPath);
      //this.loadVideo();
    },
  
    /**
     * Called when component is attached and when component data changes.
     * Generally modifies the entity based on the data.
     */
    update: function (oldData) {},
  
    /**
     * Called when a component is removed (e.g., via removeAttribute).
     * Generally undoes all modifications to the entity.
     */
    remove: function () {},
  
    /**
     * Called on each scene tick.
     */
    // tick: function (t) { },
  
    /**
     * Called when entity pauses.
     * Use to stop or remove any dynamic or background behavior such as events.
     */
    pause: function () {},
  
    /**
     * Called when entity resumes.
     * Use to continue or add any dynamic or background behavior such as events.
     */
    play: function () {

    },

    loadVideo: function(){
      console.log("Depthkit2D loadVideo:" + this.data.videoPath);        
      this.player = new Depthkit2D();
      this.player.load(this.data.videoPath,
          dkCharacter => {
              this.character = dkCharacter;

              console.log("Depthkit Loaded");

              // Depthkit video playback control
              this.player.video.muted = "muted"; // Necessary for auto-play in chrome now
              this.player.setLoop( true );
              this.player.play();

              //Add the character to the scene
              this.el.object3D.add(this.character);
          });
    }
  });