/**
 * Componente para Upload e Gerenciamento de Fotos de Pacientes
 * Funcionalidades: Upload, Crop, Preview, Exclusão
 */

class PatientPhotoManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('Container para foto não encontrado:', containerId);
            return;
        }
        this.currentFile = null;
        this.cropper = null;
        this.maxSize = 2 * 1024 * 1024; // 2MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        this.init();
    }

    init() {
        this.createPhotoInterface();
        this.bindEvents();
    }

    createPhotoInterface() {
        this.container.innerHTML = `
            <div class="photo-manager">
                <div class="photo-preview-container">
                    <div class="photo-preview" id="photoPreview">
                        <div class="photo-placeholder">
                            <i class="fas fa-user-circle"></i>
                            <span>Adicionar Foto</span>
                        </div>
                    </div>
                    <div class="photo-actions">
                        <button type="button" class="btn-photo-upload" id="btnPhotoUpload">
                            <i class="fas fa-camera"></i>
                            Adicionar Foto
                        </button>
                        <button type="button" class="btn-photo-remove" id="btnPhotoRemove" style="display: none;">
                            <i class="fas fa-trash"></i>
                            Remover
                        </button>
                    </div>
                </div>
                
                <input type="file" id="photoInput" accept="image/*" style="display: none;">
                
                <!-- Modal para crop da imagem -->
                <div class="photo-crop-modal" id="photoCropModal" style="display: none;">
                    <div class="crop-modal-content">
                        <div class="crop-header">
                            <h3>Ajustar Foto</h3>
                            <button type="button" class="crop-close" id="cropClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="crop-body">
                            <div class="crop-container">
                                <img id="cropImage" style="max-width: 100%;">
                            </div>
                        </div>
                        <div class="crop-footer">
                            <button type="button" class="btn btn-secondary" id="cropCancel">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" id="cropConfirm">
                                <i class="fas fa-check"></i>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Upload button
        document.getElementById('btnPhotoUpload').addEventListener('click', () => {
            document.getElementById('photoInput').click();
        });

        // File input change
        document.getElementById('photoInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Remove button
        document.getElementById('btnPhotoRemove').addEventListener('click', () => {
            this.removePhoto();
        });

        // Crop modal events
        document.getElementById('cropClose').addEventListener('click', () => {
            this.closeCropModal();
        });

        document.getElementById('cropCancel').addEventListener('click', () => {
            this.closeCropModal();
        });

        document.getElementById('cropConfirm').addEventListener('click', () => {
            this.confirmCrop();
        });

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const preview = document.getElementById('photoPreview');
        
        preview.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.classList.add('drag-over');
        });

        preview.addEventListener('dragleave', () => {
            preview.classList.remove('drag-over');
        });

        preview.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validar tipo de arquivo
        if (!this.allowedTypes.includes(file.type)) {
            this.showError('Formato não suportado. Use JPEG, PNG ou WebP.');
            return;
        }

        // Validar tamanho
        if (file.size > this.maxSize) {
            this.showError('Arquivo muito grande. Máximo 2MB.');
            return;
        }

        this.currentFile = file;
        this.showCropModal(file);
    }

    showCropModal(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const cropImage = document.getElementById('cropImage');
            cropImage.src = e.target.result;
            
            document.getElementById('photoCropModal').style.display = 'flex';
            
            // Inicializar Cropper.js
            if (this.cropper) {
                this.cropper.destroy();
            }
            
            this.cropper = new Cropper(cropImage, {
                aspectRatio: 1, // Quadrado
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                guides: true,
                center: true,
                background: false,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false
            });
        };
        reader.readAsDataURL(file);
    }

    closeCropModal() {
        document.getElementById('photoCropModal').style.display = 'none';
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        document.getElementById('photoInput').value = '';
    }

    confirmCrop() {
        if (!this.cropper) return;

        // Obter imagem cropada
        const canvas = this.cropper.getCroppedCanvas({
            width: 300,
            height: 300,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        // Converter para blob
        canvas.toBlob((blob) => {
            this.setPhoto(blob);
            this.closeCropModal();
        }, 'image/jpeg', 0.8);
    }

    setPhoto(blob) {
        const url = URL.createObjectURL(blob);
        const preview = document.getElementById('photoPreview');
        
        preview.innerHTML = `
            <img src="${url}" alt="Foto do paciente" class="patient-photo">
        `;
        
        // Mostrar/ocultar botões
        document.getElementById('btnPhotoUpload').innerHTML = '<i class="fas fa-edit"></i> Alterar Foto';
        document.getElementById('btnPhotoRemove').style.display = 'block';
        
        // Armazenar blob para envio
        this.currentPhotoBlob = blob;
        
        // Disparar evento personalizado
        this.container.dispatchEvent(new CustomEvent('photoChanged', {
            detail: { blob, url }
        }));
    }

    removePhoto() {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `
            <div class="photo-placeholder">
                <i class="fas fa-user-circle"></i>
                <span>Adicionar Foto</span>
            </div>
        `;
        
        // Resetar botões
        document.getElementById('btnPhotoUpload').innerHTML = '<i class="fas fa-camera"></i> Adicionar Foto';
        document.getElementById('btnPhotoRemove').style.display = 'none';
        
        // Limpar dados
        this.currentPhotoBlob = null;
        
        // Disparar evento
        this.container.dispatchEvent(new CustomEvent('photoRemoved'));
    }

    loadPhoto(photoUrl) {
        if (!photoUrl) return;
        
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `
            <img src="${photoUrl}" alt="Foto do paciente" class="patient-photo">
        `;
        
        // Ajustar botões
        document.getElementById('btnPhotoUpload').innerHTML = '<i class="fas fa-edit"></i> Alterar Foto';
        document.getElementById('btnPhotoRemove').style.display = 'block';
    }

    getPhotoBlob() {
        return this.currentPhotoBlob;
    }

    showError(message) {
        // Criar toast de erro
        const toast = document.createElement('div');
        toast.className = 'photo-error-toast';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Método para carregar foto existente
    loadExistingPhoto(photoData) {
        if (!photoData) return;
        
        try {
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `
                <img src="${photoData}" alt="Foto do paciente" class="patient-photo">
            `;
            
            this.currentImageData = photoData;
            
            // Ajustar botões
            document.getElementById('btnPhotoUpload').innerHTML = '<i class="fas fa-edit"></i> Alterar Foto';
            document.getElementById('btnPhotoRemove').style.display = 'block';
        } catch (error) {
            console.error('Erro ao carregar foto existente:', error);
        }
    }

    // Método para obter dados da foto
    getData() {
        return {
            photo: this.currentImageData,
            hasPhoto: !!this.currentImageData
        };
    }

    // Método para limpar dados
    clearData() {
        this.currentImageData = null;
        this.currentFile = null;
        this.removePhoto();
    }
}

// CSS para o componente de foto
const photoManagerStyles = `
<style>
.photo-manager {
    width: 100%;
}

.photo-preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.photo-preview {
    width: 150px;
    height: 150px;
    border: 3px dashed #ddd;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    transition: all 0.3s ease;
    cursor: pointer;
    overflow: hidden;
}

.photo-preview:hover {
    border-color: #667eea;
    background: #f0f4ff;
}

.photo-preview.drag-over {
    border-color: #667eea;
    background: #e3f2fd;
    transform: scale(1.05);
}

.photo-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #6c757d;
    text-align: center;
}

.photo-placeholder i {
    font-size: 2.5rem;
}

.photo-placeholder span {
    font-size: 0.9rem;
    font-weight: 500;
}

.patient-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.photo-actions {
    display: flex;
    gap: 10px;
}

.btn-photo-upload,
.btn-photo-remove {
    padding: 8px 16px;
    border: none;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-photo-upload {
    background: #667eea;
    color: white;
}

.btn-photo-upload:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
}

.btn-photo-remove {
    background: #dc3545;
    color: white;
}

.btn-photo-remove:hover {
    background: #c82333;
    transform: translateY(-2px);
}

/* Modal de Crop */
.photo-crop-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.crop-modal-content {
    background: white;
    border-radius: 15px;
    max-width: 600px;
    max-height: 90vh;
    width: 90%;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.crop-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.crop-header h3 {
    margin: 0;
    color: #333;
}

.crop-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #666;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.crop-close:hover {
    background: #f0f0f0;
    color: #333;
}

.crop-body {
    padding: 20px;
    max-height: 400px;
    overflow: hidden;
}

.crop-container {
    max-height: 350px;
    overflow: hidden;
}

.crop-footer {
    padding: 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* Toast de erro */
.photo-error-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 10001;
}

.photo-error-toast.show {
    transform: translateX(0);
}

.photo-error-toast i {
    font-size: 1.2rem;
}

/* Responsivo */
@media (max-width: 768px) {
    .crop-modal-content {
        width: 95%;
        margin: 10px;
    }
    
    .photo-preview {
        width: 120px;
        height: 120px;
    }
}
</style>
`;

// Adicionar estilos ao head
if (!document.getElementById('photo-manager-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'photo-manager-styles';
    styleElement.innerHTML = photoManagerStyles;
    document.head.appendChild(styleElement);
}

// Exportar para uso global
window.PatientPhotoManager = PatientPhotoManager;