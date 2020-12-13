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
} from "three";

import "depthkit";

//AFrame DepthKit.js wrapper entity
AFRAME.registerComponent("vpt-stream", {
  schema: {
    videoPath: { type: "string" },
    meta: { type: "string" },
    renderMode: { type: "string", default: "points" },
    depthMin: { type: "number", default: 0.0 },
    depthMax: { type: "number", default: 4.0 },
    pointSize: { type: "number", default: 8.0 },
    uiPosition: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    uiRotation: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    uiScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    uiDelay: { type: "number", default: 1.0 }
  },

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function() {
    this.vptstream = new VPTStream();

    document.body.appendChild(this.vptstream.video);

    this.vptstream.addEventListener(STREAMEVENTS.PLAY_SUCCESS, function(event) {
      console.log(`${event.type} ${event.message}`);
    });

    this.vptstream.addEventListener(STREAMEVENTS.PLAY_ERROR, function(event) {
      console.log(`${event.type} ${event.message}`);
    });

    this.add(this.vptstream);

    //listen for auto play events
    this.el.sceneEl.addEventListener("autoplay_clicked", () => {
      const _this = this;
      this.vptstream.video
        .play()
        .then(function() {
          console.log("playing");
          _this.vptstream.playing = true;
        })
        .catch(function(error) {
          console.log(`error, ${error}`);
          _this.vptstream.play = false;
        });
    });

    console.log(this.data);

    //we need to have a "play/unmute" button for browsers that have strict autoplay settings
    this.autoplayUi = document.createElement("a-entity");
    //see hubs.html templage
    const template = document.getElementById("vpt-stream-autoplay");
    this.autoplayUi.appendChild(document.importNode(template.content, true));

    const pos = this.data.uiPosition;
    this.autoplayUi.object3D.position.set(pos.x, pos.y, pos.z);

    const rot = this.data.uiRotation;
    const noBillboard = rot.x + rot.y + rot.x > 0;
    if (noBillboard) {
      this.autoplayUi.object3D.rotation.set(rot.x, rot.y, rot.z);
    }

    const scale = this.data.uiScale;
    this.autoplayUi.object3D.scale.set(scale.x, scale.y, scale.z);
    this.el.appendChild(this.autoplayUi);

    //keep a ref to the video element so we can control it once we are loaded
    const _this = this;

    this.autoplayUi.addEventListener("loaded", function() {
      this.onClick = function() {
        console.log("play/unmute clicked");

        _this.vptstream.video
          .play()
          .then(() => {
            console.log("playing");
            _this.vptstream.playing = true;
          })
          .catch(function(error) {
            console.log(`error, ${error}`);
            _this.vptstream.play = false;
          });
      };
      const btn = this.querySelector(".unmute-ui");

      if (noBillboard) {
        btn.removeAttribute("billboard");
      }

      btn.object3D.addEventListener("interact", this.onClick);
      this.setAttribute("visible", false);
    });

    this._loadVideo();
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function(oldData) {},

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function() {
    this.videoTexture.dispose();
  },

  /**
   * Called on each scene tick.
   */
  tick: function(t) {
    const dT = performance.now() - this.vptstream.LoadTime;
    if (this.vptstream.LoadTime > 0 && dT > this.data.uiDelay) {
      //console.log("loadTime:" + this.videoTexture.LoadTime + " dT:" + dT+ " video currentTime:" +  this.videoTexture.video.currentTime )
      if (this.vptstream.playing) {
        this.el.sceneEl.emit("hide_autoplay_dialog", { videoref: this.vptstream.video });
        this.autoplayUi.setAttribute("visible", false);
      } else {
        this.el.sceneEl.emit("show_autoplay_dialog", { videoref: this.vptstream.video });
        this.autoplayUi.setAttribute("visible", true);
      }
    }
  },

  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function() {},

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function() {},

  setVideoUrl(videoUrl) {
    if (this.vptstream) {
      // console.log("depthkit-stream, setting video url: " + videoUrl);
      this.vptstream.setVideoUrl(videoUrl);
    }
  },

  getDataValue(key, defaultValue) {
    if (this.data.hasOwnProperty(key)) {
      return this.data[key];
    } else {
      return defaultValue;
    }
  },

  async loadMedia() {
    if (!this.data.videoPath || this.data.videoPath.length < 5) {
      console.error("vptstream invalid src");
      return;
    }

    if (!this.data.meta || this.data.meta.length < 5) {
      console.error("vptstream invalid meta");
      return;
    }

    let url = this.data.videoPath;
    const fileExtension = url.substr(this.data.videoPath.lastIndexOf(".") + 1);

    if (fileExtension != "m3u8") {
      try {
        url = await fetch(url);
        url = await url.text();
      } catch (error) {
        console.error("vptstream Stream Load error", error);
      }
    }

    const params = {
      videoPath: url,
      meta: this.data.meta,
      renderMode: "perspective"
    };
    this.vptstream.load(params);
  }
});
