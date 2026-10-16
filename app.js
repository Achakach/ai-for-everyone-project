/**
 * AI Financial Health Assistant
 * Streamlined 4-Step Frontend Controller with Hover Tooltip Support
 * Sends clean raw data directly to n8n Webhook
 */

document.addEventListener('DOMContentLoaded', () => {
  // Current active step (1-4 Form steps, 5 is Dashboard)
  let currentStep = 1;

  // DOM Elements
  const settingsPanel = document.getElementById('settings-panel');
  const btnToggleSettings = document.getElementById('btn-toggle-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const inputWebhookUrl = document.getElementById('n8n-webhook-url');
  const btnLoadDemo = document.getElementById('btn-load-demo');
  const btnSubmit = document.getElementById('btn-submit-assessment');
  const btnRestart = document.getElementById('btn-restart');
  const btnPrint = document.getElementById('btn-print');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnBackToStep4 = document.getElementById('btn-back-to-step4');
  const btnRetrySubmit = document.getElementById('btn-retry-submit');

  // Help tooltips: open on hover, tap, Enter or Space (not mouse hover only)
  function closeAllTooltips() {
    document.querySelectorAll('.group.open').forEach(group => {
      group.classList.remove('open');
      const trigger = group.querySelector('.help-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  // Shift a tooltip sideways if it would go off screen (e.g. on phones)
  function keepTooltipOnScreen(tip) {
    const arrow = tip.lastElementChild;
    tip.style.marginLeft = '0px';
    if (arrow) arrow.style.marginLeft = '0px';
    const rect = tip.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const pad = 8;
    let shift = 0;
    if (rect.left < pad) shift = pad - rect.left;
    else if (rect.right > viewportWidth - pad) shift = viewportWidth - pad - rect.right;
    tip.style.marginLeft = `${shift}px`;
    if (arrow) arrow.style.marginLeft = `${-shift}px`;
  }

  document.querySelectorAll('.tooltip-box').forEach((tip, i) => {
    const group = tip.parentElement;
    const trigger = group.querySelector('.help-trigger');
    if (!trigger) return;
    tip.id = `help-tip-${i + 1}`;
    tip.setAttribute('role', 'tooltip');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-label', 'คำอธิบายเพิ่มเติม');
    trigger.setAttribute('aria-describedby', tip.id);
    trigger.setAttribute('aria-expanded', 'false');

    const toggle = (e) => {
      e.preventDefault(); // the icon sits inside a <label>: don't jump focus to the input
      e.stopPropagation();
      const willOpen = !group.classList.contains('open');
      closeAllTooltips();
      if (willOpen) {
        group.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        keepTooltipOnScreen(tip);
      }
    };
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') toggle(e);
    });
    trigger.addEventListener('blur', closeAllTooltips);
    group.addEventListener('mouseenter', () => keepTooltipOnScreen(tip));
  });

  document.addEventListener('click', closeAllTooltips);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllTooltips();
  });

  // Load saved settings from LocalStorage
  const savedWebhook = localStorage.getItem('n8n_webhook_url') || '';
  if (savedWebhook) inputWebhookUrl.value = savedWebhook;

  // Toggle settings panel
  btnToggleSettings.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  btnSaveSettings.addEventListener('click', () => {
    const url = inputWebhookUrl.value.trim();
    if (!url) {
      alert('กรุณากรอก Webhook URL');
      return;
    }
    localStorage.setItem('n8n_webhook_url', url);
    alert('บันทึก n8n Webhook URL เรียบร้อยแล้ว!');
    settingsPanel.classList.add('hidden');
  });

  // Step Navigation Listeners
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.getAttribute('data-next'));
      if (validateStep(currentStep)) {
        goToStep(nextStep);
      }
    });
  });

  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = parseInt(btn.getAttribute('data-prev'));
      goToStep(prevStep);
    });
  });

  function goToStep(step) {
    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`step-${step}`);
    if (target) {
      target.classList.add('active');
      currentStep = step;
      updateStepIndicator(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function updateStepIndicator(step) {
    const items = document.querySelectorAll('.step-nav-item');
    items.forEach(item => {
      const s = parseInt(item.getAttribute('data-step'));
      item.classList.toggle('is-active', s === step);
      item.classList.toggle('is-done', s < step);
      if (s === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });

    const current = document.querySelector(`.step-nav-item[data-step="${step}"]`);
    document.getElementById('progress-label').textContent =
      current ? `ขั้นตอนที่ ${step} จาก ${items.length}` : 'ผลการประเมิน';
    document.getElementById('progress-title').textContent = current ? current.dataset.title : '';
  }

  function validateStep(step) {
    if (step === 1) {
      const name = document.getElementById('user_name').value.trim();
      const age = document.getElementById('user_age').value.trim();
      const salary = val('inc_salary');
      const other = val('inc_other');

      if (!name) {
        alert('กรุณากรอกชื่อหรือชื่อเล่น');
        document.getElementById('user_name').focus();
        return false;
      }
      if (!age || parseInt(age) <= 0) {
        alert('กรุณาระบุอายุที่ถูกต้อง');
        document.getElementById('user_age').focus();
        return false;
      }
      if (salary + other <= 0) {
        alert('กรุณาระบุรายได้ต่อเดือนอย่างน้อย 1 รายการ');
        document.getElementById('inc_salary').focus();
        return false;
      }
    }
    return true;
  }

  // Value getter helper
  function val(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const n = parseFloat(el.value);
    return isNaN(n) ? 0 : Math.max(0, n);
  }

  // Load Demo Data based on project document test case
  btnLoadDemo.addEventListener('click', () => {
    // Step 1: Profile & Income (Total = 40,000)
    document.getElementById('user_name').value = 'สมชาย (ตัวอย่างทดสอบ)';
    document.getElementById('user_age').value = '30';
    document.getElementById('user_occupation').value = 'วิศวกรซอฟต์แวร์';
    document.getElementById('financial_goal').value = 'ต้องการลดและปลดหนี้สิน';
    document.getElementById('inc_salary').value = '35000';
    document.getElementById('inc_other').value = '5000';

    // Step 2: Savings (Total = 5,750 -> 14.37%)
    document.getElementById('sav_mandatory').value = '4250'; // PVD 3500 + ประกันสังคม 750
    document.getElementById('sav_personal').value = '1500';  // DCA หุ้น/ทอง
    document.getElementById('sav_other').value = '';

    // Step 3: Debts (Total = 18,000 -> 45.00%)
    document.getElementById('debt_assets').value = '12000';    // ผ่อนบ้าน
    document.getElementById('debt_consumer').value = '6000';   // หนี้บัตรเครดิต
    document.getElementById('debt_other').value = '';

    // Step 4: Emergency Fund & Expenses (420,000 / 30,000 -> 14 เดือน)
    document.getElementById('asset_total_liquid').value = '420000';
    document.getElementById('exp_fixed').value = '20000';
    document.getElementById('exp_variable').value = '10000';

    alert('โหลดข้อมูลชุดทดสอบตามตัวอย่างเรียบร้อยแล้ว!');
  });

  // Build Streamlined JSON Payload for n8n Webhook
  function buildPayload() {
    return {
      user_profile: {
        name: document.getElementById('user_name').value.trim() || 'ผู้ใช้งาน',
        age: parseInt(document.getElementById('user_age').value) || 0,
        occupation: document.getElementById('user_occupation').value.trim() || '-',
        financial_goal: document.getElementById('financial_goal').value
      },
      income: {
        salary: val('inc_salary'),
        other_income: val('inc_other')
      },
      savings: {
        mandatory_retirement: val('sav_mandatory'),
        personal_investments: val('sav_personal'),
        other_savings: val('sav_other')
      },
      debts: {
        asset_debts: val('debt_assets'),
        consumer_debts: val('debt_consumer'),
        other_debts: val('debt_other')
      },
      emergency_fund: {
        liquid_assets: val('asset_total_liquid'),
        monthly_expenses: {
          fixed_expenses: val('exp_fixed'),
          variable_expenses: val('exp_variable')
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  // Submit Assessment Form -> Direct to n8n Webhook
  btnSubmit.addEventListener('click', async () => {
    if (!validateStep(1)) return;

    const webhookUrl = inputWebhookUrl.value.trim();
    if (!webhookUrl) {
      alert('กรุณาระบุ n8n Webhook URL ในส่วน "ตั้งค่า n8n" มุมขวาบนก่อนเริ่มการประเมิน');
      settingsPanel.classList.remove('hidden');
      inputWebhookUrl.focus();
      return;
    }

    goToStep(5); // Go to results step
    const loadingState = document.getElementById('loading-state');
    const dashboardContent = document.getElementById('dashboard-content');
    const errorState = document.getElementById('error-state');

    loadingState.classList.remove('hidden');
    dashboardContent.classList.add('hidden');
    errorState.classList.add('hidden');

    const payload = buildPayload();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Robust parser: Handle direct JSON or Gemini output string from n8n
      let parsedData = result;
      if (typeof result === 'string') {
        try {
          const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(clean);
        } catch (e) {
          parsedData = { ai_raw_response: result };
        }
      } else if (result.output && typeof result.output === 'string') {
        try {
          const clean = result.output.replace(/```json/g, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(clean);
        } catch (e) {
          parsedData = { ai_raw_response: result.output };
        }
      } else if (result.text && typeof result.text === 'string') {
        try {
          const clean = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(clean);
        } catch (e) {
          parsedData = { ai_raw_response: result.text };
        }
      }

      // Validate that real evaluation data from AI was returned
      if (!parsedData || (!parsedData.money_index && !parsedData.action_plan && !parsedData.ai_raw_response)) {
        throw new Error('ยังไม่ได้รับผลวิเคราะห์จาก AI Agent (โปรดตรวจสอบว่าใน n8n ตั้งค่า Webhook เป็น "When Last Node Finishes" หรือต่อโหนด Respond to Webhook)');
      }

      renderDashboard(parsedData, payload);
      loadingState.classList.add('hidden');
      dashboardContent.classList.remove('hidden');

    } catch (err) {
      console.error('n8n Webhook Error:', err);
      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
      document.getElementById('error-message').textContent = 
        `เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถติดต่อ Webhook ได้'} (โปรดตรวจสอบสถานะใน n8n)`;
    }
  });

  // Error State Buttons
  btnBackToStep4.addEventListener('click', () => {
    goToStep(4);
  });

  btnRetrySubmit.addEventListener('click', () => {
    btnSubmit.click();
  });

  // Escape AI/user text before it goes into innerHTML
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Escape first, then allow only **bold** markdown
  function formatAiText(value) {
    return escapeHtml(value).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // Render Dashboard based on n8n (Code + AI) calculations
  function renderDashboard(data, payload) {
    const user = payload.user_profile;
    document.getElementById('res-user-greeting').textContent = data.user_greeting || `สวัสดีคุณ${user.name}`;
    document.getElementById('res-user-meta').textContent = 
      `อายุ ${user.age} ปี · ${user.occupation} · เป้าหมาย: ${user.financial_goal}`;

    // How many of the 3 indexes pass (emerald = meets the target)
    const indexes = Object.values(data.money_index || {});
    const passCount = indexes.filter(item => item && item.color === 'emerald').length;
    document.getElementById('res-pass-count').textContent = indexes.length ? `${passCount}/3` : '-';

    // Overall status: text from n8n, colour from the pass count (3 good, 2 warn, 0-1 bad)
    const overallBadge = document.getElementById('res-overall-badge');
    overallBadge.textContent = data.overall_status || 'ประเมินผลสำเร็จ';
    const overallColor = !indexes.length ? '' : passCount === 3 ? 'emerald' : passCount === 2 ? 'amber' : 'rose';
    applyBadgeStyle(overallBadge, overallColor);
    overallBadge.classList.add('status--lg');

    // Money Index Cards (Computed by n8n)
    if (data.money_index) {
      // Saving
      if (data.money_index.saving) {
        document.getElementById('card-saving-value').textContent = data.money_index.saving.value || '-';
        const savBadge = document.getElementById('card-saving-badge');
        savBadge.textContent = data.money_index.saving.badge || '-';
        applyBadgeStyle(savBadge, data.money_index.saving.color);
        renderGauge('card-saving-gauge', data.money_index.saving);
      }

      // Debt
      if (data.money_index.debt) {
        document.getElementById('card-debt-value').textContent = data.money_index.debt.value || '-';
        const debtBadge = document.getElementById('card-debt-badge');
        debtBadge.textContent = data.money_index.debt.badge || '-';
        applyBadgeStyle(debtBadge, data.money_index.debt.color);
        renderGauge('card-debt-gauge', data.money_index.debt);
      }

      // Emergency
      if (data.money_index.emergency) {
        document.getElementById('card-emergency-value').textContent = data.money_index.emergency.value || '-';
        const emgBadge = document.getElementById('card-emergency-badge');
        emgBadge.textContent = data.money_index.emergency.badge || '-';
        applyBadgeStyle(emgBadge, data.money_index.emergency.color);
        renderGauge('card-emergency-gauge', data.money_index.emergency);
      }
    }

    // Strengths list (from AI)
    const strengthsContainer = document.getElementById('ai-strengths-list');
    strengthsContainer.innerHTML = '';
    const strengthsArr = data.strengths || [];
    if (strengthsArr.length > 0) {
      strengthsArr.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = formatAiText(item);
        strengthsContainer.appendChild(li);
      });
    } else {
      strengthsContainer.innerHTML = '<li class="muted">ไม่มีข้อมูลจุดแข็ง</li>';
    }

    // Concerns list (from AI)
    const concernsContainer = document.getElementById('ai-concerns-list');
    concernsContainer.innerHTML = '';
    const concernsArr = data.concerns || [];
    if (concernsArr.length > 0) {
      concernsArr.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = formatAiText(item);
        concernsContainer.appendChild(li);
      });
    } else {
      concernsContainer.innerHTML = '<li class="muted">ไม่มีข้อมูลจุดที่ควรระวัง</li>';
    }

    // Action plan (from AI)
    const actionPlanContainer = document.getElementById('ai-action-plan');
    actionPlanContainer.innerHTML = '';
    const planArr = data.action_plan || [];
    if (planArr.length > 0) {
      planArr.forEach(item => {
        const li = document.createElement('li');
        li.className = 'plan-item';
        li.innerHTML = `
          <span class="plan-num">${escapeHtml(item.step || '✓')}</span>
          <div>
            <p class="plan-title">${formatAiText(item.title)}</p>
            <p class="plan-detail">${formatAiText(item.detail)}</p>
          </div>
        `;
        actionPlanContainer.appendChild(li);
      });
    } else if (data.ai_raw_response) {
      actionPlanContainer.innerHTML = `<li class="plan-raw">${escapeHtml(data.ai_raw_response)}</li>`;
    } else {
      actionPlanContainer.innerHTML = '<li class="muted">ไม่มีแผนปฏิบัติการ</li>';
    }
  }

  // Gauge bar under each index: fill = user's value, mark = target (scale from data-max/data-target)
  function renderGauge(id, item) {
    const gauge = document.getElementById(id);
    if (!gauge) return;
    const value = parseFloat(item && item.value);
    gauge.classList.remove('gauge--emerald', 'gauge--amber', 'gauge--rose');
    if (isNaN(value)) {
      gauge.classList.add('hidden');
      return;
    }
    gauge.classList.remove('hidden');
    if (['emerald', 'amber', 'rose'].includes(item.color)) gauge.classList.add(`gauge--${item.color}`);
    const max = Number(gauge.dataset.max);
    const target = Number(gauge.dataset.target);
    gauge.querySelector('.gauge-mark').style.left = `calc(${(target / max) * 100}% - 1px)`;
    gauge.querySelector('.gauge-fill').style.width = `${Math.min(Math.max(value, 0) / max, 1) * 100}%`;
  }

  // Status text with a coloured dot (colour names come from n8n: emerald / amber / rose)
  function applyBadgeStyle(element, color) {
    const statusClass = { emerald: 'status--good', amber: 'status--warn', rose: 'status--bad' }[color];
    element.className = statusClass ? `status ${statusClass}` : 'status';
  }

  // Action Buttons
  btnRestart.addEventListener('click', () => {
    goToStep(1);
  });

  btnPrint.addEventListener('click', () => {
    window.print();
  });

  btnExportJson.addEventListener('click', () => {
    const payload = buildPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `financial_input_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });
});
