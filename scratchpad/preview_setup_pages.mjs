import fs from 'node:fs';
import {createRequire} from 'node:module';
import {parse,compileScript} from 'vue/compiler-sfc';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
let css='';
function component(file,name) {
 const {descriptor}=parse(fs.readFileSync(file,'utf8'));
 css+=descriptor.styles.map(s=>s.content).join('\n');
 let source=compileScript(descriptor,{id:name,inlineTemplate:true}).content;
 source=source.replace(/import\s*\{([^}]+)\}\s*from\s*['"]vue['"];?/g,(_,body)=>`const {${body.replace(/\bas\b/g,':')}}=Vue;`);
 source=source.replace(/import[\s\S]*?from ['"][^'"]+['"];?/g,'').replace('export default', 'return');
 return `const ${name}=(()=>{${ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText}})();`;
}
const components=component('src/shared/ComponentCheckPanel.vue','CheckPanel')+component('src/shared/ModelModeControl.vue','ModelPanel');
const mock=`const MODEL_MODES=['Gemini','Claude','Glm','DeepSeek'];const modelLabel=m=>m==='Glm'?'GLM':m;let selected='Gemini';const getModelMode=()=>selected;const applyModelMode=async m=>{selected=m};const inspectComponents=async()=>[
 {id:'helper',name:'酒馆助手',state:'ok',current:'4.9.3',expected:'4.9.3',detail:'达到本卡验证基线。'},
 {id:'ejs',name:'提示词模板',state:'warning',current:'1.16.0',expected:'1.17.8.1',detail:'低于本卡验证基线，请更新插件。'},
 {id:'router',name:'规则路由插件',state:'ok',current:'0.19.6',expected:'0.19.6',detail:'达到本卡验证基线。'},
 {id:'mvu',name:'MVU 变量框架',state:'ok',current:'已加载 · 未提供版本号',expected:'运行接口可用',detail:'检查变量读写接口；此脚本没有统一的版本查询接口。'},
 {id:'preset',name:'当前聊天预设',state:'ok',current:'2026.10.22',expected:'2026.10.22',detail:'检查当前选中的预设；版本为本卡组件修订号。'},
 {id:'config',name:'本卡路由配置',state:'warning',current:'未标注版本',expected:'2026.10.22',detail:'请导入本卡新版路由配置，并确认绑定世界书及路由规则已启用。'}];`;
fs.writeFileSync('scratchpad/setup-preview.html',`<!DOCTYPE html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#e8e1d2;color:#3b463e;font-family:system-ui,'Microsoft YaHei',sans-serif}main{max-width:860px;margin:24px auto;padding:28px;background:#f6f1e6;border:1px solid #c8bda4;border-radius:18px;box-sizing:border-box}h1{font-family:serif;margin:0 0 20px}nav{font-size:12px;color:#80765e;margin-bottom:20px}section.demo{border-top:1px solid #b6a58266;padding-top:24px;margin-top:24px}@media(max-width:520px){main{margin:8px;padding:16px}}${css}</style><main id="app"><nav>封面  /  组件检测  /  模型与变量</nav><h1>验 · 启程准备</h1><check-panel></check-panel><section class="demo"><model-panel></model-panel></section></main><script>${vue}</script><script>${mock}${components}Vue.createApp({components:{CheckPanel,ModelPanel}}).mount('#app');</script></html>`);
