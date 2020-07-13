/**
 * Loads a PLY model\
* @namespace ply
 * @component ply-model
 */

import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

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

AFRAME.registerComponent("ply-model", {
    schema: {
      plypath: { type: "string" },
      texturepath: { type: "string" }      
    },

    init() {
      /*
      this.el.sceneEl.addEventListener("environment-scene-loaded", () => {
        this.loadPly();
      });
      */
     this.loadPly();
    },

  loadPly(){
      console.log("Plyloader Load");
        var parent = this.el.object3D;
        var loader = new PLYLoader();

        const sprite = new TextureLoader().load( this.data.texturepath);

        const pointsMaterial = new PointsMaterial({
            size: 0.025,
            depthTest: false,
            depthWrite: false,
            alphaTest: 0.1,
            opacity: 0.25,
            transparent: true,
            vertexColors: true,
            blending: AdditiveBlending,
            map: sprite
          });

        loader.load( this.data.plypath, function ( geometry ) {

            console.log("Plyloader Loaded ");            
            const pointCloud = new Points(geometry, pointsMaterial);
            pointCloud.sortParticles = true;    
            parent.add(pointCloud)

        },  function(text){ 
            console.log("Plyloader Progress " + text);
        }, function(error){ 
            console.log("Plyloader Error " + error);
        } );
    },

    update() {

    },

    tick() {

    }
});