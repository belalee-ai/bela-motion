import {clamp, mod} from './motion.js';

export const minimumSpan = .2;
const full = [0, 1];
const cues = [
  [0, full], [.7, full], [2, [.29, .61]], [2.85, [.29, .61]],
  [4.24, [.57, .89]], [5.16, [.57, .89]], [6.68, full], [8, full],
];

export function autoChartWindow(time, reduced) {
  if (reduced) return cues[2][1];
  const elapsed = mod(time, 8);
  const next = cues.findIndex(([at]) => at > elapsed);
  const [start, from] = cues[next - 1];
  const [end, to] = cues[next];
  const u = (elapsed - start) / (end - start);
  const progress = u ** 3 * (10 + u * (-15 + 6 * u));
  return from.map((value, i) => value + (to[i] - value) * progress);
}

export function moveChartWindow(range, part, amount) {
  const [start, end] = range;
  if (part === 'start') return [clamp(amount, 0, end - minimumSpan), end];
  if (part === 'end') return [start, clamp(amount, start + minimumSpan, 1)];
  const displacement = clamp(amount, -start, 1 - end);
  return [start + displacement, end + displacement];
}

// Interpolate true boundary values so cutting the domain never stretches
// the full series or invents a new entry/exit point for the visible line.
export function chartWindowPoints(values, [start, end]) {
  const last = values.length - 1;
  const sample = position => {
    const index = position * last;
    const low = Math.floor(index);
    return values[low] + ((values[low + 1] ?? values[low]) - values[low]) * (index - low);
  };
  const points = [[0, sample(start)]];
  for (let i = 0; i <= last; i++) {
    const position = i / last;
    if (position > start && position < end) points.push([(position - start) / (end - start), values[i]]);
  }
  return [...points, [1, sample(end)]];
}
