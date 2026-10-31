import fs from 'node:fs';
const payload=`<now_plot><gametxt>
<tp>界面验证样例 · 非模型剧情实测</tp>
<p>以下使用本次构建的前端，验证委托、紫色剧情面板，以及统一后的行动选项。</p>
<task_info>
万毒祖窟·噬心蛊鸣
| 类别: 剧情 | 状态: 待抉择 | 难度: 筑基 |
| 幕次: 第三幕 | 紧迫: 识海魔障破除前 |
| 局势: 蛊祖残魂暴动，等待玩家真实决定 |
| 契机: 识海危机 | 焦点: 守住道心 | 进展: 尚未选择 | 牵涉: 蛊祖残魂 |
</task_info>
<task_info>
百草采撷
| 状态: 进行中 | 难度: 炼气 | 委托方: 药圃执事 | 截止时间: 无 |
| 目标: 收集三株清心草 | 进展: 尚未交付 | 奖励: 灵石十枚 | 交付: 药圃执事 |
</task_info>
</gametxt><options>
1. 观察识海中的蛊影，暂不决定。
2. 【剧情·分支】旧前缀按普通文字显示并完整填入。
3. 向同门询问压制魔性的办法。
4. 稳住心神，先行调息。
</options></now_plot>`;
let html=fs.readFileSync('dist/正文美化/index.html','utf8');
const prelude=`<script src="/node_modules/jquery/dist/jquery.min.js"></script><script src="/node_modules/lodash/lodash.min.js"></script><script>window.__rb_content_payload=${JSON.stringify(payload)};</script>`;
html=html.replace('<head>','<head>'+prelude);
fs.writeFileSync('scratchpad/nanjing-preview-frame.html',html);
fs.writeFileSync('scratchpad/nanjing-preview.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>南疆精简 · 前端验证</title><style>body{margin:0;background:#16151d;color:#e8ddcb;font:15px sans-serif}header{padding:16px 24px}iframe{width:100%;height:1050px;border:0}textarea{display:block;width:90%;margin:12px auto;padding:12px;box-sizing:border-box}</style><header>南疆精简 · 前端验证（样例数据）</header><textarea id="send_textarea" placeholder="点击上方任一行动选项，验证文字完整填入"></textarea><iframe src="nanjing-preview-frame.html" title="正文与选项"></iframe></html>`);
console.log('Preview ready at http://127.0.0.1:5500/scratchpad/nanjing-preview.html');
