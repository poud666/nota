/**
 * 免费伴奏曲库
 *
 * 音频来源：
 *  - Pixabay Music（CC0，完全免费，无需署名）https://pixabay.com/music/
 *  - Free Music Archive（CC-BY）https://freemusicarchive.org/
 *
 * 如需添加更多歌曲，只需补充 Song 对象并填入：
 *  1. audioUrl：Pixabay CDN 直链 或 FMA 直链
 *  2. lrc：LRC 格式歌词（[mm:ss.xx]歌词）
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  language: "zh" | "en" | "other";
  genre: string;
  duration: number; // 秒
  difficulty: "beginner" | "intermediate" | "advanced";
  license: string;
  audioUrl: string;
  lrc: string;
}

export const SONG_LIBRARY: Song[] = [
  // ── 中文经典 ────────────────────────────────────────────────────────
  {
    id: "jasmine",
    title: "茉莉花",
    artist: "中国传统民歌",
    language: "zh",
    genre: "民谣",
    duration: 120,
    difficulty: "beginner",
    license: "公共领域 (Public Domain)",
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
[01:02.50]茉莉花呀茉莉花
[01:11.00]好一朵茉莉花
[01:15.50]好一朵茉莉花
[01:20.00]满园花草香也香不过它
[01:24.50]我有心采一朵戴
[01:29.00]又怕旁人笑话
[01:33.50]茉莉花呀茉莉花`,
  },
  {
    id: "little-star-zh",
    title: "小星星",
    artist: "儿童经典",
    language: "zh",
    genre: "儿歌",
    duration: 90,
    difficulty: "beginner",
    license: "公共领域 (Public Domain)",
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

  // ── 英文经典 ────────────────────────────────────────────────────────
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    artist: "Traditional Hymn",
    language: "en",
    genre: "Gospel",
    duration: 150,
    difficulty: "beginner",
    license: "公共领域 (Public Domain)",
    audioUrl: "https://cdn.pixabay.com/audio/2022/10/16/audio_4e544b716a.mp3",
    lrc: `[00:00.00]Amazing Grace
[00:05.00]Amazing grace how sweet the sound
[00:12.00]That saved a wretch like me
[00:19.00]I once was lost but now am found
[00:26.00]Was blind but now I see
[00:36.00]'Twas grace that taught my heart to fear
[00:43.00]And grace my fears relieved
[00:50.00]How precious did that grace appear
[00:57.00]The hour I first believed
[01:07.00]Through many dangers toils and snares
[01:14.00]I have already come
[01:21.00]'Tis grace hath brought me safe thus far
[01:28.00]And grace will lead me home`,
  },
  {
    id: "scarborough-fair",
    title: "Scarborough Fair",
    artist: "English Folk Song",
    language: "en",
    genre: "Folk",
    duration: 180,
    difficulty: "intermediate",
    license: "公共领域 (Public Domain)",
    audioUrl: "https://cdn.pixabay.com/audio/2022/11/22/audio_6c3f8f4218.mp3",
    lrc: `[00:00.00]Scarborough Fair
[00:06.00]Are you going to Scarborough Fair
[00:13.00]Parsley sage rosemary and thyme
[00:20.00]Remember me to one who lives there
[00:27.00]She once was a true love of mine
[00:38.00]Tell her to make me a cambric shirt
[00:45.00]Parsley sage rosemary and thyme
[00:52.00]Without any seam nor needle work
[00:59.00]Then she'll be a true love of mine
[01:10.00]Tell her to find me an acre of land
[01:17.00]Parsley sage rosemary and thyme
[01:24.00]Between the salt water and the sea strand
[01:31.00]Then she'll be a true love of mine`,
  },
  {
    id: "danny-boy",
    title: "Danny Boy",
    artist: "Irish Folk Song",
    language: "en",
    genre: "Folk",
    duration: 210,
    difficulty: "advanced",
    license: "公共领域 (Public Domain)",
    audioUrl: "https://cdn.pixabay.com/audio/2021/08/04/audio_c6ccf1a14b.mp3",
    lrc: `[00:00.00]Danny Boy
[00:07.00]Oh Danny boy the pipes the pipes are calling
[00:15.00]From glen to glen and down the mountain side
[00:23.00]The summer's gone and all the flowers are dying
[00:31.00]'Tis you 'tis you must go and I must bide
[00:41.00]But come ye back when summer's in the meadow
[00:49.00]Or when the valley's hushed and white with snow
[00:57.00]'Tis I'll be there in sunshine or in shadow
[01:05.00]Oh Danny boy oh Danny boy I love you so`,
  },
];

export const DIFFICULTY_LABELS = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};
