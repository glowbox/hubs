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
      src: { type: "string" },      
    },

    init() {
        console.log("Plyloader Init");
        var scene = this.el.sceneEl.object3D;
        var loader = new PLYLoader();

        const sprite = new TextureLoader().load("/assets/ply/texture_64.png");

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

        loader.load( "/assets/ply/points_0.ply", function ( geometry ) {

            console.log("Plyloader Loaded ");
            /*
            geometry.computeVertexNormals();

            var material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
            var mesh = new THREE.Mesh( geometry, material );

            mesh.position.y = - 0.2;
            mesh.position.z = 0.3;
            mesh.rotation.x = - Math.PI / 2;
            mesh.scale.multiplyScalar( 0.001 );

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            scene.add( mesh );*/

            let cloud = new Object3D();
            const pointCloud = new Points(geometry, pointsMaterial);
            pointCloud.sortParticles = true;    
            cloud.add(pointCloud);
            scene.add(cloud)

        },  function(text){ 
            console.log("Plyloader Progress " + text);
        }, function(error){ 
            console.log("Plyloader Error " + error);
        } );

        console.log("Plyloader Complete");
    },

    update() {

    },

    tick() {

    }
});