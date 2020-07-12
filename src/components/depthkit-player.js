/**
 * Loads a depthkit capture\
* @namespace depthkit-player
 * @component depthkit-player
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


import "depthkit";
//AFrame DepthKit.js wrapper entity
AFRAME.registerComponent('depthkit-player', {

    schema: {
      type: {type: 'string', default: 'mesh'},
      videoPath: {type: 'string'},
      metaPath: {type: 'string'},
      loop: {type: 'boolean', default: true},
      autoplay: {type: 'boolean', default: true}
    },
  
    /**
     * Set if component needs multiple instancing.
     */
    multiple: true,
  
    player : null,
    character : null,

    /**
     * Called once when component is attached. Generally for initial setup.
     */
    init: function () {
        this.el.sceneEl.addEventListener("environment-scene-loaded", () => {
            this.loadVideo();
        });
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
        var scene = this.el.sceneEl.object3D;

        console.log("Depthkit loadVideo - meta:" + this.data.metaPath);
        
        this.player = new Depthkit();
        this.player.load(this.data.metaPath, this.data.videoPath,
            dkCharacter => {
                this.character = dkCharacter;

                console.log("Depthkit Complete");

                //Position and rotation adjustments
                //dkCharacter.rotation.set( Math.PI - 0.25, 0, Math.PI / -2.0 );
                // dkCharacter.rotation.y = Math.PI;
                //dkCharacter.position.set( -0.25, 0.92, 0 );

                // Depthkit video playback control
                //this.player.video.muted = "muted"; // Necessary for auto-play in chrome now
                this.player.setLoop( true );
                this.player.play();

                //Add the character to the scene
                this.el.object3D.add(this.character);
            });
    }
  });