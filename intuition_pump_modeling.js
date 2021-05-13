const MLR = require("ml-regression-multivariate-linear");
const fs = require('fs');

const makeAgent = (reliabilityOfIntuitions, credence) => {
  const agent = {};
  agent.credence = credence;
  agent.startingIntuition = Math.random() < reliabilityOfIntuitions ? true : false;
  agent.update = (evidence, probability) => {
    // P(H|D) = [P(D|H) x P(H)] / [P(D|H) x P(H) + P(D|H') x (1-P(H))]
    let inverseProbability = 1 - probability;
    if (evidence == agent.startingIntuition) {
      agent.credence = (probability * agent.credence) / (probability * agent.credence + inverseProbability * (1 - agent.credence))
    } else {
      agent.credence = (inverseProbability * agent.credence) / (inverseProbability * agent.credence + probability * (1 - agent.credence))
    }
  }
  agent.fetchBelief = () => {
    if (agent.credence >= 0.5) {
      return agent.startingIntuition
    } else {
      return !agent.startingIntuition
    }
  }
  return agent;
}

const shuffle = (array) => {
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * i)
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

const askStudents = (philosopher, reliabilityOfIntuitions) => {
  const students = [];
  for (let i = 0; i < 60; i++) {
    students.push(makeAgent(reliabilityOfIntuitions, Math.random()));
  }
  for (let i = 0; i < 10; i++) {
    shuffle(students);
    comment = students[0].fetchBelief()
    philosopher.update(comment, reliabilityOfIntuitions)
    for (const student of students) {
      student.update(comment, reliabilityOfIntuitions)
    }
  }
}

const attendConference = (philosopher, reliabilityOfIntuitions, bonusReliability) => {
  const attendees = [];
  const upgradedReliability = reliabilityOfIntuitions + bonusReliability;
  for (let i = 0; i < 25; i++) {
    attendees.push(makeAgent(upgradedReliability, Math.random()));
  }
  for (let i = 0; i < 5; i++) {
    shuffle(attendees);
    comment = attendees[0].fetchBelief()
    philosopher.update(comment, upgradedReliability)
    for (const attendee of attendees) {
      attendee.update(comment, upgradedReliability)
    }
  }
}

const askExpert = (philosopher, reliabilityOfIntuitions, bonusReliability) => {
  const upgradedReliability = reliabilityOfIntuitions + bonusReliability;
  Math.random() < 0.7 ? philosopher.update(true, upgradedReliability) : philosopher.update(false, upgradedReliability);
}

const generateInitialScenarios = (sizeOfPopulation, numberOfTrials) => {
  const scenarios = [];
  for (let i = 0; i < sizeOfPopulation; i++) {
    const trials = [];
    for (let i = 0; i < numberOfTrials; i++) {
      trials.push(Math.floor(Math.random() * 3) + 1)
    }
    scenarios.push({
      endingRound: undefined,
      desriedResult: false,
      endingCredence: undefined,
      startingIntuition: undefined,
      roundEndedOn: undefined,
      trials
    });
  }
  return scenarios
}

const breedNewScenarios = (scenarios, sizeOfPopulation, numberOfTrials) => {
  const newScenarios = [];
  const successfulScenarios = scenarios.filter((scenario) => {
    return scenario.desriedResult;
  });
  while (newScenarios.length < sizeOfPopulation) {
    const partnerOne = successfulScenarios[Math.floor(Math.random() * (successfulScenarios.length))]
    const partnerTwo = successfulScenarios[Math.floor(Math.random() * (successfulScenarios.length))]
    const trials = [];
    for (let i = 0; i < numberOfTrials; i++) {
      if (Math.random() >= 0.5) {
        trials.push(partnerOne.trials[i]);
      } else {
        trials.push(partnerTwo.trials[i])
      }
    }
    newScenarios.push({
      endingRound: undefined,
      desriedResult: false,
      endingCredence: undefined,
      startingIntuition: undefined,
      roundEndedOn: undefined,
      trials
    });
  }
  return newScenarios;
}

const roundData = [];
for (let confidenceModifier = 0; confidenceModifier <= 2; confidenceModifier++) {
  for (let numberOfTrials = 5; numberOfTrials <= 15; numberOfTrials++) {
    results = [];
    for (let i = 0; i < 50; i++) {
      const sizeOfPopulation = 500;
      let scenarios = generateInitialScenarios(sizeOfPopulation, numberOfTrials);
      let sampledScenarioTrials;
      let shouldSimRunAgain = true;
      while (shouldSimRunAgain) {
        for (scenario of scenarios) {
          const reliabilityOfIntuitions = Math.random() * 0.1 + 0.6;
          const bonusReliability = Math.random() * 0.05 + 0.025;
          let round = 0;
          const philosopher = makeAgent(reliabilityOfIntuitions + bonusReliability * 2, reliabilityOfIntuitions + bonusReliability * 2 * confidenceModifier);

          for (const num in scenario.trials) {
            if (philosopher.credence > 0.5 && philosopher.credence < 0.95) {
              round++;
              if (num === 1) {
                askStudents(philosopher, reliabilityOfIntuitions)
              } else if (num === 2) {
                attendConference(philosopher, reliabilityOfIntuitions, bonusReliability)
              } else {
                askExpert(philosopher, reliabilityOfIntuitions, bonusReliability * 2)
              }
            }
          }
          scenario.endingRound = round;
          scenario.endingCredence = philosopher.credence;
          scenario.startingIntuition = philosopher.startingIntuition;
          if (philosopher.credence <= 0.5 || philosopher.credence >= 0.95) {
            if (philosopher.credence < 0.5) {
              scenario.desriedResult = !scenario.startingIntuition;
            } else {
              scenario.desriedResult = scenario.startingIntuition;
            }
          }
        }
        sampledScenarioTrials = scenarios[0].trials;
        const homogeneity = scenarios.filter((scenario) => {return scenario.trials + "" === sampledScenarioTrials + "";}).length / sizeOfPopulation
        if (homogeneity < 0.9) {
          scenarios = breedNewScenarios(scenarios, sizeOfPopulation, numberOfTrials)
        } else {
          shouldSimRunAgain = false
        }
      }
      const result = {
        trials: sampledScenarioTrials,
        percentCorrect: scenarios.filter((scenario) => (scenario.desriedResult)).length / sizeOfPopulation,
        numberOfTrials,
      }
      results.push(result);
    }
    const x = [];
    const y = [];
    let aggregateCorrect = 0
    for (let i = 0; i < results.length; i++) {
      aggregateCorrect += results[i].percentCorrect
      const _x = [];
      const _y = [];
      let firstTrialOne = 0;
      let firstTrialTwo = 0;
      let firstTrialThree = 0;
      let numOfOnes = 0;
      let numOfTwos = 0;
      let numOfThrees = 0;
      if (results[i].trials[0] === 1) {
        firstTrialOne = 1;
      } else if (results[i].trials[0] === 2) {
        firstTrialTwo = 1;
      } else if (results[i].trials[0] === 3) {
        firstTrialThree = 1;
      }
      for (const num of results[i].trials) {
        if (num === 1) {
          numOfOnes++
        } else if (num === 2) {
          numOfTwos++
        } else if (num === 3) {
          numOfThrees++
        }
      }
      _x.push(firstTrialOne)
      _x.push(firstTrialTwo)
      _x.push(firstTrialThree)
      _x.push(numOfOnes)
      _x.push(numOfTwos)
      _x.push(numOfThrees)
      _y.push(results[i].percentCorrect);
      x.push(_x);
      y.push(_y);
    }
    const mlr = new MLR(x, y);

    console.log("___________________ROUND RESULT " + numberOfTrials + "___________________")
    const roundDatum = {
      "# of trials": numberOfTrials,
      "class first": mlr.weights[0][0],
      "conference first": mlr.weights[1][0],
      "expert first": mlr.weights[2][0],
      "class occurrences": mlr.weights[3][0],
      "conference occurrences": mlr.weights[4][0],
      "expert occurrences": mlr.weights[5][0],
      "% correct": aggregateCorrect / results.length,
      "STD error": mlr.stdError
    }
    console.log(roundDatum)
    roundData.push(roundDatum)
  }
  const rows = ["# of trials", "class first", "conference first", "expert first", "class occurrences", "conference occurrences", "expert occurrences", "% correct", "STD error"]

  let dataToWrite = rows.join(',')+ '\n'
  for (roundDatum of roundData) {
    dataRow = []
    for (title of rows) {
      dataRow.push(roundDatum[title])
    }
    dataToWrite += dataRow.join(',')+ '\n'
  }

  let csvName;
  if (confidenceModifier === 0) {
    csvName = "underconfident.csv"
  } else if (confidenceModifier === 1) {
    csvName = "control.csv"
  } else {
    csvName = "overconfident.csv"
  }

  fs.writeFile(csvName, dataToWrite, 'utf8', (err) => {
    if (err) {
      console.log('Some error occured - file either not saved or corrupted file saved.');
    } else{
      console.log('It\'s saved!');
    }
  });
}


