import React, {useId, useRef, useState} from 'react';
import type {DemoProps} from '../DemoMotion';
import {clamp} from './motion.js';
import {chartScale, dataLabels, dataValues, numberText} from '../demos/data-motion.js';
import {autoChartWindow, chartWindowPoints, minimumSpan, moveChartWindow} from './chart-window.js';

type Part = 'start' | 'end' | 'window';
const left = 107;
const right = 701;
const width = right - left;
const overviewTop = 362;
const overviewHeight = 48;

export const ChartWindow: React.FC<{p: DemoProps; frame: number; fps: number}> = ({p, frame, fps}) => {
  const live = Boolean(p.native);
  const [selection, setWindow] = useState([0, 1]);
  const drag = useRef<{pointer: number; part: Part; at: number; range: number[]} | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const range = live ? selection : autoChartWindow(frame / fps * clamp(p.speed ?? 1, .5, 2), p.reducedMotion);
  const [start, end] = range;
  const values = dataValues(p);
  const labels = dataLabels(p, values.length);
  const last = values.length - 1;
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values) || (min === 0 ? 1 : 0);
  const y = chartScale([min, max], 128, 292);
  const overviewY = chartScale([min, max], overviewTop + 6, overviewTop + overviewHeight - 6);
  const points = chartWindowPoints(values, range);
  const path = (positions: number[][], scale: (value: number) => number) =>
    positions.map(([x, value], i) => (i === 0 ? 'M' : 'L') + (left + x * width) + ',' + scale(value)).join(' ');
  const detailPath = path(points, y);
  const overviewPath = path(chartWindowPoints(values, [0, 1]), overviewY);
  const accent = p.accent ?? '#08736f';
  const selectionX = left + start * width;
  const selectionWidth = (end - start) * width;
  const axisIndices = labels.map((_, i) => i).filter(i => i / last >= start && i / last <= end);
  const labelIndices: number[] = [];
  for (const index of axisIndices) {
    const previous = labelIndices.at(-1);
    if (previous === undefined || (index - previous) * width / (last * (end - start)) >= 110) labelIndices.push(index);
  }

  const pointerPosition = (clientX: number) => {
    const rect = track.current!.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width);
  };
  const startDrag = (event: React.PointerEvent<HTMLElement>, part: Part) => {
    if (event.button !== 0 || drag.current) return;
    event.stopPropagation();
    const at = pointerPosition(event.clientX);
    drag.current = {pointer:event.pointerId, part, at, range};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: React.PointerEvent<HTMLElement>) => {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const delta = pointerPosition(event.clientX) - active.at;
    const edge = active.part === 'start' ? active.range[0] : active.range[1];
    setWindow(moveChartWindow(active.range, active.part, active.part === 'window' ? delta : edge + delta));
  };
  const finish = (event: React.PointerEvent<HTMLElement>) => {
    if (drag.current?.pointer === event.pointerId) drag.current = null;
  };
  const onKey = (event: React.KeyboardEvent, part: 'start' | 'end') => {
    const current = part === 'start' ? start : end;
    const step = event.shiftKey ? .10 : .025;
    const target = {ArrowLeft:current-step, ArrowRight:current+step, ArrowDown:current-step,
      ArrowUp:current+step, Home:0, End:1}[event.key];
    if (target === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    setWindow(previous => moveChartWindow(previous, part, target));
  };
  const reset = () => setWindow([0, 1]);
  const handles = (['start', 'end'] as const).map(part => {
    const isStart = part === 'start';
    const value = isStart ? start : end;
    return <div key={part} data-chart-handle={part} role="slider" tabIndex={0}
      aria-label={isStart ? '区间起点' : '区间终点'}
      aria-valuemin={isStart ? 0 : Math.round((start + minimumSpan) * 100)}
      aria-valuemax={isStart ? Math.round((end - minimumSpan) * 100) : 100}
      aria-valuenow={Math.round(value * 100)} aria-valuetext={labels[Math.round(value * last)]}
      onPointerDown={event => startDrag(event, part)} onPointerMove={move}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
      onKeyDown={event => onKey(event, part)}
      style={{position:'absolute',top:0,left:value*width-22,width:44,height:overviewHeight,
        cursor:'ew-resize',touchAction:'none',outlineOffset:-4,borderRadius:8}}/>;
  });

  return <div data-chart-window="" data-window-start={start.toFixed(4)} data-window-end={end.toFixed(4)}
    style={{position:'absolute',inset:0,fontFamily:'Arial,sans-serif'}}>
    <div style={{position:'absolute',inset:'38px 38px 42px',background:'#fbfcfa',borderRadius:18}}/>
    <div style={{position:'absolute',top:62,left:76,right:live?210:76,overflow:'hidden',whiteSpace:'nowrap',
      textOverflow:'ellipsis',fontSize:29,fontWeight:650,letterSpacing:-.6,color:'#203b37'}}>
      {p.title || 'Weekly traffic'}
    </div>
    <svg width="800" height="500" aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
      <defs>
        <linearGradient id={id} x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor={accent} stopOpacity=".21"/><stop offset="1" stopColor={accent} stopOpacity=".055"/>
        </linearGradient>
      </defs>
      {Array.from(new Set([min, 0, max])).map(value => <g key={value}>
        <path d={'M'+left+' '+y(value)+'H'+right} stroke={value === 0 ? '#9cabaa' : '#dce6e3'}/>
        <text x={left-12} y={y(value)+5} textAnchor="end" fontSize="16" fill="#526964">{numberText(value)}</text>
      </g>)}
      <path d={detailPath+' L'+right+' '+y(0)+' H'+left+' Z'} fill={'url(#'+id+')'}/>
      <path data-window-detail="" d={detailPath} stroke={accent} strokeWidth="3.25" strokeLinejoin="round" fill="none"/>
      {labelIndices.map(i => {
        const x = (i / last - start) / (end - start);
        const anchor = x < .09 ? 'start' : x > .91 ? 'end' : 'middle';
        return <text key={i} x={left+x*width} y="318" fontSize="16" textAnchor={anchor} fill="#526964">
          {Array.from(labels[i]).length > 6 ? Array.from(labels[i]).slice(0,5).join('')+'…' : labels[i]}
        </text>;
      })}
      <rect x={left} y={overviewTop} width={width} height={overviewHeight} rx="7" fill="#edf3f1"/>
      <path d={overviewPath} stroke="#7f9892" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
      <rect x={selectionX} y={overviewTop} width={selectionWidth} height={overviewHeight} rx="6"
        fill={accent} fillOpacity=".13" stroke={accent} strokeWidth="1.5"/>
      {[selectionX, selectionX+selectionWidth].map(x => <g key={x}>
        <rect x={x-7} y={overviewTop+8} width="14" height="32" rx="5" fill="#fbfcfa" stroke={accent}/>
        <path d={'M'+x+' '+(overviewTop+17)+'v14'} stroke={accent} strokeWidth="1.4" strokeLinecap="round"/>
      </g>)}
    </svg>
    {live && <>
      <button type="button" aria-label="重置图表区间" onClick={reset} style={{position:'absolute',right:98,top:60,
        borderRadius:9,border:'1px solid #c5d5d0',background:'#fbfcfa',color:'#294740',padding:'7px 13px',fontSize:18,cursor:'pointer'}}>
        Reset
      </button>
      <div ref={track} aria-label="图表全量概览" role="group" style={{position:'absolute',left,top:overviewTop,width,height:overviewHeight}}>
        <div data-chart-band="" onPointerDown={event => startDrag(event, 'window')} onPointerMove={move}
          onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
          style={{position:'absolute',left:start*width,width:selectionWidth,height:overviewHeight,cursor:'grab',touchAction:'none'}}/>
        {handles}
      </div>
    </>}
  </div>;
};
