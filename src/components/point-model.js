/**
 * Loads a PLY model\
* @namespace ply
 * @component point-model
 */

import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

import {
  isNonCorsProxyDomain,
  guessContentType,
  proxiedUrlFor,
} from "../utils/media-url-utils";

import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    TextureLoader,
    OBJLoader,
    MTLLoader,
    AdditiveBlending,
    NormalBlending,
    PointsMaterial,
    Points,
    Vector3,
    CatmullRomCurve3,
    Object3D
  } from 'three'

AFRAME.registerComponent("point-model", {
    schema: {
      modelpath: { type: "string" },
      texturepath: { type: "string" },
      size: { type: "number", default: 0.01 },
      alphaTest: { type: "number", default: 0.02 },
      opacity: { type: "number", default: 0.05 },
      transparent: {type: "boolean", default: true },
      blending: {type:"string", default: "additive" },
      sizeAttenuation: { type: "boolean", default:true}
    },

  init() {      
    
    let modelType = guessContentType( this.data.modelpath);
     if( modelType == "model/ply"){
      this.loadPly();
    }else{
      console.error("point-model: unknown content type " + modelType);
    }
    
  },

  loadPly(){
    console.log("Load PLY");
    let el = this.el;
    let loader = new PLYLoader();

    if( this.data.texturepath.length < 5){
      this.data.texturepath  = this.data.modelpath.substring(0, this.data.modelpath.length - 4) + ".png";
    }

    
    const sprite = new TextureLoader().load( proxiedUrlFor(this.data.texturepath) );
    const blendmode = this.data.blending == "additive" ? AdditiveBlending : NormalBlending;

    const pointsMaterial = new PointsMaterial({
      size: this.data.size,
      depthTest: false,
      depthWrite: false,
      alphaTest: this.data.alphaTest,
      opacity: this.data.opacity,
      transparent: this.data.transparent,
      vertexColors: true,
      blending: blendmode,
      sizeAttenuation: this.data.sizeAttenuation,
      map: sprite
    });

    loader.load(  proxiedUrlFor(this.data.modelpath), function ( geometry ) {

      console.log("point-model ply loaded ");            
      const pointCloud = new Points(geometry, pointsMaterial);
      pointCloud.sortParticles = true;    
      el.object3D.add(pointCloud);
      el.emit("model-loaded", { projection: ""});

      }, function(text){ 
        console.log("point-model ply progress " + text);
      }, function(error){ 
        console.log("point-model ply error " + error);
      });
  },

  update() {

  },

  tick() {

  }
});