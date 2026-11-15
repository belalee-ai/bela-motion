import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill, renderMedia} from '@remotion/renderer';
import {demoDefaults} from '../src/demos/catalog.js';

const out = path.resolve('proof/chart-window');
fs.mkdirSync(out, {recursive:true});
const serveUrl = await bundle({entryPoint:path.resolve('src/index.ts'), publicDir:path.resolve('public')});
const browser = await openBrowser('chrome', {logLevel:'error'});
try {
  const inputProps = demoDefaults('demo-chart-window');
  const options = {serveUrl, puppeteerInstance:browser, logLevel:'error'};
  const composition = await selectComposition({...options, id:'Demo296', inputProps});
  await renderMedia({...options, composition, inputProps, codec:'h264', crf:22,
    outputLocation:path.join(out,'296-preview.mp4'), concurrency:2});
  const reducedProps = {...inputProps, reducedMotion:true, title:'Weekly traffic across all channels', dataValues:'-18,0,31,-5,62,-20,0,45'};
  const reducedComposition = await selectComposition({...options, id:'Demo296', inputProps:reducedProps});
  await renderStill({...options, composition:reducedComposition, inputProps:reducedProps, frame:150,
    output:path.join(out,'296-reduced.png')});
} finally {
  await browser.close({silent:true});
}
