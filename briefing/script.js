const FORM_CONFIG = {
  webhookUrl: "https://formspree.io/f/maqggqaj",
  emailDestino: "arthurms707@gmail.com",
  whatsapp: "5581999944106"
};

const form = document.getElementById('briefingForm');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');

window.addEventListener('DOMContentLoaded', () => {
  carregarRascunho();
  atualizarProgresso();
});

form.addEventListener('input', atualizarProgresso);
form.addEventListener('change', atualizarProgresso);

function atualizarProgresso() {
  const allInputs = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
  let preenchidos = 0;
  let total = 0;
  
  allInputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') return;
    total++;
    if (input.value.trim() !== '') preenchidos++;
  });
  
  const checkboxGroups = new Set();
  form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    checkboxGroups.add(cb.name);
  });
  
  total += checkboxGroups.size;
  checkboxGroups.forEach(name => {
    const checked = form.querySelectorAll(`input[name="${name}"]:checked`);
    if (checked.length > 0) preenchidos++;
  });
  
  const percent = total > 0 ? Math.round((preenchidos / total) * 100) : 0;
  progressFill.style.width = percent + '%';
  progressPercent.textContent = percent + '%';
}

const saveBtn = document.getElementById('saveBtn');

saveBtn.addEventListener('click', () => {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
  const checkboxData = {};
  checkboxes.forEach(cb => {
    if (!checkboxData[cb.name]) checkboxData[cb.name] = [];
    checkboxData[cb.name].push(cb.value);
  });
  Object.assign(data, checkboxData);
  
  localStorage.setItem('briefing_biofit_rascunho', JSON.stringify(data));
  showToast('✅ Rascunho salvo! Pode voltar a qualquer momento.');
});

function carregarRascunho() {
  const rascunho = localStorage.getItem('briefing_biofit_rascunho');
  if (!rascunho) return;
  
  const data = JSON.parse(rascunho);
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    const input = form.querySelector(`[name="${key}"]`);
    
    if (!input) return;
    
    if (Array.isArray(value)) {
      value.forEach(val => {
        const cb = form.querySelector(`[name="${key}"][value="${val}"]`);
        if (cb) cb.checked = true;
      });
    } else if (input.type === 'radio') {
      const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      input.value = value;
    }
  });
  
  toggleDepoimentosField();
  atualizarProgresso();
}

const temDepoimentosRadios = form.querySelectorAll('input[name="temDepoimentos"]');
const depoimentosField = document.getElementById('depoimentosField');

function toggleDepoimentosField() {
  const selected = form.querySelector('input[name="temDepoimentos"]:checked');
  if (selected && selected.value !== 'nao') {
    depoimentosField.style.display = 'block';
  } else {
    depoimentosField.style.display = 'none';
  }
}

temDepoimentosRadios.forEach(r => r.addEventListener('change', toggleDepoimentosField));

const especialidadesCheckboxes = form.querySelectorAll('input[name="especialidades"]');
const MAX_ESPECIALIDADES = 3;

especialidadesCheckboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    const checked = form.querySelectorAll('input[name="especialidades"]:checked');
    if (checked.length > MAX_ESPECIALIDADES) {
      cb.checked = false;
      showToast(`⚠️ Máximo de ${MAX_ESPECIALIDADES} especialidades.`);
    }
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '⏳ Enviando...';
  submitBtn.disabled = true;
  
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  const checkboxData = {};
  form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    if (!checkboxData[cb.name]) checkboxData[cb.name] = [];
    checkboxData[cb.name].push(cb.value);
  });
  Object.assign(data, checkboxData);
  
  if (!data.nomeCompleto || !data.whatsapp) {
    showToast('❌ Preencha pelo menos nome e WhatsApp.');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    return;
  }
  
  try {
    const response = await fetch(FORM_CONFIG.webhookUrl, {
      method: 'POST',
      mode: 'cors',                          
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'         
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro Formspree:', errorData);
      throw new Error(errorData.error || `Erro HTTP ${response.status}`);
    }
    
    localStorage.removeItem('briefing_biofit_rascunho');
    document.getElementById('successScreen').classList.add('show');
    
  } catch (error) {
    console.error('Erro completo:', error);
    showToast('❌ Erro ao enviar. Tente pelo WhatsApp.');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

function showToast(message) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: #161616;
    color: #fff;
    padding: 14px 24px;
    border-radius: 100px;
    font-weight: 600;
    font-size: 14px;
    z-index: 9999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    border: 1px solid #c4ff00;
    animation: slideUpToast 0.3s ease;
    font-family: 'Inter', sans-serif;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
  }, 2500);
  setTimeout(() => toast.remove(), 2900);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideUpToast {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;
document.head.appendChild(style);