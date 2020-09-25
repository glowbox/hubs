# FORK NOTES

This fork is in support of work done for the Eyebeam Rapid Response Aritst Residency.

The technical goals are to explore the combintation of virtual presence and live performance. 

Supporting github reops:

Depthkitjs fork that demonstrates HLS stream of a custom video texture:
https://github.com/glowbox/Depthkit.js

AKVFK fork used to create the live video texture and stream it to an RTMP endpoint
https://github.com/glowbox/akvfx

Hubs Blender Exporter fork that implements custom components listed below
https://github.com/glowbox/hubs-blender-exporter

This fork introduces a few custom components:
- depth-stream: stream a very specifically formatted 
- ply-model: support for visuals
- depthkit-player: playback depthkit generated video
- depthkit2d-player: playback depthkit generated video using depth texture as alpha key


The following commands / shortcuts are supported:

To create a ply model in a room
`[ply: [url]]`

Where url is a link to the ply model

To create a live stream in a room:
`live: [hls m3u8] [id]]`

- hls m3u8 is the live stream end point.
- id is optionallly the id of the depthkit stream you want to update

To create a depthkit stream
`[ dk: [url] ]`
Where url is a link to the ply model
