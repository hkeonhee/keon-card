'use strict';
const C = window.R;
const $ = (selector) => document.querySelector(selector);
const cards = [...$('#track').children];
let lang = 'ko';
let requestedLang = new URLSearchParams(location.search).get('lang');
if (!requestedLang) { try { requestedLang = localStorage.getItem('keon-resume-language'); } catch {} }
if (requestedLang === 'en') lang = 'en';
const loc = (item, key) => lang === 'en' && item.en?.[key] !== undefined ? item.en[key] : item[key];
const ui = (key) => C.i18n[lang][key];
const sectionIds = cards.map(card => card.id);
const names = () => [ui('cover'), ui('webtoon'), ui('services'), ui('before'), ui('note'), ui('contact')];
$('#chapters').innerHTML = sectionIds.map((id, k) => `<button type="button" data-go="${k}"><span class="seg"></span><span class="lbl"></span></button>`).join('');
$('.deck-prev').innerHTML = ARROW('prev');
$('.deck-next').innerHTML = ARROW('next');
$('#year').textContent = new Date().getFullYear();

function external(el, url, text) {
  el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer';
  if (text !== undefined) el.textContent = text;
}
function renderService(key, artId, textId) {
  const p = C.launched.find(project => project.key === key);
  $(artId).innerHTML = key === 'tm'
    ? `<p class="wm" aria-hidden="true">TOON<br>MILL<i>.</i></p><div class="tm-prints">${p.imgs.map(([src, alt], k) => paper(src, lang === 'en' ? p.en.alts[k] : alt, { pos: '50% 0', lazy: true })).join('')}</div>`
    : `<p class="wm" aria-hidden="true">ASTRA<br>SEER<i>.</i></p><div class="fan">${p.imgs.map(([src, alt], k) => paper(src, lang === 'en' ? p.en.alts[k] : alt, { lazy: true })).join('')}</div>`;
  $(textId).innerHTML = `<div class="svc-top"><h3 id="${key === 'tm' ? 'toonmill-name' : 'byeol-name'}">${h(loc(p, 'name'))}</h3><span class="status${key === 'bb' ? ' hot' : ''}">${h(loc(p, 'status'))}</span></div>
    <p class="service-title">${h(loc(p, 't'))}</p><p class="d">${h(loc(p, 'd'))}</p>
    <p class="meta"><b>${h(loc(p, 'yr'))}</b> ${h(loc(p, 'role'))}</p>
    <a class="go" ${ext(p.link[1])}>${h(p.link[0])} ↗</a>`;
}
function applyLanguage(next) {
  lang = next === 'en' ? 'en' : 'ko';
  document.documentElement.lang = lang;
  document.title = ui('title');
  $('meta[name="description"]').content = ui('description');
  $('meta[property="og:title"]').content = ui('title');
  $('meta[property="og:description"]').content = ui('description');
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = ui(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = ui(el.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', ui(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = ui(el.dataset.i18nAlt); });
  document.querySelectorAll('[data-lang]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.lang === lang)));
  document.querySelectorAll('#chapters [data-go]').forEach((el, k) => {
    el.querySelector('.lbl').textContent = names()[k];
    el.setAttribute('aria-label', `${k + 1}. ${names()[k]}`);
  });
  cards.forEach((card, k) => {
    card.setAttribute('role', 'group'); card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `${k + 1} / ${cards.length} · ${names()[k]}`);
  });
  // 표지 원화: 누르면 그린 과정(단계 그림 또는 타임랩스)을 확대 창에서 재생
  $('#c1art').innerHTML = Object.values(C.process).map(p => paper(p.thumb, loc(p, 'alt'), {
    aria: loc(p, 'open'),
    data: p.steps ? { steps: p.steps.join(' '), caption: loc(p, 'caption') } : { video: p.video, poster: p.poster, caption: loc(p, 'caption') },
  })).join('');
  $('#milestones').innerHTML = C.webtoon.map(item => `<li><b>${h(item.big)}${item.key === 'langs' ? `<small>${h(loc(item, 'cap'))}</small>` : ''}</b><div><h3>${h(loc(item, 't'))}</h3><p>${h(loc(item, 'd'))}</p></div></li>`).join('');
  $('#editions').innerHTML = C.editions.map(edition => `<div class="edition" data-edition="${h(edition.k)}">
    ${paper(edition.img, lang === 'en' ? edition.enAlt : edition.alt, {pos:edition.pos || '50% 0', lazy:true})}
    <a ${ext(edition.url)} aria-label="${h(edition.lang)} · ${h(loc(edition, 'p'))} · VOID MAN"><span class="edition-lang"><b>${h(edition.k)}</b><span aria-hidden="true">↗</span></span><span class="edition-platform">${h(loc(edition, 'p'))}</span></a>
  </div>`).join('');
  renderService('tm', '#toonmill-art', '#toonmill-copy');
  renderService('bb', '#byeol-art', '#byeol-copy');
  $('#history').innerHTML = C.before.map(item => `<li><span class="yr">${h(item.yr)}</span><span class="t">${h(loc(item, 't'))}${loc(item, 's') ? `<small>${h(loc(item, 's'))}</small>` : ''}</span></li>`).join('');
  $('#before-range').textContent = span(C.before);
  const readUrl = lang === 'en' ? C.editions.find(edition => edition.k === 'EN').url : C.naver;
  external($('#read-cover'), readUrl);
  // 연락처 저장: 같은 사이트의 vCard 파일. download 지정이 없어야 아이폰이 연락처 미리보기를 연다
  $('#save-contact').href = C.vcard[lang];
  external($('#follow-cover'), C.insta);
  external($('#contact-insta'), C.insta);
  if (C.email) {
    $('#contact-description').textContent = C.email;
    $('#contact-link').href = `mailto:${C.email}?subject=${encodeURIComponent(ui('emailSubject'))}`;
    $('#contact-link').removeAttribute('target'); $('#contact-link').removeAttribute('rel');
    $('#contact-link').textContent = ui('emailContact'); $('#copy-email').hidden = false; $('#contact-insta').hidden = false;
  } else {
    $('#contact-description').textContent = ui('instagramDescription');
    external($('#contact-link'), C.insta, ui('instagramContact')); $('#copy-email').hidden = true; $('#contact-insta').hidden = true;
  }
  $('#contact-status').textContent = '';
  $('.lb').setAttribute('aria-label', ui('zoom'));
  Object.assign(LB, { zoom: ui('zoom'), pause: ui('pause'), play: ui('play') });
  $('.lb-close').textContent = ui('close');
  $('#now').textContent = names()[Number(document.body.dataset.card) || 0];
  try { localStorage.setItem('keon-resume-language', lang); } catch {}
  wake(Number(document.body.dataset.card) || 0);
  markMore();
}
const markMore = () => cards.forEach(card => card.classList.toggle('more-below', card.scrollHeight - card.clientHeight - card.scrollTop > 2));
// 처음 열 때 받는 양을 줄이려고, 그림은 보이는 장과 그 앞뒤 장만 받음(.woke: 연락 장 먹 그림도 이때)
const wake = (n) => cards.forEach((card, k) => {
  if (Math.abs(k - n) > 1) return;
  card.classList.add('woke');
  card.querySelectorAll('img[data-src]').forEach(img => { img.addEventListener('load', markMore, {once:true}); img.src = img.dataset.src; img.removeAttribute('data-src'); });
  card.querySelectorAll('source[data-srcset]').forEach(source => { source.srcset = source.dataset.srcset; source.removeAttribute('data-srcset'); });
});
applyLanguage(lang);

const d = deck(document.body, {
  onChange(n) {
    document.body.dataset.card = n;
    document.querySelectorAll('#chapters [data-go]').forEach((button, k) => button.classList.toggle('done', k < n));
    cards.forEach((card, k) => { card.inert = k !== n; });
    $('#now').textContent = names()[n];
    if (n) document.documentElement.classList.remove('intro-done');
    wake(n);
    markMore();
  }
});
function goToHash() {
  const id = location.hash.slice(1);
  const service = id === 'toonmill' || id === 'byeolbyeoljeom' ? document.getElementById(id) : null;
  const n = sectionIds.indexOf(service ? 'services' : id);
  if (n >= 0) d.go(n);
  if (service) $('.services-scroll').scrollTo({top:service.offsetTop, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
goToHash();
addEventListener('hashchange', goToHash);
// 첫 방문(2026-10-17): 공유 그림처럼 원화가 화면을 채운 포스터로 열고, 원화는 표지 그림 띠로 내려가며 KEON은 표지 KEON 자리로 올라감.
// <head>의 한 줄이 html.intro-wait를 붙인 경우만 돈다(주소에 #이 없고, 움직임 줄이기가 꺼져 있고, 이 창에서 처음).
// 그림·글꼴이 1.5초 안에 준비되지 않으면 건너뛰고, 누르거나 키·휠을 쓰면 바로 끝 모습으로 간다(그 누름은 아래 표지 그림을 열지 않음).
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('intro-wait')) return;
  try { sessionStorage.setItem('keon-intro', '1'); } catch {}
  const cover = $('#cover'), big = cover.querySelector('.big'), strip = $('#c1art');
  const o = document.createElement('div');
  o.className = 'intro';
  o.setAttribute('aria-hidden', 'true');
  o.innerHTML = `<div class="intro-art">${[...strip.querySelectorAll('img')].map(img => `<img alt="" src="${h(img.getAttribute('src'))}">`).join('')}</div><div class="intro-shade"></div>`;
  const art = o.firstChild;
  // KEON은 표지와 같은 글씨(.big)를 복제해 표지 KEON 자리에 두고, 처음에는 화면 가운데로 옮겨 둔다
  const mark = document.createElement('p');
  mark.className = 'big intro-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = big.textContent;
  art.style.opacity = 0; mark.style.opacity = 0;
  document.body.append(o, mark);
  let state = 'wait', anims = [];
  const done = (keep) => {
    if (state === 'gone') return;
    if (state === 'run') {
      root.classList.add('intro-done');
      cover.getAnimations({ subtree: true }).forEach(a => { if (a.effect.getComputedTiming().endTime !== Infinity) a.finish(); });
    }
    state = 'gone';
    clearTimeout(timer);
    anims.forEach(a => a.cancel());
    mark.remove();
    root.classList.remove('intro-wait', 'intro-run');
    removeEventListener('keydown', skip, true); removeEventListener('wheel', skip, true); removeEventListener('resize', skip);
    if (!keep) { o.remove(); return; }
    // 누른 손가락의 click을 덮개가 받아 버린 뒤 치움
    o.style.opacity = 0;
    o.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); o.remove(); }, { once: true });
    setTimeout(() => o.remove(), 700);
  };
  const skip = () => done(false);
  const begin = () => {
    if (state !== 'wait') return;
    state = 'run';
    clearTimeout(timer);   // 준비를 기다리는 시간 제한은 시작하면 끝(남겨 두면 첫 등장이 중간에 끊김)
    root.classList.replace('intro-wait', 'intro-run');
    // 표지 글씨 등장을 이 순간부터 다시(지연값은 intro-run 규칙), 장 전환 효과 없이
    cover.style.transition = 'none'; cover.classList.remove('is-on'); void cover.offsetWidth; cover.classList.add('is-on'); void cover.offsetWidth; cover.style.transition = '';
    const k = big.getBoundingClientRect();
    Object.assign(mark.style, { left: `${k.left}px`, top: `${k.top}px`, width: `${k.width}px`, opacity: '' });
    art.style.opacity = '';
    const m = mark.getBoundingClientRect(), r = strip.getBoundingClientRect();
    const dx = innerWidth / 2 - (m.left + m.width / 2), dy = innerHeight / 2 - (m.top + m.height / 2);
    const ease = 'cubic-bezier(.65,0,.35,1)', T = 850, D = 900, END = T + D;
    anims = [
      art.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'both' }),
      o.animate([{ left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px` }, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` }], { duration: D, delay: T, easing: ease, fill: 'both' }),
      o.querySelector('.intro-shade').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: T, fill: 'both' }),
      mark.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], { duration: D, delay: T, easing: ease, fill: 'both' }),
      // 도착하면 같은 자리의 진짜 표지 KEON으로 바꾸고, 원화 덮개는 그림 띠 위에서 녹아 사라짐
      mark.animate([{ opacity: 0 }, { opacity: 1, offset: 200 / END }, { opacity: 1, offset: 0.9995 }, { opacity: 0 }], { duration: END, fill: 'both' }),
      big.animate([{ opacity: 0 }, { opacity: 0, offset: 0.9995 }, { opacity: 1 }], { duration: END, fill: 'both' }),
      o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, delay: END, fill: 'both' }),
    ];
    // 표지 그림 띠의 느린 숨쉬기와 같은 위상
    art.querySelectorAll('img').forEach((img, i) => img.animate([{ scale: 1.14 }, { scale: 1.19 }], { duration: 18000, delay: -6000 * i, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
    Promise.all(anims.map(a => a.finished)).then(() => done(false), () => {});
  };
  const timer = setTimeout(skip, 1500);
  o.addEventListener('pointerdown', e => { e.preventDefault(); done(true); });
  addEventListener('keydown', skip, true); addEventListener('wheel', skip, { capture: true, passive: true }); addEventListener('resize', skip);
  Promise.all([
    ...[...art.querySelectorAll('img')].map(img => img.decode().then(() => { if (!img.naturalWidth) throw new Error('no image'); })),
    document.fonts.load('500 100px "Cormorant Garamond"', 'KEON').then(faces => { if (!faces.length) throw new Error('no font'); }),
  ]).then(begin, skip);
})();
$('.logo').addEventListener('click', event => { event.preventDefault(); d.go(0); });
document.querySelectorAll('.service-jumps a').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const service = document.querySelector(link.getAttribute('href'));
  $('.services-scroll').scrollTo({top:service.offsetTop, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}));
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  applyLanguage(button.dataset.lang);
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
}));
$('#copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(C.email); $('#contact-status').textContent = ui('emailCopied'); }
  catch { $('#contact-status').textContent = C.email; }
});
cards.forEach(card => card.addEventListener('scroll', markMore, {passive:true}));
addEventListener('resize', markMore);
document.fonts.ready.then(markMore);
document.querySelectorAll('#track img').forEach(image => image.addEventListener('load', markMore, {once:true}));

function scrollsInside(el, dy) {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(node).overflowY)) {
      if (dy > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 0) return true;
    }
    if (node.classList?.contains('card')) break;
  }
  return false;
}
let acc = 0, quiet = 0, locked = false;
addEventListener('wheel', event => {
  if ($('dialog[open]') || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.shiftKey || event.ctrlKey) return;
  // 서비스 두 개는 같은 장에서 세로로 읽는다. 끝에 닿아도 다른 장으로 넘어가지 않는다.
  if (cards[d.index].id === 'services') return;
  if (scrollsInside(event.target, event.deltaY)) return;
  event.preventDefault();
  clearTimeout(quiet);
  quiet = setTimeout(() => { locked = false; acc = 0; }, 180);
  if (locked) return;
  acc += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  if (Math.abs(acc) >= 40) { locked = true; d.go(d.index + (acc > 0 ? 1 : -1)); }
}, {passive:false});

// Motion follows the printed-card artwork; navigation and touch scrolling stay native.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  const cover = document.getElementById('cover');
  const reset = () => {
    cancelAnimationFrame(frame);
    cover.style.removeProperty('--light-x');
    cover.style.removeProperty('--light-y');
    cards.forEach(card => {
      card.style.removeProperty('--art-rx');
      card.style.removeProperty('--art-ry');
      card.style.removeProperty('--px');
    });
  };
  // Depth: while the deck moves, each card's artwork lags a little behind its card (--px is -1..1 from the centre).
  const track = document.getElementById('track');
  let depthFrame = 0;
  const depth = () => {
    depthFrame = 0;
    const mid = track.scrollLeft + track.clientWidth / 2;
    cards.forEach(card => {
      const p = (card.offsetLeft + card.offsetWidth / 2 - mid) / card.offsetWidth;
      card.style.setProperty('--px', Math.max(-1, Math.min(1, p)).toFixed(3));
    });
  };
  track.addEventListener('scroll', () => { if (!motion.matches && !depthFrame) depthFrame = requestAnimationFrame(depth); }, {passive:true});
  document.getElementById('track').addEventListener('pointermove', event => {
    if (motion.matches || !finePointer.matches || event.buttons || document.querySelector('dialog[open]')) return;
    const card = event.target.closest('.card.is-on');
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      card.style.setProperty('--art-rx', `${(0.5 - y) * 2}deg`);
      card.style.setProperty('--art-ry', `${(x - 0.5) * 3}deg`);
      if (card === cover) {
        card.style.setProperty('--light-x', `${x * 100}%`);
        card.style.setProperty('--light-y', `${y * 100}%`);
      }
    });
  }, {passive:true});
  document.getElementById('track').addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting));
    }, {root:document.querySelector('.services-scroll'), threshold:.15});
    document.querySelectorAll('.service-panel').forEach(panel => observer.observe(panel));
  }
})();
