import assert from 'node:assert/strict';
import {demoById,demoDefaults,demoFrames} from '../src/demos/catalog.js';
import {dataValues, validateValues} from '../src/demos/data-motion.js';
import {autoChartWindow,chartWindowPoints,minimumSpan,moveChartWindow} from '../src/intake-studies/chart-window.js';

const id = 'demo-chart-window';
const defaults = demoDefaults(id);
assert.equal(demoById(id).code, '296');
assert.equal(demoById(id).trigger, '拖动');
assert.equal(defaults.images.length, 0);
assert.deepEqual(dataValues({...defaults,dataValues:'-20,0,20'}), [-20,0,20]);
assert.equal(validateValues('chart-window', [0,0]), '');
assert.notEqual(validateValues('chart-window', [10]), '');
assert.deepEqual(chartWindowPoints([-20,0,20],[.25,.75]), [[0,-10],[.5,0],[1,10]]);
assert.deepEqual(chartWindowPoints([0,0],[.23,.7]), [[0,0],[1,0]]);

const range = [.25,.75];
assert.deepEqual(moveChartWindow(range,'window',2), [.5,1]);
assert.deepEqual(moveChartWindow(range,'window',-2), [0,.5]);
assert.deepEqual(moveChartWindow(range,'start',1), [.75-minimumSpan,.75]);
assert.deepEqual(moveChartWindow(range,'end',0), [.25,.25+minimumSpan]);

for (const fps of [25,30,60]) for (const speed of [.5,1,2]) {
  const frames = demoFrames({...defaults,speed},fps);
  const samples = Array.from({length:frames},(_,frame)=>autoChartWindow(frame*speed/fps));
  assert.deepEqual(samples[0], samples.at(-1));
  assert(samples.every(([a,b])=>a >= 0 && b <= 1 && b-a >= minimumSpan));
  assert(samples.some(([a,b])=>b-a < .33));
  assert(samples.some(([a,b])=>a > .56 && b > .88));
  assert(samples.slice(1).every(([a,b],i)=>Math.abs(a-samples[i][0]) < .09 && Math.abs(b-samples[i][1]) < .09));
}
assert.deepEqual(autoChartWindow(0,true),autoChartWindow(5,true));
console.log('PASS 296: data projection, signed and zero values, bounded handles, fixed-width pan, reduced motion and loop continuity.');
