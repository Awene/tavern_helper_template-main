import type {
  CustomStory,
  Selection,
  StoryConstraints,
  StoryOption,
  StorySettings,
} from '../types';
import { findLocation, findLocationPath, findRegionById } from './locations';
import { rootTierLabel } from './roots';

// ============ 故事数据 ============
export const stories: StoryOption[] = [
  // ==================== 通用宗门入山 ====================
  {
    id: 'story-zayou',
    name: '杂役入山',
    subtitle: '从最底层起步',
    desc: '一身布衣，怀揣家书入山，从扫地、挑水、看炉做起。',
    cost: 0,
    glyph: '凡',
    recommend: '寻常修行 / 砺心问道',
    类型: '宗门',
    constraints: { 灵根禁止: ['无'], physiqueTier: ['灵体', '道体', '仙体'] },
    settings: {
      时间: { 年: 7203, 月: 1, 日: 5, 时辰: '辰时' },
      宗门: '入山待考之外门',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
    body:
      '凛冬清晨，山门外排起了长队。\n' +
      '你裹着单薄的棉袍，跟着乡邻里几位同行的少年，恭敬地把一封家书递给值守的执事，听对方淡淡道：\n' +
      '"自此入山，再无外事。"\n' +
      '你点了点头，跨过那道高高的石阶——',
  },

  // ==================== 市井偶得 ====================
  {
    id: 'story-yinyu',
    name: '隐玉初识',
    subtitle: '于市井间结识高人',
    desc: '本欲只在市井度日，却于茶肆偶遇游方仙师，赠你一卷残页。',
    cost: 0,
    glyph: '机',
    recommend: '寻常修行',
    类型: '散修',
    constraints: { 灵根禁止: ['无'], physiqueTier: ['灵体', '道体', '仙体'] },
    settings: {
      时间: { 年: 7156, 月: 11, 日: 12, 时辰: '酉时' },
      宗门: '散修',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
    body:
      '你正坐在茶肆角落，看着雪粒打在窗棂上发呆。\n' +
      '邻桌一位灰衣老者忽然冲你笑了笑：\n' +
      '"小友与剑有缘。"\n' +
      '他随手在桌上推过一卷油黄的残页，又自顾自饮尽杯中酒，转眼便消失在风雪中——',
  },

  // ==================== 灭门遗孤 ====================
  {
    id: 'story-fuchou',
    name: '血门遗孤',
    subtitle: '负仇前行',
    desc: '门派在魔修夜袭中被屠尽，只你一人带着师门信物逃出生天。',
    cost: 0,
    glyph: '仇',
    recommend: '砺心问道 / 逆天改命',
    类型: '散修',
    constraints: { 灵根禁止: ['无'], physiqueTier: ['灵体', '道体', '仙体'] },
    settings: {
      时间: { 年: 7188, 月: 7, 日: 22, 时辰: '寅时' },
      宗门: '散修（前 · 雾隐山门）',
      初始境界: { 大境界: '炼气', 小境界: '后期' },
    },
    body:
      '山门毁于一夜之间。\n' +
      '你伏在血泥里装死，听着师姐的最后一声怒吼，听着那道沉重的拐杖从身边经过。\n' +
      '直到一切归于死寂。\n' +
      '你紧紧攥着那枚被血浸透的玉牌，在黎明前从断壁残垣中爬出来——',
    tags: ['仇怨'],
  },

  // ==================== 转世重修 ====================
  {
    id: 'story-dadao',
    name: '已悟大道',
    subtitle: '前世今生',
    desc: '你似乎记得前世种种。一切尚未开始，便仿佛已是结局。',
    cost: 0,
    glyph: '道',
    recommend: '小道悠游',
    类型: '特殊',
    settings: {
      时间: { 年: 7301, 月: 3, 日: 3, 时辰: '卯时' },
      宗门: '散修',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
    body:
      '你在朝霞中睁开眼。\n' +
      '窗外是再熟悉不过的灵溪，远处晨钟敲响——\n' +
      '这一切，你似乎在某个梦里见过千百次。\n' +
      '你抬手轻抚胸口的玉牌，那里仿佛还残留着上一世火焚之后的余温——',
    tags: ['传说'],
  },

  // ==================== 天玄剑宗 · 万剑坪赠石 ====================
  {
    id: 'story-tianxuan-zayou',
    name: '万剑坪 · 剑师赠石',
    subtitle: '风雪中的萍水之缘',
    desc: '天玄剑宗杂役弟子，于万剑坪扫雪时偶遇大师兄墨诗行下山历练；离去前他随手抛下一枚下品灵石。',
    cost: 0,
    glyph: '剑',
    recommend: '砺心问道',
    类型: '宗门',
    constraints: {
      locationIds: ['loc-tianxuan'],
      灵根禁止: ['无'],
      physiqueTier: ['灵体', '道体', '仙体'],
    },
    settings: {
      时间: { 年: 7204, 月: 12, 日: 18, 时辰: '辰时' },
      宗门: '天玄剑宗（外门杂役）',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
    body:
      '天玄剑宗宗门广场，万剑坪上积了一层新霜，几名杂役弟子正低头清扫，你就在其中。\n' +
      '宗主莫决云站在大殿前的石阶上，负手而立，灰白长衫随风飘荡；大师兄墨诗行斜倚在一处石碑，腰间挂着个酒葫芦，双目半阖。\n' +
      '"光天化日，醉酒喧哗，成何体统？"莫决云的声音不大，却清晰传遍了整个万剑坪，隐隐压过呼啸的风声。\n' +
      '墨诗行换了个更舒适的姿势倚靠在石碑上，随手拍掉落在肩头的雪花。\n' +
      '"师尊此言差矣。今朝有酒今朝醉，明日愁来明日愁。这雪景配佳酿，正如宝剑配英雄，岂不美哉？"\n' +
      '莫决云眉头微皱，袖袍一挥，一道无形剑气扫过，将墨诗行身旁的积雪激起三尺高，墨诗行却是丝毫不避。\n' +
      '"冥顽不灵。今日起，你便下山历练去吧，未得突破机缘，不得回宗。"\n' +
      '墨诗行眼睛一亮，立刻站直了身子，对着莫决云恭敬地行了一礼，"弟子谨遵师命，定不负师尊厚望。"\n' +
      '他说完，甚至没等莫决云再说什么，转身便向山门方向走去，路过你身边时，脚步稍稍顿了一下。\n' +
      '墨诗行腰间的葫芦随着步伐轻轻晃动，发出清脆的响声，飘来些许淡淡的酒香。\n' +
      '"宠辱两相忘，所欲随心安……这位小友，扫雪虽枯燥，却也是一种修行啊。"墨诗行笑了笑，从袖中摸出一枚下品灵石，轻轻一抛，恰好落在你手中。\n' +
      '"拿去打壶热酒暖暖，这冰天雪地的，莫要冻坏了道基，哈哈哈！"说罢，他掐起法诀，御剑飞去，很快就消失在漫天风雪之中。',
  },

  // ==================== 聆风斋 · 月夜合奏 ====================
  {
    id: 'story-lingfeng-yueye',
    name: '回音谷 · 月下合奏',
    subtitle: '初入聆风斋的雅会',
    desc: '入聆风斋不久，月夜独抚琴于回音谷，恰遇手持玉笛的夏未央，二人合奏一曲。',
    cost: 0,
    glyph: '琴',
    recommend: '小道悠游 / 寻常修行',
    类型: '宗门',
    constraints: {
      locationIds: ['loc-lingfeng'],
      灵根禁止: ['无'],
      physiqueTier: ['灵体', '道体', '仙体'],
    },
    settings: {
      时间: { 年: 7212, 月: 8, 日: 16, 时辰: '亥时' },
      宗门: '聆风斋',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
    body:
      '夜色稍沉，一弯新月挂在回音谷的夜空；水汽氤氲，濡湿了岸边的青苔。\n' +
      '你坐于河边石上，膝上横着古琴，指尖勾挑，并无定谱，只随风势起落。泠泠七弦，偶尔惊起栖息在芦苇荡中的几只水鸟，水鸟振翅掠过水面，摇散月光点点。\n' +
      '忽有笛声自林梢落下，那笛音清越，不争不抢，只轻轻填补琴音将歇的空隙，留住了那将要散去的余韵。\n' +
      '你按住琴弦，抬眼望去，林间小径转角处，一袭淡藕色纱裙随风微动。来人手持一支玉笛，笛身通体洁白，惟有末端坠着明黄流苏。\n' +
      '"扰了道友雅兴，方才听这琴音，似有江流宛转绕芳甸之意，却又多了几分随性。道友是新入斋的？"\n' +
      '你起身，向女子拱手一礼，"在下你，初入聆风斋，见此地月色正好，情难自禁，不想惊动了师姐。"\n' +
      '那女子行至水边，并未站在高处受礼，而是在一旁的青石上坐下，将玉笛横在膝头。\n' +
      '"万物有声，这水浪拍岸是声，虫鸣鸟叫是声，道友的琴音自然也是声，既然都在这天地间，那便算不得惊扰。"\n' +
      '"我方才在林中，听道友琴中似有未尽之意，恰好我有支曲子也缺了些许意境，不知道友可愿合奏一曲？"\n' +
      '你重新落座，双手抚上琴弦，无需言语确认调式，指尖落下，便是回应。\n' +
      '琴音起时如山涧滴泉，清冽透亮；笛声随之而入，绵长悠远，似风过松林。\n' +
      '曲终，余音散入风中，水面复归平静。\n' +
      '"今夜的风，倒是比往日柔和了些。"夏未央轻抚笛身，站起身来，理了理被风吹乱的鬓发。\n' +
      '"若是道友喜欢此地，往后也可常来。聆风斋夏未央，记下了道友今夜的琴。"',
  },

  // ==================== 琉璃丹宗 · 百草新邻 ====================
  {
    id: 'story-liuli-baicao',
    name: '百草峰 · 药园新邻',
    subtitle: '与赵芳萤同顷锄药',
    desc: '琉璃丹宗外门弟子，于百草峰偏角药园锄药；隔壁新搬来一位怯生生的小师妹赵芳萤。',
    cost: 0,
    glyph: '丹',
    recommend: '寻常修行',
    类型: '宗门',
    constraints: {
      locationIds: ['loc-liulidanzong'],
      灵根禁止: ['无'],
      physiqueTier: ['灵体', '道体', '仙体'],
    },
    settings: {
      时间: { 年: 7197, 月: 4, 日: 9, 时辰: '辰时' },
      宗门: '琉璃丹宗（外门杂役）',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
    body:
      '流芳山脉绵延几百里，晨辉破云，金光洒落百草峰，峰顶云蒸霞蔚，隐约可见有内门弟子御物在天，或坐于葫芦、或立于飞剑，但那都是与杂役无缘的风景。\n' +
      '琉璃丹宗，百草峰，集中种植低阶灵草灵药的区域，其中一片小药园。\n' +
      '你提起锄头歇息片刻，直起腰，炼气初期的灵气在经脉里转了小半周天，消解了些许疲乏。这块药田便是其在琉璃丹宗的一亩三分地，种的皆是炼气期丹药的基础辅材。\n' +
      '隔壁那荒废了大半个月的小药园，今日有了动静。\n' +
      '竹篱那边，一名看上去豆蔻年华的少女，身上的杂役布袍宽大了些许，袖口挽了几道，露出细瘦的手腕。她半蹲在土地上，对着刚栽下去有些蔫头耷脑的草药比划。\n' +
      '"绿高高，这里的土很软和，你要争气，把根扎深点。"\n' +
      '声音顺着晨风飘过竹篱，落入你耳中。那少女并未察觉旁人目光，只是从沟渠舀起少许泉水，淋给草药。\n' +
      '"喝了水就不许枯了，等你长出新叶子，我就喊你绿壮壮。"\n' +
      '你手中锄头轻顿，碰上一块硬土，发出了响声，少女转头，眸子里映出你提着锄头的身影。\n' +
      '她连忙站起身来，双手在身前交叠，朝着你深深行了一礼，因为动作太急，头顶那条用来束发的粗布条歪了一些，几缕碎发散在额前。\n' +
      '"前、前辈好。"她头垂得很低，露出白净纤细的后颈，声音有些发怯，"我是新来这块药田的赵芳萤，若是吵到前辈修行，还请前辈恕罪。"',
  },

  // ==================== 南疆 · 误入狐谷 ====================
  {
    id: 'story-nanjiang-fox',
    name: '十万大山 · 邂逅狐妖',
    subtitle: '采药途中偶入仙芝幽谷',
    desc: '为寻"灵山仙芝"在十万大山边缘盘桓数日，误入幽谷，遇见正对木桩独自练习答词的青丘狐族少女苏凝香。',
    cost: 0,
    glyph: '狐',
    recommend: '寻常修行 / 砺心问道',
    类型: '散修',
    constraints: {
      regionIds: ['reg-nanjiang'],
      灵根禁止: ['无'],
      physiqueTier: ['灵体', '道体', '仙体'],
    },
    settings: {
      时间: { 年: 7220, 月: 6, 日: 1, 时辰: '辰时' },
      宗门: '散修',
      初始境界: { 大境界: '炼气', 小境界: '中期' },
    },
    body:
      '晨曦微露，南疆特有的湿热水汽尚未完全散去，在林间凝成轻纱般的薄雾。\n' +
      '你身负竹篓，脚穿皮靴，踏入幽深的小径，这里人迹罕至，寻常采药人不敢涉足，但你为了寻找那传闻中的"灵山仙芝"，已在十万大山边缘盘桓了数日。\n' +
      '你拨开眼前遮蔽视线的阔叶，视野豁然开朗，前方是一处静谧的幽谷，谷中溪水潺潺，两岸开满了不知名的野花，随风摇曳，落英缤纷。花丛中央，坐着一位身着浅粉襦裙的少女，她背对着你，正对着一根木桩念念有词。\n' +
      '"公子大恩，小女子无以为报，惟有……"少女声音稍顿，歪了歪头，似在回忆什么，随后换了一种语调，略带娇羞，"惟有以身相许，愿随君走遍天涯海角。"\n' +
      '你不慎踩断了一截枯枝，咔嚓轻响，在这静谧幽谷中显得尤为突兀。\n' +
      '少女身形微颤，蓦然回首，面容娇憨，双颊晕红，溪水般清澈的眼眸中带着些许惊慌。\n' +
      '"你是谁？你是......来这里赏风景的吗？"\n' +
      '你拱手一礼，"在下你，乃山中采药之人，误闯姑娘……清修之地，多有得罪，还望见谅。"\n' +
      '少女闻言，眼中警惕稍退，取而代之的是好奇，似在确认对方的善意。\n' +
      '"采药人……"她低声重复，随即起身，笨拙地回了一礼，"小女子苏凝香，这厢有礼了。"',
  },

  // ==================== 临渊城 · 仗义银绫 ====================
  {
    id: 'story-linyuan-mojian',
    name: '临渊石街 · 银绫救卖花',
    subtitle: '繁市中目睹魔渊阁高手援手',
    desc: '于天江入海口的临渊石街，见锦衣修士欺凌卖花少女；月白身影自飞檐落下，银绫缠人，铃音夺心。',
    cost: 0,
    glyph: '渊',
    recommend: '寻常修行',
    类型: '散修',
    constraints: {
      locationIds: ['loc-linyuan'],
      灵根禁止: ['无'],
      physiqueTier: ['灵体', '道体', '仙体'],
    },
    settings: {
      时间: { 年: 7232, 月: 9, 日: 14, 时辰: '巳时' },
      宗门: '散修',
      初始境界: { 大境界: '炼气', 小境界: '后期' },
    },
    body:
      '天江入海，波涛拍岸。\n' +
      '临渊城，东土繁华之最。石街两侧，楼阁高耸，飞檐斗拱间挂着各式幡旗，街上车水马龙，半空中偶尔可见修士御器的掠过流光。\n' +
      '你夹杂在熙攘的人群中，身侧是叫卖灵米糕的小贩，前方不远处的金来钱庄分号前挤满了兑换灵石的客商。\n' +
      '一阵喧哗声盖过了周遭的叫卖，只见人群分开，腾出一片空地，一名身着锦衣的青年修士正对着地上一个摔倒的卖花少女指指点点。少女面前，竹篮翻倒，几枝沾着露水的灵兰花散落在青石地面。\n' +
      '"你是瞎了眼，还是故意冲撞？"锦衣修士抬起脚，用靴底碾了碾地上的残花，"把你这条贱命卖上十次，也赔不起爷身上的半只袖子！"\n' +
      '少女伏在地上，额头贴着冰凉的石板，一言不发。围观者众，却无人上前。那锦衣修士腰间挂着闪烁灵光的玉牌——凡人在修士面前便如同蝼蚁一般，除了敬畏，便只有沉默。\n' +
      '就在此时，一道银绫自高处垂落，恍若九天银河倒卷，不急不徐地缠上锦衣修士的脚踝，他还来不及反应，整个人已被那银绫抡起，倒飞出优美的曲线，重重摔落在数丈开外的空地上，顿时青石板碎裂，烟尘四起。\n' +
      '"哎呀，手滑了。"那声音娇慵软糯，又透着几分漫不经心。\n' +
      '只见一道月白身影立于飞檐之上，女子身姿窈窕，单手把玩着垂在身侧的银色丝带，淡紫色玉簪挽着如瀑青丝，几缕碎发拂过白皙脸颊。日光映照下，周身似有灵光流转，圣洁不可方物。\n' +
      '锦衣修士狼狈爬起，发髻散乱，满脸灰土，色厉内荏："你是何人？竟敢多管闲事！我乃……"\n' +
      '"本姑娘最烦听你们这套开场白。"楚晚烟秀眉微蹙，指尖轻弹，腰间小巧铃铛发出清脆响声。\n' +
      '铃音未落，那修士双目即刻失焦，竟自顾自地对着空气跪地求饶起来。',
  },

  // ==================== 合欢宗 · 鸳鸯池入门 ====================
  {
    id: 'story-hehuan-yuanyang',
    name: '鸳鸯池 · 合欢宗入门',
    subtitle: '欢媚殿后初见双修场',
    desc: '被人劝入合欢宗，腰牌未热，便被引至鸳鸯池畔——温泉氤氲，琼浆四溢，初识"合欢双修"之名。',
    cost: 0,
    glyph: '合',
    recommend: '小道悠游 / 寻常修行',
    类型: '宗门',
    constraints: {
      locationIds: ['loc-hehuan'],
      灵根禁止: ['无'],
      physiqueTier: ['灵体', '道体', '仙体'],
    },
    settings: {
      时间: { 年: 7245, 月: 3, 日: 28, 时辰: '戌时' },
      宗门: '合欢宗',
      初始境界: { 大境界: '炼气', 小境界: '中期' },
    },
    body:
      '天色已暗，华灯初上。数百盏绯色宫灯高悬，将腾起的袅袅热气染成暧昧的粉红。空气中弥漫着甜腻异香，如兰似麝，只稍稍吸入肺腑，便觉腹热气躁。\n' +
      '你手里捏着刚领到的腰牌，还未从被人劝进此地的经历中回过神来。身后是通往欢媚殿的回廊，眼前是一幅活色生香的画卷。\n' +
      '此处，合欢宗大浴场，唤作鸳鸯池——起名倒是直白，放眼望去，哪里是什么修仙福地，分明是毫无遮掩的欢场。温热泉水中，无数晶莹剔透的肉体各自纠缠——这里不仅是沐浴之地，更是合欢宗弟子的修炼场。\n' +
      '你视线稍偏，便又见池水中的某处玉台，数名女修围坐一圈，中间躺着一位面色潮红的俊秀青年。\n' +
      '"这就是新入门的小师弟？元阳倒是充沛得紧……让师姐们好好尝尝。"\n' +
      '"这就是……修仙？"你喃喃自语，声音很快就被周遭此起彼伏的浪叫声淹没。\n' +
      '乳白色的温泉，泛着暖意的迷蒙水雾，不远处的水床上，许多不着寸缕的少男少女正在嬉戏。',
    tags: ['合欢'],
  },

  // ==================== 凡体专用 · 后天植根 ====================
  {
    id: 'story-fan-zhigen',
    name: '巷尾灯火 · 后天植根',
    subtitle: '凡夫之身偶遇仙缘',
    desc:
      '凡人之身，偶遇一位流落街巷的老叟。彼此有缘之下，老叟以一门近乎失传的秘法为你接续灵根，自此踏上修真路。',
    cost: 0,
    glyph: '续',
    recommend: '寻常修行 / 砺心问道',
    类型: '特殊',
    constraints: { physiqueTier: ['凡体'] },
    settings: {
      时间: { 年: 7268, 月: 10, 日: 7, 时辰: '亥时' },
      宗门: '散修',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
    body:
      '夜雨敲檐，巷尾的旧屋灯火微弱。\n' +
      '你替母亲煎完了药，正欲熄灯，门口忽地传来轻而沙哑的咳声——一名衣衫褴褛的老叟扶着门框，似乎已撑不住身子。\n' +
      '"小友……一碗清水……一处避风之所，可乎？"\n' +
      '你让出门来，老叟入屋，跌坐在炕沿，借着灯光，他抬起一双竟未浑浊的眸子，仔细打量了你半晌。\n' +
      '"你命中无根，本不可修。然——老朽身怀一门接续灵根的秘法，已无来日施展。今夜你引我入屋，便是因缘。"\n' +
      '他从怀中摸出一截枯瘦如柴的指头，指尖结着一缕灰白的灵气，伸至你眉心。\n' +
      '"忍住灼意，七寸气海若开，从此凡尘不复你归处。"\n' +
      '一道温热自眉心直贯丹田。窗外的雨声渐远，屋内的烛火忽然明亮起来——\n' +
      '凡夫之躯，自此续上仙缘。',
    tags: ['特殊'],
  },

  // ==================== 凡体专用 · 纯凡之路 ====================
  {
    id: 'story-fan-renjian',
    name: '粟米人间 · 纯凡之路',
    subtitle: '不入修真路',
    desc:
      '不入修真之列，安守凡人本分；于市井间度日，于沙场上历劫。凡躯亦能见识修真世道。',
    cost: 0,
    glyph: '俗',
    recommend: '砺心问道 / 逆天改命',
    类型: '特殊',
    constraints: { physiqueTier: ['凡体'] },
    settings: {
      时间: { 年: 7222, 月: 5, 日: 18, 时辰: '巳时' },
      宗门: '散修',
      初始境界: { 大境界: '凡人', 小境界: '初期' },
    },
    body:
      '熹微之光透过窗纸落在你的桌案上，照亮一份未抄完的契书。\n' +
      '隔壁的粥摊已摆出了第一锅热粥，蒸气混着柴香缓缓浮起。\n' +
      '你是凡夫，不通修真，不识灵气；这世间的修士御剑入云，于你而言不过是天上传闻。\n' +
      '但市井烟火，自有你的去处——账册要算，柴米要买，旁边卖花的少女今晨还托你带一壶酒。\n' +
      '你整了整布袍，揣好沉甸甸的几枚铜钱，跨过门槛，迎着晨光踏入这熙攘的街市。\n' +
      '凡人有凡人的活法。修真世界的风浪与你似远还近，但只要心里有秤，凡途亦能不亏己心。',
    tags: ['特殊', '纯凡'],
  },
];

// ============ 故事查询 ============
export const findStory = (id: string | null): StoryOption | undefined =>
  id ? stories.find(s => s.id === id) : undefined;

// ============ 故事约束校验 / 描述 ============
export function isStoryAvailable(story: StoryOption, sel: Selection): boolean {
  const c = story.constraints;
  if (!c) return true;

  // 出生地约束
  if (c.locationIds?.length) {
    if (!sel.locationId || !c.locationIds.includes(sel.locationId)) return false;
  }
  if (c.regionIds?.length) {
    if (!sel.locationId) return false;
    const path = findLocationPath(sel.locationId);
    if (!path.region || !c.regionIds.includes(path.region.id)) return false;
  }

  // 性别
  if (c.性别 && sel.性别 !== c.性别) return false;

  // 元阳/元阴
  if (c.元阳元阴必须 && !sel.元阳元阴) return false;

  // 灵根五行
  if (c.灵根五行任意?.length) {
    if (!sel.root.elements.some(e => c.灵根五行任意!.includes(e))) return false;
  }
  if (c.灵根禁止?.length) {
    if (sel.root.elements.some(e => c.灵根禁止!.includes(e))) return false;
  }

  // 灵根品阶
  if (c.灵根品阶?.length) {
    const tier = rootTierLabel(sel.root);
    if (!c.灵根品阶.some(t => tier.includes(t))) return false;
  }

  // 体质等级
  if (c.physiqueTier?.length) {
    if (!c.physiqueTier.includes(sel.physique.tier)) return false;
  }

  return true;
}

/** 列出当前选择下，故事约束未满足的具体原因；满足时返回空数组 */
export function whyStoryUnavailable(story: StoryOption, sel: Selection): string[] {
  const c = story.constraints;
  if (!c) return [];
  const reasons: string[] = [];

  if (c.locationIds?.length) {
    if (!sel.locationId || !c.locationIds.includes(sel.locationId)) {
      const names = c.locationIds.map(id => findLocation(id)?.name).filter(Boolean) as string[];
      reasons.push(`起始地点须为：${names.join(' / ')}`);
    }
  }
  if (c.regionIds?.length) {
    let ok = false;
    if (sel.locationId) {
      const path = findLocationPath(sel.locationId);
      if (path.region && c.regionIds.includes(path.region.id)) ok = true;
    }
    if (!ok) {
      const names = c.regionIds.map(id => findRegionById(id)?.name).filter(Boolean) as string[];
      reasons.push(`地域须为：${names.join(' / ')}`);
    }
  }
  if (c.性别 && sel.性别 !== c.性别) {
    reasons.push(`性别须为：${c.性别}`);
  }
  if (c.元阳元阴必须 && !sel.元阳元阴) {
    reasons.push(`须保持：${sel.性别 === '男' ? '元阳' : '元阴'}尚存`);
  }
  if (c.灵根五行任意?.length) {
    if (!sel.root.elements.some(e => c.灵根五行任意!.includes(e))) {
      reasons.push(`灵根至少含：${c.灵根五行任意.join(' / ')}`);
    }
  }
  if (c.灵根禁止?.length) {
    const bad = sel.root.elements.filter(e => c.灵根禁止!.includes(e));
    if (bad.length) {
      reasons.push(`灵根不可含：${c.灵根禁止.join(' / ')}（当前含 ${bad.join('、')}）`);
    }
  }
  if (c.灵根品阶?.length) {
    const tier = rootTierLabel(sel.root);
    if (!c.灵根品阶.some(t => tier.includes(t))) {
      reasons.push(`灵根品阶须为：${c.灵根品阶.join(' / ')}（当前 ${tier}）`);
    }
  }
  if (c.physiqueTier?.length) {
    if (!c.physiqueTier.includes(sel.physique.tier)) {
      reasons.push(`体质须为：${c.physiqueTier.join(' / ')}（当前 ${sel.physique.tier}）`);
    }
  }
  return reasons;
}

export function describeConstraints(c?: StoryConstraints): string[] {
  if (!c) return [];
  const lines: string[] = [];
  if (c.locationIds?.length) {
    const names = c.locationIds.map(id => findLocation(id)?.name).filter(Boolean) as string[];
    if (names.length) lines.push(`出生地：${names.join(' / ')}`);
  }
  if (c.regionIds?.length) {
    const names = c.regionIds.map(id => findRegionById(id)?.name).filter(Boolean) as string[];
    if (names.length) lines.push(`地域：${names.join(' / ')}`);
  }
  if (c.性别) lines.push(`性别：${c.性别}`);
  if (c.元阳元阴必须) lines.push('元阳/元阴：尚存');
  if (c.灵根五行任意?.length) lines.push(`灵根含：${c.灵根五行任意.join(' / ')}`);
  if (c.灵根品阶?.length) lines.push(`品阶：${c.灵根品阶.join(' / ')}`);
  if (c.灵根禁止?.length) lines.push(`不可：${c.灵根禁止.join(' / ')}`);
  return lines;
}

export function describeSettings(s: StorySettings): string[] {
  const t = s.时间;
  return [
    `时间：${t.年}年 ${t.月}月 ${t.日}日${t.时辰 ? ' · ' + t.时辰 : ''}`,
    `宗门：${s.宗门}`,
    `初始境界：${s.初始境界.大境界}${s.初始境界.小境界}`,
  ];
}

// ============ 自创剧本 ============
export function emptyCustomStory(): CustomStory {
  return {
    id: '',
    name: '',
    desc: '',
    body: '',
    类型: '散修',
    settings: {
      时间: { 年: 7200, 月: 1, 日: 1, 时辰: '辰时' },
      宗门: '散修',
      初始境界: { 大境界: '炼气', 小境界: '初期' },
    },
  };
}

/** 自创剧本 → StoryOption（便于复用展示逻辑） */
export function customStoryToOption(c: CustomStory): StoryOption {
  return {
    id: c.id,
    name: c.name,
    desc: c.desc,
    body: c.body,
    cost: 0,
    glyph: '自',
    类型: c.类型,
    settings: c.settings,
    tags: ['自创'],
  };
}

/** 验证自创剧本最小可用条件 */
export function isCustomStoryValid(c: CustomStory): boolean {
  if (!c.name.trim()) return false;
  if (!c.body.trim()) return false;
  if (c.settings.时间.年 < 7000) return false;
  if (!c.settings.宗门.trim()) return false;
  if (!c.settings.初始境界.大境界.trim()) return false;
  return true;
}

export const SMALL_REALMS: Array<'初期' | '中期' | '后期'> = ['初期', '中期', '后期'];
/** 故事的 大境界 候选；纯凡模式可填「凡人」 */
export const BIG_REALMS = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神'];
