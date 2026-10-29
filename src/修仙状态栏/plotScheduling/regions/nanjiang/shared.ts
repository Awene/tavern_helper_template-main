import type { PlotContext } from '../../types';
export const yes = (v: any) => v === true || v === 1 || ['true', '1', '是', '有', '在场', '开启', '启用'].includes(String(v).trim().toLowerCase());
export const realm = ({ data }: PlotContext) => String(data.修炼进度?.境界 || '').replace('练气', '炼气').replace('炼虚', '返虚');
export const rank = (ctx: PlotContext) => Math.max(0, ['凡人','炼气','筑基','金丹','元婴','化神','返虚','合体','大乘','渡劫'].findIndex(n => realm(ctx).includes(n)));
export const place = ({ data }: PlotContext) => String(data.地点?.具体地点 || '');
export const identity = ({ data }: PlotContext) => [].concat(data.身份 || []).join(' ');
export const inside = (ctx: PlotContext) => {
 const text = String(ctx.data.地点?.地域 || '') + place(ctx);
 return /五毒/.test(text) || /百草瘴|神木殿|万毒窟|炼蛊池|百毒瘴/.test(place(ctx)) || (/雨瘴林/.test(text) && /神木|万毒|炼蛊|百毒|百草|天蜈|灵蛇|魔蝎|圣蟾|鬼蛛|洞府|静室|膳堂|法坛|演武/.test(place(ctx)));
};
export const availableRegion = (ctx: PlotContext) => (!ctx.data.地点?.世界 || ctx.data.地点.世界 === '凡界') && (/南疆|五毒|雨瘴林/.test(String(ctx.data.地点?.地域 || '') + place(ctx)) || inside(ctx));
export const response = (action: string) => /回答|回应|点头|摇头|接过|递回|同意|拒绝|答应|询问|追问|压制|献祭|另寻/.test(action);
/** 仅识别正向镜头请求；明确离开、拒绝不算接续。 */
export const actionMatches = (source: string) => (action: string) => [...action.matchAll(new RegExp(source, 'g'))].some(m => !/(?:不去|不再|不找|不见|不回应|不理会|暂离|离开|搁置|放下|暂不|先不)[^，。；!?！？]{0,4}$/.test(action.slice(Math.max(0, m.index! - 8), m.index)));
export const always = () => true;

export const actionPattern = (source: string) => ({ matches: actionMatches(source), mentions: (action: string) => new RegExp(source).test(action) });
