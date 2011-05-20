Car = SC.Application.create({
  speed: 0,

  _incrementSpeed: function() { this.incrementProperty('speed'); },

  _decrementSpeed: function() {
    if (this.get('speed') > 0) {
      this.decrementProperty('speed');
    }

    if (this.get('speed') === 0) {
      this.statechart.sendEvent('stoppedMoving');
    }
  }
});

//------------------------------------------------------------------------------
// Statechart
//------------------------------------------------------------------------------
Car.statechart = SC.Statechart.create({
  trace: true,

  rootState: SC.State.design({
    initialSubstate: 'off',

    enterState: function() {
      Car.mainPane = SC.TemplatePane.append({
        layerId: 'car',
        templateName: 'car'
      });
    },

    off: SC.State.design({
      enterState: function() {
        Car.ignitionButtonView.set('title', 'Turn On');
        Car.ignitionButtonView.set('isDisabled', false);
        Car.gasPedalView.set('isDisabled', true);
        Car.brakePedalView.set('isDisabled', true);
      },

      toggleIgnition: function() { this.gotoState('on'); }
    }),

    on: SC.State.design({
      initialSubstate: 'stopped',

      enterState: function() {
        Car.ignitionButtonView.set('title', 'Turn Off');
        Car.gasPedalView.set('isDisabled', false);
        Car.brakePedalView.set('isDisabled', false);
      },

      toggleIgnition: function() { this.gotoState('off'); },

      stopped: SC.State.design({
        enterState: function() {
          Car.ignitionButtonView.set('isDisabled', false);
        },

        gasOn: function() { this.gotoState('on.moving'); }
      }),

      moving: SC.State.design({
        initialSubstate: 'accelerating',

        enterState: function() {
          Car.ignitionButtonView.set('isDisabled', true);
        },

        stoppedMoving: function() {
          this.gotoState('on.stopped');
        },

        accelerating: SC.State.design({
          enterState: function() {
            this._accelerateTimer = SC.Timer.schedule({
              target: Car,
              action: '_incrementSpeed',
              interval: 500,
              repeats: true
            })
          },

          exitState: function() {
            this._accelerateTimer.invalidate();
          },

          gasOff: function() {
            this.gotoState('on.moving.idle');
          }
        }),

        idle: SC.State.design({
          enterState: function() {
            this._idleTimer = SC.Timer.schedule({
              target: Car,
              action: '_decrementSpeed',
              interval: 2000,
              repeats: true
            });
          },

          exitState: function() {
            this._idleTimer.invalidate();
          },

          gasOn: function() {
            this.gotoState('on.moving.accelerating');
          },

          brakeOn: function() {
            this.gotoState('on.moving.braking');
          }
        }),

        braking: SC.State.design({
          enterState: function() {
            this._brakeTimer = SC.Timer.schedule({
              target: Car,
              action: '_decrementSpeed',
              interval: 200,
              repeats: true
            });
          },

          exitState: function() {
            this._brakeTimer.invalidate();
          },

          brakeOff: function() {
            this.gotoState('on.moving.idle');
          }
        })
      })
    })
  })
});

//------------------------------------------------------------------------------
// Views
//------------------------------------------------------------------------------

Car.speedometerView = SC.TemplateView.create({
  layerId: 'speedometer',
  speedBinding: 'Car.speed'
});

Car.Button = SC.Button.extend({
  isDisabled: false,
  template: SC.Handlebars.compile('<button>{{title}}</button>'),

  didCreateLayer: function() {
    this.addObserver('isDisabled', this, '_isDisabledDidChange');
    this._isDisabledDidChange();
  },

  _isDisabledDidChange: function() {
    this.$('button').attr('disabled', this.get('isDisabled'));
  }
});

Car.ignitionButtonView = Car.Button.create({
  title: '',
  target: Car.statechart,
  action: 'toggleIgnition',
  mouseUp: function() {
    if (this.get('isDisabled')) { return; }
    sc_super();
  }
});

Car.PedalView = Car.Button.extend({
  event: '',

  mouseDown: function() {
    if (this.get('isDisabled')) { return; }

    var event = this.get('event');
    sc_super();
    Car.statechart.sendEvent(event + 'On');
  },

  mouseUp: function() {
    if (this.get('isDisabled')) { return; }

    var event = this.get('event');
    sc_super();
    Car.statechart.sendEvent(event + 'Off');
  }
});

Car.brakePedalView = Car.PedalView.create({
  title: 'Brake', event: 'brake'
});

Car.gasPedalView = Car.PedalView.create({
  title: 'Gas', event: 'gas'
});

SC.ready(function() { Car.statechart.initStatechart(); });
