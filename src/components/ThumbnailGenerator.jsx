import { useState, useRef, useEffect } from 'react';
import { Download, Upload, Type, Image as ImageIcon, X, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function ThumbnailGenerator({ onGenerate, isOpen, onClose }) {
  const [baseImage, setBaseImage] = useState(null);
  const [customText, setCustomText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(48);
  const [textPosition, setTextPosition] = useState('center');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Gestisce il cambio dell'opzione rimozione sfondo
  useEffect(() => {
    if (originalImage && !removingBg) {
      const processImage = async () => {
        if (removeBackground) {
          const noBgImage = await removeBg(originalImage);
          if (noBgImage) {
            setBaseImage(noBgImage);
          }
        } else {
          setBaseImage(originalImage);
        }
      };
      processImage();
    }
  }, [removeBackground]);

  // Genera anteprima automaticamente quando cambiano le impostazioni
  useEffect(() => {
    if (isOpen && (baseImage || customText)) {
      generateThumbnail();
    }
  }, [baseImage, customText, textColor, textSize, textPosition, isOpen]);

  const removeBg = async (imageDataUrl) => {
    try {
      setRemovingBg(true);
      
      // Converti data URL in blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Crea FormData per remove.bg
      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', blob);
      
      // Chiama l'API di remove.bg
      const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 
          'X-Api-Key': import.meta.env.VITE_REMOVEBG_API_KEY || 'INSERT_YOUR_API_KEY_HERE'
        },
        body: formData,
      });
      
      if (removeBgResponse.ok) {
        const arrayBuffer = await removeBgResponse.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'image/png' });
        
        // Converti il blob in data URL
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(blob);
        });
      } else {
        const errorText = await removeBgResponse.text();
        throw new Error(`${removeBgResponse.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Errore nella rimozione dello sfondo. Verifica la chiave API e riprova.');
      return null;
    } finally {
      setRemovingBg(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target.result;
        setOriginalImage(imageDataUrl);
        
        // Se l'opzione di rimozione sfondo è attiva, processa l'immagine
        if (removeBackground) {
          const noBgImage = await removeBg(imageDataUrl);
          if (noBgImage) {
            setBaseImage(noBgImage);
          } else {
            setBaseImage(imageDataUrl);
          }
        } else {
          setBaseImage(imageDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateThumbnail = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to 1280x720
    canvas.width = 1280;
    canvas.height = 720;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create gradient background (coerente con il sito)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#8B5CF6'); // purple-600
    gradient.addColorStop(0.5, '#A78BFA'); // purple-400
    gradient.addColorStop(1, '#1E1B4B'); // violet-900
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw base image if provided
    if (baseImage) {
      const img = new Image();
      img.onload = () => {
        // Calcola le dimensioni per l'immagine a sinistra (occupa 40% della larghezza)
        const imageWidth = canvas.width * 0.4;
        const imageHeight = canvas.height;
        const imageX = 0;
        const imageY = 0;
        
        // Calcola le proporzioni per mantenere l'aspect ratio
        const imgAspect = img.width / img.height;
        const targetAspect = imageWidth / imageHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > targetAspect) {
          // L'immagine è più larga, adatta alla larghezza
          drawWidth = imageWidth;
          drawHeight = drawWidth / imgAspect;
          drawX = imageX;
          drawY = imageY + (imageHeight - drawHeight) / 2;
        } else {
          // L'immagine è più alta, adatta all'altezza
          drawHeight = imageHeight;
          drawWidth = drawHeight * imgAspect;
          drawX = imageX + (imageWidth - drawWidth) / 2;
          drawY = imageY;
        }
        
        // Disegna l'immagine a sinistra
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Disegna il testo nella parte destra
        drawText();
        
        // Convert canvas to image AFTER everything is drawn
        const dataURL = canvas.toDataURL('image/png');
        setGeneratedImage(dataURL);
      };
      img.src = baseImage;
    } else {
      // Se non c'è immagine, disegna solo il testo al centro
      drawText();
      
      // Convert canvas to image AFTER everything is drawn
      const dataURL = canvas.toDataURL('image/png');
      setGeneratedImage(dataURL);
    }
    
    function drawText() {
      if (!customText) return;
      
      ctx.font = `bold ${textSize}px Poppins, Arial, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Calcola la posizione del testo
      let textX, maxWidth;
      
      if (baseImage) {
        // Se c'è un'immagine, il testo va nella parte destra
        textX = canvas.width * 0.4 + (canvas.width * 0.6) / 2; // Centro della parte destra
        maxWidth = canvas.width * 0.55; // Larghezza disponibile per il testo
      } else {
        // Se non c'è immagine, il testo va al centro
        textX = canvas.width / 2;
        maxWidth = canvas.width - 100;
      }
      
      // Calcola la dimensione del testo per riempire tutto lo spazio disponibile
      const testText = customText || "Testo di esempio";
      const availableHeight = baseImage ? canvas.height * 0.8 : canvas.height * 0.8; // 80% dell'altezza disponibile
      const maxFontSize = baseImage ? 200 : 250; // Dimensione massima più grande
      let fontSize = maxFontSize;
      
      // Funzione per calcolare le dimensioni del testo con word wrapping
      const calculateTextDimensions = (text, font) => {
        ctx.font = font;
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (let word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        
        return {
          lines,
          lineHeight: fontSize * 1.1,
          totalHeight: lines.length * fontSize * 1.1
        };
      };
      
      // Trova la dimensione ottimale del font
      let textDimensions;
      do {
        fontSize -= 2;
        const font = `bold ${fontSize}px Poppins, Arial, sans-serif`;
        textDimensions = calculateTextDimensions(testText, font);
      } while (textDimensions.totalHeight > availableHeight && fontSize > 20);
      
      // Imposta il font finale
      ctx.font = `bold ${fontSize}px Poppins, Arial, sans-serif`;
      
      // Calcola la posizione verticale per centrare perfettamente
      let textY;
      switch (textPosition) {
        case 'top':
          textY = 50 + textDimensions.totalHeight / 2;
          break;
        case 'center':
          textY = canvas.height / 2;
          break;
        case 'bottom':
          textY = canvas.height - 50 - textDimensions.totalHeight / 2;
          break;
        default:
          textY = canvas.height / 2;
      }
      
      // Disegna il testo centrato perfettamente
      const lineHeight = textDimensions.lineHeight;
      const startY = textY - (textDimensions.lines.length - 1) * lineHeight / 2;
      
      textDimensions.lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.fillText(line, textX, y);
      });
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  };

  const uploadThumbnail = async () => {
    if (!generatedImage) return;

    try {
      setUploading(true);
      
      // Converti il canvas in blob
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      // Crea FormData per l'upload
      const formData = new FormData();
      formData.append('image', blob, `thumbnail-${Date.now()}.png`);
      
      // Carica l'immagine al server
      const response = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Passa l'URL dell'immagine caricata al componente padre
      if (onGenerate) {
        onGenerate(response.data.url);
      }
      
      // Chiudi il modal
      handleClose();
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Errore nel caricamento della thumbnail');
    } finally {
      setUploading(false);
    }
  };

  const downloadThumbnail = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.download = `cpstest-thumbnail-${Date.now()}.png`;
      link.href = generatedImage;
      link.click();
    }
  };

  const handleClose = () => {
    setBaseImage(null);
    setOriginalImage(null);
    setCustomText('');
    setGeneratedImage(null);
    setRemoveBackground(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Thumbnail Generator
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immagine di Base (opzionale)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={removingBg}
                  className="btn-secondary btn-rounded glass-button glass-liquid glass-interactive btn-md w-full"
                >
                  {removingBg ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      Rimozione sfondo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Carica Immagine
                    </>
                  )}
                </button>
                {baseImage && (
                  <div className="mt-2">
                    <img src={baseImage} alt="Preview" className="max-h-32 mx-auto rounded" />
                  </div>
                )}
              </div>
              
              {/* Remove Background Option */}
              <div className="mt-3 flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                <input
                  type="checkbox"
                  id="removeBackground"
                  checked={removeBackground}
                  onChange={(e) => setRemoveBackground(e.target.checked)}
                  disabled={removingBg}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="removeBackground" className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                  <Scissors className="w-4 h-4 mr-1 text-purple-600" />
                  Rimuovi sfondo automaticamente
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Utilizza l'API di remove.bg per rimuovere lo sfondo dell'immagine
              </p>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Testo Personalizzato
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="es. Build 1000€, Budget Beast..."
                className="input"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colore Testo
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="input flex-1"
                />
              </div>
            </div>

            {/* Text Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensione Testo: {textSize}px
              </label>
              <input
                type="range"
                min="24"
                max="120"
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posizione Testo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['top', 'center', 'bottom'].map((position) => (
                  <button
                    key={position}
                    onClick={() => setTextPosition(position)}
                    className={`btn-sm btn-rounded glass-button glass-liquid glass-interactive ${
                      textPosition === position ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {position === 'top' ? 'Alto' : position === 'center' ? 'Centro' : 'Basso'}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Text */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium">💡 L'anteprima si aggiorna automaticamente!</p>
              <p className="text-xs mt-1">Modifica le impostazioni per vedere le modifiche in tempo reale.</p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Anteprima</h3>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto rounded"
                style={{ maxHeight: '400px' }}
              />
            </div>
            
            {generatedImage && (
              <div className="space-y-2">
                <button
                  onClick={uploadThumbnail}
                  disabled={uploading}
                  className="btn-primary btn-rounded glass-button glass-liquid glass-interactive btn-md w-full"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Caricamento...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Carica Thumbnail
                    </>
                  )}
                </button>
                <button
                  onClick={downloadThumbnail}
                  className="btn-secondary btn-rounded glass-button glass-liquid glass-interactive btn-md w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Scarica Thumbnail
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
