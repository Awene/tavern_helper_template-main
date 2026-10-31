import configs from '../webpack.config.ts';
import webpack from 'webpack';
const selected = configs.map(fn => fn({frontendOnly:true}, {mode:'production'})).filter(c => /[\\/](自定义开局|修仙状态栏)[\\/]index\.ts$/.test(c.entry));
if(selected.length !== 2) throw new Error('Expected two UI entries');
for(const c of selected) c.mode='production';
webpack(selected, (error, stats) => {
  if(error) { console.error(error); process.exitCode=1; return; }
  console.log(stats.toString({colors:false, all:false, errors:true, warnings:true, timings:true}));
  if(stats.hasErrors()) process.exitCode=1;
});
