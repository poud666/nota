/**
 * 免费伴奏曲库
 *
 * 音频来源：
 *  - Pixabay Music（CC0）https://pixabay.com/music/search/chinese%20instrumental/
 *  - Free Music Archive（CC-BY）https://freemusicarchive.org/
 *  - 公共领域（Public Domain）
 *
 * needsUpload: true → 受版权保护，需要用户自行上传伴奏文件
 * 歌词已内置，用户只需上传对应伴奏即可直接开始练习
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  language: "zh" | "en" | "other";
  genre: string;
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  license: string;
  audioUrl?: string;       // 有则自动加载
  needsUpload?: true;      // 需要用户上传伴奏
  pixabaySearch?: string;  // Pixabay 搜索链接
  lrc: string;
}

export const SONG_LIBRARY: Song[] = [

  // ═══════════════════════════════════════════════════════════════
  // 初 级（可直接加载）
  // ═══════════════════════════════════════════════════════════════
  {
    id: "jasmine",
    title: "茉莉花",
    artist: "中国传统民歌",
    language: "zh",
    genre: "民谣",
    duration: 120,
    difficulty: "beginner",
    license: "公共领域",
    audioUrl: "https://cdn.pixabay.com/audio/2022/01/13/audio_d0c6ff1bca.mp3",
    lrc: `[00:00.00]茉莉花
[00:04.50]好一朵美丽的茉莉花
[00:09.00]好一朵美丽的茉莉花
[00:13.50]芬芳美丽满枝桠
[00:18.00]又香又白人人夸
[00:22.50]让我来将你摘下
[00:27.00]送给别人家
[00:31.50]茉莉花呀茉莉花
[00:40.00]好一朵茉莉花
[00:44.50]好一朵茉莉花
[00:49.00]茉莉花开雪也白不过它
[00:53.50]我有心采一朵戴
[00:58.00]又怕来年不开花
[01:02.50]茉莉花呀茉莉花`,
  },

  {
    id: "little-star-zh",
    title: "小星星",
    artist: "儿童经典",
    language: "zh",
    genre: "儿歌",
    duration: 90,
    difficulty: "beginner",
    license: "公共领域",
    audioUrl: "https://cdn.pixabay.com/audio/2022/03/10/audio_d04c2e4da7.mp3",
    lrc: `[00:00.00]小星星
[00:03.00]一闪一闪亮晶晶
[00:07.50]满天都是小星星
[00:12.00]挂在天上放光明
[00:16.50]好像许多小眼睛
[00:21.00]一闪一闪亮晶晶
[00:25.50]满天都是小星星
[00:34.00]一闪一闪亮晶晶
[00:38.50]满天都是小星星
[00:43.00]挂在天上放光明
[00:47.50]好像许多小眼睛
[00:52.00]一闪一闪亮晶晶
[00:56.50]满天都是小星星`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 中 级（用户上传伴奏）
  // ═══════════════════════════════════════════════════════════════
  {
    id: "gaoshanqing",
    title: "高山青",
    artist: "台湾民谣",
    language: "zh",
    genre: "民谣",
    duration: 180,
    difficulty: "intermediate",
    license: "公共领域",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/chinese%20folk/",
    lrc: `[00:00.00]高山青
[00:05.00]高山青 涧水蓝
[00:12.00]阿里山的姑娘美如水
[00:19.00]阿里山的少年壮如山
[00:26.00]啊 啊 啊
[00:31.00]高山常青 涧水常蓝
[00:38.00]姑娘和那少年永不分呀
[00:45.00]碧水长围着青山转
[00:52.00]高山青 涧水蓝
[00:59.00]阿里山的姑娘美如水
[01:06.00]阿里山的少年壮如山
[01:13.00]啊 啊 啊
[01:18.00]高山常青 涧水常蓝
[01:25.00]姑娘和那少年永不分呀
[01:32.00]碧水长围着青山转`,
  },

  {
    id: "moon-mandarin",
    title: "月亮代表我的心",
    artist: "邓丽君",
    language: "zh",
    genre: "流行",
    duration: 210,
    difficulty: "intermediate",
    license: "需自备伴奏",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/chinese%20ballad/",
    lrc: `[00:00.00]月亮代表我的心
[00:08.00]你问我爱你有多深
[00:14.00]我爱你有几分
[00:20.00]我的情也真 我的爱也真
[00:28.00]月亮代表我的心
[00:36.00]你问我爱你有多深
[00:42.00]我爱你有几分
[00:48.00]我的情不移 我的爱不变
[00:56.00]月亮代表我的心
[01:04.00]轻轻的一个吻
[01:10.00]已经打动我的心
[01:16.00]深深的一段情
[01:22.00]叫我思念到如今
[01:30.00]你问我爱你有多深
[01:36.00]我爱你有几分
[01:42.00]你去想一想 你去看一看
[01:50.00]月亮代表我的心
[01:58.00]轻轻的一个吻
[02:04.00]已经打动我的心
[02:10.00]深深的一段情
[02:16.00]叫我思念到如今
[02:24.00]你问我爱你有多深
[02:30.00]我爱你有几分
[02:36.00]你去想一想 你去看一看
[02:44.00]月亮代表我的心`,
  },

  {
    id: "tonghua",
    title: "童话",
    artist: "光良",
    language: "zh",
    genre: "流行",
    duration: 270,
    difficulty: "intermediate",
    license: "需自备伴奏",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/chinese%20pop%20ballad/",
    lrc: `[00:00.00]童话
[00:18.00]忘了有多久
[00:22.00]再没听到你
[00:26.00]对我说你最爱的故事
[00:33.00]我想了很久
[00:37.00]我开始慌了
[00:41.00]是不是我又做错了什么
[00:48.00]你哭着对我说
[00:52.00]童话里都是骗人的
[00:57.00]我不可能是你的王子
[01:03.00]也许你不会懂
[01:07.00]从你说爱我以后
[01:12.00]我的天空星星都亮了
[01:20.00]我愿变成童话里
[01:25.00]你爱的那个天使
[01:30.00]张开双手变成翅膀守护你
[01:37.00]你要相信相信我们会像童话故事里
[01:44.00]幸福和快乐是结局
[01:51.00]你要相信相信我们会像童话故事里
[01:58.00]幸福和快乐是结局`,
  },

  {
    id: "penghu-wan",
    title: "外婆的澎湖湾",
    artist: "潘安邦",
    language: "zh",
    genre: "民谣/流行",
    duration: 210,
    difficulty: "intermediate",
    license: "需自备伴奏",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/chinese%20folk/",
    lrc: `[00:00.00]外婆的澎湖湾
[00:10.00]晚风摇树树还挺
[00:15.50]澎湖湾的仙人掌有我一段情
[00:22.00]低头想一想
[00:25.50]眼眶红红
[00:29.00]阳光 沙滩 海浪 仙人掌
[00:35.00]还有一位老船长
[00:42.00]每当我回忆起童年时候
[00:49.00]外婆的笑脸总浮现心头
[00:56.00]坐在那门前的椰子树下乘凉
[01:03.00]听她讲那过去的那事情
[01:10.00]阳光 沙滩 海浪 仙人掌
[01:17.00]还有一位老船长
[01:24.00]再没有那澎湖湾
[01:30.00]只有在梦里边
[01:36.00]外婆她已来不及分享`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 高 级（需控制气息和音域，用户上传伴奏）
  // ═══════════════════════════════════════════════════════════════
  {
    id: "houlai",
    title: "后来",
    artist: "刘若英",
    language: "zh",
    genre: "流行",
    duration: 270,
    difficulty: "advanced",
    license: "需自备伴奏",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/emotional%20piano/",
    lrc: `[00:00.00]后来
[00:18.00]后来 我总算学会了
[00:24.00]如何去爱 可惜你早已远去
[00:31.00]消失在人海
[00:37.00]后来 终于在眼泪中明白
[00:44.00]有些人 一旦错过就不再
[00:53.00]栀子花 白花瓣
[00:59.00]落在我蓝色百褶裙上
[01:06.00]爱你 你轻声说
[01:13.00]我低下头 闻见一阵芬芳
[01:21.00]那个永恒的夜晚
[01:27.00]十七岁仲夏你吻我的那个夜晚
[01:35.00]让我往后的时光 每逢黑夜来临
[01:43.00]长夜漫漫 都想起那段时光
[01:52.00]后来 我总算学会了
[01:58.00]如何去爱 可惜你早已远去
[02:05.00]消失在人海
[02:11.00]后来 终于在眼泪中明白
[02:18.00]有些人 一旦错过就不再
[02:27.00]后来 我总算学会了如何去爱
[02:38.00]后来 终于在眼泪中明白
[02:44.00]有些人一旦错过就不再`,
  },

  {
    id: "ni-shi-wo-de-yan",
    title: "你是我的眼",
    artist: "萧煌奇",
    language: "zh",
    genre: "流行",
    duration: 300,
    difficulty: "advanced",
    license: "需自备伴奏",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/emotional%20chinese/",
    lrc: `[00:00.00]你是我的眼
[00:22.00]如果我能看得见
[00:29.00]就能轻易地分辨白天黑夜
[00:37.00]如果我能看得见
[00:44.00]就能轻易地分辨方向和远近
[00:52.00]如果我能看得见
[00:59.00]就能看见你的脸
[01:06.00]把你的样貌描绘
[01:13.00]再也不用凭想像
[01:21.00]你是我的眼
[01:28.00]带我领略四季的变换
[01:35.00]你是我的眼
[01:42.00]带我穿越拥挤的人潮
[01:50.00]你是我双手触碰的渴望
[01:58.00]因为你是我的眼
[02:06.00]让我看见这世界就在我眼前
[02:14.00]如果我能看得见
[02:21.00]就能轻易地分辨白天黑夜
[02:29.00]如果我能看得见
[02:36.00]就能看见你的脸
[02:42.00]把你的样貌描绘
[02:49.00]再也不用凭想像
[02:57.00]你是我的眼
[03:04.00]带我领略四季的变换
[03:11.00]你是我的眼
[03:18.00]带我穿越拥挤的人潮
[03:26.00]你是我双手触碰的渴望
[03:34.00]因为你是我的眼`,
  },

  {
    id: "ye-qu",
    title: "夜曲",
    artist: "周杰伦",
    language: "zh",
    genre: "流行/R&B",
    duration: 240,
    difficulty: "advanced",
    license: "需自备伴奏",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/chinese%20rnb/",
    lrc: `[00:00.00]夜曲
[00:19.00]为你弹奏肖邦的夜曲
[00:25.00]纪念我死去的爱情
[00:31.00]我每天每天每天在想你
[00:36.00]直到离开这世界
[00:42.00]你冷冷的眼神
[00:46.00]让我的眼睛湿润了
[00:52.00]你的笑容让我伤心
[00:59.00]我不会哭泣
[01:04.00]只是夜深了连心都空了
[01:12.00]你说你爱我的那一天
[01:19.00]玫瑰盛开在颤抖的手中
[01:26.00]却换我用眼泪送别
[01:33.00]我已不再是从前的我
[01:41.00]心脏被誓言戳了个洞
[01:48.00]然后你说你离开了
[01:55.00]为你弹奏肖邦的夜曲
[02:01.00]纪念我死去的爱情
[02:07.00]我每天每天每天在想你
[02:13.00]直到离开这世界
[02:19.00]你冷冷的眼神
[02:23.00]让我的眼睛湿润了
[02:29.00]你的笑容让我伤心
[02:36.00]难以忘记`,
  },

  {
    id: "pingfan-zhilu",
    title: "平凡之路",
    artist: "朴树",
    language: "zh",
    genre: "摇滚/流行",
    duration: 310,
    difficulty: "advanced",
    license: "需自备伴奏",
    needsUpload: true,
    pixabaySearch: "https://pixabay.com/music/search/chinese%20rock/",
    lrc: `[00:00.00]平凡之路
[00:18.00]徘徊着的 在路上的
[00:24.00]你要走吗 via via
[00:30.00]易碎的 骄傲着
[00:36.00]那也曾是我的模样
[00:43.00]沸腾着的 不安着的
[00:49.00]你要去哪 via via
[00:55.00]谜一样的 沉默着的
[01:01.00]故事你真的在听吗
[01:10.00]我曾经跨过山和大海
[01:17.00]也穿过人山人海
[01:23.00]我曾经拥有着一切
[01:30.00]转眼都飘散如烟
[01:36.00]我曾经失落失望失掉所有方向
[01:44.00]直到看见平凡才是唯一的答案
[01:53.00]当你仍然还在幻想
[02:00.00]你的明天 via via
[02:06.00]她会好吗 还是更烂
[02:12.00]对我而言是另一天
[02:19.00]我曾经跨过山和大海
[02:26.00]也穿过人山人海
[02:32.00]我曾经问遍整个世界
[02:39.00]从来没得到答案
[02:45.00]我不过像你像他像那野草野花
[02:53.00]冥冥中这是我唯一要走的路啊
[03:01.00]时间无言 如此这般
[03:08.00]明天已在 via via`,
  },

  // ═══════════════════════════════════════════════════════════════
  // 英文（可直接加载）
  // ═══════════════════════════════════════════════════════════════
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    artist: "Traditional Hymn",
    language: "en",
    genre: "Gospel",
    duration: 150,
    difficulty: "beginner",
    license: "公共领域",
    audioUrl: "https://cdn.pixabay.com/audio/2022/10/16/audio_4e544b716a.mp3",
    lrc: `[00:00.00]Amazing Grace
[00:05.00]Amazing grace how sweet the sound
[00:12.00]That saved a wretch like me
[00:19.00]I once was lost but now am found
[00:26.00]Was blind but now I see
[00:36.00]'Twas grace that taught my heart to fear
[00:43.00]And grace my fears relieved
[00:50.00]How precious did that grace appear
[00:57.00]The hour I first believed`,
  },

  {
    id: "scarborough-fair",
    title: "Scarborough Fair",
    artist: "English Folk Song",
    language: "en",
    genre: "Folk",
    duration: 180,
    difficulty: "intermediate",
    license: "公共领域",
    audioUrl: "https://cdn.pixabay.com/audio/2022/11/22/audio_6c3f8f4218.mp3",
    lrc: `[00:00.00]Scarborough Fair
[00:06.00]Are you going to Scarborough Fair
[00:13.00]Parsley sage rosemary and thyme
[00:20.00]Remember me to one who lives there
[00:27.00]She once was a true love of mine
[00:38.00]Tell her to make me a cambric shirt
[00:45.00]Parsley sage rosemary and thyme
[00:52.00]Without any seam nor needle work
[00:59.00]Then she'll be a true love of mine`,
  },
];

export const DIFFICULTY_LABELS = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

export const DIFFICULTY_COLORS = {
  beginner:     { text: "text-emerald-400", bg: "bg-emerald-400/10" },
  intermediate: { text: "text-purple-400",  bg: "bg-purple-400/10"  },
  advanced:     { text: "text-amber-400",   bg: "bg-amber-400/10"   },
};
