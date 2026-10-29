import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const webpack=require('webpack');
const source=fs.readFileSync('webpack.config.ts','utf8');
// Use project configuration, limiting output to affected interfaces and suppressing
// unrelated automatic card bundling/schema rewrites during this local check.
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const configPath='.nanjing-build-config.mjs';
fs.writeFileSync(configPath,code);
try {
 const {default:factories}=await import(pathToFileURL(process.cwd()+'/'+configPath));
 const configs=factories.map(f=>f({}, {mode:'production'})).filter(c=>/src[\\/](修仙状态栏|正文美化|自定义开局)[\\/]index\.ts$/.test(c.entry));
 for(const c of configs){
  c.mode='production';
  c.plugins=c.plugins.filter(p=>!['schema_dump','tavern_sync','watch_tavern_helper'].includes(p.apply?.name));
 }
 if(configs.length!==3)throw new Error('Expected exactly three frontend builds');
 await new Promise((resolve,reject)=>webpack(configs,(err,stats)=>{
  if(err)return reject(err);
  console.log(stats.toString({all:false,errors:true,warnings:true,timings:true}));
  if(stats.hasErrors())reject(new Error('Build failed'));else resolve();
 }));
}finally{fs.unlinkSync(configPath);}
