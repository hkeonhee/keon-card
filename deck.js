// 배치 후보 공통 도구: 글자를 안전하게 넣기, 바깥 링크, 별 스티커, 그림을 누르면 크게 보기
window.h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
window.ext = (url) => `href="${h(url)}" target="_blank" rel="noopener noreferrer"`;
window.STAR = '<svg class="star" viewBox="0 0 130 130" aria-hidden="true"><path d="M64 8L69 48L99 20L79 57L121 52L83 69L111 99L74 80L80 122L62 83L33 110L49 74L8 79L46 61L18 32L56 48Z"/></svg>';
// 그림 종이 한 장(누르면 크게 보기). window.print는 브라우저 인쇄라 이름을 paper로 씀
// data: 버튼에 붙일 data-* 값(steps, video, poster, caption이면 확대 창이 그린 과정을 재생), aria: 버튼 이름
window.paper = (src, alt, { cls = '', label = '', pos = '', full = src, data = {}, aria = '' } = {}) =>
  `<button type="button" class="print sheet ${cls}" data-full="${h(full)}"${Object.entries(data).map(([k, v]) => ` data-${k}="${h(v)}"`).join('')}${aria ? ` aria-label="${h(aria)}"` : ''}><span class="pic"><img src="${h(src)}" alt="${h(alt)}"${pos ? ` style="object-position:${h(pos)}"` : ''}></span>${label ? `<span class="label">${h(label)}</span>` : ''}</button>`;

// 확대 창. 보통은 그림 한 장. 누른 그림에 data-steps(단계 그림 목록)나 data-video가 있으면 그린 과정을 재생.
// 단계 그림은 앞 단계 위에 다음 단계가 겹쳐 나타나고(각 1초, 완성본에서 2.5초 뒤 처음부터), 영상은 소리 없이 반복.
// 움직임 줄이기에서는 저절로 시작하지 않고 완성본과 재생 버튼만 보임. 문구는 app.js가 언어에 맞게 LB에 넣음.
window.LB = { zoom: '그림 크게 보기', pause: '멈춤', play: '재생' };
(() => {
  const lb = document.createElement('dialog');
  lb.className = 'lb';
  lb.setAttribute('aria-label', '크게 보기');
  lb.innerHTML = '<button type="button" class="lb-close">닫기 ×</button><img alt=""><div class="lb-play" hidden><div class="lb-stage"></div><div class="lb-ctl"><span class="lb-bar" aria-hidden="true"></span><span class="lb-n"></span><button type="button" class="lb-toggle"></button></div><p class="lb-cap"></p></div>';
  document.body.append(lb);
  const part = (s) => lb.querySelector(s);
  const img = part(':scope > img'), box = part('.lb-play'), stage = part('.lb-stage'), bar = part('.lb-bar');
  const count = part('.lb-n'), toggle = part('.lb-toggle'), cap = part('.lb-cap');
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let opener = null, run = null;
  const label = () => { toggle.textContent = run && run.playing() ? LB.pause : LB.play; };

  function steps(list) {
    stage.innerHTML = list.map((src) => `<img src="${h(src)}" alt="">`).join('');
    bar.innerHTML = list.map(() => '<i></i>').join('');
    const frames = [...stage.children], segs = [...bar.children], last = frames.length - 1;
    let at = last, timer = 0, on = false;
    const show = (k) => {
      at = k;
      frames.forEach((f, i) => f.classList.toggle('on', i <= k));
      segs.forEach((g, i) => g.classList.toggle('on', i <= k));
      count.textContent = `${k + 1} / ${frames.length}`;
    };
    const next = () => { timer = setTimeout(() => { show(at === last ? 0 : at + 1); next(); }, at === last ? 2500 : 1000); };
    show(last);
    const r = {
      play() { clearTimeout(timer); on = true; if (at === last) show(0); next(); label(); },
      pause() { clearTimeout(timer); on = false; label(); },
      playing: () => on,
      stop() { clearTimeout(timer); on = false; },
    };
    // 완성본(표지에서 이미 받은 그림)을 보여 주는 동안 나머지 단계를 받고 나서 처음부터 시작
    if (!still()) Promise.all(frames.map((f) => f.decode().catch(() => {}))).then(() => { if (run === r) r.play(); });
    return r;
  }

  function video(src, poster) {
    stage.innerHTML = `<video src="${h(src)}" poster="${h(poster)}" muted playsinline loop preload="auto"></video>`;
    bar.innerHTML = '<i class="run"></i>';
    count.textContent = '';
    const v = stage.firstChild, line = bar.firstChild;
    v.muted = true;
    v.addEventListener('timeupdate', () => line.style.setProperty('--p', v.duration ? (v.currentTime / v.duration).toFixed(3) : 0));
    v.addEventListener('play', label);
    v.addEventListener('pause', label);
    const r = {
      play() { v.play().catch(label); },
      pause() { v.pause(); },
      playing: () => !v.paused,
      stop() { v.pause(); v.removeAttribute('src'); v.load(); },
    };
    if (!still()) r.play();
    return r;
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-full]');
    if (!t) return;
    opener = t;
    const d = t.dataset, process = !!(d.steps || d.video);
    img.hidden = process;
    box.hidden = !process;
    lb.setAttribute('aria-label', process && d.caption ? d.caption : LB.zoom);
    if (process) {
      cap.textContent = d.caption || '';
      run = d.steps ? steps(d.steps.split(' ')) : video(d.video, d.poster || '');
      label();
    } else {
      img.src = d.full;
      img.alt = (t.querySelector('img') || {}).alt || '';
    }
    lb.showModal();
  });
  toggle.addEventListener('click', () => { if (!run) return; if (run.playing()) run.pause(); else run.play(); });
  stage.addEventListener('click', () => toggle.click());
  part('.lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', () => {
    if (run) { run.stop(); run = null; }
    stage.innerHTML = ''; bar.innerHTML = ''; count.textContent = ''; cap.textContent = '';
    img.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
  });
})();

// 하나씩 넘겨 보는 카드 묶음. 손가락으로 밀기(브라우저 가로 스크롤), 마우스로 끌기, 이전/다음 버튼, 이름 버튼, 방향키.
// 필요한 구조: root 안에 .deck-track(자식이 한 장씩) + 선택: [data-go] 버튼들, .deck-prev, .deck-next, .deck-count
// opts.onChange(n): 보이는 장이 바뀔 때. 돌려주는 값: { go(n), index, size }
window.deck = (root, opts = {}) => {
  const track = root.querySelector('.deck-track');
  const slides = [...track.children];
  const tabs = [...root.querySelectorAll('[data-go]')];
  const prev = root.querySelector('.deck-prev'), next = root.querySelector('.deck-next'), count = root.querySelector('.deck-count');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const x = (n) => slides[n].offsetLeft - slides[0].offsetLeft;
  let i = -1;
  const show = (n) => {
    if (n === i) return;
    i = n;
    tabs.forEach((t) => t.setAttribute('aria-current', String(+t.dataset.go === n)));
    slides.forEach((s, k) => s.classList.toggle('is-on', k === n));
    if (prev) prev.disabled = n === 0;
    if (next) next.disabled = n === slides.length - 1;
    if (count) count.textContent = `${n + 1} / ${slides.length}`;
    opts.onChange?.(n);
  };
  const go = (n) => {
    n = Math.max(0, Math.min(slides.length - 1, n));
    track.scrollTo({ left: x(n), behavior: still.matches ? 'auto' : 'smooth' });
    show(n);
  };
  const near = () => slides.reduce((b, _, k) => (Math.abs(x(k) - track.scrollLeft) < Math.abs(x(b) - track.scrollLeft) ? k : b), 0);
  let settle = 0, gliding = 0;
  const endGlide = () => { if (sx === null) track.classList.remove('dragging'); };
  track.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => { endGlide(); show(near()); }, 80);
  }, { passive: true });
  tabs.forEach((t) => t.addEventListener('click', () => go(+t.dataset.go)));
  prev?.addEventListener('click', () => go(i - 1));
  next?.addEventListener('click', () => go(i + 1));
  root.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]') || e.altKey || e.ctrlKey || e.metaKey) return;
    const insideServices = e.target.closest?.('.services-scroll');
    if (e.key === 'Home' && !insideServices) { e.preventDefault(); go(0); return; }
    if (e.key === 'End' && !insideServices) { e.preventDefault(); go(slides.length - 1); return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    go(i + (e.key === 'ArrowRight' ? 1 : -1));
  });
  // 마우스로 끌어서 넘기기. 끈 뒤에는 그림 크게 보기가 열리지 않게 클릭을 막음
  let sx = null, sl = 0, si = 0, moved = false;
  track.addEventListener('dragstart', (e) => e.preventDefault());
  track.addEventListener('pointerdown', (e) => {
    moved = false;
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    sx = e.clientX; sl = track.scrollLeft; si = i;
  });
  addEventListener('pointermove', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('dragging'); }
    if (moved) track.scrollLeft = sl - dx;
  });
  addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (!moved) return;
    // 'dragging'(장 맞춤 끔)은 미끄러짐이 끝난 뒤 scroll 정착에서 해제. 움직임이 없으면 1.2초 뒤 해제
    go(Math.abs(dx) > 50 ? si + (dx < 0 ? 1 : -1) : si);
    clearTimeout(gliding);
    gliding = setTimeout(endGlide, 1200);
    // 끈 직후의 클릭 한 번만 막고, 손을 다른 곳에서 떼어 클릭이 안 생겼어도 다음 누름은 살림
    setTimeout(() => { moved = false; }, 0);
  });
  root.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  // 트랙패드 가로 밀기·shift+휠: 스냅이 작은 휠 이동을 되돌리므로 직접 받아 한 번에 한 장씩. 세로 휠은 페이지 스크롤로 둠
  let acc = 0, quiet = 0, locked = false;
  track.addEventListener('wheel', (e) => {
    if (document.querySelector('dialog[open]') || e.ctrlKey) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? track.clientWidth : 1;
    const dx = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0) * unit;
    if (!dx) return;
    e.preventDefault();
    clearTimeout(quiet);
    quiet = setTimeout(() => { locked = false; acc = 0; }, 180);
    if (locked) return;
    acc += dx;
    if (Math.abs(acc) >= 40) { locked = true; go(i + (acc > 0 ? 1 : -1)); }
  }, { passive: false });
  addEventListener('pointercancel', () => { sx = null; moved = false; endGlide(); });
  addEventListener('resize', () => track.scrollTo({ left: x(Math.max(i, 0)) }));
  show(0);
  return { go, get index() { return i; }, size: slides.length };
};
// 목록의 기간: '2017—18', '2008—' 같은 연도 표기에서 가장 이른 해와 가장 늦은 해
window.span = (list) => {
  const ys = list.flatMap((b) => {
    const m = String(b.yr).match(/(\d{4})(?:—(\d{2,4}))?/);
    if (!m) return [];
    const a = +m[1];
    const z = m[2] ? +(m[2].length === 2 ? String(a).slice(0, 2) + m[2] : m[2]) : a;
    return [a, z];
  });
  return `${Math.min(...ys)}—${Math.max(...ys)}`;
};
// 넘기기 버튼 아이콘
window.ARROW = (dir) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
