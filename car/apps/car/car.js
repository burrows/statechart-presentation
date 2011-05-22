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
      substatesAreConcurrent: true,

      drivetrain: SC.State.design({
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

          gasOn: function() { this.gotoState('on.drivetrain.moving'); }
        }),

        moving: SC.State.design({
          initialSubstate: 'accelerating',

          enterState: function() {
            Car.ignitionButtonView.set('isDisabled', true);
          },

          stoppedMoving: function() {
            this.gotoState('on.drivetrain.stopped');
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
              this.gotoState('on.drivetrain.moving.idle');
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
              this.gotoState('on.drivetrain.moving.accelerating');
            },

            brakeOn: function() {
              this.gotoState('on.drivetrain.moving.braking');
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
              this.gotoState('on.drivetrain.moving.idle');
            }
          })
        })
      }),

      radio: SC.State.design({
        initialSubstate: SC.HistoryState.design({
          defaultState: 'off'
        }),

        enterState: function() {
          Car.radioButtonView.set('isVisible', true);
        },

        exitState: function() {
          Car.radioButtonView.set('isVisible', false);
        },

        off: SC.State.design({
          enterState: function() {
            Car.radioButtonView.set('title', 'Radio On');
          },

          toggleRadio: function() {
            this.gotoHistoryState('on.radio.on');
          }
        }),

        on: SC.State.design({
          initialSubstate: SC.HistoryState.design({
            defaultState: 'am'
          }),

          enterState: function() {
            Car.radioButtonView.set('title', 'Radio Off');
            Car.radioModeView.set('isVisible', true);
          },

          exitState: function() {
            Car.radioModeView.set('isVisible', false);
          },

          toggleRadio: function() {
            this.gotoState('on.radio.off');
          },

          toggleRadioMode: function(mode) {
            this.gotoState('on.radio.on.%@'.fmt(mode));
          },

          am: SC.State.design({
            enterState: function() {
              Car.radioModeView.set('value', 'am');
            }
          }),

          fm: SC.State.design({
            enterState: function() {
              Car.radioModeView.set('value', 'fm');
            }
          }),

          cd: SC.State.design({
            enterState: function() {
              Car.radioModeView.set('value', 'cd');
            }
          })
        })
      })
    })
  }),

  currentStateNames: function() {
    if (!this.get('statechartIsInitialized')) {
      return '-';
    }

    return this.get('currentStates').map(function(s) {
      var path = [];

      for (; s.get('name') !== '__ROOT_STATE__'; s = s.get('parentState')) {
        path.push(s.get('name'));
      }

      return path.reverse().join('.');
    }).join(', ');
  }.property('currentStates').cacheable(),
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

Car.radioButtonView = Car.Button.create({
  title: 'Radio On',
  isVisible: false,
  target: Car.statechart,
  action: 'toggleRadio',
  mouseUp: function() {
    if (this.get('isDisabled')) { return; }
    sc_super();
  }
});

Car.radioModeView = SC.TemplateView.create({
  isVisible: false,
  value: 'am',

  didCreateLayer: function() {
    this.addObserver('value', this, '_valueDidChange');
    this._valueDidChange();
  },

  mouseDown: function(evt) {
    var elem = jQuery(evt.target);

    if (elem.is('input[type=radio]')) {
      this.set('value', elem.val());
      Car.statechart.sendEvent('toggleRadioMode', this.get('value'));
    }
  },

  _valueDidChange: function() {
    var value = this.get('value');
    this.$('input[value=%@]'.fmt(value)).attr('checked', true);
  }
});

Car.currentStatesView = SC.TemplateView.create({
  currentStatesBinding: 'Car.statechart.currentStateNames'
});

SC.ready(function() { Car.statechart.initStatechart(); });
