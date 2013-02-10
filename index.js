module.exports = control

var Stream = require('stream').Stream

function control(control_state, opts) {
  return new Control(control_state, opts)
}

function Control(state, opts) {
  Stream.call(this)

  opts = opts || {}

  this.state = state
  this._pitch_target = 
  this._yaw_target =
  this._roll_target =
  this._target = null
  this.speed = opts.speed || 0.08
  this.max_speed = opts.maxSpeed || 0.28 
  this.jump_max_speed = opts.jumpMaxSpeed || 0.4 
  this.jump_max_timer = opts.jumpTimer || 200
  this.jump_speed = opts.jumpSpeed || 0.1 
  this.jump_timer = this.jump_timer_max
  this.jumping = false
  this.acceleration = opts.accelerationCurve || this.acceleration

  this.fire_rate = opts.fireRate || 0
  this.needs_discrete_fire = opts.discreteFire || false
  this.onfire = opts.onfire || this.onfire
  this.firing = 0

  this.x_rotation_per_ms = opts.rotationXMax || opts.rotationMax || 33
  this.y_rotation_per_ms = opts.rotationYMax || opts.rotationMax || 33
  this.z_rotation_per_ms = opts.rotationZMax || opts.rotationMax || 33

  this.x_rotation_clamp = opts.rotationXClamp || Math.PI / 2
  this.y_rotation_clamp = opts.rotationYClamp || Infinity
  this.z_rotation_clamp = opts.rotationZClamp || 0

  this.rotation_scale = opts.rotationScale || 0.002

  this.air_control = 'airControl' in opts ? opts.airControl : true

  this.x_rotation_accum =
  this.y_rotation_accum = 
  this.z_rotation_accum = 0.0

  this.accel_max_timer = opts.accelTimer || 200
  this.x_accel_timer = this.accel_max_timer+0
  this.z_accel_timer = this.accel_max_timer+0

  this.readable =
  this.writable = true
}

var cons = Control
  , proto = cons.prototype = new Stream

proto.constructor = cons

var max = Math.max
  , min = Math.min
  , sin = Math.sin
  , abs = Math.abs
  , floor = Math.floor
  , π = Math.PI

proto.tick = function(dt) {
  if(!this._target) {
    return
  }
  var state = this.state
    , target = this._target
    , speed = this.speed
    , jump_speed = this.jump_speed
    , okay_z = abs(target.velocity.z) < this.max_speed
    , okay_x = abs(target.velocity.x) < this.max_speed
    , at_rest = target.atRestY()

  if(!this._target) return

  if(state.forward || state.backward) {
    this.z_accel_timer = max(0, this.z_accel_timer - dt)
  }
  if(state.backward) {
    if(target.velocity.z < this.max_speed)
      target.velocity.z = max(min(this.max_speed, speed * dt * this.acceleration(this.z_accel_timer, this.accel_max_timer)), target.velocity.z)
  } else if(state.forward) {
    if(target.velocity.z > -this.max_speed)
      target.velocity.z = min(max(-this.max_speed, -speed * dt * this.acceleration(this.z_accel_timer, this.accel_max_timer)), target.velocity.z)
  } else {
    this.z_accel_timer = this.accel_max_timer

  }
 

  if(state.left || state.right) {
    this.x_accel_timer = max(0, this.x_accel_timer - dt)
  }

  if(state.right) {
    if(target.velocity.x < this.max_speed)
      target.velocity.x = max(min(this.max_speed, speed * dt * this.acceleration(this.x_accel_timer, this.accel_max_timer)), target.velocity.x)
  } else if(state.left) {
    if(target.velocity.x > -this.max_speed)
      target.velocity.x = min(max(-this.max_speed, -speed * dt * this.acceleration(this.x_accel_timer, this.accel_max_timer)), target.velocity.x)
  } else {
    this.x_accel_timer = this.accel_max_timer
  }

  if(state.jump) {
    if(!this.jumping && !at_rest) {
      // we're falling, we can't jump
    } else if(at_rest > 0) {
      // we hit our head
      this.jumping = false
    } else {
      this.jumping = true
      if(this.jump_timer > 0) {
        target.velocity.y = min(target.velocity.y + jump_speed * min(dt, this.jump_timer), this.jump_max_speed)
      }
      this.jump_timer = max(this.jump_timer - dt, 0)
    }
  } else {
    this.jumping = false
  }
  this.jump_timer = at_rest < 0 ? this.jump_max_timer : this.jump_timer

  var can_fire = true

  if(state.fire || state.firealt) {
    if(this.firing && this.needs_discrete_fire) {
      this.firing += dt
    } else {
      if(!this.fire_rate || floor(this.firing / this.fire_rate) !== floor((this.firing + dt) / this.fire_rate)) {
        this.onfire(state)
      }
      this.firing += dt
    }
  } else {
    this.firing = 0
  }

  var x_rotation = this.x_rotation_accum * this.rotation_scale
    , y_rotation = this.y_rotation_accum * this.rotation_scale
    , z_rotation = this.z_rotation_accum * this.rotation_scale
    , pitch_target = this._pitch_target
    , yaw_target = this._yaw_target
    , roll_target = this._roll_target

  pitch_target.rotation.x = clamp(pitch_target.rotation.x + clamp(x_rotation, this.x_rotation_per_ms), this.x_rotation_clamp)
  yaw_target.rotation.y = clamp(yaw_target.rotation.y + clamp(y_rotation, this.y_rotation_per_ms), this.y_rotation_clamp)
  roll_target.rotation.z = clamp(roll_target.rotation.z + clamp(z_rotation, this.z_rotation_per_ms), this.z_rotation_clamp)

  this.x_rotation_accum =
  this.y_rotation_accum =
  this.z_rotation_accum = 0
}

proto.write = function(rotation_deltas) {
  this.x_rotation_accum -= rotation_deltas.dy || 0
  this.y_rotation_accum -= rotation_deltas.dx || 0
  this.z_rotation_accum += rotation_deltas.dz || 0
}

proto.end = function(deltas) {
  if(deltas) {
    this.write(deltas)
  }
}

proto.acceleration = function(current, max) {
  // max -> 0
  var pct = (max - current) / max
  return sin(π/2*pct)
}

proto.target = function(target) {
  if(target) {
    this._target = target
    this._yaw_target = target.yaw || target
    this._pitch_target = target.pitch || target
    this._roll_target = target.roll || target
  }
  return this._target
}

proto.onfire = function(_) {

}

function clamp(value, to) {
  return isFinite(to) ? max(min(value, to), -to) : value
}
