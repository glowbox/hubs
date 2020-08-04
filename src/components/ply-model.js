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
    NormalBlending,
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
     this.loadPly();
    },

  loadPly(){
        console.log("Plyloader Load");
        let el = this.el;
        let loader = new PLYLoader();

        if( this.data.texturepath.length < 5){
          let isPly = this.data.plypath.toLowerCase().endsWith(".ply");
          if (isPly) {
            this.data.texturepath  = this.data.plypath.substring(0, this.data.plypath.length - 4) + ".png";
          }else{
            console.error("ply-loader: model url invalid:" + this.data.plypath);
            return;
          }  
        }

        const sprite = new TextureLoader().load( this.data.texturepath);

        const pointsMaterial = new PointsMaterial({
            size: 0.1,
            depthTest: false,
            depthWrite: false,
            alphaTest: 0.02,
            opacity: 0.05,
            transparent: true,
            vertexColors: true,
            blending: AdditiveBlending,
            sizeAttenuation: true,
            map: sprite
          });

        loader.load( this.data.plypath, function ( geometry ) {

            console.log("Plyloader Loaded ");            
            const pointCloud = new Points(geometry, pointsMaterial);
            pointCloud.sortParticles = true;    
            el.object3D.add(pointCloud);
            el.emit("model-loaded", { projection: ""});

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