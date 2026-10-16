// 배치 후보 공통 도구: 글자를 안전하게 넣기, 바깥 링크, 별 스티커, 그림을 누르면 크게 보기
window.h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
window.ext = (url) => `href="${h(url)}" target="_blank" rel="noopener noreferrer"`;
window.STAR = '<svg class="star" viewBox="0 0 130 130" aria-hidden="true"><path d="M64 8L69 48L99 20L79 57L121 52L83 69L111 99L74 80L80 122L62 83L33 110L49 74L8 79L46 61L18 32L56 48Z"/></svg>';
// 그림 종이 한 장(누르면 크게 보기). window.print는 브라우저 인쇄라 이름을 paper로 씀
window.paper = (src, alt, { cls = '', label = '', pos = '', full = src } = {}) =>
  `<button type="button" class="print sheet ${cls}" data-full="${h(full)}"><span class="pic"><img src="${h(src)}" alt="${h(alt)}"${pos ? ` style="object-position:${h(pos)}"` : ''}></span>${label ? `<span class="label">${h(label)}</span>` : ''}</button>`;

(() => {
  const lb = document.createElement('dialog');
  lb.className = 'lb';
  lb.setAttribute('aria-label', '크게 보기');
  lb.innerHTML = '<button type="button" class="lb-close">닫기 ×</button><img alt="">';
  document.body.append(lb);
  const img = lb.querySelector('img');
  let opener = null;
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-full]');
    if (!t) return;
    opener = t;
    img.src = t.dataset.full;
    img.alt = (t.querySelector('img') || {}).alt || '';
    lb.showModal();
  });
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', () => { img.removeAttribute('src'); if (opener) opener.focus({ preventScroll: true }); });
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
