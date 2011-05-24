!SLIDE
# Statecharts

!SLIDE smaller
# The Problem: How do you keep track of your application's state?

!SLIDE
# Quick Demo

!SLIDE bullets incremental
# What do we mean by _state_?

* The exact configuration of your views at any given time.
* E.g. When the car is turned on and the radio is turned on, the radio mode selector should be enabled.
* An app's state typically changes frequently.
* State changes are triggered by _events_ and are called _transitions_.

!SLIDE small
# So how do you implement this?

!SLIDE bullets smaller
# The naive way

    @@@ javascript
    ignitionButton: SC.ButtonView.create({
      title: function() {
        return Car.get('isOn') ? 'Turn Off' : 'Turn On';
      }.property(),

      isDisabled: function() {
        return !Car.get('keyIn') || Car.get('isMoving');
      }.property()
    })

* Each view is responsible for knowing its current state.
* State logic is spread throughout the application.

!SLIDE smaller bullets
# The naive way

* An app's state is calculated from a bunch of properties spread out across the app.
* Becomes increasingly difficult to understand as complexity increases.
* Difficult to change.
* Quickly leads to spaghetti code.

!SLIDE bullets
# A better way: Finite State Machines

* Keeps all of your state logic in one place.
* Works great as long as your number of states is small.

!SLIDE center
# FSM Car example
![car-fsm1](car-fsm1.png) 

!SLIDE center
# FSM Car example
![car-fsm2](car-fsm2.png) 

!SLIDE center
# FSM Car example
![car-fsm3](car-fsm3.png) 

!SLIDE center
# FSM Car example
![car-fsm4](car-fsm4.png) 

!SLIDE center
# Solution: Statecharts!
![basic-car-statechart](basic-car-statechart.png) 

!SLIDE bullets
# What is a statechart?

* A visual diagram for describing the behavior of a system.
* `SC.Statechart` - A framework for SproutCore that provides an API for defining and interacting with a statechart object.

!SLIDE bullets
# Features

* hierarchical states
* orthogonal states
* history states

!SLIDE bullets smaller
# Hierarchical states

* A parent state is the XOR of its substates.
* To be in state P, one must be in either state C1 or state C2, but not both.
* P is an abstraction of C1 and C2 and allows you to denote common properties of both in an economical way.
* Substates are a refinement of their parent state.

![hierarchy](hierarchy.png) 

!SLIDE bullets smaller
# Orthogonal (Parallel) states

* AND decomposition: being in a state - the system must be in all of its components.
* At any given point in time a statechart will be in a vector of states whose length is not fixed.
* `(A ⊕ B) ∧ (C ⊕ D) ∧ (E ⊕ F)`
* Eg: `P1.A, P2.D, P3.E`
* Syncronicity - a single event causes multiple simultaneous happenings.

![orthogonal](orthogonal.png) 

!SLIDE bullets center smaller
# History states

* When entering this parent state, transition to the most recently exited child state.
* If this is the first time entering this parent state, transition to the default child state.
![basic-car-statechart](basic-car-statechart.png) 

!SLIDE bullets
# Events

* When an event is sent to the statechart, each current state is given the opportunity to handle it. 

!SLIDE bullets
# Transistions
* When a state handles an event, it typically triggers a state transition.
* Transitions start from the current state causing the transition and traverse up to the pivot state, triggering exit state handlers along the way.
* From the pivot state, child states are traversed, triggering enter state handlers until the final substate is reached.

!SLIDE center
### `C1.2 -> C2.1`
![transition-ex1](transition-ex1.png)

!SLIDE center
### `C1.2 -> C2.1`
![transition-ex2](transition-ex2.png)

!SLIDE center
### `C1.2 -> C2.1`
![transition-ex3](transition-ex3.png)

!SLIDE center
### `(W.P1.B, W.P2.D, W.P3.E) -> W.X.Z`
![transition-ex4](transition-ex4.png)

!SLIDE center
### `(W.P1.B, W.P2.D, W.P3.E) -> W.X.Z`
![transition-ex5](transition-ex5.png)

!SLIDE center
### `(W.P1.B, W.P2.D, W.P3.E) -> W.X.Z`
![transition-ex6](transition-ex6.png)

!SLIDE center
# `SC.Statechart` example
![car-statechart](car-statechart.png) 
