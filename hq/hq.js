/* HQ · Two Different Socks – liest /hq/data.json und baut die Seite. Kein Framework, keine externen Aufrufe. */
(function () {
  'use strict';

  var ICONS = {
    cart: '<path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    megaphone: '<path d="M4 10v4h3l7 4V6L7 10H4z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.2-1-1.6-1-2.6 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    scale: '<path d="M12 4v16M6 20h12M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0L5 7zM19 7l-3 6a3 3 0 0 0 6 0l-3-6z"/>'
  };
  var STATUS = { ok: 'Alles gut', warn: 'Läuft', todo: 'Braucht dich' };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(name, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function tint(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function spark(values, color, cls) {
    var w = 300, h = 48, pad = 4;
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    var span = max - min || 1;
    var pts = values.map(function (v, i) {
      var x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1);
      var y = max === min ? h - pad - 2 : h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + h + ' L' + pts[0][0].toFixed(1) + ' ' + h + ' Z';
    var last = pts[pts.length - 1];
    return '<svg class="' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + area + '" fill="' + tint(color, 0.12) + '"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.5" fill="' + color + '"/></svg>';
  }
  function daysUntil(iso) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var p = iso.split('-').map(Number);
    var target = new Date(p[0], p[1] - 1, p[2]);
    if (target < today) target = new Date(today.getFullYear() + 1, p[1] - 1, p[2]);
    return Math.round((target - today) / 86400000);
  }
  function greeting() {
    var h = new Date().getHours();
    if (h < 11) return 'Guten Morgen';
    if (h < 17) return 'Servus';
    return 'Guten Abend';
  }

  function render(d) {
    var now = new Date();
    document.getElementById('today').textContent = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('hello').textContent = greeting() + ', ' + (d.anrede || 'Chef') + '.';
    document.getElementById('summary').textContent = d.summary || '';
    var upd = new Date(d.updated);
    document.getElementById('stand').innerHTML = '<i class="dot dot--ok"></i><span class="txt">Stand ' +
      esc(upd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ', ' + upd.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })) + '</span>';

    // Kennzahlen
    var kpis = document.getElementById('kpis');
    kpis.innerHTML = '';
    d.kpis.forEach(function (k) {
      var value = k.value;
      var series = k.spark;
      if (k.kind === 'christmas') {
        var left = daysUntil(d.christmas || (now.getFullYear() + '-12-24'));
        value = String(left);
        series = [7, 6, 5, 4, 3, 2, 1].map(function (n) { return left + n; }).concat([left]);
      }
      if (k.kind === 'todos') value = String(d.todos.length);
      var card = el('div', 'kpi');
      card.innerHTML = '<span class="kpi__label">' + esc(k.label) + '</span><span class="kpi__value">' + esc(value) + '</span>' +
        (series ? spark(series, k.kind === 'christmas' ? '#D7263D' : '#0A0A0A') : '');
      kpis.appendChild(card);
    });

    // Projekte an der Leine
    var projects = document.getElementById('projects');
    projects.innerHTML = '';
    var rot = ['-1.5deg', '1.2deg', '-0.6deg'];
    d.projects.forEach(function (p, i) {
      var light = p.id === 'mwi' || p.id === 'p4k' || p.id === 'vin';
      var a = el('a', 'proj');
      a.href = p.hq ? p.hq : (p.teams.length ? '#p-' + p.id : (p.url || '#'));
      if (p.hq) { a.target = '_blank'; a.rel = 'noopener'; }
      a.style.setProperty('--r', rot[i % rot.length]);
      a.style.background = p.color;
      a.style.color = light ? '#fff' : '#0A0A0A';
      var moreBg = p.id === 'mwi' ? p.color3 : p.color2;
      var moreFg = p.id === 'p4k' ? p.color : '#0A0A0A';
      a.innerHTML = '<span class="proj__tag" style="color:' + (p.id === 'vin' ? p.color2 : 'inherit') + '">' + esc(p.tag) + '</span>' +
        '<span class="proj__name">' + esc(p.name) + '</span>' +
        '<span class="proj__text">' + esc(p.headline) + '</span>' +
        '<span class="proj__more" style="background:' + moreBg + ';color:' + moreFg + '"><i class="dot dot--' + p.status + '"></i>' +
        (p.hq ? 'Zum VINWEAR-HQ ↗' : p.teams.length ? p.teams.length + ' Teams ansehen ↓' : 'Kein eigenes HQ') + '</span>';
      projects.appendChild(a);
    });

    // Bereiche pro Projekt mit Teams
    var host = document.getElementById('project-sections');
    host.innerHTML = '';
    d.projects.filter(function (p) { return p.teams.length; }).forEach(function (p) {
      var sec = el('section', 'psec');
      sec.id = 'p-' + p.id;
      sec.style.setProperty('--c', p.color);
      sec.innerHTML = '<div class="psec__head"><h2>' + esc(p.name) + '</h2>' +
        (p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.url.replace('https://', '')) + ' ↗</a>' : '') +
        '</div><h3 class="section-title">Berichte der Teams</h3>';
      var grid = el('div', 'teams');
      p.teams.forEach(function (t) {
        var card = el('article', 'team');
        card.id = 'p-' + p.id + '-' + t.id;
        card.style.setProperty('--c', p.color);
        card.style.setProperty('--tint', tint(p.color, 0.09));
        var chips = '<span class="chip chip--agent"><span class="av">' + esc(t.agent.name.charAt(0)) + '</span>' + esc(t.agent.name) + ' fragen</span>';
        if (t.chips && t.chips.meldungen) chips += '<span class="chip chip--hot">' + t.chips.meldungen + (t.chips.meldungen === 1 ? ' Meldung' : ' Meldungen') + '</span>';
        if (t.chips && t.chips.freigabe) chips += '<span class="chip chip--hot">' + t.chips.freigabe + ' zur Freigabe</span>';
        card.innerHTML =
          '<div class="team__head"><span class="team__icon">' + icon(t.icon) + '</span>' +
          '<div><h4 class="team__name">' + esc(t.name) + '</h4><div class="team__sub">' + esc(t.sub) + '</div></div>' +
          '<span class="pill"><i class="dot dot--' + t.status + '"></i>' + STATUS[t.status] + '</span></div>' +
          '<p class="team__headline">' + esc(t.headline) + '</p>' +
          spark(t.spark, p.color, 'spark') +
          '<div class="cap">' + esc(t.sparkCaption) + '</div>' +
          '<div class="metrics">' + t.metrics.map(function (m) {
            return '<div class="metric"><span>' + esc(m[0]) + '</span><b>' + esc(m[1]) + '</b></div>';
          }).join('') + '</div>' +
          (t.list ? '<div class="list">' + t.list.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' : '') +
          (t.facts ? '<div class="cap" style="margin-top:0">' + t.facts.map(esc).join(' · ') + '</div>' : '') +
          '<p class="agent"><b>' + esc(t.agent.name) + ':</b> ' + esc(t.agent.line) + '</p>' +
          '<div class="chips">' + chips + '</div>';
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      host.appendChild(sec);
    });

    // To-dos
    var colors = {};
    d.projects.forEach(function (p) { colors[p.id] = p.color; });
    var list = document.getElementById('todo-list');
    list.innerHTML = '';
    d.todos.forEach(function (t) {
      var li = el('li');
      li.innerHTML = '<span>' + esc(t.text) + '</span><span class="swatch" style="background:' + (colors[t.project] || '#BDBDBD') + '" title="' + esc(t.project) + '"></span>';
      list.appendChild(li);
    });

    // Seitenleiste
    var side = document.getElementById('side');
    var html = '<a href="#top" class="on" data-nav="top">Lagebericht</a><div class="side__group">Projekte</div>';
    d.projects.forEach(function (p) {
      var sw = '<span class="swatch" style="background:' + p.color + '"></span>';
      if (p.hq) {
        html += '<a href="' + esc(p.hq) + '" target="_blank" rel="noopener">' + sw + esc(p.name) + '<span class="ext">↗</span></a>';
      } else if (p.teams.length) {
        html += '<a href="#p-' + p.id + '" data-nav="p-' + p.id + '">' + sw + esc(p.name) + '<i class="dot dot--' + p.status + '"></i></a>';
        p.teams.forEach(function (t) {
          html += '<a class="sub" href="#p-' + p.id + '-' + t.id + '">' + esc(t.name) + '<i class="dot dot--' + t.status + '"></i></a>';
        });
      } else {
        html += '<a href="' + esc(p.url || '#') + '">' + sw + esc(p.name) + '</a>';
      }
    });
    html += '<div class="side__group">Du</div><a href="#todos" data-nav="todos">To-dos<i class="dot dot--warn"></i></a>';
    side.innerHTML = html;
  }

  function load() {
    var btn = document.getElementById('reload');
    btn.classList.add('spin');
    return fetch('/hq/data.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(render)
      .catch(function () {
        document.getElementById('stand').innerHTML = '<i class="dot dot--todo"></i><span class="txt">Daten nicht geladen</span>';
      })
      .then(function () { btn.classList.remove('spin'); });
  }

  document.documentElement.id = 'top';
  document.getElementById('reload').addEventListener('click', load);
  load();
})();
