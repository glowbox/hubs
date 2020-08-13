/**
 * Loads a depthkit capture\
* @namespace depthkit-stream
 * @component depthkit-stream
 */
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    TextureLoader,
    AdditiveBlending,
    PlaneGeometry,
    PlaneBufferGeometry,
    MeshBasicMaterial,
    LinearFilter,
    NearestFilter,
    RGBFormat,
    ShaderMaterial,
    VideoTexture,
    PointsMaterial,
    Points,
    Vector3,
    CatmullRomCurve3,
    Object3D,
    DoubleSide
  } from 'three'

import HLS from "hls.js";
import configs from "../utils/configs";
import { proxiedUrlFor } from "../utils/media-url-utils";
import { Mesh } from 'three';

const metaJson = `{
	"_versionMajor" : "0",
	"_versionMinor" : "1",
	"depthFocalLength" : {
		"x" : 320,
		"y" : 240
	},
	"depthImageSize" : {
		"x" : 640,
		"y" : 480
	},
	"depthPrincipalPoint" : {
		"x" : 0.0,
		"y" : 0.0
	},
	"farClip" : 1.0,
	"format" : "perpixel",
	"nearClip": 0.01,
	"clipEpsilon" : 0.00162288
}`;

const fragmentShaderPoints = `

uniform sampler2D map;
uniform float opacity;
uniform float width;
uniform float height;

varying vec4 ptColor;
varying vec2 vUv;
varying vec4 vPos;
varying vec3 debug;

#define BRIGHTNESS_THRESHOLD_OFFSET 0.01
#define FLOAT_EPS 0.00001

const float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)
const float _DepthBrightnessThreshold = 0.6; //a given pixel whose brightness is less than half will be culled (old default was .9)

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + FLOAT_EPS)), d / (q.x + FLOAT_EPS), q.x);
}

float depthForPoint(vec2 texturePoint)
{
    vec4 depthsample = texture2D(map, texturePoint);
    vec3 depthsamplehsv = rgb2hsv(depthsample.rgb);
    return depthsamplehsv.g > _DepthSaturationThreshhold && depthsamplehsv.b > _DepthBrightnessThreshold ? depthsamplehsv.r : 0.0;
}

void main() {

  /*float verticalScale = 480.0 / 720.0;
  float verticalOffset = 1.0 - verticalScale;
  vec2 colorUv = vUv * vec2(0.5, verticalScale) + vec2(0, verticalOffset);
  vec2 depthUv = colorUv + vec2(0.5, 0.0);*/


    float verticalScale = 0.5;//480.0 / 720.0;
    float verticalOffset = 1.0 - verticalScale;

    vec2 colorUv = vUv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);
    vec2 depthUv = colorUv - vec2(0.0, 0.5);

    vec4 colorSample = ptColor;// texture2D(map, colorUv); 
    vec4 depthSample = texture2D(map, depthUv); 

    vec3 hsv = rgb2hsv(depthSample.rgb);
    float depth = hsv.b;
    float alpha = depth > _DepthBrightnessThreshold + BRIGHTNESS_THRESHOLD_OFFSET ? 1.0 : 0.0;

    if(alpha <= 0.0) {
      discard;
    }

    colorSample.a *= (alpha * opacity);

    gl_FragColor = colorSample;//vec4(debug, 1);
}
`;

const vertexShaderPoints = `

uniform sampler2D map;

varying vec4 ptColor;
varying vec2 vUv;
varying vec3 debug;

const float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)
const float _DepthBrightnessThreshold = 0.3; //a given pixel whose brightness is less than half will be culled (old default was .9)
const float  _Epsilon = .03;

//https://github.com/tobspr/GLSL-Color-Spaces/blob/master/ColorSpaces.inc.glsl
const float SRGB_GAMMA = 1.0 / 2.2;
const float SRGB_INVERSE_GAMMA = 2.2;
const float SRGB_ALPHA = 0.055;

// Converts a single srgb channel to rgb
float srgb_to_linear(float channel) {
    if (channel <= 0.04045)
        return channel / 12.92;
    else
        return pow((channel + SRGB_ALPHA) / (1.0 + SRGB_ALPHA), 2.4);
}

// Converts a srgb color to a linear rgb color (exact, not approximated)
vec3 srgb_to_rgb(vec3 srgb) {
    return vec3(
        srgb_to_linear(srgb.r),
        srgb_to_linear(srgb.g),
        srgb_to_linear(srgb.b)
    );
}

//faster but noisier
vec3 srgb_to_rgb_approx(vec3 srgb) {
  return pow(srgb, vec3(SRGB_INVERSE_GAMMA));
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + _Epsilon)), d / (q.x + _Epsilon), q.x);
}


float depthForPoint(vec2 texturePoint)
{
    vec4 depthsample = texture2D(map, texturePoint);
    vec3 linear = srgb_to_rgb( depthsample.rgb);
    vec3 depthsamplehsv = rgb2hsv(linear.rgb);
    return depthsamplehsv.g > _DepthSaturationThreshhold && depthsamplehsv.b > _DepthBrightnessThreshold ? depthsamplehsv.r : 0.0;
}

void main()
{
    float mindepth = 0.0;
    float maxdepth = 2.25;

    float verticalScale = 0.5;//480.0 / 720.0;
    float verticalOffset = 1.0 - verticalScale;

    vec2 colorUv = uv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);
    vec2 depthUv = colorUv - vec2(0.0, 0.5);

    float depth = depthForPoint(depthUv);

    float z = depth * (maxdepth - mindepth) + mindepth;
    
    vec4 worldPos = vec4(position.xy, -z, 1.0);
    worldPos.w = 1.0;

    
    float scale = 1.0;
    vec4 mvPosition = vec4( worldPos.xyz, 1.0 );
    mvPosition = modelViewMatrix * mvPosition;

    ptColor = texture2D(map, colorUv);

    gl_Position = projectionMatrix * modelViewMatrix * worldPos;
    vUv = uv;
    debug = vec3(1, 0.5, 0.0);
    
    gl_PointSize = 8.0;
    gl_PointSize *= ( scale / - mvPosition.z );

    //gl_Position =  projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;



const fragmentShaderCutout = `
uniform sampler2D map;
uniform float opacity;
uniform float width;
uniform float height;

varying vec2 vUv;

#define BRIGHTNESS_THRESHOLD_OFFSET 0.01
#define FLOAT_EPS 0.00001

const float _DepthSaturationThreshhold = 0.3; //a given pixel whose saturation is less than half will be culled (old default was .5)
const float _DepthBrightnessThreshold = 0.4; //a given pixel whose brightness is less than half will be culled (old default was .9)

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + FLOAT_EPS)), d / (q.x + FLOAT_EPS), q.x);
}

void main() {

    float verticalScale = 0.5;//480.0 / 720.0;
    float verticalOffset = 1.0 - verticalScale;

    vec2 colorUv = vUv * vec2(1.0, verticalScale) + vec2(0.0, 0.5);
    vec2 depthUv = colorUv - vec2(0.0, 0.5);

    vec4 colorSample = texture2D(map, colorUv); 
    vec4 depthSample = texture2D(map, depthUv); 

    vec3 hsv = rgb2hsv(depthSample.rgb);
    float depth = hsv.b;
    float alpha = depth > _DepthBrightnessThreshold + BRIGHTNESS_THRESHOLD_OFFSET ? 1.0 : 0.0;

    if(alpha <= 0.0) {
      discard;
    }

    colorSample.a *= (alpha * opacity);

    gl_FragColor = colorSample;
}
`;

const vertexShaderCutout = `

varying vec2 vUv;

void main()
{
    vUv = uv;
    gl_Position =  projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;


const HLS_TIMEOUT = 2500;


class VideoStreamTexture {

    constructor(_videoElement) {
        this.video = _videoElement ? _videoElement : this.createVideoEl();
        
        this.texture = new VideoTexture(this.video);
        this.texture.minFilter = NearestFilter;
        this.texture.magFilter = LinearFilter;
        this.texture.format = RGBFormat;
        this.hls = null;
      }
    
      update() {
      }
    
  
    createVideoEl() {
      const el = document.createElement("video");
      
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      // iOS Safari requires the autoplay attribute, or it won't play the video at all.
      el.autoplay = true;
      // iOS Safari will not play videos without user interaction. We mute the video so that it can autoplay and then
      // allow the user to unmute it with an interaction in the unmute-video-button component.
      el.muted = true;
      el.preload = "auto";
      el.crossOrigin = "anonymous";
  
      console.log("VideoStreamTexture: Video element created", el);
    
      return el;
    }
    
     scaleToAspectRatio(el, ratio) {
      const width = Math.min(1.0, 1.0 / ratio);
      const height = Math.min(1.0, ratio);
      el.object3DMap.mesh.scale.set(width, height, 1);
      el.object3DMap.mesh.matrixNeedsUpdate = true;
    }
    
  
    dispose() {
      if (this.texture.image instanceof HTMLVideoElement) {
        const video = this.texture.image;
        video.pause();
        video.src = "";
        video.load();
      }
    
      if (this.hls) {
        this.hls.stopLoad();
        this.hls.detachMedia();
        this.hls.destroy();
        this.hls = null;
      }
    
      this.texture.dispose();
    }

    setVideoUrl(videoUrl) {
      if (this.hls) {
        this.startVideo(videoUrl);
        //this.hls.loadSource(videoUrl);
        //this.hls.startLoad();
      }
    }
  
    startVideo(videoUrl) {
  
      if (HLS.isSupported()) {
          
        const corsProxyPrefix = `https://${configs.CORS_PROXY_SERVER}/`;
        const baseUrl = videoUrl.startsWith(corsProxyPrefix) ? videoUrl.substring(corsProxyPrefix.length) : videoUrl;
       
        const setupHls = () => {
          if (this.hls) {
            this.hls.stopLoad();
            this.hls.detachMedia();
            this.hls.destroy();
            this.hls = null;
          }
  
          this.hls = new HLS({
            xhrSetup: (xhr, u) => {
              if (u.startsWith(corsProxyPrefix)) {
                u = u.substring(corsProxyPrefix.length);
              }
  
              // HACK HLS.js resolves relative urls internally, but our CORS proxying screws it up. Resolve relative to the original unproxied url.
              // TODO extend HLS.js to allow overriding of its internal resolving instead
              if (!u.startsWith("http")) {
                u = buildAbsoluteURL(baseUrl, u.startsWith("/") ? u : `/${u}`);
              }
  
              xhr.open("GET", proxiedUrlFor(u));
            }
          });
  
          this.hls.loadSource(videoUrl);
          this.hls.attachMedia(this.video);
  
          this.hls.on(HLS.Events.ERROR, (event, data) => {
            console.log("ERROR", data )
            if (data.fatal) {
              switch (data.type) {
                case HLS.ErrorTypes.NETWORK_ERROR:
                  // try to recover network error
                  this.hls.startLoad();
                  break;
                case HLS.ErrorTypes.MEDIA_ERROR:
                    this.hls.recoverMediaError();
                  break;
                default:
                  console.log("ERROR", data )
                  return;
              }
            }
          });

          this.hls.on(HLS.Events.MANIFEST_PARSED, (event, data) => {
            this.video.play().then(function () {
              console.log("playing" );
            }).catch(function (error) {
              console.log("error autoplay" );
            });

          });
        };
  
        setupHls();

  
        // Sometimes for weird streams HLS fails to initialize.
        /*const setupInterval = setInterval(() => {
          // Stop retrying if the src changed.
          const isNoLongerSrc = this.data.src !== videoUrl;
  
          if (isReady() || isNoLongerSrc) {
            clearInterval(setupInterval);
          } else {
            console.warn("HLS failed to read video, trying again");
            setupHls();
          }
        }, HLS_TIMEOUT);*/
        // If not, see if native support will work
      } else if (this.video.canPlayType(contentType)) {
        this.video.src = videoUrl;
        this.video.onerror = failLoad;

        this.video.play().then(function () {
          console.log("playing", data );
        }).catch(function (error) {
          console.log("error autoplay", data );
        });
      } else {
        console.log("HLS unsupported" );
      }    
    }
}

//AFrame DepthKit.js wrapper entity
AFRAME.registerComponent('depthkit-stream', {

    schema: {
      videoPath : {type: 'string'},
      renderMode: {type: 'string'}
    },
  
    /**
     * Called once when component is attached. Generally for initial setup.
     */
    init: function () {
        this.videoTexture = new VideoStreamTexture();
        this._loadVideo();
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
    remove: function () {
        this.videoTexture.dispose();
    },
  
    /**
     * Called on each scene tick.
     */
    tick: function (t) { 

       },
  
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

    setVideoUrl(videoUrl) {
      if (this.videoTexture) {
        // console.log("depthkit-stream, setting video url: " + videoUrl);
        this.videoTexture.setVideoUrl(videoUrl);
      }      
    },

    _loadVideo: function() {
      
      console.log("STREAMING renderMode:" + this.data.renderMode + ", videoPath:" + this.data.videoPath);
    
      this.videoTexture.startVideo(this.data.videoPath);

      if(this.data.renderMode == "points") {
        console.log("STREAMING video in POINTS mode");        
        this.material = new ShaderMaterial({
            uniforms: {
                "map": {
                    type: "t",
                    value: this.videoTexture.texture
                },
                "time": {
                    type: "f",
                    value: 0.0
                },
                "opacity": {
                    type: "f",
                    value: 1.0
                },
                extensions:
                {
                    derivatives: true
                }
            },
            side:DoubleSide,
            vertexShader: vertexShaderPoints,
            fragmentShader: fragmentShaderPoints,
            transparent: true
            //depthWrite:falses
        });

        let geometry = new PlaneBufferGeometry(2, 2, 320, 240);
        let points = new Points(geometry, this.material);
        points.position.y = 1;
        this.el.object3D.add(points);

      } else {

        // Default render mode will be "cutout"

        this.material = new ShaderMaterial({
          uniforms: {
              "map": {
                  type: "t",
                  value: this.videoTexture.texture
              },
              "time": {
                  type: "f",
                  value: 0.0
              },
              "opacity": {
                  type: "f",
                  value: 1.0
              },
              extensions:
              {
                  derivatives: true
              }
          },
          side:DoubleSide,
          vertexShader: vertexShaderCutout,
          fragmentShader: fragmentShaderCutout,
          transparent: true
      });

      let geometry = new PlaneBufferGeometry(2, 2);
      let plane = new Mesh(geometry, this.material);
      plane.position.y = 1;
      this.el.object3D.add(plane);

      console.log("STREAMING video in PLANE mode");

      }
    }
  });