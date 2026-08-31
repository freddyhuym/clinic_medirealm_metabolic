(function () {
  'use strict';
  var form = document.getElementById('appointmentForm');
  var treatments = window.APPOINTMENT_TREATMENTS || [];
  var selected = new Map();
  var submitting = false;
  var controls = form.elements;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function money(n) { return 'NT$' + Number(n).toLocaleString('en-US'); }
  function byId(id) { return document.getElementById(id); }
  function renderTreatments() {
    byId('treatmentGrid').innerHTML = treatments.map(function (t) {
      var meta = t.price != null ? '<span class="ap-treatment-price">體驗價　<b>' + money(t.price) + '</b></span>' : '<span class="ap-treatment-desc">' + esc(t.description || '') + '</span>';
      var options = t.options ? '<div class="ap-suboptions" data-options="' + esc(t.id) + '" hidden><p>' + (t.optionsMode === 'multiple' ? '請選擇部位（可複選）' : '請選擇方案') + '</p>' +
        t.options.map(function (o) { return '<label><input type="' + (t.optionsMode === 'single' ? 'radio' : 'checkbox') + '" name="option-' + esc(t.id) + '" value="' + esc(o.id) + '"><span>' + esc(o.name) + '<b>' + money(o.price) + '</b></span></label>'; }).join('') +
        '<p class="ap-error" id="' + esc(t.id) + 'Error" role="alert"></p></div>' : '';
      return '<div class="ap-treatment-group"><label class="ap-treatment-card"><input type="checkbox" name="treatment" value="' + esc(t.id) + '"><span class="ap-card-check" aria-hidden="true">✓</span><span class="ap-treatment-name serif">' + esc(t.name) + '</span>' + meta + '</label>' + options + '</div>';
    }).join('');
  }
  function setError(id, message, field) {
    var el = byId(id); if (el) el.textContent = message || '';
    if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !!message;
  }
  function treatmentData() {
    return treatments.filter(function (t) { return selected.has(t.id); }).map(function (t) {
      var chosen = [];
      if (t.options) document.querySelectorAll('[name="option-' + t.id + '"]:checked').forEach(function (input) {
        var option = t.options.find(function (o) { return o.id === input.value; });
        if (option) chosen.push({ id: option.id, name: option.name, price: option.price });
      });
      return { id: t.id, name: t.name, price: t.price == null ? null : t.price, options: chosen };
    });
  }
  function validate() {
    var first = null;
    function fail(id, message, field) { if (setError(id, message, field) && !first) first = field || byId(id); }
    var selectedData = treatmentData();
    fail('treatmentsError', selectedData.length ? '' : '請選擇希望預約的療程', document.querySelector('.ap-treatment-card input'));
    var hair = selectedData.find(function (t) { return t.id === 'ipl-hair-removal'; });
    var botox = selectedData.find(function (t) { return t.id === 'botox-wrinkle'; });
    fail('ipl-hair-removalError', hair && !hair.options.length ? '請至少選擇一個除毛部位' : '', byId('ipl-hair-removalError'));
    fail('botox-wrinkleError', botox && botox.options.length !== 1 ? '請選擇一個肉毒方案' : '', byId('botox-wrinkleError'));
    var date = controls.appointmentDate;
    fail('dateError', !date.value ? '請選擇希望預約日期' : (date.value < date.min ? '不可選擇今天以前的日期' : ''), date);
    var time = form.querySelector('[name="preferredTime"]:checked');
    fail('timeError', time ? '' : '請選擇希望預約時段', form.querySelector('[name="preferredTime"]'));
    fail('nameError', controls.name.value.trim() ? '' : '請輸入您的姓名', controls.name);
    fail('phoneError', /^09\d{8}$/.test(controls.phone.value.trim()) ? '' : '請輸入 09 開頭的 10 位手機號碼', controls.phone);
    fail('emailError', !controls.email.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(controls.email.value.trim()) ? '' : '請輸入正確的 Email 格式', controls.email);
    fail('consentError', controls.privacyConsent.checked ? '' : '請勾選聯絡資訊使用同意', controls.privacyConsent);
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) window.setTimeout(function () { first.focus(); }, 350); }
    return !first;
  }
  function init() {
    renderTreatments();
    var today = new Date(), y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, '0'), d = String(today.getDate()).padStart(2, '0');
    controls.appointmentDate.min = y + '-' + m + '-' + d;
    byId('apYear').textContent = y;
    byId('treatmentGrid').addEventListener('change', function (e) {
      var input = e.target;
      if (input.name === 'treatment') {
        if (input.checked) selected.set(input.value, true); else {
          selected.delete(input.value);
          document.querySelectorAll('[name="option-' + input.value + '"]').forEach(function (o) { o.checked = false; });
        }
        input.closest('.ap-treatment-card').classList.toggle('is-selected', input.checked);
        var panel = document.querySelector('[data-options="' + input.value + '"]');
        if (panel) panel.hidden = !input.checked;
        setError('treatmentsError', '', input);
      }
    });
    byId('sourceOtherToggle').addEventListener('change', function (e) { byId('sourceOtherWrap').hidden = !e.target.checked; if (!e.target.checked) controls.sourceOther.value = ''; });
    var toggle = byId('navToggle'), links = byId('navLinks');
    toggle.addEventListener('click', function () { var open = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單'); });
    form.addEventListener('submit', submit);
    byId('appointmentAgain').addEventListener('click', reset);
  }
  function submit(e) {
    e.preventDefault(); if (submitting || !validate()) return;
    submitting = true;
    var button = form.querySelector('[type="submit"]'), label = button.querySelector('.ap-submit-label');
    button.disabled = true; button.classList.add('loading'); label.textContent = '正在送出...'; byId('submitError').textContent = '';
    var time = form.querySelector('[name="preferredTime"]:checked');
    var payload = {
      appointmentDate: controls.appointmentDate.value, preferredTime: time ? time.value : '',
      name: controls.name.value.trim(), phone: controls.phone.value.trim(), email: controls.email.value.trim(),
      lineId: controls.lineId.value.trim(), treatments: treatmentData(),
      source: Array.from(form.querySelectorAll('[name="source"]:checked')).map(function (v) { return v.value; }),
      sourceOther: controls.sourceOther.value.trim(), note: controls.note.value.trim(),
      privacyConsent: controls.privacyConsent.checked, submittedAt: new Date().toISOString(),
      website: controls.website.value
    };
    fetch('/api/appointments', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { if (!r.ok) throw new Error(data.error || '送出失敗'); return data; }); })
      .then(function () { form.hidden = true; var success = byId('appointmentSuccess'); success.hidden = false; success.focus(); window.scrollTo({ top: success.offsetTop - 100, behavior: 'smooth' }); })
      .catch(function (err) { byId('submitError').textContent = err.message || '送出失敗，請稍後再試。'; })
      .finally(function () { submitting = false; button.disabled = false; button.classList.remove('loading'); label.textContent = '送出預約'; });
  }
  function reset() {
    form.reset(); selected.clear(); document.querySelectorAll('.ap-suboptions').forEach(function (p) { p.hidden = true; });
    document.querySelectorAll('.ap-treatment-card').forEach(function (p) { p.classList.remove('is-selected'); });
    document.querySelectorAll('.ap-error,.ap-submit-error').forEach(function (p) { p.textContent = ''; });
    byId('sourceOtherWrap').hidden = true; byId('appointmentSuccess').hidden = true; form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  init();
})();