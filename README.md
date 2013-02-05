# voxel-control

manipulate [voxel-physical objects](https://github.com/chrisdickinson/voxel-physical) using
a state object. implements basic FPS controls.

### options

```javascript
{ speed: Number(0.08)           // starting speed
, maxSpeed: Number(0.28)        // max speed
, jumpMaxSpeed: Number(0.4)     // max jump speed
, jumpMaxTimer: Number(200)     // maximum amount of time jump will be applied in MS
, jumpSpeed: Number(0.1)        // starting jump speed
, accelTimer: Number(200)       // time to reach full speed on X/Y
, accelerationCurve: Function() // function(current, max) -> [0-1]
                                // defaults to a sin curve.
, airControl: Boolean(true)     // can player control direction without being on the ground?
, fireRate: Number(0)           // MS between firing
, discreteFire: Boolean(false)  // does firing require mousedown -> mouseup, or can it be held?
, onfire: Function() }          // function(mount, state) -> undefined
```

### api

#### control(state, mount, target, opts) -> Control

`state` is a state object (probably supplied by [kb-controls](https://github.com/chrisdickinson/kb-controls.git)).

`mount` is the camera mount -- which direction we're facing, essentially.

`target` is the object to be manipulated. Assumed to have `.acceleration`, `.velocity`, and `.atRestY() -> -1, 0, 1`.

`opts` is an object optionally containing any of the above. 

#### Control#target(target?) -> target

if a target is passed, set control to target that argument.

return the current target.

#### Control#mount(mount?) -> mount

if a mount is passed, set control to target that argument as mount.

#### Control#tick(dt) -> undefined

advance the simulation.

# license

MIT
