module.exports = control


function control(control_state, mount, target, opts) {
  return new Control(control_state, mount, target, opts)
}

function Control(state, mount, target, opts) {
  this.state = state
  this._target = target
  this._mount = mount
  this.speed = opts.speed || 0.08
  this.max_speed = opts.maxSpeed || 0.28 
  this.jump_max_speed = opts.jumpMaxSpeed || 0.4 
  this.jump_max_timer = opts.jumpTimer || 200
  this.jump_speed = opts.jumpSpeed || 0.1 
  this.jump_timer = this.jump_timer_max
  this.jumping = false

  this.fire_rate = opts.fireRate || 0
  this.needs_discrete_fire = opts.discreteFire || false
  this.onfire = opts.onfire || this.onfire
  this.firing = 0

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
  , floor = Math.floor
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
      return this.firing += dt
    }

    if(!this.fire_rate || floor(this.firing / this.fire_rate) !== floor((this.firing + dt) / this.fire_rate)) {
      this.onfire(this._mount, state)
    }
    this.firing += dt
  } else {
    this.firing = 0
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
  }
  return this._target
}

proto.mount = function(mount) {
  if(mount) {
    this._mount = mount
  }
  return this._mount
}

proto.onfire = function(_, __) {

}
