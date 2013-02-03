module.exports = control

function control(control_state, target, opts) {
  return new Control(control_state, target, opts)
}

function Control(state, target, opts) {
  this.state = state
  this._target = target
  this.speed = opts.speed || 0.08
  this.max_speed = opts.maxSpeed || 0.28 
  this.jump_max_speed = opts.jumpMaxSpeed || 0.4 
  this.jump_max_timer = opts.jumpTimer || 200
  this.jump_speed = opts.jumpSpeed || 0.1 
  this.jump_timer = this.jump_timer_max
  this.jumping = false

  this.air_control = 'airControl' in opts ? opts.airControl : true

  this.accel_max_timer = opts.accelTimer || 200
  this.x_accel_timer = this.accel_max_timer+0
  this.z_accel_timer = this.accel_max_timer+0
}

var cons = Control
  , proto = cons.prototype

var max = Math.max
  , min = Math.min
  , sin = Math.sin
  , abs = Math.abs
  , π = Math.PI

proto.tick = function(dt) {
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
    if(okay_z)
      target.velocity.z = max(min(this.max_speed, speed * dt * this.acceleration(this.z_accel_timer, this.accel_max_timer)), target.velocity.z)
  } else if(state.forward) {
    if(okay_z)
      target.velocity.z = min(max(-this.max_speed, -speed * dt * this.acceleration(this.z_accel_timer, this.accel_max_timer)), target.velocity.z)
  } else {
    this.z_accel_timer = this.accel_max_timer

    target.velocity.z = at_rest || this.air_control ? 0 : target.velocity.z
  }
 

  if(state.left || state.right) {
    this.x_accel_timer = max(0, this.x_accel_timer - dt)
  }

  if(state.right) {
    if(okay_x)
      target.velocity.x = max(min(this.max_speed, speed * dt * this.acceleration(this.x_accel_timer, this.accel_max_timer)), target.velocity.x)
  } else if(state.left) {
    if(okay_x)
      target.velocity.x = min(max(-this.max_speed, -speed * dt * this.acceleration(this.x_accel_timer, this.accel_max_timer)), target.velocity.x)
  } else {
    this.x_accel_timer = this.accel_max_timer
    target.velocity.x = at_rest || this.air_control ? 0 : target.velocity.x
  }

  if(state.jump) {
    if(!this.jumping && !at_rest) {
      // we're falling, we can't jump
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
  this.jump_timer = at_rest ? this.jump_max_timer : this.jump_timer 

  document.querySelector('.debug').innerText = 
    target.acceleration.y.toFixed(2) + 'a; ' + target.velocity.y.toFixed(2) + 'v; '+
    this.jump_timer + '; '
}

proto.acceleration = function(current, max) {
  // max -> 0
  var pct = (max - current) / max
  return sin(π/2*pct)
}

proto.target = function(target) {
  if(target) {
    this._target = target
  }
  return this._target
}
