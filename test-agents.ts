import { getAgent, AGENTS } from './src/data/agents';

const ids = ['startup-mentor', 'english-tutor', 'code-helper', 'mood-diary'];
console.log('Total agents:', AGENTS.length);
ids.forEach(id => {
  const agent = getAgent(id);
  console.log(`Agent ${id}: ${agent ? 'Found' : 'NOT FOUND'}`);
});
