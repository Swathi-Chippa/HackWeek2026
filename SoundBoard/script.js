(function(){
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let masterGain = null;

  function ensureCtx(){
    if(!ctx){
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
    }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // active voices: each = { stopFn, nodes:[], padEl }
  let activeVoices = [];

  function registerVoice(voice){
    activeVoices.push(voice);
    updateVoiceCount();
  }
  function removeVoice(voice){
    const i = activeVoices.indexOf(voice);
    if(i>-1) activeVoices.splice(i,1);
    updateVoiceCount();
  }
  function updateVoiceCount(){
    document.getElementById('voiceCount').textContent = activeVoices.length + ' voice' + (activeVoices.length===1?'':'s') + ' active';
  }

  function noiseBuffer(duration){
    const c = ensureCtx();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<data.length;i++){ data[i] = Math.random()*2-1; }
    return buf;
  }

  // ---- sound definitions ----
  // each returns {stop} and auto-cleans on natural end for one-shots

  function playKick(pad){
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    const now = c.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain).connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
    const voice = { nodes:[osc,gain], padEl: pad, stop(){ try{ gain.gain.cancelScheduledValues(c.currentTime); gain.gain.setTargetAtTime(0,c.currentTime,0.02); osc.stop(c.currentTime+0.05); }catch(e){} } };
    registerVoice(voice);
    osc.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playSnare(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer(0.2);
    const noiseFilter = c.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);

    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    const oscGain = c.createGain();
    oscGain.gain.setValueAtTime(0.6, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(oscGain).connect(masterGain);

    noise.start(now); noise.stop(now + 0.2);
    osc.start(now); osc.stop(now + 0.14);
    const voice = { nodes:[noise,osc], padEl: pad, stop(){ try{ noise.stop(c.currentTime+0.02); osc.stop(c.currentTime+0.02);}catch(e){} } };
    registerVoice(voice);
    noise.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playHat(pad, open){
    const c = ensureCtx();
    const now = c.currentTime;
    const dur = open ? 0.4 : 0.06;
    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer(dur + 0.02);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(hp).connect(g).connect(masterGain);
    noise.start(now); noise.stop(now + dur + 0.02);
    const voice = { nodes:[noise], padEl: pad, stop(){ try{ noise.stop(c.currentTime+0.01);}catch(e){} } };
    registerVoice(voice);
    noise.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playClap(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const voice = { nodes:[], padEl: pad, stop(){} };
    const stopFns = [];
    for(let i=0;i<3;i++){
      const t = now + i*0.02;
      const noise = c.createBufferSource();
      noise.buffer = noiseBuffer(0.12);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.55, t+0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t+0.15);
      noise.connect(bp).connect(g).connect(masterGain);
      noise.start(t); noise.stop(t+0.16);
      stopFns.push(()=>{ try{noise.stop(c.currentTime+0.01);}catch(e){} });
      if(i===2){ noise.onended = () => { removeVoice(voice); setPadPlaying(pad,false); }; }
    }
    voice.stop = () => stopFns.forEach(f=>f());
    registerVoice(voice);
    return voice;
  }

  function playTom(pad, freqStart){
    const c = ensureCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(freqStart*0.5, now+0.3);
    const g = c.createGain();
    g.gain.setValueAtTime(0.8, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.35);
    osc.connect(g).connect(masterGain);
    osc.start(now); osc.stop(now+0.4);
    const voice = { nodes:[osc], padEl: pad, stop(){ try{ osc.stop(c.currentTime+0.02);}catch(e){} } };
    registerVoice(voice);
    osc.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playRim(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1800;
    const g = c.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.05);
    osc.connect(g).connect(masterGain);
    osc.start(now); osc.stop(now+0.06);
    const voice = { nodes:[osc], padEl: pad, stop(){ try{ osc.stop(c.currentTime+0.01);}catch(e){} } };
    registerVoice(voice);
    osc.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playCowbell(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.3);
    g.connect(masterGain);
    const o1 = c.createOscillator(); o1.type='square'; o1.frequency.value = 800;
    const o2 = c.createOscillator(); o2.type='square'; o2.frequency.value = 540;
    o1.connect(g); o2.connect(g);
    o1.start(now); o2.start(now);
    o1.stop(now+0.3); o2.stop(now+0.3);
    const voice = { nodes:[o1,o2], padEl: pad, stop(){ try{ o1.stop(c.currentTime+0.02); o2.stop(c.currentTime+0.02);}catch(e){} } };
    registerVoice(voice);
    o1.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playBlip(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now+0.08);
    const g = c.createGain();
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
    osc.connect(g).connect(masterGain);
    osc.start(now); osc.stop(now+0.1);
    const voice = { nodes:[osc], padEl: pad, stop(){ try{ osc.stop(c.currentTime+0.01);}catch(e){} } };
    registerVoice(voice);
    osc.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playLaser(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(80, now+0.35);
    const g = c.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.35);
    osc.connect(g).connect(masterGain);
    osc.start(now); osc.stop(now+0.36);
    const voice = { nodes:[osc], padEl: pad, stop(){ try{ osc.stop(c.currentTime+0.01);}catch(e){} } };
    registerVoice(voice);
    osc.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  function playChime(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const freqs = [880, 1318.5, 1760];
    const voice = { nodes:[], padEl: pad, stop(){} };
    const stopFns = [];
    freqs.forEach((f,i)=>{
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.25/(i+1), now+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now+1.1);
      osc.connect(g).connect(masterGain);
      osc.start(now); osc.stop(now+1.2);
      stopFns.push(()=>{ try{osc.stop(c.currentTime+0.05);}catch(e){} });
      if(i===freqs.length-1){ osc.onended = () => { removeVoice(voice); setPadPlaying(pad,false); }; }
    });
    voice.stop = () => stopFns.forEach(f=>f());
    registerVoice(voice);
    return voice;
  }

  function playClick(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer(0.03);
    const g = c.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.03);
    noise.connect(g).connect(masterGain);
    noise.start(now); noise.stop(now+0.03);
    const voice = { nodes:[noise], padEl: pad, stop(){ try{ noise.stop(c.currentTime+0.005);}catch(e){} } };
    registerVoice(voice);
    noise.onended = () => { removeVoice(voice); setPadPlaying(pad,false); };
    return voice;
  }

  // ---- looping / sustained sounds (so Stop All has real work to do) ----

  function playSiren(pad){
    const c = ensureCtx();
    const osc = c.createOscillator();
    osc.type = 'sine';
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.3, c.currentTime+0.15);
    osc.connect(g).connect(masterGain);
    let dir = 1;
    let f = 500;
    osc.frequency.setValueAtTime(f, c.currentTime);
    const interval = setInterval(()=>{
      f += dir*220;
      if(f>900){ f=900; dir=-1; }
      if(f<400){ f=400; dir=1; }
      osc.frequency.linearRampToValueAtTime(f, c.currentTime+0.18);
    }, 180);
    osc.start();
    const voice = {
      nodes:[osc], padEl: pad, looping:true,
      stop(){
        clearInterval(interval);
        const now = c.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0, now, 0.05);
        osc.stop(now+0.3);
      }
    };
    registerVoice(voice);
    return voice;
  }

  function playDrone(pad){
    const c = ensureCtx();
    const now = c.currentTime;
    const o1 = c.createOscillator(); o1.type='sawtooth'; o1.frequency.value = 110;
    const o2 = c.createOscillator(); o2.type='sawtooth'; o2.frequency.value = 110*1.005;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.22, now+0.4);
    o1.connect(filter); o2.connect(filter);
    filter.connect(g).connect(masterGain);
    o1.start(now); o2.start(now);
    const voice = {
      nodes:[o1,o2], padEl: pad, looping:true,
      stop(){
        const t = c.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0, t, 0.15);
        o1.stop(t+0.5); o2.stop(t+0.5);
      }
    };
    registerVoice(voice);
    return voice;
  }

  function playAlarm(pad){
    const c = ensureCtx();
    const osc = c.createOscillator();
    osc.type = 'square';
    const g = c.createGain();
    g.gain.setValueAtTime(0.001, c.currentTime);
    osc.connect(g).connect(masterGain);
    osc.frequency.setValueAtTime(700, c.currentTime);
    let on = true;
    const now0 = c.currentTime;
    g.gain.setValueAtTime(0.25, now0);
    const interval = setInterval(()=>{
      const t = c.currentTime;
      on = !on;
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(on?0.25:0.0, t, 0.02);
      osc.frequency.setValueAtTime(on?700:520, t);
    }, 260);
    osc.start(now0);
    const voice = {
      nodes:[osc], padEl: pad, looping:true,
      stop(){
        clearInterval(interval);
        const t = c.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setTargetAtTime(0, t, 0.05);
        osc.stop(t+0.3);
      }
    };
    registerVoice(voice);
    return voice;
  }

  // ---- pad configuration ----
  const PADS = [
    { label:'Kick',    tag:null, play:playKick },
    { label:'Snare',   tag:null, play:playSnare },
    { label:'Hat Cl',  tag:null, play:(p)=>playHat(p,false) },
    { label:'Hat Op',  tag:null, play:(p)=>playHat(p,true) },
    { label:'Clap',    tag:null, play:playClap },
    { label:'Tom Hi',  tag:null, play:(p)=>playTom(p,300) },
    { label:'Tom Lo',  tag:null, play:(p)=>playTom(p,180) },
    { label:'Rim',     tag:null, play:playRim },
    { label:'Cowbell', tag:null, play:playCowbell },
    { label:'Blip',    tag:null, play:playBlip },
    { label:'Laser',   tag:null, play:playLaser },
    { label:'Chime',   tag:null, play:playChime },
    { label:'Click',   tag:null, play:playClick },
    { label:'Siren',   tag:'hold', play:playSiren },
    { label:'Drone',   tag:'hold', play:playDrone },
    { label:'Alarm',   tag:'hold', play:playAlarm },
  ];

  const grid = document.getElementById('padGrid');
  const padStates = new Map(); // padEl -> voice (for loop-type toggling)

  PADS.forEach((cfg, idx) => {
    const btn = document.createElement('button');
    btn.className = 'pad' + (cfg.tag ? ' loop-type' : '');
    btn.setAttribute('data-idx', idx);
    btn.setAttribute('aria-label', cfg.label + (cfg.tag ? ' (hold-type sound)' : ' (one-shot sound)'));
    btn.innerHTML =
      '<span class="num">' + String(idx+1).padStart(2,'0') + '</span>' +
      '<span class="label">' + cfg.label + '</span>' +
      '<span class="tag">' + (cfg.tag ? 'toggle' : '') + '</span>' +
      '<span class="led"></span>';

    btn.addEventListener('click', () => {
      ensureCtx();
      if(cfg.tag === 'hold'){
        // toggle looping sound on/off
        if(padStates.has(btn)){
          const voice = padStates.get(btn);
          voice.stop();
          removeVoice(voice);
          padStates.delete(btn);
          setPadPlaying(btn, false);
        } else {
          const voice = cfg.play(btn);
          padStates.set(btn, voice);
          setPadPlaying(btn, true);
        }
      } else {
        cfg.play(btn);
        flashHit(btn);
      }
    });

    grid.appendChild(btn);
  });

  function flashHit(btn){
    btn.classList.add('hit');
    setTimeout(()=> btn.classList.remove('hit'), 110);
  }

  function setPadPlaying(btn, isPlaying){
    if(isPlaying) btn.classList.add('playing');
    else btn.classList.remove('playing');
  }

  // Stop All
  document.getElementById('stopAll').addEventListener('click', () => {
    activeVoices.slice().forEach(v => {
      try{ v.stop(); }catch(e){}
      setPadPlaying(v.padEl, false);
    });
    activeVoices = [];
    padStates.clear();
    updateVoiceCount();
  });

  // Volume
  const volSlider = document.getElementById('volume');
  const volVal = document.getElementById('volVal');
  volSlider.addEventListener('input', () => {
    const v = Number(volSlider.value);
    volVal.textContent = v + '%';
    ensureCtx();
    masterGain.gain.setTargetAtTime(v/100, ctx.currentTime, 0.01);
  });

  // keyboard support: number row 1-9,0 and q,w,e,r,t,y for pads 11-16... keep simple, use 1-9 and 0 for first 10
  window.addEventListener('keydown', (e) => {
    if(e.repeat) return;
    const keyMap = '1234567890';
    const i = keyMap.indexOf(e.key);
    if(i > -1 && i < PADS.length){
      grid.children[i].click();
    }
  });

})();
