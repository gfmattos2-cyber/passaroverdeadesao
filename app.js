/* 
 * Lógica do Formulário de Onboarding — Pássaro Verde & Desconto Sollar
 * Gerenciamento de Stepper, Máscaras de CPF/Telefone, Upload de Arquivos e Validações
 */

// --- CONFIGURAÇÃO DO INTEGRATION ENDPOINT ---
// Opção A (FormSubmit): "https://formsubmit.co/ajax/descontosollarenergia@gmail.com"
// Opção B (Vercel Serverless Function): "/api/submit"
// Opção C (n8n Webhook): "https://seu-n8n.com/webhook/adesao-passaro-verde"
const INTEGRATION_ENDPOINT = "https://burrowinggoose-n8n.cloudfy.live/webhook/36c55c3e-5895-40b5-b4b8-2c7546ce6e18";

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENT SELECTORS ---
    const form = document.getElementById('onboarding-form');
    
    // Steps
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const successScreen = document.getElementById('success-screen');
    
    // Navigation Buttons
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnSubmit = document.getElementById('btn-submit');
    
    // Step Indicators
    const stepIndicator1 = document.getElementById('step-indicator-1');
    const stepIndicator2 = document.getElementById('step-indicator-2');
    const stepLine1 = document.getElementById('step-line-1');
    
    // Form Inputs
    const inputNome = document.getElementById('nome');
    const inputCpf = document.getElementById('cpf');
    const inputTelefone = document.getElementById('telefone');
    const inputEmail = document.getElementById('email');
    const inputCodigoGestor = document.getElementById('codigo_gestor');
    const checkConsent = document.getElementById('consentimento');
    
    // --- PARSE URL REFERRAL / MANAGER CODE ---
    const urlParams = new URLSearchParams(window.location.search);
    const gestorCode = urlParams.get('ref') || urlParams.get('code') || urlParams.get('gestor') || urlParams.get('codigo_gestor');
    if (gestorCode) {
        inputCodigoGestor.value = gestorCode.toUpperCase();
    }
    
    // File Inputs & Upload Zones
    const fileFatura = document.getElementById('fatura_energia');
    const fileCnh = document.getElementById('cnh_documento');
    const zoneFatura = document.getElementById('zone-fatura');
    const zoneCnh = document.getElementById('zone-cnh');
    const nameFatura = document.getElementById('name-fatura');
    const nameCnh = document.getElementById('name-cnh');
    const previewFatura = document.getElementById('preview-fatura');
    const previewCnh = document.getElementById('preview-cnh');
    const btnRemoveFatura = document.getElementById('remove-fatura');
    const btnRemoveCnh = document.getElementById('remove-cnh');
    
    // Error spans for step 2
    const errorFatura = document.getElementById('error-fatura');
    const errorCnh = document.getElementById('error-cnh');
    const errorConsent = document.getElementById('error-consentimento');

    // --- MASKING LOGIC ---
    
    // CPF Mask (000.000.000-00)
    inputCpf.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Apenas números
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
        }
        e.target.value = value;
        
        // Limpar classe de erro ao digitar
        clearError(inputCpf);
    });

    // Telefone Mask ((00) 00000-0000)
    inputTelefone.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,4})$/, '($1) $2');
        }
        e.target.value = value;
        
        clearError(inputTelefone);
    });
    
    // Clear errors on input change
    [inputNome, inputEmail, inputCodigoGestor].forEach(input => {
        input.addEventListener('input', () => clearError(input));
    });

    // --- VALIDATION FUNCTIONS ---
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validateCPF(cpf) {
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length !== 11) return false;
        
        // Bloquear sequências repetidas óbvias
        if (/^(\d)\1{10}$/.test(cleaned)) return false;
        
        // Validação de dígitos verificadores básicos
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
        
        sum = 0;
        for (let i = 1; i <= 10; i++) sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
        
        return true;
    }
    
    function showError(input) {
        const group = input.closest('.form-group');
        if (group) group.classList.add('invalid');
    }
    
    function clearError(input) {
        const group = input.closest('.form-group');
        if (group) group.classList.remove('invalid');
    }
    
    function validateStep1() {
        let isValid = true;
        
        // Validar Nome
        if (inputNome.value.trim().length < 3) {
            showError(inputNome);
            isValid = false;
        } else {
            clearError(inputNome);
        }
        
        // Validar CPF
        if (!validateCPF(inputCpf.value)) {
            showError(inputCpf);
            isValid = false;
        } else {
            clearError(inputCpf);
        }
        
        // (Removido campo de matrícula por solicitação do usuário)
        
        // Validar Telefone
        if (inputTelefone.value.replace(/\D/g, '').length < 10) {
            showError(inputTelefone);
            isValid = false;
        } else {
            clearError(inputTelefone);
        }
        
        // Validar Email
        if (!validateEmail(inputEmail.value)) {
            showError(inputEmail);
            isValid = false;
        } else {
            clearError(inputEmail);
        }

        // Validar Código do Gestor
        if (inputCodigoGestor.value.trim().length < 2) {
            showError(inputCodigoGestor);
            isValid = false;
        } else {
            clearError(inputCodigoGestor);
        }
        
        return isValid;
    }

    // --- STEP NAVIGATION ---
    
    btnNext.addEventListener('click', () => {
        if (validateStep1()) {
            // Ir para o passo 2
            step1.classList.remove('active');
            step2.classList.add('active');
            
            // Atualizar Stepper
            stepIndicator1.classList.remove('active');
            stepIndicator1.classList.add('completed');
            stepLine1.classList.add('completed');
            stepIndicator2.classList.add('active');
            
            // Rolar a tela para o topo do formulário
            document.querySelector('.card-container').scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    btnPrev.addEventListener('click', () => {
        // Voltar para o passo 1
        step2.classList.remove('active');
        step1.classList.add('active');
        
        // Atualizar Stepper
        stepIndicator2.classList.remove('active');
        stepLine1.classList.remove('completed');
        stepIndicator1.classList.remove('completed');
        stepIndicator1.classList.add('active');
    });

    // --- FILE UPLOAD ZONE HANDLING ---
    
    // Setup clicks on upload zones
    zoneFatura.addEventListener('click', (e) => {
        // Evitar loop se clicar no botão de remoção ou na imagem
        if (!e.target.closest('.preview-container') && !e.target.closest('.btn-remove')) {
            fileFatura.click();
        }
    });
    
    zoneCnh.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-container') && !e.target.closest('.btn-remove')) {
            fileCnh.click();
        }
    });
    
    // Bind file input changes
    fileFatura.addEventListener('change', (e) => handleFileSelection(e.target.files[0], 'fatura'));
    fileCnh.addEventListener('change', (e) => handleFileSelection(e.target.files[0], 'cnh'));
    
    // Drag and Drop support
    ['dragenter', 'dragover'].forEach(eventName => {
        zoneFatura.addEventListener(eventName, (e) => { e.preventDefault(); zoneFatura.classList.add('dragover'); }, false);
        zoneCnh.addEventListener(eventName, (e) => { e.preventDefault(); zoneCnh.classList.add('dragover'); }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        zoneFatura.addEventListener(eventName, (e) => { e.preventDefault(); zoneFatura.classList.remove('dragover'); }, false);
        zoneCnh.addEventListener(eventName, (e) => { e.preventDefault(); zoneCnh.classList.remove('dragover'); }, false);
    });
    
    zoneFatura.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileFatura.files = dt.files;
            handleFileSelection(file, 'fatura');
        }
    });
    
    zoneCnh.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileCnh.files = dt.files;
            handleFileSelection(file, 'cnh');
        }
    });

    // Handle selected files
    function handleFileSelection(file, type) {
        if (!file) return;
        
        const zone = type === 'fatura' ? zoneFatura : zoneCnh;
        const nameLabel = type === 'fatura' ? nameFatura : nameCnh;
        const preview = type === 'fatura' ? previewFatura : previewCnh;
        const uploadContent = zone.querySelector('.upload-content');
        const error = type === 'fatura' ? errorFatura : errorCnh;
        
        // Validar formato (PDF ou imagem)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            zone.classList.add('invalid');
            nameLabel.innerText = "Formato de arquivo inválido. Use JPG, PNG ou PDF.";
            return;
        }
        
        // Limpar possíveis erros
        zone.classList.remove('invalid');
        error.style.display = 'none';
        
        // Atualizar interface de sucesso
        zone.classList.add('has-file');
        nameLabel.innerText = `${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
        
        // Preview da imagem
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = preview.querySelector('img');
                img.src = e.target.result;
                uploadContent.style.display = 'none';
                preview.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        } else {
            // É PDF, apenas mostra o nome
            uploadContent.style.display = 'block';
            zone.querySelector('.upload-icon').innerText = '📁';
        }
    }
    
    // File Removal Logic
    btnRemoveFatura.addEventListener('click', (e) => {
        e.stopPropagation();
        fileFatura.value = '';
        zoneFatura.classList.remove('has-file', 'invalid');
        nameFatura.innerText = 'Nenhum arquivo selecionado';
        previewFatura.style.display = 'none';
        zoneFatura.querySelector('.upload-content').style.display = 'block';
        zoneFatura.querySelector('.upload-icon').innerText = '📄';
    });
    
    btnRemoveCnh.addEventListener('click', (e) => {
        e.stopPropagation();
        fileCnh.value = '';
        zoneCnh.classList.remove('has-file', 'invalid');
        nameCnh.innerText = 'Nenhum arquivo selecionado';
        previewCnh.style.display = 'none';
        zoneCnh.querySelector('.upload-content').style.display = 'block';
        zoneCnh.querySelector('.upload-icon').innerText = '🪪';
    });

    // --- FORM SUBMISSION ---
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        
        // Validar Fatura
        if (!fileFatura.files[0]) {
            zoneFatura.classList.add('invalid');
            errorFatura.style.display = 'block';
            isValid = false;
        } else {
            zoneFatura.classList.remove('invalid');
            errorFatura.style.display = 'none';
        }
        
        // Validar CNH
        if (!fileCnh.files[0]) {
            zoneCnh.classList.add('invalid');
            errorCnh.style.display = 'block';
            isValid = false;
        } else {
            zoneCnh.classList.remove('invalid');
            errorCnh.style.display = 'none';
        }
        
        // Validar consentimento
        if (!checkConsent.checked) {
            checkConsent.closest('.checkbox-group').classList.add('invalid');
            errorConsent.style.display = 'block';
            isValid = false;
        } else {
            checkConsent.closest('.checkbox-group').classList.remove('invalid');
            errorConsent.style.display = 'none';
        }
        
        // Limpar erro de consentimento ao clicar nele
        checkConsent.addEventListener('change', () => {
            if (checkConsent.checked) {
                checkConsent.closest('.checkbox-group').classList.remove('invalid');
                errorConsent.style.display = 'none';
            }
        });
        
        if (isValid) {
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Enviando Documentos...";
            
            // Preparar os dados para envio
            const formData = new FormData(form);
            
            // Parâmetros do FormSubmit para personalizar o e-mail recebido (ignorados se usar Vercel/n8n)
            formData.append('_captcha', 'false');
            formData.append('_subject', 'Nova Adesão Energia Verde - Pássaro Verde');
            formData.append('_template', 'table');
            
            // Enviar os dados via AJAX para o endpoint configurado
            fetch(INTEGRATION_ENDPOINT, {
                method: "POST",
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // n8n pode retornar um array como [{"success": true}] ou um objeto direto {"success": true}
                const isSuccess = data.success === "true" || data.success === true || 
                                  (Array.isArray(data) && data[0] && (data[0].success === true || data[0].success === "true"));
                
                if (isSuccess) {
                    // Esconder botões e stepper
                    document.querySelector('.stepper').style.display = 'none';
                    step2.style.display = 'none';
                    
                    // Mostrar tela de sucesso
                    successScreen.style.display = 'block';
                    
                    // Rolar para o topo do formulário
                    document.querySelector('.card-container').scrollIntoView({ behavior: 'smooth' });
                    
                    // Atualizar indicador 2 para concluído
                    stepIndicator2.classList.remove('active');
                    stepIndicator2.classList.add('completed');
                } else {
                    console.error("Erro retornado pelo n8n:", data);
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = "Enviar Cadastro ✓";
                    alert("Ocorreu um erro ao processar seu cadastro no servidor. Por favor, verifique se o fluxo do n8n está ativo ou contate o administrador.");
                }
            })
            .catch(error => {
                console.error("Erro no envio:", error);
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Enviar Cadastro ✓";
                alert("Ocorreu um erro de rede ou de conexão. Por favor, tente novamente.");
            });
        }
    });
});
