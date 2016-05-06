'use strict';
// stolen ;) from puckwold
// see: http://cs.stanford.edu/people/karpathy/reinforcejs/puckworld.html
module.exports = {
  update: 'qlearn', // qlearn | sarsa
  gamma: 0.9, // discount factor, [0, 1)
  epsilon: 0.2, // initial epsilon for epsilon-greedy policy, [0, 1)
  alpha: 0.01, // value function learning rate
  experienceAddEvery: 10, // number of time steps before we add another experience to replay memory
  experienceSize: 5000, // size of experience replay memory
  learningStepsPerIteration: 20,
  tderrorClamp: 1.0, // for robustness
  numHiddenUnits: 100 // number of neurons in hidden layer
};
