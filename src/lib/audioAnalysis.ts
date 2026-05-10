/**
 * 专业声乐分析引擎
 *
 * 实现以下学术/工程标准指标：
 *  - Jitter (local)          — 基频周期抖动，参考 Praat Voice Report
 *  - Shimmer (local + dB)    — 振幅周期抖动，参考 MDVP 标准
 *  - HNR                     — 谐波噪声比，Boersma 1993 自相关法
 *  - CPPS                    — 倒谱峰突出度，Hillenbrand & Houde 1996
 *  - Vibrato                 — 速率 & 深度，对 F0 曲线做 FFT
 *  - SPR                     — 歌手共振峰比值，Omori 1996
 *  - Spectral Centroid       — 频谱质心（亮度）
 *  - Spectral Tilt           — 频谱斜率（dB/oct）
 *  - Spectral Flatness       — 谐波纯净度（Wiener Entropy）
 *  - Spectral Rolloff (85%)  — 85% 能量截止频率
 *  - Tonality                — Krumhansl-Schmuckler 调性检测 + 跑音率
 */

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface AudioAnalysisResult {
  duration: number;

  pitch: {
    stability: number;      // 0-100：音高稳定性
    intonation: number;     // 0-100：音准准确度（偏离最近半音的音分）
    rangeOctaves: number;   // 演唱音域（八度）
    avgHz: number;          // 平均音高 Hz
    voicedRatio: number;    // 有声占比 0-1
  };

  tonality: {
    detectedKey: string;
    detectedKeyZh: string;
    confidence: number;
    inKeyRatio: number;     // 在调音符 %
    offKeyRatio: number;    // 跑调音符 %
    avgOffKeyCents: number;
    inTuneScore: number;    // 0-100
  };

  rhythm: {
    regularity: number;
    phraseCount: number;
    avgOnsetIntervalMs: number;
  };

  breath: {
    avgPhraseDuration: number;
    maxPhraseDuration: number;
    volumeStability: number;
    phraseEndDrop: number;
  };

  /** 频谱特征（类比混音 EQ 分析） */
  spectrum: {
    lowRatio: number;       // 80-300 Hz（胸腔/厚度）
    midRatio: number;       // 300-3000 Hz（人声核心）
    highRatio: number;      // 3-8 kHz（亮度/穿透）
    spr: number;            // Singer's Power Ratio (dB)，>0 表示有歌手共振峰
    centroid: number;       // 频谱质心 Hz（越高越亮）
    tilt: number;           // 频谱斜率 dB/oct（健康约 -3 ~ -8）
    rolloff: number;        // 85% 能量截止 Hz
    flatness: number;       // Wiener Entropy 0-1（<0.1 为纯净谐波声）
    brightness: number;     // 0-100 综合亮度分
  };

  /** 声音质量（参考 Praat 标准值） */
  voiceQuality: {
    hnr: number;            // 谐波噪声比 dB（理想 >20）
    jitter: number;         // 基频周期抖动 %（理想 <0.5）
    shimmer: number;        // 振幅抖动 %（理想 <3）
    shimmerDb: number;      // 振幅抖动 dB（理想 <0.35）
    cpps: number;           // 倒谱峰突出度 dB（理想 >14）
    qualityScore: number;   // 0-100 综合声音质量
  };

  /** 颤音分析（Vibrato） */
  vibrato: {
    detected: boolean;
    rate: number;           // Hz（理想 4.5-6.5）
    extent: number;         // 音分峰-峰值（理想 50-120）
    regularity: number;     // 0-100
    score: number;          // 0-100（0=无颤音，100=理想颤音）
  };
}

// ─── FFT（Cooley-Tukey 基-2 原位）────────────────────────────────────────────

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i+j+len/2]*curRe - im[i+j+len/2]*curIm;
        const vIm = re[i+j+len/2]*curIm + im[i+j+len/2]*curRe;
        re[i+j]=uRe+vRe; im[i+j]=uIm+vIm;
        re[i+j+len/2]=uRe-vRe; im[i+j+len/2]=uIm-vIm;
        const t = curRe*wRe - curIm*wIm;
        curIm = curRe*wIm + curIm*wRe; curRe = t;
      }
    }
  }
}

function powerSpectrum(chunk: Float32Array, N: number): Float64Array {
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const L = Math.min(chunk.length, N);
  for (let i = 0; i < L; i++) {
    const w = 0.5 * (1 - Math.cos(2*Math.PI*i/(L-1)));
    re[i] = chunk[i] * w;
  }
  fft(re, im);
  const ps = new Float64Array(N/2);
  for (let i = 0; i < N/2; i++) ps[i] = re[i]*re[i] + im[i]*im[i];
  return ps;
}

// ─── 调性检测（Krumhansl-Schmuckler）────────────────────────────────────────

const KK_MAJOR = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const KK_MINOR = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
const MAJOR_INTERVALS = [0,2,4,5,7,9,11];
const MINOR_INTERVALS = [0,2,3,5,7,8,10];
const NOTE_EN = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_ZH = ['C','♭D','D','♭E','E','F','♯F','G','♭A','A','♭B','B'];

function pearsonCorr(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s,v)=>s+v,0)/n, mb = b.reduce((s,v)=>s+v,0)/n;
  let num=0, da2=0, db2=0;
  for (let i=0;i<n;i++){const da=a[i]-ma,db=b[i]-mb;num+=da*db;da2+=da*da;db2+=db*db;}
  return da2&&db2 ? num/Math.sqrt(da2*db2) : 0;
}

function detectKey(pitchesHz: number[]) {
  const hist = new Array(12).fill(0);
  for (const hz of pitchesHz) {
    const midi = 12*Math.log2(hz/440)+69;
    hist[((Math.round(midi)%12)+12)%12]++;
  }
  const total = hist.reduce((a,b)=>a+b,1);
  const norm = hist.map(v=>v/total);
  let bk=0, bm: 'major'|'minor'='major', bc=-Infinity;
  for (let k=0;k<12;k++){
    const mj=[...KK_MAJOR.slice(k),...KK_MAJOR.slice(0,k)];
    const mn=[...KK_MINOR.slice(k),...KK_MINOR.slice(0,k)];
    const cM=pearsonCorr(norm,mj), cN=pearsonCorr(norm,mn);
    if(cM>bc){bc=cM;bk=k;bm='major';}
    if(cN>bc){bc=cN;bk=k;bm='minor';}
  }
  return {key:bk,mode:bm,confidence:Math.round(Math.max(0,Math.min(100,(bc+1)/2*100))),
    keyName:`${NOTE_EN[bk]} ${bm==='major'?'Major':'Minor'}`,
    keyNameZh:`${NOTE_ZH[bk]}${bm==='major'?'大调':'小调'}`};
}

function analyzeOffKey(pitchesHz: number[], keyRoot: number, mode: 'major'|'minor') {
  const scaleNotes = new Set((mode==='major'?MAJOR_INTERVALS:MINOR_INTERVALS).map(i=>(keyRoot+i)%12));
  let offCount=0, offCentsSum=0, totalCents=0;
  for (const hz of pitchesHz) {
    const mf = 12*Math.log2(hz/440)+69;
    const pc = ((Math.round(mf)%12)+12)%12;
    const cfc = Math.abs((mf-Math.round(mf))*100);
    totalCents += cfc;
    let msd = Infinity;
    for (const sn of scaleNotes){const d=Math.min(Math.abs(pc-sn),12-Math.abs(pc-sn));if(d<msd)msd=d;}
    const dev = cfc + msd*100;
    if (dev>80){offCount++;offCentsSum+=dev;}
  }
  const n = pitchesHz.length||1;
  const offKeyRatio = Math.round((offCount/n)*100);
  return {
    inKeyRatio:100-offKeyRatio, offKeyRatio,
    avgOffKeyCents:offCount>0?Math.round(offCentsSum/offCount):0,
    inTuneScore:Math.round(Math.max(0,Math.min(100,(100-offKeyRatio)*0.7+Math.max(0,100-totalCents/n*2)*0.3))),
  };
}

// ─── HNR（谐波噪声比，自相关法，Boersma 1993）────────────────────────────────

function computeHNR(chunk: Float32Array, sampleRate: number, f0Hz: number): number {
  const N = chunk.length;
  const T0 = Math.round(sampleRate/f0Hz);
  if (T0<=0||T0>=N) return 12;
  let R0=0, RT0=0;
  for (let n=0;n<N;n++){
    const w=0.5*(1-Math.cos(2*Math.PI*n/(N-1)));
    const xw=chunk[n]*w;
    R0+=xw*xw;
    if (n+T0<N) RT0+=xw*(chunk[n+T0]*(0.5*(1-Math.cos(2*Math.PI*(n+T0)/(N-1)))));
  }
  const rT0=Math.min(0.9999,Math.max(0.001,RT0/(R0+1e-10)));
  return 10*Math.log10(rT0/(1-rT0));
}

// ─── CPPS（倒谱峰突出度，Hillenbrand & Houde 1996）──────────────────────────

function computeCPPS(chunk: Float32Array, sampleRate: number): number {
  const N = 1024;
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const L = Math.min(chunk.length, N);
  for (let i=0;i<L;i++){
    const w=0.5*(1-Math.cos(2*Math.PI*i/(L-1)));
    re[i]=chunk[i]*w;
  }
  fft(re, im);
  // 对数功率谱 → 倒谱（IFFT = 对 re/im 取共轭再 FFT 再除以 N）
  for (let i=0;i<N;i++){
    re[i]=Math.log(re[i]*re[i]+im[i]*im[i]+1e-10);
    im[i]=0;
  }
  // IFFT：共轭 FFT
  for (let i=1;i<N/2;i++){im[i]=-im[i];im[N-i]=-im[N-i];} // 实数信号共轭对称
  fft(re, im);
  // 功率倒谱
  const cep = new Float64Array(N/2);
  for (let i=0;i<N/2;i++) cep[i]=(re[i]*re[i]+im[i]*im[i])/(N*N);

  const qMin=Math.floor(sampleRate/500), qMax=Math.min(Math.floor(sampleRate/80),N/2-1);
  let peak=-Infinity, peakIdx=qMin;
  for (let q=qMin;q<=qMax;q++) if(cep[q]>peak){peak=cep[q];peakIdx=q;}

  // 线性回归基线
  let sx=0,sy=0,sxy=0,sx2=0,cnt=0;
  for (let q=qMin;q<=qMax;q++){sx+=q;sy+=cep[q];sxy+=q*cep[q];sx2+=q*q;cnt++;}
  const slope=(cnt*sxy-sx*sy)/(cnt*sx2-sx*sx+1e-10);
  const intercept=(sy-slope*sx)/cnt;
  const base=slope*peakIdx+intercept;

  return Math.max(0, 10*Math.log10(Math.max(peak,1e-10))-10*Math.log10(Math.max(base,1e-10)));
}

// ─── Vibrato（对 F0 曲线做 FFT）────────────────────────────────────────────

function analyzeVibrato(pitchesHz: number[], frameRate: number) {
  const EMPTY = {detected:false,rate:0,extent:0,regularity:0,score:0};
  if (pitchesHz.length<40) return EMPTY;
  const avgHz = pitchesHz.reduce((a,b)=>a+b)/pitchesHz.length;
  const cents = pitchesHz.map(p=>1200*Math.log2(p/avgHz));
  // 取 2 的幂长度
  let N=1; while(N<cents.length&&N<512) N<<=1;
  const re=new Float64Array(N), im=new Float64Array(N);
  const mean=cents.slice(0,N).reduce((a,b)=>a+b,0)/N;
  for (let i=0;i<N;i++) re[i]=(cents[i]||0)-mean;
  // Hanning
  for (let i=0;i<N;i++){const w=0.5*(1-Math.cos(2*Math.PI*i/(N-1)));re[i]*=w;}
  fft(re,im);
  // 在 4-8 Hz 范围找峰值
  const kMin=Math.max(1,Math.ceil(4*N/frameRate));
  const kMax=Math.floor(8*N/frameRate);
  let maxP=0, bestK=-1;
  let totalP=0;
  for (let k=1;k<N/2;k++){
    const p=re[k]*re[k]+im[k]*im[k];
    totalP+=p;
    if(k>=kMin&&k<=kMax&&p>maxP){maxP=p;bestK=k;}
  }
  if (bestK<0||totalP===0) return EMPTY;
  const rate=Math.round((bestK*frameRate/N)*10)/10;
  const extent=Math.round(Math.max(...cents)-Math.min(...cents));
  const bandP=Array.from({length:kMax-kMin+1},(_,i)=>re[kMin+i]*re[kMin+i]+im[kMin+i]*im[kMin+i]).reduce((a,b)=>a+b,0);
  const regularity=Math.round(Math.min(100,bandP/totalP*200));
  const detected=rate>=4&&rate<=8&&extent>=20;
  let score=0;
  if (detected){
    const rScore=Math.max(0,100-Math.abs(rate-5.5)*20);
    const eScore=extent>=20&&extent<=150?Math.max(0,100-Math.abs(extent-85)*0.8):Math.max(0,50-Math.abs(extent-85)*0.5);
    score=Math.round(rScore*0.4+eScore*0.4+regularity*0.2);
  }
  return {detected,rate,extent,regularity,score};
}

// ─── 频谱特征（SPR、质心、斜率、滚降、平坦度）───────────────────────────────

function analyzeSpectrum(ps: Float64Array, sampleRate: number) {
  const N2=ps.length; // = FFT_N/2
  const bw=sampleRate/(2*N2);
  let low=0,mid=0,high=0,total=0;
  let weightedFreq=0;
  let maxLow=-Infinity, maxHigh=-Infinity;
  let cumEnergy=0;
  let rolloff=sampleRate/2;
  let logSumGeom=0, logSumArith=0;

  for (let i=1;i<N2;i++){
    const f=i*bw, p=ps[i];
    total+=p;
    weightedFreq+=f*p;
    const dB=10*Math.log10(p+1e-10);
    if(f<300) low+=p;
    else if(f<3000) mid+=p;
    else if(f<8000) high+=p;
    if(f>=0&&f<2000) maxLow=Math.max(maxLow,dB);
    if(f>=2000&&f<4000) maxHigh=Math.max(maxHigh,dB);
    logSumGeom+=Math.log(p+1e-10);
    logSumArith+=p;
  }

  // 85% rolloff
  let cum=0;
  for (let i=1;i<N2;i++){cum+=ps[i];if(cum>=0.85*total){rolloff=i*bw;break;}}

  // Spectral Tilt（频谱斜率 dB/oct）
  // 对 log(freq) vs 10*log10(power) 做线性回归
  let stSx=0,stSy=0,stSxy=0,stSx2=0,stN=0;
  for (let i=1;i<N2;i++){
    const f=i*bw;
    if(f<80||f>8000) continue;
    const lf=Math.log2(f);
    const ldB=10*Math.log10(ps[i]+1e-10);
    stSx+=lf;stSy+=ldB;stSxy+=lf*ldB;stSx2+=lf*lf;stN++;
  }
  const tilt=stN>1?(stN*stSxy-stSx*stSy)/(stN*stSx2-stSx*stSx+1e-10):0;

  const centroid=total>0?Math.round(weightedFreq/total):1000;
  const spr=maxHigh-maxLow;
  const geoMean=Math.exp(logSumGeom/(N2-1));
  const arithMean=logSumArith/(N2-1);
  const flatness=geoMean/(arithMean+1e-10);
  const brightness=Math.round(Math.min(100,Math.max(0,(centroid-500)/30)));

  return {
    lowRatio:Math.round(low/(total||1)*100)/100,
    midRatio:Math.round(mid/(total||1)*100)/100,
    highRatio:Math.round(high/(total||1)*100)/100,
    spr:Math.round(spr*10)/10,
    centroid,
    tilt:Math.round(tilt*10)/10,
    rolloff:Math.round(rolloff),
    flatness:Math.round(flatness*100)/100,
    brightness,
  };
}

// ─── 主分析函数 ───────────────────────────────────────────────────────────────

export async function analyzeAudio(blob: Blob): Promise<AudioAnalysisResult> {
  const {PitchDetector} = await import('pitchy');
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();

  const data = audioBuffer.getChannelData(0);
  const sr = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const HOP=512, BUF=2048;
  const detector = PitchDetector.forFloat32Array(BUF);
  const frameRate = sr/HOP; // ≈86 fps @ 44100Hz

  // ── 逐帧提取基础特征 ────────────────────────────────────────────────────
  const pitchesHz: number[]=[], clarities: number[]=[], centsDevs: number[]=[];
  const frameVols: number[]=[], hnrValues: number[]=[], cppsValues: number[]=[];
  const specAcc={low:0,mid:0,high:0,total:0,wFreq:0,maxLow:-200,maxHigh:-200,
    geoLog:0,arithSum:0,count:0,
    rolloffBins:new Float64Array(BUF/2)};
  let allPS = new Float64Array(BUF/2);

  for (let i=0;i+BUF<data.length;i+=HOP){
    const chunk=data.slice(i,i+BUF) as unknown as Float32Array;
    let rms=0; for (let j=0;j<BUF;j++) rms+=chunk[j]**2; rms=Math.sqrt(rms/BUF);
    frameVols.push(rms);

    if (rms>0.005){
      // 音高检测
      const [pitch,clarity]=detector.findPitch(chunk,sr);
      if (clarity>0.85&&pitch>80&&pitch<1200){
        pitchesHz.push(pitch); clarities.push(clarity);
        const midi=12*Math.log2(pitch/440)+69;
        centsDevs.push(Math.abs((midi-Math.round(midi))*100));
        // HNR
        hnrValues.push(computeHNR(chunk,sr,pitch));
      }
      // CPPS（每 5 帧采样一次节省计算）
      if (frameVols.length%5===0) cppsValues.push(computeCPPS(chunk,sr));

      // 频谱（每 8 帧采样）
      if (frameVols.length%8===0){
        const ps=powerSpectrum(chunk,BUF);
        const bw=sr/(BUF);
        for (let k=1;k<BUF/2;k++){
          const f=k*bw, p=ps[k];
          allPS[k]+=p;
          specAcc.total+=p; specAcc.wFreq+=f*p;
          const dB=10*Math.log10(p+1e-10);
          if(f<300) specAcc.low+=p;
          else if(f<3000) specAcc.mid+=p;
          else if(f<8000) specAcc.high+=p;
          if(f>=0&&f<2000) specAcc.maxLow=Math.max(specAcc.maxLow,dB);
          if(f>=2000&&f<4000) specAcc.maxHigh=Math.max(specAcc.maxHigh,dB);
          specAcc.geoLog+=Math.log(p+1e-10);
          specAcc.arithSum+=p;
          specAcc.rolloffBins[k]+=p;
        }
        specAcc.count++;
      }
    }
  }

  const hasPitch=pitchesHz.length>=10;

  // ── 音准 ──────────────────────────────────────────────────────────────
  const semitones=pitchesHz.map(p=>12*Math.log2(p/440));
  const avgST=semitones.length?semitones.reduce((a,b)=>a+b)/semitones.length:0;
  const stdST=semitones.length?Math.sqrt(semitones.reduce((a,b)=>a+(b-avgST)**2,0)/semitones.length):4;
  const pitchStability=Math.round(Math.max(0,Math.min(100,100-(stdST/8)*100)));
  const avgCentsDev=centsDevs.length?centsDevs.reduce((a,b)=>a+b)/centsDevs.length:30;
  const intonation=Math.round(Math.max(0,Math.min(100,100-(avgCentsDev/50)*100)));
  const rangeOctaves=semitones.length?Math.round(((Math.max(...semitones)-Math.min(...semitones))/12)*10)/10:0;
  const avgHz=pitchesHz.length?Math.round(pitchesHz.reduce((a,b)=>a+b)/pitchesHz.length):0;
  const voicedRatio=Math.round((pitchesHz.length/(data.length/HOP))*100)/100;

  // ── 调性 ──────────────────────────────────────────────────────────────
  let tonality: AudioAnalysisResult['tonality'];
  if (hasPitch){
    const ki=detectKey(pitchesHz);
    const oi=analyzeOffKey(pitchesHz,ki.key,ki.mode);
    tonality={detectedKey:ki.keyName,detectedKeyZh:ki.keyNameZh,confidence:ki.confidence,...oi};
  } else {
    tonality={detectedKey:'Unknown',detectedKeyZh:'未知',confidence:0,inKeyRatio:50,offKeyRatio:50,avgOffKeyCents:0,inTuneScore:50};
  }

  // ── 节奏 ──────────────────────────────────────────────────────────────
  const THRESH=0.015;
  const onsets: number[]=[];
  let prev=0;
  for (let i=0;i<frameVols.length;i++){
    if(frameVols[i]>THRESH&&prev<=THRESH) onsets.push(i*HOP/sr*1000);
    prev=frameVols[i];
  }
  const intervals=onsets.slice(1).map((t,i)=>t-onsets[i]);
  const avgIv=intervals.length?intervals.reduce((a,b)=>a+b)/intervals.length:500;
  const stdIv=intervals.length?Math.sqrt(intervals.reduce((a,b)=>a+(b-avgIv)**2,0)/intervals.length):300;
  const rhythmReg=Math.round(Math.max(0,Math.min(100,100-(stdIv/(avgIv+1))*50)));

  // ── 气息 ──────────────────────────────────────────────────────────────
  const GAP=Math.floor(sr*0.15/HOP);
  const phrases: {start:number;end:number}[]=[];
  let ps2=-1, sc=0;
  for (let i=0;i<frameVols.length;i++){
    if(frameVols[i]>THRESH){if(ps2===-1)ps2=i;sc=0;}
    else{sc++;if(ps2!==-1&&sc>GAP){phrases.push({start:ps2,end:i-GAP});ps2=-1;sc=0;}}
  }
  if(ps2!==-1) phrases.push({start:ps2,end:frameVols.length-1});
  const pDurs=phrases.map(p=>((p.end-p.start)*HOP)/sr);
  const avgPD=pDurs.length?Math.round(pDurs.reduce((a,b)=>a+b)/pDurs.length*10)/10:3;
  const maxPD=pDurs.length?Math.round(Math.max(...pDurs)*10)/10:5;
  let vsSum=0,vsN=0;
  for (const p of phrases){
    const vs=frameVols.slice(p.start,p.end+1).filter(v=>v>THRESH);
    if(vs.length<3)continue;
    const avg=vs.reduce((a,b)=>a+b)/vs.length;
    const std=Math.sqrt(vs.reduce((a,b)=>a+(b-avg)**2,0)/vs.length);
    vsSum+=1-std/(avg+1e-6);vsN++;
  }
  const volumeStab=Math.round(Math.max(0,Math.min(100,(vsN?vsSum/vsN:0.6)*100)));
  let drops=0;
  for (const p of phrases){
    const e=p.end,s=Math.max(p.start,e-Math.floor(0.3*sr/HOP));
    const tail=frameVols.slice(s,e+1);
    if(tail.length<3)continue;
    const h=tail.slice(0,Math.ceil(tail.length/2)).reduce((a,b)=>a+b)/Math.ceil(tail.length/2);
    const l=tail.slice(Math.floor(tail.length/2)).reduce((a,b)=>a+b)/Math.floor(tail.length/2);
    if(l<h*0.5)drops++;
  }
  const phraseEndDrop=phrases.length?Math.round((drops/phrases.length)*100):30;

  // ── 频谱 ──────────────────────────────────────────────────────────────
  const specResult=analyzeSpectrum(allPS,sr);

  // ── HNR 平均 ──────────────────────────────────────────────────────────
  const avgHNR=hnrValues.length?Math.round(hnrValues.reduce((a,b)=>a+b)/hnrValues.length*10)/10:12;

  // ── Jitter（帧级基频周期抖动）────────────────────────────────────────
  let jitter=0;
  if (pitchesHz.length>=4){
    const periods=pitchesHz.map(f=>1/f);
    const avgP=periods.reduce((a,b)=>a+b)/periods.length;
    const diffSum=periods.slice(1).reduce((s,t,i)=>s+Math.abs(t-periods[i]),0);
    jitter=Math.round((diffSum/((periods.length-1)*avgP))*10000)/100; // 百分比
  }

  // ── Shimmer（帧级振幅抖动）──────────────────────────────────────────
  let shimmer=0, shimmerDb=0;
  if (frameVols.length>=4){
    const vols=frameVols.filter(v=>v>THRESH);
    if(vols.length>=4){
      const avgA=vols.reduce((a,b)=>a+b)/vols.length;
      const diff=vols.slice(1).reduce((s,a,i)=>s+Math.abs(a-vols[i]),0);
      shimmer=Math.round((diff/((vols.length-1)*avgA))*10000)/100;
      const dBdiff=vols.slice(1).reduce((s,a,i)=>s+Math.abs(20*Math.log10((a+1e-10)/(vols[i]+1e-10))),0);
      shimmerDb=Math.round((dBdiff/(vols.length-1))*100)/100;
    }
  }

  // ── CPPS 平均 ─────────────────────────────────────────────────────────
  const avgCPPS=cppsValues.length?Math.round(cppsValues.reduce((a,b)=>a+b)/cppsValues.length*10)/10:8;

  // ── 综合声音质量评分（参考 Praat 标准正常值）────────────────────────
  const hnrScore  = Math.round(Math.max(0,Math.min(100,(avgHNR-5)/25*100)));    // 5-30dB → 0-100
  const jitScore  = Math.round(Math.max(0,Math.min(100,(1-jitter/2)*100)));     // 0-2% → 100-0
  const shimScore = Math.round(Math.max(0,Math.min(100,(1-shimmer/6)*100)));    // 0-6% → 100-0
  const cppsScore = Math.round(Math.max(0,Math.min(100,(avgCPPS/20)*100)));     // 0-20dB → 0-100
  const qualityScore = Math.round(hnrScore*0.30+jitScore*0.25+shimScore*0.25+cppsScore*0.20);

  // ── Vibrato ──────────────────────────────────────────────────────────
  const vibrato=analyzeVibrato(pitchesHz, frameRate);

  return {
    duration: Math.round(duration),
    pitch: {
      stability: hasPitch?pitchStability:50,
      intonation: hasPitch?intonation:50,
      rangeOctaves: hasPitch?rangeOctaves:0,
      avgHz, voicedRatio,
    },
    tonality,
    rhythm: {regularity:rhythmReg, phraseCount:phrases.length, avgOnsetIntervalMs:Math.round(avgIv)},
    breath: {avgPhraseDuration:avgPD, maxPhraseDuration:maxPD, volumeStability:volumeStab, phraseEndDrop},
    spectrum: specResult,
    voiceQuality: {
      hnr: avgHNR,
      jitter: Math.min(jitter,5),
      shimmer: Math.min(shimmer,15),
      shimmerDb: Math.min(shimmerDb,2),
      cpps: avgCPPS,
      qualityScore: hasPitch?qualityScore:50,
    },
    vibrato,
  };
}
