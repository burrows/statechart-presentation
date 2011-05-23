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
        Car.radioButtonView.set('isDisabled', true);
      },

      toggleIgnition: function() { this.gotoState('on'); }
    }),

    on: SC.State.design({
      substatesAreConcurrent: true,

      enterState: function() {
        jQuery('body').addClass('car-on');
        Car.radioButtonView.set('isDisabled', false);
      },

      exitState: function() {
        jQuery('body').removeClass('car-on');
      },

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

        off: SC.State.design({
          enterState: function() {
            Car.radioButtonView.set('title', 'Radio On');
            Car.radioModeView.set('isDisabled', true);
            Car.radioDisplayView.set('value', '---');
          },

          toggleRadio: function() {
            this.gotoState('on.radio.on');
          }
        }),

        on: SC.State.design({
          initialSubstate: SC.HistoryState.design({
            defaultState: 'am'
          }),

          enterState: function() {
            Car.radioButtonView.set('title', 'Radio Off');
            Car.radioModeView.set('isDisabled', false);
          },

          exitState: function() {
            Car.radioButtonView.set('title', 'Radio On');
            Car.radioModeView.set('isDisabled', true);
            Car.radioDisplayView.set('value', '---');
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
              Car.radioDisplayView.set('value', '1000 AM');
            }
          }),

          fm: SC.State.design({
            enterState: function() {
              Car.radioModeView.set('value', 'fm');
              Car.radioDisplayView.set('value', '97.7 FM');
            }
          }),

          cd: SC.State.design({
            enterState: function() {
              Car.radioModeView.set('value', 'cd');
              Car.radioDisplayView.set('value', 'CD');
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
    }).sort().join(', ');
  }.property('currentStates').cacheable(),
});

//------------------------------------------------------------------------------
// Views
//------------------------------------------------------------------------------

Car.speedometerView = SC.TemplateView.create({
  layerId: 'speedometer',
  classNames: 'digital-display',
  speedBinding: SC.Binding.from('Car.speed').transform(function(v) {
    return v < 10 ? '0' + v : v;
  })
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
  layerId: 'ignition-button',
  target: Car.statechart,
  action: 'toggleIgnition',
  mouseUp: function() {
    if (this.get('isDisabled')) { return; }
    sc_super();
  }
});

Car.PedalView = Car.Button.extend({
  classNames: 'pedal-view',
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
  target: Car.statechart,
  action: 'toggleRadio',
  mouseUp: function() {
    if (this.get('isDisabled')) { return; }
    sc_super();
  }
});

Car.radioModeView = SC.TemplateView.create({
  value: 'am',
  isDisabled: true,

  didCreateLayer: function() {
    this.addObserver('value', this, '_valueDidChange');
    this.addObserver('isDisabled', this, '_isDisabledDidChange');
    this._valueDidChange();
    this._isDisabledDidChange();
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
  },

  _isDisabledDidChange: function() {
    this.$('input').attr('disabled', this.get('isDisabled'));
  }
});

Car.radioDisplayView = SC.TemplateView.create({
  layerId: 'radio-display',
  classNames: 'digital-display',
  value: ''
});

Car.currentStatesView = SC.TemplateView.create({
  classNames: 'current-states',
  currentStatesBinding: 'Car.statechart.currentStateNames'
});

SC.ready(function() { Car.statechart.initStatechart(); });

