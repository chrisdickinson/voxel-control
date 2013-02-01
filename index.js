module.exports = control

function control(control_state, target, opts) {
  return new Control(control_state, target, opts)
}

function Control(state, target, opts) {
  this.state = state
  this._target = target
  this.speed = opts.speed || 0.001
  this.max_speed = opts.maxSpeed || 0.1 
  this.jump_max_speed = opts.jumpMaxSpeed || 100
  this.jump_max_timer = opts.jumpTimer || 1000
  this.jump_speed = opts.jumpSpeed || 10 
  this.jump_timer = this.jump_timer_max
  this.jumping = false
}

var cons = Control
  , proto = cons.prototype

var max = Math.max
  , min = Math.min

proto.tick = function(dt) {
  var state = this.state
    , target = this._target
    , speed = this.speed
    , at_rest

  if(!this._target) return

  if(state.forward) {
    target.acceleration.z = max(target.acceleration.z - speed * dt, -this.max_speed)
  } else if(state.backward) {
    target.acceleration.z = min(target.acceleration.z + speed * dt, this.max_speed)
  }

  if(state.left) {
    target.acceleration.x = max(target.acceleration.x - speed * dt, -this.max_speed)
  } else if(state.right) {
    target.acceleration.x = min(target.acceleration.x + speed * dt, this.max_speed)
  }

  at_rest = target.atRestY()

  this.jump_timer = at_rest ? this.jump_max_timer : 0

  if(state.jump) {
    if(!this.jumping && !at_rest) {
      return
    }

    this.jumping = true
    if(this.jump_timer > 0) {
      target.acceleration.y = min(target.acceleration.y + speed * min(dt, this.jump_timer), this.jump_max_speed)
    }
    this.jump_timer = max(this.jump_timer, 0)
  } else {
    this.jumping = false
  }
}

proto.target = function(target) {
  if(target) {
    this._target = target
  }
  return this._target
}
