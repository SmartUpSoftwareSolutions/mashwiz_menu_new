// export default RestaurantLogoUpload;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImagePlus, X, Upload, Camera, FileImage, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
interface RestaurantLogoUploadProps {
  logoPreview: string | null;
  onLogoChange: (file: File | null, bytes: number[]) => void;
  onRemoveLogo: () => void;
}

const RestaurantLogoUpload: React.FC<RestaurantLogoUploadProps> = ({
  logoPreview,
  onLogoChange,
  onRemoveLogo,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    e.target.value = '';
  };

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, WebP)');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const byteArray = Array.from(new Uint8Array(arrayBuffer));
      onLogoChange(file, byteArray);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-gray-600" />
          <FormLabel className="text-lg font-semibold text-gray-900">
            {t('restaurantLogo')}
          </FormLabel>
        </div>
        <p className="text-sm text-gray-600">
          Upload your restaurant's logo to customize your brand appearance
        </p>
      </div>
      
      {logoPreview ? (
        /* Logo Preview Section with Enhanced Design */
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start gap-6">
              {/* Logo Display */}
              <div className="relative group">
                <div className="relative overflow-hidden rounded-xl border-2 border-white bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <AspectRatio ratio={1} className="w-24 h-24 sm:w-32 sm:h-32">
                    <img 
                      src={logoPreview} 
                      alt="Restaurant logo" 
                      className="object-contain w-full h-full p-3" 
                    />
                  </AspectRatio>
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="bg-white/95 hover:bg-white text-gray-700 text-xs px-2 py-1 shadow-sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="bg-white/95 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs px-2 py-1 shadow-sm"
                        onClick={onRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Logo Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Logo uploaded successfully</span>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Your logo is ready to use. You can change or remove it anytime.
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-50 border-gray-300"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t('changeLogo')}
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-300"
                      onClick={onRemoveLogo}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('removeLogo')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Area with Enhanced Design */
        <div className="space-y-4">
          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group",
              "bg-gradient-to-br from-gray-50/50 to-blue-50/30",
              isDragOver 
                ? "border-blue-400 bg-blue-50/50 scale-[1.02]" 
                : "border-gray-300 hover:border-blue-300 hover:bg-blue-50/20",
              isProcessing && "pointer-events-none opacity-60"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && document.getElementById('logo-upload')?.click()}
          >
            {/* Upload Content */}
            <div className="space-y-4 max-w-xs mx-auto">
              {/* Icon */}
              <div className={cn(
                "w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300",
                isDragOver 
                  ? "bg-blue-100 scale-110" 
                  : "bg-gray-100 group-hover:bg-blue-100 group-hover:scale-105"
              )}>
                {isProcessing ? (
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <ImagePlus className={cn(
                    "w-8 h-8 transition-colors duration-300",
                    isDragOver ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
                  )} />
                )}
              </div>
              
              {/* Text Content */}
              <div className="space-y-2">
                <div>
                  <p className="text-base font-semibold text-gray-900 mb-1">
                    {isProcessing ? 'Processing...' : t('uploadLogo')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isDragOver 
                      ? 'Drop your image here' 
                      : 'Drag and drop your logo or click to browse'
                    }
                  </p>
                </div>
                
                {/* File Requirements */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <FileImage className="w-3 h-3" />
                  <span>PNG, JPG, GIF, WebP • Max 5MB</span>
                </div>
              </div>
              
              {/* Upload Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 bg-white hover:bg-gray-50 border-gray-300"
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
            
            {/* Drag Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-100/20 rounded-xl flex items-center justify-center">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg">
                  Drop image here
                </div>
              </div>
            )}
          </div>
          
          {/* Upload Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileImage className="w-3 h-3 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">Logo Guidelines</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use a square aspect ratio for best results</li>
                  <li>• Ensure your logo is clear and readable at small sizes</li>
                  <li>• Consider using a transparent background (PNG format)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input */}
      <Input 
        type="file" 
        accept="image/*"
        onChange={handleLogoChange}
        className="hidden"
        id="logo-upload"
        disabled={isProcessing}
      />
    </div>
  );
};

export default RestaurantLogoUpload;