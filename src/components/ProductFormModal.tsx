import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Eye,
  Shield,
  Tag,
  DollarSign,
  Package,
  Layers,
  FileText,
  Sliders,
  Sun,
  Globe,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Copy,
  ExternalLink,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  Product,
  ProductVariation,
  Category,
  EXACT_14_CATEGORIES,
  ProductStatus,
  StockStatus,
  SkincareSpecifications,
} from '../types';
import {
  formatPrice,
  calculateDiscountPercentage,
  slugify,
  computeStockStatus,
  generateSku,
} from '../utils/format';
import { uploadImageToStorage, validateImageFile } from '../services/storageService';
import { isSlugTaken } from '../services/productService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'>, id?: string) => Promise<void>;
  onDelete?: (product: Product) => void;
  productToEdit?: Product | null;
  existingProducts?: Product[];
}

const PRESET_BRANDS = [
  'ANFA Skincare',
  'Beauty of Joseon',
  'COSRX',
  'Torriden',
  'Skin1004',
  'Anua',
  'Round Lab',
  'Laneige',
  'Innisfree',
  'Some By Mi',
  'Axis-Y',
  'Pyunkang Yul',
  'Dr. Jart+',
  'Isntree',
  'Haruharu Wonder',
  'Medicube',
  'Bioderma',
  'Cerave',
];

const PRESET_SKIN_TYPES = [
  'All Skin Types',
  'Normal',
  'Dry',
  'Oily',
  'Combination',
  'Sensitive',
];

const PRESET_SKIN_CONCERNS = [
  'Acne & Blemishes',
  'Dryness & Dehydration',
  'Dullness & Uneven Tone',
  'Pores & Blackheads',
  'Excess Oil & Sebum',
  'Barrier Repair & Redness',
  'Fine Lines & Aging',
  'Sun Damage & Dark Spots',
  'Sensitivity & Irritation',
];

const PRESET_ATTRIBUTES = [
  'Fragrance-Free',
  'Alcohol-Free',
  'Vegan',
  'Cruelty-Free',
  'Dermatologist-Tested',
  'Paraben-Free',
  'Non-Comedogenic',
  'Reef-Safe',
  'Hypoallergenic',
];

const PRESET_COUNTRIES = [
  'South Korea',
  'Japan',
  'China',
  'United States',
  'France',
  'United Kingdom',
  'Germany',
  'Bangladesh',
];

const SPF_OPTIONS = ['SPF 15', 'SPF 30', 'SPF 45', 'SPF 50', 'SPF 50+'];
const PA_OPTIONS = ['PA+', 'PA++', 'PA+++', 'PA++++'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  productToEdit,
  existingProducts = [],
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'images' | 'skincare' | 'storefront'>('info');

  // Basic Information
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [category, setCategory] = useState<Category>('Sheet Mask');
  const [brand, setBrand] = useState('ANFA Skincare');
  const [customBrand, setCustomBrand] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Pricing & Currency
  const [basePrice, setBasePrice] = useState<number | ''>(1850);
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');

  // Media
  const [mainImage, setMainImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Inventory & Variants
  const [trackInventory, setTrackInventory] = useState(true);
  const [baseStock, setBaseStock] = useState<number>(20);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [allowBackorders, setAllowBackorders] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);

  // Skincare Specifics
  const [skinTypes, setSkinTypes] = useState<string[]>(['All Skin Types']);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [customConcern, setCustomConcern] = useState('');
  const [keyIngredients, setKeyIngredients] = useState('');
  const [fullIngredients, setFullIngredients] = useState('');
  const [benefits, setBenefits] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [volume, setVolume] = useState('50 ml / 1.69 fl. oz.');
  const [origin, setOrigin] = useState('South Korea');
  const [expiryDate, setExpiryDate] = useState('2027-12 / 12M after opening');
  const [warnings, setWarnings] = useState('For external use only. Discontinue if rash or irritation develops.');
  const [spfRating, setSpfRating] = useState('SPF 50+');
  const [paRating, setPaRating] = useState('PA++++');
  const [attributes, setAttributes] = useState<string[]>(['Cruelty-Free', 'Dermatologist-Tested']);

  // Storefront & Marketing
  const [featured, setFeatured] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [comboOffer, setComboOffer] = useState(false);
  const [status, setStatus] = useState<ProductStatus>('published');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // UI & Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Initialize or populate form
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      // Edit existing product
      setName(productToEdit.name || '');
      setSlug(productToEdit.slug || '');
      setIsSlugManual(true);
      setCategory(productToEdit.category || 'Sheet Mask');

      const brandVal = productToEdit.brand || 'ANFA Skincare';
      if (PRESET_BRANDS.includes(brandVal)) {
        setBrand(brandVal);
        setCustomBrand('');
      } else {
        setBrand('Other');
        setCustomBrand(brandVal);
      }

      setSku(productToEdit.sku || '');
      setShortDescription(productToEdit.shortDescription || '');
      setDescription(productToEdit.description || '');
      setTags(productToEdit.tags || []);

      setBasePrice(productToEdit.basePrice ?? 1850);
      setSalePrice(productToEdit.salePrice ?? (productToEdit.compareAtPrice ? productToEdit.basePrice : ''));
      setCostPrice(productToEdit.costPrice ?? '');

      setMainImage(productToEdit.mainImage || '');
      const otherImgs = (productToEdit.images || []).filter((img) => img !== productToEdit.mainImage);
      setGalleryImages(otherImgs);

      setTrackInventory(productToEdit.trackInventory !== false);
      setBaseStock(productToEdit.totalStock ?? 20);
      setLowStockThreshold(productToEdit.lowStockThreshold ?? 5);
      setAllowBackorders(Boolean(productToEdit.allowBackorders));
      const hasVars = Boolean(productToEdit.hasVariants || (productToEdit.variations && productToEdit.variations.length > 0));
      setHasVariants(hasVars);
      setVariations(productToEdit.variations || []);

      // Skincare Specs
      const specs = productToEdit.specifications || {};
      if (Array.isArray(specs.concerns)) {
        setConcerns(specs.concerns);
      } else if (typeof specs.concerns === 'string') {
        setConcerns(specs.concerns.split(',').map((s) => s.trim()).filter(Boolean));
      } else {
        setConcerns(specs.skinConcerns || []);
      }
      setKeyIngredients(specs.keyIngredients || '');
      setFullIngredients(specs.fullIngredients || '');
      setBenefits(specs.benefits || '');
      setHowToUse(specs.howToUse || '');
      setVolume(specs.volume || '50 ml / 1.69 fl. oz.');
      setOrigin(specs.origin || 'South Korea');
      setExpiryDate(specs.expiryDate || '2027-12 / 12M after opening');
      setWarnings(specs.warnings || 'For external use only. Discontinue if rash or irritation develops.');
      setSpfRating(specs.spfRating || 'SPF 50+');
      setPaRating(specs.paRating || 'PA++++');
      setAttributes(specs.attributes || ['Cruelty-Free', 'Dermatologist-Tested']);

      // Storefront & Marketing
      setFeatured(Boolean(productToEdit.featured));
      setBestseller(Boolean(productToEdit.bestseller));
      setNewArrival(Boolean(productToEdit.newArrival));
      setComboOffer(Boolean(productToEdit.comboOffer || productToEdit.category === 'Combo Offer' || productToEdit.category === 'Combo offer'));
      setStatus(productToEdit.status || (productToEdit.active ? 'published' : 'draft'));
      setSortOrder(productToEdit.sortOrder ?? 0);
      setRelatedProductIds(productToEdit.relatedProductIds || []);
      setSeoTitle(productToEdit.seoTitle || productToEdit.name || '');
      setSeoDescription(productToEdit.seoDescription || productToEdit.shortDescription || '');
    } else {
      // Brand new product defaults
      resetToCleanDefaults();
    }
    setIsDirty(false);
    setErrorMessage(null);
    setActiveTab('info');
  }, [isOpen, productToEdit]);

  const resetToCleanDefaults = () => {
    setName('');
    setSlug('');
    setIsSlugManual(false);
    setCategory('Sheet Mask');
    setBrand('ANFA Skincare');
    setCustomBrand('');
    setSku('');
    setShortDescription('');
    setDescription('');
    setTags(['K-Beauty', 'Glass Skin', 'Authentic']);

    setBasePrice(1850);
    setSalePrice('');
    setCostPrice(950);

    setMainImage('https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80');
    setGalleryImages([
      'https://images.unsplash.com/photo-1608248597359-0a6245e3ea1e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
    ]);

    setTrackInventory(true);
    setBaseStock(25);
    setLowStockThreshold(5);
    setAllowBackorders(false);
    setHasVariants(false);
    setVariations([]);

    setSkinTypes(['All Skin Types', 'Sensitive']);
    setConcerns(['Dryness & Dehydration', 'Barrier Repair & Redness']);
    setKeyIngredients('Centella Asiatica (80%), Niacinamide 5%, Ceramide NP, Sodium Hyaluronate');
    setFullIngredients('Centella Asiatica Extract, Water, Butylene Glycol, Niacinamide, 1,2-Hexanediol, Ceramide NP, Hyaluronic Acid, Allantoin, Panthenol, Madecassoside, Ethylhexylglycerin.');
    setBenefits('Instant calming of redness, 48-hour deep barrier hydration, non-sticky dewy glow.');
    setHowToUse('After cleansing and toning, dispense 3-4 drops onto palms and gently press across face and neck. Use AM and PM.');
    setVolume('50 ml / 1.69 fl. oz.');
    setOrigin('South Korea');
    setExpiryDate('2027-12 / 12M after opening');
    setWarnings('For external use only. Discontinue if rash or irritation develops.');
    setSpfRating('SPF 50+');
    setPaRating('PA++++');
    setAttributes(['Fragrance-Free', 'Alcohol-Free', 'Cruelty-Free', 'Dermatologist-Tested']);

    setFeatured(false);
    setBestseller(false);
    setNewArrival(true);
    setComboOffer(false);
    setStatus('published');
    setSortOrder(0);
    setRelatedProductIds([]);
    setSeoTitle('');
    setSeoDescription('');
  };

  // Auto-slugify when name changes if not manually detached
  const handleNameChange = (val: string) => {
    setName(val);
    setIsDirty(true);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
    if (!seoTitle) {
      setSeoTitle(`${val} | ANFA BD`);
    }
  };

  // Auto-generate SKU
  const handleAutoGenerateSku = () => {
    const newSku = generateSku(name || 'SKIN', category);
    setSku(newSku);
    setIsDirty(true);
  };

  // Tags management
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
      setIsDirty(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setIsDirty(true);
  };

  // Total stock calculation
  const calculatedTotalStock = useMemo(() => {
    if (hasVariants && variations.length > 0) {
      return variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    return Number(baseStock) || 0;
  }, [hasVariants, variations, baseStock]);

  const currentStockStatus: StockStatus = useMemo(() => {
    return computeStockStatus(calculatedTotalStock, lowStockThreshold, allowBackorders);
  }, [calculatedTotalStock, lowStockThreshold, allowBackorders]);

  // Price calculations
  const numericBasePrice = Number(basePrice) || 0;
  const numericSalePrice = salePrice !== '' ? Number(salePrice) : undefined;
  const discountPercent = calculateDiscountPercentage(
    numericSalePrice !== undefined && numericSalePrice < numericBasePrice ? numericSalePrice : numericBasePrice,
    numericSalePrice !== undefined && numericSalePrice < numericBasePrice ? numericBasePrice : undefined
  );

  // Filtered categories for searchable dropdown
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return EXACT_14_CATEGORIES;
    return EXACT_14_CATEGORIES.filter((c) =>
      c.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
  }, [categorySearchQuery]);

  // Is category sunscreen?
  const isSunscreenCategory = category.toLowerCase().includes('sunscreen') || category.toLowerCase().includes('sunscream');

  // Variations handlers
  const handleAddVariant = () => {
    const newVariant: ProductVariation = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Option ${variations.length + 1}`,
      color: 'Dewy Glow',
      colorCode: '#FF1493',
      images: [mainImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80'],
      sku: generateSku(name || 'PROD', category, `V${variations.length + 1}`),
      stock: 15,
      priceOverride: undefined,
      active: true,
    };
    setVariations([...variations, newVariant]);
    setIsDirty(true);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariation, value: any) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
    setIsDirty(true);
  };

  const handleRemoveVariant = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleDuplicateVariant = (index: number) => {
    const source = variations[index];
    const clone: ProductVariation = {
      ...source,
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Copy)`,
      sku: generateSku(name || 'PROD', category, `CPY`),
    };
    setVariations([...variations, clone]);
    setIsDirty(true);
  };

  // Image Upload Handlers
  const handleMainImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);
    try {
      const url = await uploadImageToStorage(file, 'products/main');
      setMainImage(url);
      setIsDirty(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload main image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setErrorMessage(null);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(`${file.name}: ${validation.error}`);
        }
        const url = await uploadImageToStorage(file, 'products/gallery');
        uploadedUrls.push(url);
      }
      setGalleryImages([...galleryImages, ...uploadedUrls]);
      setIsDirty(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed uploading gallery images.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed); // validate format
      setGalleryImages([...galleryImages, trimmed]);
      setNewImageUrl('');
      setIsDirty(true);
    } catch {
      setErrorMessage('Please enter a valid image URL starting with http:// or https://');
    }
  };

  const handleSetAsMainImage = (index: number) => {
    const selected = galleryImages[index];
    const remaining = galleryImages.filter((_, i) => i !== index);
    if (mainImage) {
      remaining.unshift(mainImage);
    }
    setMainImage(selected);
    setGalleryImages(remaining);
    setIsDirty(true);
  };

  const handleMoveGalleryImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= galleryImages.length) return;
    const reordered = [...galleryImages];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setGalleryImages(reordered);
    setIsDirty(true);
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Skin Types & Concerns toggles
  const handleToggleSkinType = (type: string) => {
    if (skinTypes.includes(type)) {
      if (skinTypes.length > 1) {
        setSkinTypes(skinTypes.filter((t) => t !== type));
      }
    } else {
      setSkinTypes([...skinTypes, type]);
    }
    setIsDirty(true);
  };

  const handleToggleConcern = (concern: string) => {
    if (concerns.includes(concern)) {
      setConcerns(concerns.filter((c) => c !== concern));
    } else {
      setConcerns([...concerns, concern]);
    }
    setIsDirty(true);
  };

  const handleAddCustomConcern = () => {
    const trimmed = customConcern.trim();
    if (trimmed && !concerns.includes(trimmed)) {
      setConcerns([...concerns, trimmed]);
      setCustomConcern('');
      setIsDirty(true);
    }
  };

  const handleToggleAttribute = (attr: string) => {
    if (attributes.includes(attr)) {
      setAttributes(attributes.filter((a) => a !== attr));
    } else {
      setAttributes([...attributes, attr]);
    }
    setIsDirty(true);
  };

  // Form Validation
  const validateForm = (isDraftMode: boolean = false): boolean => {
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Product Name is required.');
      setActiveTab('info');
      return false;
    }

    if (!isDraftMode) {
      if (!shortDescription.trim()) {
        setErrorMessage('Short Description is required for storefront product cards.');
        setActiveTab('info');
        return false;
      }

      if (!mainImage.trim()) {
        setErrorMessage('Main Product Image is required.');
        setActiveTab('images');
        return false;
      }

      if (numericBasePrice <= 0) {
        setErrorMessage('Regular Price must be greater than 0 ৳.');
        setActiveTab('pricing');
        return false;
      }

      if (numericSalePrice !== undefined && numericSalePrice > numericBasePrice) {
        setErrorMessage('Sale Price cannot exceed Regular Price.');
        setActiveTab('pricing');
        return false;
      }
    }

    return true;
  };

  // Submit Handler (Draft or Publish)
  const handleSubmit = async (submitStatus: 'draft' | 'published') => {
    const isValid = validateForm(submitStatus === 'draft');
    if (!isValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const finalBrand = brand === 'Other' ? (customBrand.trim() || 'ANFA Skincare') : brand;
      let finalSlug = slugify(slug || name);

      // Check slug uniqueness
      const taken = await isSlugTaken(finalSlug, productToEdit?.id);
      if (taken) {
        finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const allImages = [mainImage, ...galleryImages].filter(Boolean);

      const finalProductPayload: Omit<Product, 'id'> = {
        name: name.trim(),
        slug: finalSlug,
        category,
        brand: finalBrand,
        sku: sku.trim() || generateSku(name, category),
        shortDescription: shortDescription.trim(),
        description: description.trim() || shortDescription.trim(),
        tags,

        basePrice: numericBasePrice,
        salePrice: numericSalePrice,
        compareAtPrice: numericSalePrice !== undefined && numericSalePrice < numericBasePrice ? numericBasePrice : undefined,
        costPrice: costPrice !== '' ? Math.max(0, Number(costPrice)) : undefined,

        mainImage,
        images: allImages,

        trackInventory,
        totalStock: calculatedTotalStock,
        lowStockThreshold,
        allowBackorders,
        hasVariants,
        stockStatus: currentStockStatus,
        variations: hasVariants ? variations : [],

        specifications: {
          skinType: skinTypes.join(', '),
          skinTypes,
          concerns,
          keyIngredients: keyIngredients.trim(),
          fullIngredients: fullIngredients.trim(),
          benefits: benefits.trim(),
          howToUse: howToUse.trim(),
          volume: volume.trim(),
          origin: origin.trim(),
          expiryDate: expiryDate.trim(),
          warnings: warnings.trim(),
          spfRating: isSunscreenCategory ? spfRating : undefined,
          paRating: isSunscreenCategory ? paRating : undefined,
          attributes,
          dermatologistTested: attributes.includes('Dermatologist-Tested'),
        },

        featured,
        bestseller,
        newArrival,
        comboOffer: comboOffer || category === 'Combo Offer',
        active: submitStatus === 'published',
        status: submitStatus,
        sortOrder: Number(sortOrder) || 0,
        relatedProductIds,
        seoTitle: seoTitle.trim() || `${name.trim()} | ANFA BD Skincare`,
        seoDescription: seoDescription.trim() || shortDescription.trim(),

        createdAt: productToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(finalProductPayload, productToEdit?.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setErrorMessage(err.message || 'An error occurred while saving the product to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleResetForm = () => {
    if (window.confirm('Reset this form back to clean defaults? All entered fields will be cleared.')) {
      resetToCleanDefaults();
      setIsDirty(false);
      setErrorMessage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#18020D] via-[#2A0318] to-[#18020D] text-white px-6 py-4 flex items-center justify-between border-b border-pink-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF1493]/20 border border-[#FF1493]/50 flex items-center justify-center text-[#FF1493] shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg sm:text-xl font-bold tracking-wide">
                  {productToEdit ? 'Edit Product' : 'Create New Product'}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : status === 'draft'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                  }`}
                >
                  {status}
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-pink-200 font-mono">
                  {currentStockStatus} ({calculatedTotalStock} units)
                </span>
              </div>
              <p className="text-xs text-pink-200/80 mt-0.5">
                {productToEdit ? `Updating ID: ${productToEdit.id}` : 'ANFA BD Skincare Catalogue Manager'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-pink-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
              title="Reset form"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleCancel}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-pink-200 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-2 text-xs text-red-700 animate-in slide-in-from-top-1 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-50 px-4 sm:px-6 border-b border-slate-200 shrink-0 flex items-center overflow-x-auto no-scrollbar gap-1 sm:gap-2 pt-2">
          {[
            { id: 'info', label: '1. Basic Info', icon: FileText },
            { id: 'pricing', label: '2. Pricing & Stock', icon: DollarSign },
            { id: 'images', label: '3. Images & Gallery', icon: ImageIcon },
            { id: 'skincare', label: '4. Skincare Details', icon: Sparkles },
            { id: 'storefront', label: '5. Storefront & SEO', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'bg-white text-[#FF1493] border-[#FF1493] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF1493]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Product Name <span className="text-[#FF1493]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Centella Calming Ampoule Serum 50ml"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493] focus:ring-2 focus:ring-[#FF1493]/20 font-medium"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Use a clear, descriptive title including key active ingredient and volume.
                  </p>
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Product Slug
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSlugManual(!isSlugManual);
                        if (isSlugManual) setSlug(slugify(name));
                      }}
                      className="text-[11px] text-[#FF1493] hover:underline font-semibold"
                    >
                      {isSlugManual ? 'Reset to Auto' : 'Edit Manually'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={!isSlugManual}
                      placeholder="e.g. centella-calming-ampoule-serum-50ml"
                      value={slug}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                        setIsDirty(true);
                      }}
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-700 focus:outline-none focus:border-[#FF1493] disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    URL: anfabd.com/products/{slug || 'product-slug'}
                  </p>
                </div>

                {/* Category (Exact 14 Categories with Searchable Dropdown) */}
                <div className="relative" ref={categoryDropdownRef}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category <span className="text-[#FF1493]">*</span> (14 Skincare Lines)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl flex items-center justify-between text-left focus:outline-none focus:border-[#FF1493] shadow-2xs font-semibold text-slate-800"
                  >
                    <span>{category}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1 max-h-64 overflow-y-auto">
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF1493] mb-1"
                      />
                      {filteredCategories.map((cat, idx) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat as Category);
                            setIsCategoryDropdownOpen(false);
                            setCategorySearchQuery('');
                            setIsDirty(true);
                            if (cat === 'Combo Offer') setComboOffer(true);
                          }}
                          className={`w-full px-3 py-2 text-xs rounded-lg text-left flex items-center justify-between transition-colors ${
                            category === cat
                              ? 'bg-[#FFF0F6] text-[#FF1493] font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <span>{idx + 1}. {cat}</span>
                          {category === cat && <Check className="w-3.5 h-3.5 text-[#FF1493]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Brand <span className="text-[#FF1493]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493] font-medium"
                    >
                      {PRESET_BRANDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      <option value="Other">+ Custom Brand</option>
                    </select>

                    {brand === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter brand name"
                        value={customBrand}
                        onChange={(e) => {
                          setCustomBrand(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                      />
                    )}
                  </div>
                </div>

                {/* SKU / Product Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      SKU / Product Code
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSku}
                      className="text-[11px] text-[#FF1493] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. ANFA-MSK-CEN-001"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-[#FF1493]"
                  />
                </div>

                {/* Short Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Short Description <span className="text-[#FF1493]">*</span> (for product cards &amp; quick view)
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Brief 1-2 sentence summary highlighting key benefits and origin..."
                    value={shortDescription}
                    onChange={(e) => {
                      setShortDescription(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493] leading-relaxed"
                  />
                </div>

                {/* Full Description */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Full Description <span className="text-[#FF1493]">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500">Supports detailed skincare ritual guide</span>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Provide full formulation background, active concentrations, texture details, sensory experience, and application ritual..."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493] leading-relaxed font-sans"
                  />
                </div>

                {/* Product Tags */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Product Tags (Search &amp; Filter Keywords)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Type a tag and press Enter or click Add (e.g. Cica, Serum, Glass Skin)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3] hover:bg-[#FF1493] hover:text-white rounded-xl text-xs font-bold uppercase transition-colors"
                    >
                      Add Tag
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                      >
                        <Tag className="w-3 h-3 text-[#FF1493]" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & INVENTORY */}
          {activeTab === 'pricing' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Pricing Grid */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#FF1493]" />
                    <span>Pricing &amp; Margins (BDT ৳)</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Live Discount:</span>
                    <span className="font-bold text-[#FF1493] bg-pink-100/60 px-2.5 py-0.5 rounded-full border border-pink-200">
                      {discountPercent > 0 ? `${discountPercent}% OFF` : 'No Discount'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Regular Price */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Regular Price (৳) <span className="text-[#FF1493]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={basePrice}
                        onChange={(e) => {
                          setBasePrice(e.target.value === '' ? '' : Number(e.target.value));
                          setIsDirty(true);
                        }}
                        placeholder="1850"
                        className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-[#FF1493]"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Official catalog standard selling price.</p>
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Sale Price (৳) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        value={salePrice}
                        onChange={(e) => {
                          setSalePrice(e.target.value === '' ? '' : Number(e.target.value));
                          setIsDirty(true);
                        }}
                        placeholder="Leave blank for regular"
                        className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-[#FF1493] focus:outline-none focus:border-[#FF1493]"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Must be lower than Regular Price.</p>
                  </div>

                  {/* Cost Price (Admin Only) */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Cost Price (৳)
                      </label>
                      <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                        <Shield className="w-2.5 h-2.5" /> Admin Only
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        value={costPrice}
                        onChange={(e) => {
                          setCostPrice(e.target.value === '' ? '' : Number(e.target.value));
                          setIsDirty(true);
                        }}
                        placeholder="e.g. 950"
                        className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-mono text-slate-700 focus:outline-none focus:border-[#FF1493]"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Import cost. Never exposed to storefront or customers.
                    </p>
                  </div>
                </div>

                {/* Profit summary */}
                {costPrice !== '' && basePrice !== '' && (
                  <div className="pt-2 text-xs text-slate-600 flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      Gross Profit:{' '}
                      <span className="font-bold text-emerald-700">
                        {formatPrice(
                          (numericSalePrice !== undefined && numericSalePrice > 0 ? numericSalePrice : numericBasePrice) -
                            Number(costPrice)
                        )}
                      </span>
                    </div>
                    <div>
                      Margin:{' '}
                      <span className="font-bold text-emerald-700">
                        {Math.round(
                          (((numericSalePrice !== undefined && numericSalePrice > 0 ? numericSalePrice : numericBasePrice) -
                            Number(costPrice)) /
                            (numericSalePrice !== undefined && numericSalePrice > 0 ? numericSalePrice : numericBasePrice)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Management Section */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#FF1493]" />
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      Inventory &amp; Stock Tracking
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      currentStockStatus === 'In Stock'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentStockStatus === 'Low Stock'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Status: {currentStockStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Track Inventory toggle */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">Track Inventory</span>
                      <span className="text-[11px] text-slate-500">Auto-deduct on orders</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trackInventory}
                        onChange={(e) => {
                          setTrackInventory(e.target.checked);
                          setIsDirty(true);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF1493]"></div>
                    </label>
                  </div>

                  {/* Allow Backorders toggle */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">Allow Backorders</span>
                      <span className="text-[11px] text-slate-500">Accept orders when out</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowBackorders}
                        onChange={(e) => {
                          setAllowBackorders(e.target.checked);
                          setIsDirty(true);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF1493]"></div>
                    </label>
                  </div>

                  {/* Low stock threshold */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Low-Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={(e) => {
                        setLowStockThreshold(Number(e.target.value));
                        setIsDirty(true);
                      }}
                      className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                    />
                  </div>
                </div>

                {!hasVariants && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Available Stock Quantity (Units)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={baseStock}
                      onChange={(e) => {
                        setBaseStock(Number(e.target.value));
                        setIsDirty(true);
                      }}
                      className="w-full sm:w-1/3 px-4 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                    />
                  </div>
                )}
              </div>

              {/* PRODUCT VARIANTS MANAGER */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#FF1493]" />
                      <h3 className="font-serif text-base font-bold text-slate-900">
                        Product Variants (Sizes, Shades, Scents &amp; Pack Types)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      When enabled, storefront stock and price dynamically adapt to customer selection.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setHasVariants(checked);
                          setIsDirty(true);
                          if (checked && variations.length === 0) {
                            handleAddVariant();
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF1493]"></div>
                      <span className="ml-2 text-xs font-bold text-slate-700">
                        {hasVariants ? 'Variants Enabled' : 'Single Product'}
                      </span>
                    </label>

                    {hasVariants && (
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="px-3.5 py-1.5 bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3] hover:bg-[#FF1493] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Variant</span>
                      </button>
                    )}
                  </div>
                </div>

                {hasVariants && (
                  <div className="space-y-4 pt-2">
                    {variations.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">No variants added yet.</p>
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="mt-3 px-4 py-2 bg-[#FF1493] text-white rounded-xl text-xs font-bold uppercase shadow-sm"
                        >
                          + Add First Variant
                        </button>
                      </div>
                    ) : (
                      variations.map((v, idx) => (
                        <div
                          key={v.id || idx}
                          className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 hover:border-pink-300 transition-colors"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                style={{ backgroundColor: v.colorCode || '#FF1493' }}
                              />
                              <span className="font-bold text-xs text-slate-900">
                                Variant #{idx + 1}: {v.name}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                                  v.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {v.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDuplicateVariant(idx)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"
                                title="Duplicate variant"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove variant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Variant Name */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                Option / Size Name *
                              </label>
                              <input
                                type="text"
                                value={v.name}
                                onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                                placeholder="e.g. 50ml Dropper"
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493]"
                              />
                            </div>

                            {/* Color/Shade Label */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                Color / Shade / Scent
                              </label>
                              <input
                                type="text"
                                value={v.color || ''}
                                onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                                placeholder="e.g. Dewy Glow"
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493]"
                              />
                            </div>

                            {/* Color Swatch */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                Swatch Color
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={v.colorCode || '#FF1493'}
                                  onChange={(e) => handleUpdateVariant(idx, 'colorCode', e.target.value)}
                                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 shrink-0"
                                />
                                <input
                                  type="text"
                                  value={v.colorCode || '#FF1493'}
                                  onChange={(e) => handleUpdateVariant(idx, 'colorCode', e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                                />
                              </div>
                            </div>

                            {/* SKU */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                Variant SKU
                              </label>
                              <input
                                type="text"
                                value={v.sku || ''}
                                onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                                placeholder="ANFA-CEN-50M"
                                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493]"
                              />
                            </div>

                            {/* Stock */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                Stock Quantity *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493]"
                              />
                            </div>

                            {/* Price Override */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                Price Override (৳) <span className="font-normal text-slate-400">(Optional)</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={v.priceOverride ?? ''}
                                onChange={(e) =>
                                  handleUpdateVariant(
                                    idx,
                                    'priceOverride',
                                    e.target.value === '' ? undefined : Number(e.target.value)
                                  )
                                }
                                placeholder={`Base: ${formatPrice(numericBasePrice)}`}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493]"
                              />
                            </div>

                            {/* Image URL */}
                            <div className="lg:col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                                Variant Image URL (Displayed when chosen)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={v.images?.[0] || ''}
                                  onChange={(e) => handleUpdateVariant(idx, 'images', [e.target.value])}
                                  placeholder="https://..."
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF1493]"
                                />
                                {v.images?.[0] && (
                                  <img
                                    src={v.images[0]}
                                    alt="Variant preview"
                                    className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: IMAGES & GALLERY */}
          {activeTab === 'images' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Main Product Image Section */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#FF1493]" />
                      <span>Main Product Image <span className="text-[#FF1493]">*</span></span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Primary high-resolution photo displayed across product listings, cards, and cart.
                    </p>
                  </div>
                  {uploadingImage && (
                    <span className="text-xs text-[#FF1493] font-semibold animate-pulse">
                      Processing &amp; Optimizing...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Image Preview Box */}
                  <div className="md:col-span-4 aspect-square rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden relative group bg-white flex items-center justify-center shadow-xs">
                    {mainImage ? (
                      <>
                        <img
                          src={mainImage}
                          alt="Main Product Preview"
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewZoomImage(mainImage)}
                            className="p-2 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform shadow-md"
                            title="Zoom full image"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <span className="text-xs font-semibold block">No main image set</span>
                        <span className="text-[10px]">Upload or enter URL</span>
                      </div>
                    )}
                  </div>

                  {/* Input Controls */}
                  <div className="md:col-span-8 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Image URL (Direct link)
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or cloudinary link"
                        value={mainImage}
                        onChange={(e) => {
                          setMainImage(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-[11px] text-slate-400 uppercase font-bold">OR UPLOAD FILE</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3] hover:bg-[#FF1493] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs">
                        <Upload className="w-4 h-4" />
                        <span>Upload From Device (JPEG, PNG, WEBP, AVIF)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleMainImageFileUpload}
                        />
                      </label>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Max file size: 5MB. Automatically optimized for retina displays.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Gallery Images Section */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#FF1493]" />
                      <span>Additional Gallery Images ({galleryImages.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Reorder, remove, or promote any gallery photo to main product image.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-[#FF1493] text-slate-800 hover:text-[#FF1493] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Files</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleGalleryImageFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Add via URL input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Add additional image by direct URL (https://...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-[#FFF0F6] text-[#FF1493] border border-[#FFC1E3] hover:bg-[#FF1493] hover:text-white rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    Add Image URL
                  </button>
                </div>

                {/* Gallery Grid */}
                {galleryImages.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-300">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No additional gallery images added.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload swatch closeups, texture shots, and packaging details.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {galleryImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="text-red-400 hover:text-red-200 p-1"
                              title="Delete image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleSetAsMainImage(idx)}
                              className="w-full py-1 text-[10px] font-bold bg-[#FF1493] hover:bg-[#E00078] rounded text-white tracking-wide"
                            >
                              Make Main
                            </button>
                            <div className="flex justify-between gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveGalleryImage(idx, 'left')}
                                className="flex-1 py-0.5 text-[9px] bg-white/20 hover:bg-white/30 rounded disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                                title="Move left"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewZoomImage(imgUrl)}
                                className="p-1 text-white hover:bg-white/20 rounded"
                                title="Zoom preview"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === galleryImages.length - 1}
                                onClick={() => handleMoveGalleryImage(idx, 'right')}
                                className="flex-1 py-0.5 text-[9px] bg-white/20 hover:bg-white/30 rounded disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                                title="Move right"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SKINCARE DETAILS */}
          {activeTab === 'skincare' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Suitable Skin Types Multi-select */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Suitable Skin Types <span className="text-slate-400 font-normal">(Select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SKIN_TYPES.map((type) => {
                    const isSelected = skinTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleToggleSkinType(type)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#FF1493] text-white border-[#FF1493] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-pink-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skin Concerns Multi-select */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Skin Concerns
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SKIN_CONCERNS.map((con) => {
                    const isSelected = concerns.includes(con);
                    return (
                      <button
                        key={con}
                        type="button"
                        onClick={() => handleToggleConcern(con)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#FFF0F6] text-[#FF1493] border-[#FFC1E3] ring-1 ring-[#FF1493]'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1 text-[#FF1493]" />}
                        {con}
                      </button>
                    );
                  })}
                </div>

                {/* Add custom concern */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom concern (e.g. Fungal Acne Safe)"
                    value={customConcern}
                    onChange={(e) => setCustomConcern(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomConcern();
                      }
                    }}
                    className="w-full sm:w-1/2 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomConcern}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Sunscreen Conditional Fields */}
              {isSunscreenCategory && (
                <div className="p-6 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                    <Sun className="w-5 h-5 text-amber-600" />
                    <div>
                      <h4 className="font-serif text-sm font-bold text-amber-900">
                        Sunscreen Protection Ratings (Sun Care Exclusive)
                      </h4>
                      <p className="text-[11px] text-amber-700">
                        Visible only because category is Sunscreen.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                        SPF Rating
                      </label>
                      <select
                        value={spfRating}
                        onChange={(e) => {
                          setSpfRating(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600 font-bold"
                      >
                        {SPF_OPTIONS.map((spf) => (
                          <option key={spf} value={spf}>
                            {spf}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                        PA Rating
                      </label>
                      <select
                        value={paRating}
                        onChange={(e) => {
                          setPaRating(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-amber-600 font-bold"
                      >
                        {PA_OPTIONS.map((pa) => (
                          <option key={pa} value={pa}>
                            {pa}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Verified Attributes Checklist */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Verified Botanical &amp; Safety Attributes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_ATTRIBUTES.map((attr) => {
                    const isChecked = attributes.includes(attr);
                    return (
                      <label
                        key={attr}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAttribute(attr)}
                          className="accent-[#FF1493] w-4 h-4 rounded"
                        />
                        <span>{attr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Ingredients & Usage Ritual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Key Ingredients
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Centella Asiatica 80%, Niacinamide 5%, Ceramide NP"
                    value={keyIngredients}
                    onChange={(e) => {
                      setKeyIngredients(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Net Weight / Volume
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50 ml / 1.69 fl. oz. or 100 g"
                    value={volume}
                    onChange={(e) => {
                      setVolume(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Country of Origin
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  >
                    {PRESET_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Expiry Date / Shelf Life
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2027-12 / 12M after opening"
                    value={expiryDate}
                    onChange={(e) => {
                      setExpiryDate(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Ingredients List (INCI)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Full scientific INCI ingredients list..."
                    value={fullIngredients}
                    onChange={(e) => {
                      setFullIngredients(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493] font-mono leading-relaxed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Product Benefits
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Deep hydration, redness reduction, strengthened skin barrier, radiant glass glow..."
                    value={benefits}
                    onChange={(e) => {
                      setBenefits(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493] leading-relaxed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    How to Use (Application Ritual)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Step-by-step instructions on when and how to apply in the routine..."
                    value={howToUse}
                    onChange={(e) => {
                      setHowToUse(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493] leading-relaxed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Warnings &amp; Precautions
                  </label>
                  <input
                    type="text"
                    value={warnings}
                    onChange={(e) => {
                      setWarnings(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STOREFRONT & SEO */}
          {activeTab === 'storefront' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Product Status & Visibility */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-serif text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
                  Publication Status &amp; Shop Visibility
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'published',
                      title: 'Published (Active)',
                      desc: 'Visible in public shop & searchable by customers.',
                      color: 'border-emerald-400 bg-emerald-50/60 text-emerald-900',
                    },
                    {
                      id: 'draft',
                      title: 'Draft (Hidden)',
                      desc: 'Completely hidden from customer storefront.',
                      color: 'border-amber-400 bg-amber-50/60 text-amber-900',
                    },
                    {
                      id: 'archived',
                      title: 'Archived',
                      desc: 'Hidden from shop and deprecated from active catalogue.',
                      color: 'border-slate-400 bg-slate-100 text-slate-800',
                    },
                  ].map((st) => (
                    <label
                      key={st.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                        status === st.id ? st.color : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{st.title}</span>
                        <input
                          type="radio"
                          name="productStatus"
                          value={st.id}
                          checked={status === st.id}
                          onChange={() => {
                            setStatus(st.id as ProductStatus);
                            setIsDirty(true);
                          }}
                          className="accent-[#FF1493]"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 leading-snug">{st.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Marketing Toggles */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-serif text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
                  Marketing Badges &amp; Curations
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-pink-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => {
                        setFeatured(e.target.checked);
                        setIsDirty(true);
                      }}
                      className="accent-[#FF1493] w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">Featured Curation</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-pink-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={bestseller}
                      onChange={(e) => {
                        setBestseller(e.target.checked);
                        setIsDirty(true);
                      }}
                      className="accent-[#FF1493] w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">Best Seller</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-pink-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={newArrival}
                      onChange={(e) => {
                        setNewArrival(e.target.checked);
                        setIsDirty(true);
                      }}
                      className="accent-[#FF1493] w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">New Arrival</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-pink-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={comboOffer}
                      onChange={(e) => {
                        setComboOffer(e.target.checked);
                        setIsDirty(true);
                      }}
                      className="accent-[#FF1493] w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">Combo Offer</span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Display Priority / Sort Order <span className="font-normal text-slate-400">(Lower numbers appear first)</span>
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    className="w-full sm:w-1/4 px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                  />
                </div>
              </div>

              {/* Related Products Selector */}
              {existingProducts.length > 0 && (
                <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Frequently Bought Together / Related Products
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select complementary skincare items displayed at the bottom of this product's page.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {existingProducts
                      .filter((p) => p.id !== productToEdit?.id)
                      .slice(0, 15)
                      .map((p) => {
                        const isSelected = relatedProductIds.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setRelatedProductIds(relatedProductIds.filter((id) => id !== p.id));
                              } else {
                                setRelatedProductIds([...relatedProductIds, p.id]);
                              }
                              setIsDirty(true);
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                              isSelected
                                ? 'bg-pink-50 border-[#FF1493] text-slate-900'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={p.mainImage}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                            <div className="truncate flex-1">
                              <span className="text-[11px] font-semibold block truncate">{p.name}</span>
                              <span className="text-[10px] text-slate-400">{formatPrice(p.basePrice)}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#FF1493] shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* SEO Meta Fields */}
              <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#FF1493]" />
                    <span>Search Engine Optimization (SEO)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Google SERP Preview</span>
                </div>

                {/* Google Snippet Mockup */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-emerald-800 font-mono block">
                    https://anfabd.com › products › {slug || 'product-slug'}
                  </span>
                  <h4 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                    {seoTitle || `${name || 'Product Title'} | ANFA BD Skincare`}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {seoDescription || shortDescription || 'Authentic Korean and dermatologist-grade skincare formulas in Bangladesh.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        SEO Meta Title
                      </label>
                      <span className="text-[11px] text-slate-400">{seoTitle.length}/60 chars</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Centella Calming Ampoule Serum 50ml | ANFA BD"
                      value={seoTitle}
                      onChange={(e) => {
                        setSeoTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        SEO Meta Description
                      </label>
                      <span className="text-[11px] text-slate-400">{seoDescription.length}/160 chars</span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Enter a captivating search summary for Google, Bing, and social sharing..."
                      value={seoDescription}
                      onChange={(e) => {
                        setSeoDescription(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF1493]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer Actions (Section 8) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResetForm}
              className="flex-1 sm:flex-none px-3 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-200/50 transition-colors"
            >
              Clear
            </button>

            {productToEdit && onDelete && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onDelete(productToEdit)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Permanently delete this product from catalogue"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Save as Draft */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>Save as Draft</span>
            </button>

            {/* Publish Product */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('published')}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#FF1493] hover:bg-[#E00078] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{productToEdit ? 'Update & Publish' : 'Publish Product'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Image Zoom Preview Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-transparent">
            <img
              src={previewZoomImage}
              alt="Zoomed preview"
              className="w-full h-full object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
