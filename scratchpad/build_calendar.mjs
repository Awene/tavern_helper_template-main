// 只构建本次修改的前端，不触发角色卡打包、同步或网络发布。
import webpack from 'webpack';
import factories from '../webpack.config.ts';
const targets = ['自定义开局', '修仙状态栏', '正文美化'];
const configs = factories.map(make => make({}, { mode: 'production' }))
  .filter(config => targets.some(name => config.entry.replaceAll('\\', '/').endsWith(`/src/${name}/index.ts`)))
  .map(config => ({ ...config, mode: 'production',
    plugins: config.plugins.filter(plugin => !['watch_tavern_helper', 'schema_dump', 'tavern_sync'].includes(plugin.apply?.name)),
  }));
if (configs.length !== targets.length) throw Error('未找到全部目标入口');
const compiler = webpack(configs);
compiler.run((error, stats) => {
  if (error) console.error(error);
  if (stats) console.log(stats.toString({ preset: 'errors-warnings', colors: false }));
  process.exitCode = error || stats?.hasErrors() ? 1 : 0;
  compiler.close(closeError => { if (closeError) { console.error(closeError); process.exitCode = 1; } });
});
