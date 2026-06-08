/* ══════════════════════════════════
   DATA
══════════════════════════════════ */
var SVC_CATS = ['windows','networking','hardware','education'];

var SVC_LABELS = {
  windows:    'Windows Support',
  networking: 'Networking',
  hardware:   'Hardware',
  education:  'Education & Guidance'
};

var SVC_COUNTS = { windows:4, networking:3, hardware:3, education:3 };

var SVC_ITEMS = {
  windows: [
    { name: 'Slowness & Performance Tuning', desc: 'Startup optimization, bloatware removal, resource management.' },
    { name: 'Virus & Malware Removal',        desc: 'Full scan and clean using professional tools.' },
    { name: 'OS Reinstall & Setup',           desc: 'Fresh Windows install, drivers, updates, software.' },
    { name: 'Driver & Update Issues',         desc: 'Failed updates, missing drivers, compatibility problems.' }
  ],
  networking: [
    { name: 'Wi-Fi Troubleshooting',     desc: 'Dead zones, dropped connections, slow speeds.' },
    { name: 'Router & Modem Setup',      desc: 'New equipment, ISP config, guest networks, security.' },
    { name: 'Home Network Organization', desc: 'Device management, parental controls, ad blocking.' }
  ],
  hardware: [
    { name: 'RAM & SSD Upgrades',    desc: 'Source and install compatible components.' },
    { name: 'Peripheral Setup',       desc: 'Printers, monitors, drives, webcams — configured and tested.' },
    { name: 'Data Backup & Transfer', desc: 'Local or cloud backup, migrate between machines.' }
  ],
  education: [
    { name: 'Device Walkthroughs',           desc: 'One-on-one sessions for laptops, tablets, smartphones.' },
    { name: 'Security & Scam Awareness',     desc: 'Phishing, passwords, and what to actually worry about.' },
    { name: 'Email, Cloud & Password Setup', desc: 'Gmail, iCloud, OneDrive, password managers.' }
  ],
  consult: [
    { name: 'Not sure what I need',  desc: "Describe what's going on and we'll figure it out together." },
    { name: 'Get a price estimate',  desc: "Tell me your issue and I'll give you a rough time and cost." },
    { name: 'Ask a quick question',  desc: 'Something simple you just need a straight answer on.' }
  ],
  other: [
    { name: 'Something not on the list', desc: "Describe your issue — I'll let you know if I can help." }
  ]
};

var FORMSPREE_ID = 'mykvplrn';

/* ══════════════════════════════════
   STATE
══════════════════════════════════ */
var flowType     = null;
var selCats      = {};
var activeCat    = null;
var catQueue     = [];
var contactData  = null;
var sheetStep    = 0;
var cameFromChoice = false;
var sheetStepId  = 'choice';
var freshSubOpts = false;

/* ══════════════════════════════════
   ENTRY POINTS
══════════════════════════════════ */

/* email link / float btn: ask services or consult */
function openEmailSheet() {
  resetState();
  flowType       = null;
  cameFromChoice = true;
  sheetStepId    = 'choice';
  renderSheet();
  document.getElementById('sheet-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openServicesSheet() {
  resetState();
  flowType       = 'services';
  cameFromChoice = false;
  sheetStepId    = 'cats';
  renderSheet();
  document.getElementById('sheet-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* Direct category (desktop cards or 'other') */
function openSheet(cat) {
  resetState();
  if (cat === 'consult') {
    flowType           = 'consult';
    sheetStepId        = 'subopts';
    activeCat          = 'consult';
    selCats['consult'] = [];
    freshSubOpts       = true;
  } else if (cat === 'other') {
    flowType     = 'other';
    sheetStepId  = 'subopts';
    activeCat    = 'other';
    freshSubOpts = true;
  } else {
    flowType      = 'services';
    sheetStepId   = 'subopts';
    activeCat     = cat;
    selCats[cat]  = [];
    freshSubOpts  = true;
  }
  renderSheet();
  document.getElementById('sheet-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function resetState() {
  selCats        = {};
  activeCat      = null;
  catQueue       = [];
  contactData    = null;
  flowType       = null;
  cameFromChoice = false;
  sheetStepId    = 'choice';
  freshSubOpts   = false;
}

/* ══════════════════════════════════
   CLOSE
══════════════════════════════════ */
function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.body.style.overflow = '';
  updateFloatBtn();
}
function closeSheetOnOverlay(e) {
  if (e.target === document.getElementById('sheet-overlay')) closeSheet();
}

/* ══════════════════════════════════
   RENDER ROUTER
══════════════════════════════════ */
function renderSheet() {
  updatePips();
  document.getElementById('sheet-body').scrollTop = 0;
  if      (sheetStepId === 'choice')  renderChoice();
  else if (sheetStepId === 'cats')    renderCatPicker();
  else if (sheetStepId === 'subopts') renderSubOpts();
  else if (sheetStepId === 'contact') renderContact();
  else                                renderDone();
}

function pipCount() {
  if (sheetStepId === 'choice')  return {total:2, active:1};
  if (sheetStepId === 'cats')    return {total:3, active:1};
  if (sheetStepId === 'subopts') return {total: (flowType==='consult'||flowType==='other') ? 3:4, active:2};
  if (sheetStepId === 'contact') return {total: (flowType==='consult'||flowType==='other') ? 3:4, active: (flowType==='consult'||flowType==='other') ? 2:3};
  return {total:4, active:4};
}

function updatePips() {
  var pc = pipCount();
  for (var n=1; n<=4; n++) {
    var p = document.getElementById('pip'+n);
    if (n > pc.total) { p.style.display='none'; continue; }
    p.style.display='';
    p.className = 'pip' + (n < pc.active ? ' done' : n===pc.active ? ' active' : '');
  }
}

/* ══════════════════════════════════
   STEP: EMAIL CHOICE
══════════════════════════════════ */
function renderChoice() {
  document.getElementById('sheet-label').textContent = '// get_in_touch.sh';
  document.getElementById('sheet-body').innerHTML =
    '<div class="sheet-cmd">$ ./contact <span>--mode=select</span></div>' +
    '<div class="sheet-h2">How can I help?</div>' +
    '<div class="sheet-sub">Select what you\'re looking for and I\'ll get you to the right place.</div>' +
    '<div class="cat-row" onclick="pickFlow(\'services\')">' +
      '<div class="cat-icon">⚙</div>' +
      '<div class="cat-text"><div class="cat-name">Services</div><div class="cat-desc">On-site tech support</div></div>' +
      '<div class="cat-arrow">›</div>' +
    '</div>' +
    '<div class="cat-row" onclick="pickFlow(\'consult\')">' +
      '<div class="cat-icon">💬</div>' +
      '<div class="cat-text"><div class="cat-name">Free Consultation</div><div class="cat-desc">Not sure what you need? Let\'s talk.</div></div>' +
      '<div class="cat-arrow">›</div>' +
    '</div>';

  document.getElementById('sheet-actions').innerHTML =
    '<button class="sheet-btn-secondary" onclick="closeSheet()">[ ESC ] Cancel</button>' +
    '<button class="sheet-btn-primary" disabled>CONTINUE →</button>';
}

function pickFlow(type) {
  flowType       = type;
  cameFromChoice = true;
  if (type === 'services') {
    sheetStepId = 'cats';
  } else {
    sheetStepId        = 'subopts';
    activeCat          = 'consult';
    selCats['consult'] = [];
    freshSubOpts       = true;
  }
  renderSheet();
}

/* ══════════════════════════════════
   STEP: CATEGORY PICKER
══════════════════════════════════ */
function renderCatPicker() {
  document.getElementById('sheet-label').textContent = '// select_services.sh';
  var rows = SVC_CATS.map(function(cat) {
    var checked = selCats[cat] !== undefined;
    return '<div class="opt-row' + (checked?' selected':'') + '" id="cat-'+cat+'" onclick="toggleCat(\''+cat+'\')">' +
      '<div class="opt-indicator" id="catind-'+cat+'">' + (checked?'✓':'') + '</div>' +
      '<div class="opt-text">' +
        '<div class="opt-name">'+SVC_LABELS[cat]+'</div>' +
        '<div class="opt-desc">'+SVC_COUNTS[cat]+' services available</div>' +
      '</div></div>';
  }).join('');

  document.getElementById('sheet-body').innerHTML =
    '<div class="sheet-cmd">$ ./services <span>--select-categories</span></div>' +
    '<div class="sheet-h2">Which services do you need?</div>' +
    '<div class="sheet-sub">Select all that apply — we\'ll go through each one.</div>' +
    '<div class="sheet-rate-badge">// Get Estimate &nbsp;·&nbsp; Free Consultation</div>' +
    '<div class="options-list">' + rows + '</div>';

  document.getElementById('sheet-actions').innerHTML =
    '<button class="sheet-btn-secondary" onclick="goBackFromCats()">← BACK</button>' +
    '<button class="sheet-btn-primary" id="btn-cats" onclick="startCatDrill()" ' + (Object.keys(selCats).length===0?'disabled':'') + '>CONTINUE →</button>';
}

function toggleCat(cat) {
  if (selCats[cat] !== undefined) {
    delete selCats[cat];
    document.getElementById('cat-'+cat).classList.remove('selected');
    document.getElementById('catind-'+cat).textContent = '';
  } else {
    selCats[cat] = [];
    document.getElementById('cat-'+cat).classList.add('selected');
    document.getElementById('catind-'+cat).textContent = '✓';
  }
  var btn = document.getElementById('btn-cats');
  if (btn) btn.disabled = Object.keys(selCats).length === 0;
}

function goBackFromCats() {
  /* if we got here from the email choice screen, go back to it */
  /* if we got here directly from a card tap, just close */
  if (flowType === 'services' && cameFromChoice) {
    sheetStepId = 'choice';
    renderSheet();
  } else {
    closeSheet();
  }
}

function startCatDrill() {
  catQueue = Object.keys(selCats).slice();
  nextCatDrill();
}

function nextCatDrill() {
  if (catQueue.length === 0) {
    sheetStepId = 'contact';
    renderSheet();
    return;
  }
  activeCat          = catQueue.shift();
  selCats[activeCat] = [];
  freshSubOpts       = true;
  sheetStepId        = 'subopts';
  renderSheet();
}

/* ══════════════════════════════════
   STEP: SUB-OPTIONS
══════════════════════════════════ */
function renderSubOpts() {
  if (freshSubOpts) { selCats[activeCat] = []; freshSubOpts = false; }
  if (!selCats[activeCat]) selCats[activeCat] = [];
  var items = SVC_ITEMS[activeCat];
  var isServices = (flowType === 'services');
  var label = (activeCat === 'consult') ? 'FREE CONSULTATION' :
              (activeCat === 'other')   ? 'OTHER / NOT LISTED' :
              SVC_LABELS[activeCat].toUpperCase();
  var cmdStr = activeCat;

  document.getElementById('sheet-label').textContent = '// ' + cmdStr + '_options.sh';

  var currentSel = selCats[activeCat] || [];
  var opts = items.map(function(item, i) {
    var on = currentSel.indexOf(i) !== -1;
    return '<div class="opt-row'+(on?' selected':'')+'" id="opt-'+i+'" onclick="toggleSubOpt('+i+')">' +
      '<div class="opt-indicator" id="ind-'+i+'">'+(on?'✓':'')+'</div>' +
      '<div class="opt-text"><div class="opt-name">'+item.name+'</div><div class="opt-desc">'+item.desc+'</div></div>' +
    '</div>';
  }).join('');

  var badge = isServices
    ? '<div class="sheet-rate-badge">// Get Estimate &nbsp;·&nbsp; Free Consultation</div>'
    : '<div class="sheet-rate-badge"><span class="free">// FREE</span> &nbsp;·&nbsp; Initial Consultation</div>';

  var remainStr = catQueue.length > 0 ? ' (' + catQueue.length + ' more after this)' : '';

  document.getElementById('sheet-body').innerHTML =
    '<div class="sheet-cmd">$ ./select <span>--cat=' + cmdStr + '</span></div>' +
    '<div class="sheet-h2">' + label + '</div>' +
    '<div class="sheet-sub">Select all that apply' + remainStr + '.</div>' +
    badge +
    '<div class="options-list">' + opts + '</div>';

  var backFn = isServices && selCats && Object.keys(selCats).length > 0
    ? 'goBackToSubOpts()'
    : (activeCat==='consult'&&flowType===null ? 'goBackToChoice()' : 'closeSheet()');

  document.getElementById('sheet-actions').innerHTML =
    '<button class="sheet-btn-secondary" onclick="' + backFn + '">← BACK</button>' +
    '<button class="sheet-btn-primary" id="btn-sub" onclick="continueFromSub()" ' + (currentSel.length===0?'disabled':'') + '>CONTINUE →</button>';
}

function toggleSubOpt(i) {
  if (!selCats[activeCat]) selCats[activeCat] = [];
  var arr = selCats[activeCat];
  var idx = arr.indexOf(i);
  if (idx === -1) { arr.push(i); markOpt(i,true); }
  else            { arr.splice(idx,1); markOpt(i,false); }
  var btn = document.getElementById('btn-sub');
  if (btn) btn.disabled = arr.length === 0;
}

function markOpt(i, on) {
  var row = document.getElementById('opt-'+i);
  var ind = document.getElementById('ind-'+i);
  if (row) row.classList.toggle('selected', on);
  if (ind) ind.textContent = on ? '✓' : '';
}

function continueFromSub() {
  if (catQueue.length > 0) {
    nextCatDrill();
  } else {
    sheetStepId = 'contact';
    renderSheet();
  }
}

function goBackToChoice() {
  sheetStepId = 'choice';
  renderSheet();
}

function goBackToSubOpts() {
  /* go back to cat picker if services flow */
  if (flowType === 'services' && sheetStepId === 'subopts') {
    sheetStepId = 'cats';
    renderSheet();
  } else {
    closeSheet();
  }
}

/* ══════════════════════════════════
   STEP: CONTACT
══════════════════════════════════ */
function renderContact() {
  document.getElementById('sheet-label').textContent = '// contact_info.sh';

  /* build summary tags */
  var tags = '';
  if (flowType === 'consult' || flowType === null && activeCat === 'consult') {
    var consultSel = selCats['consult'] || [];
    consultSel.forEach(function(i) {
      tags += '<span class="sel-tag"><span class="sel-tag-check">✓</span>' + SVC_ITEMS.consult[i].name + '</span>';
    });
  } else if (flowType === 'other') {
    tags = '<span class="sel-tag"><span class="sel-tag-check">✓</span>Other / Not Listed</span>';
  } else {
    Object.keys(selCats).forEach(function(cat) {
      selCats[cat].forEach(function(i) {
        tags += '<span class="sel-tag"><span class="sel-tag-check">✓</span>' + SVC_ITEMS[cat][i].name + '</span>';
      });
    });
  }

  var isConsult = (flowType === 'consult' || activeCat === 'consult');
  var badge = isConsult
    ? '<div class="sheet-rate-badge"><span class="free">// FREE</span> &nbsp;·&nbsp; Initial Consultation</div>'
    : '<div class="sheet-rate-badge">// Get Estimate &nbsp;·&nbsp; Free Consultation</div>';

  document.getElementById('sheet-body').innerHTML =
    '<div class="sheet-cmd">$ ./submit <span>--contact-info</span></div>' +
    '<div class="sheet-h2">Your Contact Info</div>' +
    badge +
    '<div class="sel-tags-wrap">' + tags + '</div>' +
    '<div class="form-row2">' +
      '<div class="form-group"><label class="form-label">// First Name *</label><input class="form-input" id="f-first" type="text" placeholder="Jane" /></div>' +
      '<div class="form-group"><label class="form-label">// Last Name</label><input class="form-input" id="f-last" type="text" placeholder="Smith" /></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">// Phone Number *</label><input class="form-input" id="f-phone" type="tel" placeholder="(843) 555-0100" /></div>' +
    '<div class="form-group"><label class="form-label">// Email Address *</label><input class="form-input" id="f-email" type="email" placeholder="jane@email.com" /></div>' +
    '<div class="form-group"><label class="form-label">// Describe Your Issue</label><textarea class="form-textarea" id="f-desc" placeholder="Brief description — the more detail, the better prepared I\'ll be."></textarea></div>' +
    '<div class="form-group"><label class="form-label">// Your Availability</label><input class="form-input" id="f-avail" type="text" placeholder="e.g. Weekday evenings, Saturday mornings" /></div>';

  document.getElementById('sheet-actions').innerHTML =
    '<button class="sheet-btn-secondary" onclick="goBackFromContact()">← BACK</button>' +
    '<button class="sheet-btn-primary" onclick="submitRequest()">SUBMIT REQUEST →</button>';
}

function goBackFromContact() {
  freshSubOpts = false;
  if (flowType === 'consult' || activeCat === 'consult') {
    sheetStepId = 'subopts';
    activeCat   = 'consult';
    renderSheet();
  } else if (flowType === 'other') {
    sheetStepId = 'subopts';
    activeCat   = 'other';
    renderSheet();
  } else {
    /* re-enter last cat drill */
    var cats = Object.keys(selCats);
    activeCat = cats[cats.length - 1];
    sheetStepId = 'subopts';
    renderSheet();
  }
}

/* ══════════════════════════════════
   SUBMIT
══════════════════════════════════ */
function submitRequest() {
  var first = document.getElementById('f-first');
  var phone = document.getElementById('f-phone');
  var email = document.getElementById('f-email');
  if (!first.value.trim()) { first.focus(); return; }
  if (!phone.value.trim()) { phone.focus(); return; }
  if (!email.value.trim()) { email.focus(); return; }

  var selectedLines = [];
  Object.keys(selCats).forEach(function(cat) {
    var items = SVC_ITEMS[cat];
    selCats[cat].forEach(function(i) {
      selectedLines.push((SVC_LABELS[cat]||cat) + ' → ' + items[i].name);
    });
  });

  var payload = {
    _subject:          'New Service Request — BareMetalBit',
    flow_type:         flowType || 'services',
    services_selected: selectedLines.join(' | ') || 'See description',
    first_name:        first.value.trim(),
    last_name:         document.getElementById('f-last').value.trim(),
    phone:             phone.value.trim(),
    email:             email.value.trim(),
    issue_description: document.getElementById('f-desc').value.trim(),
    availability:      document.getElementById('f-avail').value.trim()
  };

  fetch('https://formspree.io/f/' + FORMSPREE_ID, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function() { sheetStepId = 'done'; renderSheet(); })
  .catch(function() { sheetStepId = 'done'; renderSheet(); });
}

/* ══════════════════════════════════
   DONE
══════════════════════════════════ */
function renderDone() {
  document.getElementById('sheet-label').textContent = '// transmission_complete.sh';
  document.getElementById('sheet-body').innerHTML =
    '<div class="thankyou">' +
      '<span class="ty-icon">[ OK ]</span>' +
      '<div class="ty-title">// Request Received</div>' +
      '<p class="ty-sub">Thanks for reaching out. I\'ll review your request and get back to you as soon as possible — usually within a few hours.<br><br><span>baremetalbit@gmail.com</span></p>' +
    '</div>';
  document.getElementById('sheet-actions').innerHTML =
    '<button class="sheet-btn-primary" onclick="closeSheet()">[ ESC ] Close</button>';
}

/* ══════════════════════════════════
   NAV
══════════════════════════════════ */
var isMobile = window.matchMedia('(max-width:600px)');

function toggleNav() {
  var toggle = document.getElementById('nav-toggle');
  var menuD  = document.getElementById('nav-menu');
  var menuM  = document.getElementById('nav-menu-mobile');
  var isOpen = toggle.classList.contains('open');

  if (isOpen) {
    toggle.classList.remove('open');
    menuD.classList.remove('open');
    menuM.style.display = 'none';
  } else {
    toggle.classList.add('open');
    if (isMobile.matches) {
      menuM.style.display = 'block';
      menuD.classList.remove('open');
    } else {
      menuD.classList.add('open');
      menuM.style.display = 'none';
    }
  }
}

function mobileNavPick(type) {
  document.getElementById('nav-toggle').classList.remove('open');
  document.getElementById('nav-menu-mobile').style.display = 'none';
  if (type === 'services') {
    openServicesSheet();
  } else {
    openSheet('consult');
  }
}

function jumpTo(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  document.getElementById('nav-menu').classList.remove('open');
  document.getElementById('nav-toggle').classList.remove('open');
}

document.addEventListener('click', function(e) {
  var toggle = document.getElementById('nav-toggle');
  var menuD  = document.getElementById('nav-menu');
  var menuM  = document.getElementById('nav-menu-mobile');
  if (!toggle.contains(e.target) && !menuD.contains(e.target) && !menuM.contains(e.target)) {
    toggle.classList.remove('open');
    menuD.classList.remove('open');
    menuM.style.display = 'none';
  }
});

/* ══════════════════════════════════
   FLOAT BTN
══════════════════════════════════ */
var floatBtn = document.getElementById('float-book');

function updateFloatBtn() {
  var sheetOpen = document.getElementById('sheet-overlay').classList.contains('open');
  if (sheetOpen) return; /* don't touch visibility while sheet is open */
  floatBtn.classList.toggle('visible', window.scrollY > 100);
}

window.addEventListener('scroll', updateFloatBtn, { passive: true });

/* show immediately on load if page is already scrolled */
updateFloatBtn();

/* ESC */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeSheet();
});
