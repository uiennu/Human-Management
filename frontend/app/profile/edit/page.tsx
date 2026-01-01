'use client';

import React, { useState, useEffect } from 'react';
import Toast from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import OtpModal from '@/components/OtpModal';
import { Loader2, Lock, Camera, Plus, Trash2, ArrowLeft, FileText, Upload, X } from 'lucide-react'; 
import type { EmployeeProfile } from '@/types/profile';
import { profileApi } from '@/lib/api/profile';
import { fetchBanks, fetchProvinces, type Bank, type Province, type District } from '@/lib/api/external';

// UI Components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; 

// --- CẤU HÌNH URL ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204';

interface EmergencyContactState {
  name: string;
  relation: string;
  phone: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  
  // --- STATE ---
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Master Data
  const [listBanks, setListBanks] = useState<Bank[]>([]);
  const [listProvinces, setListProvinces] = useState<Province[]>([]);
  const [listDistricts, setListDistricts] = useState<District[]>([]);

  // UI State
  const [addressParts, setAddressParts] = useState({ city: '', district: '', street: '' });
  const [bankParts, setBankParts] = useState({ bankName: '', accountNumber: '' });
  
  // State xử lý Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null); 

  // State for supporting documents (ID card photo, bank statement, etc.) - multiple files
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [supportingDocPreviews, setSupportingDocPreviews] = useState<{id: string, file: File, preview: string}[]>([]);
  const [supportingDocError, setSupportingDocError] = useState<string>('');
  const [viewingFile, setViewingFile] = useState<{file: File, preview: string} | null>(null);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    personalEmail: '',
    reqFirstName: '', 
    reqLastName: '',
    reqIdNumber: '',
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactState[]>([
    { name: '', relation: '', phone: '' }
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState({ open: false, type: 'info', message: '' });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [otpMessage, setOtpMessage] = useState<string>('');

  const getFullImageUrl = (url: string | null | undefined) => {
    if (!url) return "https://github.com/shadcn.png"; 
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => { loadAllData(); }, []);

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      supportingDocPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.preview);
      });
    };
  }, [supportingDocPreviews]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [profileData, banksData, provincesData] = await Promise.all([
        profileApi.getProfile(),
        fetchBanks(),
        fetchProvinces()
      ]);

      setProfile(profileData);
      setListBanks(banksData);
      setListProvinces(provincesData);

      setFormData(prev => ({
        ...prev,
        phoneNumber: profileData.basicInfo?.phoneNumber || '',
        personalEmail: profileData.basicInfo?.personalEmail || '',
      }));

      if (profileData.basicInfo?.address) {
         const parts = profileData.basicInfo.address.split(',').map(s => s.trim());
         if (parts.length >= 2) {
            const city = parts[parts.length - 1];
            const district = parts[parts.length - 2];
            const street = parts.slice(0, parts.length - 2).join(', ');
            const province = provincesData.find(p => p.name === city || p.name.includes(city));
            
            if (province) {
                setListDistricts(province.districts);
                setAddressParts({ city: province.name, district: district, street: street });
            } else {
                setAddressParts({ city: '', district: '', street: profileData.basicInfo.address });
            }
         } else {
             setAddressParts({ city: '', district: '', street: profileData.basicInfo.address });
         }
      }

      // @ts-ignore
      const contacts = profileData.basicInfo?.emergencyContacts || profileData.basicInfo?.emergencyContact;
      if (Array.isArray(contacts) && contacts.length > 0) setEmergencyContacts(contacts);
      else if (contacts && !Array.isArray(contacts) && (contacts as any).name) setEmergencyContacts([contacts]);
      else setEmergencyContacts([{ name: '', relation: '', phone: '' }]);

      if (profileData.sensitiveInfo?.bankAccount) {
         const bankStr = profileData.sensitiveInfo.bankAccount;
         if (bankStr.includes(' - ')) {
            const [name, num] = bankStr.split(' - ');
            setBankParts({ bankName: name, accountNumber: num });
         }
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // --- REGEX ---
  const REGEX_PHONE = /^\d{10}$/; 
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const REGEX_NAME = /^[\p{L}\s]+$/u; 
  const REGEX_ID_NUMBER = /^\d{12}$/; 
  const REGEX_NUMBER_ONLY = /^\d+$/;

  // --- VALIDATION & SCROLL LOGIC ---
  const getValidationErrors = () => {
    const newErrors: { [key: string]: string } = {};

    // 1. Phone
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (!REGEX_NUMBER_ONLY.test(formData.phoneNumber)) newErrors.phoneNumber = 'Digits only';
    else if (!REGEX_PHONE.test(formData.phoneNumber)) newErrors.phoneNumber = 'Must be 10 digits';

    // 2. Email
    if (!formData.personalEmail.trim()) newErrors.personalEmail = 'Email is required';
    else if (!REGEX_EMAIL.test(formData.personalEmail)) newErrors.personalEmail = 'Invalid email format';

    // 3. Name
    if (formData.reqFirstName && !REGEX_NAME.test(formData.reqFirstName)) newErrors.reqFirstName = 'No numbers allowed';
    if (formData.reqLastName && !REGEX_NAME.test(formData.reqLastName)) newErrors.reqLastName = 'No numbers allowed';

    // 4. ID
    if (formData.reqIdNumber) {
        if (!REGEX_NUMBER_ONLY.test(formData.reqIdNumber)) newErrors.reqIdNumber = 'Digits only';
        else if (!REGEX_ID_NUMBER.test(formData.reqIdNumber)) newErrors.reqIdNumber = 'Must be 12 digits';
    }

    // 5. Bank
    if (bankParts.accountNumber) {
        if (!bankParts.bankName) newErrors.bank = 'Select a bank'; 
        else if (!REGEX_NUMBER_ONLY.test(bankParts.accountNumber)) newErrors.bank = 'Digits only';
    } else if (bankParts.bankName) {
        newErrors.bank = 'Enter account number';
    }

    // 6. Emergency Contacts
    let hasValidContact = false;
    emergencyContacts.forEach((contact, index) => {
        if (contact.name || contact.relation || contact.phone) {
            hasValidContact = true;
            if (!contact.name.trim()) newErrors[`ec_name_${index}`] = 'Name required';
            else if (!REGEX_NAME.test(contact.name)) newErrors[`ec_name_${index}`] = 'No numbers';

            if (!contact.relation.trim()) newErrors[`ec_relation_${index}`] = 'Relationship required';

            if (!contact.phone.trim()) newErrors[`ec_phone_${index}`] = 'Phone required';
            else if (!REGEX_PHONE.test(contact.phone)) newErrors[`ec_phone_${index}`] = '10 digits';
        }
    });

    if (emergencyContacts.length === 0 || !hasValidContact) {
        newErrors.emergency = 'At least one contact required';
    }

    return newErrors;
  };

  // --- HÀM TỰ ĐỘNG CUỘN TỚI LỖI ---
  const scrollToError = (errorList: { [key: string]: string }) => {
    const firstErrorKey = Object.keys(errorList)[0];
    if (firstErrorKey) {
        // Tìm element theo ID (đã gắn id vào các thẻ Input bên dưới)
        const element = document.getElementById(firstErrorKey);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
        } else if (firstErrorKey === 'emergency') {
            // Trường hợp lỗi chung của Emergency (không tìm thấy input cụ thể) thì cuộn tới tiêu đề
            document.getElementById('emergency-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  };

  // --- CHECK IF THERE ARE ANY CHANGES ---
  const hasBasicInfoChanges = (): boolean => {
    if (!profile) return false;
    
    // Check phone number
    if (formData.phoneNumber !== (profile.basicInfo?.phoneNumber || '')) return true;
    
    // Check personal email
    if (formData.personalEmail !== (profile.basicInfo?.personalEmail || '')) return true;
    
    // Check address
    const currentAddress = profile.basicInfo?.address || '';
    let newAddress = '';
    if (addressParts.city && addressParts.district) {
      newAddress = `${addressParts.street}, ${addressParts.district}, ${addressParts.city}`;
    } else if (addressParts.street) {
      newAddress = addressParts.street;
    }
    if (newAddress && newAddress !== currentAddress) return true;
    
    // Check emergency contacts - simple comparison
    const originalContacts = profile.basicInfo?.emergencyContacts || [];
    if (JSON.stringify(emergencyContacts) !== JSON.stringify(originalContacts)) return true;
    
    // Check avatar
    if (avatarFile) return true;
    
    return false;
  };

  const hasSensitiveInfoChanges = (): boolean => {
    // Check sensitive fields
    if (formData.reqIdNumber.trim()) return true;
    if (formData.reqFirstName.trim()) return true;
    if (formData.reqLastName.trim()) return true;
    
    // Check bank account
    if (bankParts.bankName && bankParts.accountNumber) return true;
    
    return false;
  };

  const hasAnyChanges = (): boolean => {
    return hasBasicInfoChanges() || hasSensitiveInfoChanges();
  };

  // --- HANDLERS ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setAddressParts({ ...addressParts, city: cityName, district: '' });
    const province = listProvinces.find(p => p.name === cityName);
    setListDistricts(province ? province.districts : []);
  };

  const handleAddContact = () => setEmergencyContacts([...emergencyContacts, { name: '', relation: '', phone: '' }]);
  const handleRemoveContact = (index: number) => {
    if (emergencyContacts.length <= 1) return;
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };
  const handleContactChange = (index: number, field: keyof EmergencyContactState, value: string) => {
    const newList = [...emergencyContacts];
    newList[index][field] = value;
    setEmergencyContacts(newList);
  };

  // Handle supporting documents file selection with validation (multiple files)
  const handleSupportingDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSupportingDocError('');
    
    if (!files || files.length === 0) {
      return;
    }

    const selectedFiles = Array.from(files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB per file
    const maxTotalSize = 10 * 1024 * 1024; // 10MB total
    const maxFileCount = 5;

    // Check total file count
    if (supportingDocs.length + selectedFiles.length > maxFileCount) {
      setSupportingDocError(`Maximum ${maxFileCount} files allowed`);
      e.target.value = '';
      return;
    }

    // Validate each file
    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setSupportingDocError(`File "${file.name}": Only JPG, PNG, and PDF files are allowed`);
        e.target.value = '';
        return;
      }
      if (file.size > maxFileSize) {
        setSupportingDocError(`File "${file.name}": Size must be less than 5MB`);
        e.target.value = '';
        return;
      }
    }

    // Check total size
    const totalSize = [...supportingDocs, ...selectedFiles].reduce((acc, f) => acc + f.size, 0);
    if (totalSize > maxTotalSize) {
      setSupportingDocError('Total file size must be less than 10MB');
      e.target.value = '';
      return;
    }

    // Create preview URLs for new files
    const newPreviews = selectedFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file)
    }));

    setSupportingDocs(prev => [...prev, ...selectedFiles]);
    setSupportingDocPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = ''; // Reset input to allow selecting same file again
  };

  const removeSupportingDoc = (id: string) => {
    // Find the preview to revoke its URL
    const previewIndex = supportingDocPreviews.findIndex(p => p.id === id);
    if (previewIndex !== -1) {
      const preview = supportingDocPreviews[previewIndex];
      URL.revokeObjectURL(preview.preview);
      
      // Remove from both arrays using the same index
      setSupportingDocs(prev => prev.filter((_, i) => i !== previewIndex));
      setSupportingDocPreviews(prev => prev.filter(p => p.id !== id));
    }
    
    setSupportingDocError('');
  };

  const handleSaveAll = async () => {
    // 1. Validate và lấy lỗi
    const validationErrors = getValidationErrors();
    setErrors(validationErrors);

    // 2. Nếu có lỗi -> Báo và Cuộn
    if (Object.keys(validationErrors).length > 0) {
        setToast({ open: true, type: 'error', message: 'Please fix highlighted errors' });
        scrollToError(validationErrors);
        return;
    }

    try {
      setSaving(true);

      // Upload Avatar
      if (avatarFile) {
         try {
             await profileApi.uploadAvatar(avatarFile);
         } catch (uploadErr) {
             console.error("Avatar upload failed", uploadErr);
             setToast({ open: true, type: 'error', message: 'Failed to upload avatar, continuing...' });
         }
      }
      
      // Save Basic Info
      let finalAddress = profile?.basicInfo?.address || '';
      if (addressParts.city && addressParts.district) {
         finalAddress = `${addressParts.street}, ${addressParts.district}, ${addressParts.city}`;
      } else if (addressParts.street && !addressParts.city) {
         finalAddress = addressParts.street; 
      }

      let finalBankAccount = '';
      if (bankParts.bankName && bankParts.accountNumber) {
         finalBankAccount = `${bankParts.bankName} - ${bankParts.accountNumber}`;
      }

      await profileApi.updateBasicInfo({
          phoneNumber: formData.phoneNumber,
          address: finalAddress,
          personalEmail: formData.personalEmail,
          // @ts-ignore
          emergencyContacts: emergencyContacts 
      });

      // Save Sensitive Info
      const hasSensitiveUpdate = formData.reqIdNumber || finalBankAccount || formData.reqFirstName || formData.reqLastName;

      if (!hasSensitiveUpdate) {
        setToast({ open: true, type: 'success', message: 'Updated successfully!' });
        setTimeout(() => router.push('/profile'), 1000);
      } else {
        const response = await profileApi.requestSensitiveUpdate(
          {
            idNumber: formData.reqIdNumber,
            bankAccount: finalBankAccount,
            // @ts-ignore
            firstName: formData.reqFirstName,
            // @ts-ignore
            lastName: formData.reqLastName
          },
          supportingDocs.length > 0 ? supportingDocs : undefined // Pass supporting documents if provided
        );
        setPendingRequestId(response.requestId);
        setOtpMessage(response.message);
        setShowOtpModal(true);
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, type: 'error', message: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
      if (!pendingRequestId) return;
      try {
        await profileApi.verifyOtp({ requestId: pendingRequestId, otpCode });
        setShowOtpModal(false);
        setToast({ open: true, type: 'success', message: 'Submitted for HR approval!' });
        setTimeout(() => router.push('/profile'), 1500);
      } catch (err) {
        setToast({ open: true, type: 'error', message: 'Invalid OTP' });
      }
  };

  if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin" /></div>;
  if (!profile) return null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
      <Toast open={toast.open} type={toast.type as any} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
      
      {/* HEADER */}
      <div className="bg-white dark:bg-[#1a2831] p-6 rounded-xl border shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
            <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-lg">
                <img 
                    src={avatarPreview || getFullImageUrl(profile.avatarUrl)} 
                    alt="Avatar" 
                    className="h-full w-full object-cover"
                />
            </div>
            <label className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
        </div>
        <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                {profile.firstName} {profile.lastName}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3 text-sm text-slate-500 font-medium">
                <span className="bg-slate-100 px-3 py-1 rounded-full dark:bg-slate-700">ID: {profile.employeeId}</span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                    {profile.department}
                </span>
            </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          
          {/* PERSONAL INFO */}
          <div className="bg-white dark:bg-[#1a2831] p-6 rounded-xl border shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b pb-4">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
               <div className="space-y-2">
                  <Label className="text-slate-600">Phone Number <span className="text-red-500">*</span></Label>
                  <Input 
                    id="phoneNumber" // <--- ID ĐỂ SCROLL
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                    className={errors.phoneNumber ? "border-red-500 focus-visible:ring-red-500 bg-red-50/10" : ""} 
                    placeholder="09xxxxxxxx (10 digits)"
                  />
                  {errors.phoneNumber && <p className="text-xs text-red-500 font-medium mt-1">{errors.phoneNumber}</p>}
               </div>
               <div className="space-y-2">
                  <Label className="text-slate-600">Personal Email <span className="text-red-500">*</span></Label>
                  <Input 
                    id="personalEmail" // <--- ID ĐỂ SCROLL
                    name="personalEmail" 
                    value={formData.personalEmail} 
                    onChange={e => setFormData({...formData, personalEmail: e.target.value})} 
                    className={errors.personalEmail ? "border-red-500 focus-visible:ring-red-500 bg-red-50/10" : ""} 
                    placeholder="example@mail.com"
                  />
                  {errors.personalEmail && <p className="text-xs text-red-500 font-medium mt-1">{errors.personalEmail}</p>}
               </div>
               
               {/* ADDRESS */}
               <div className="md:col-span-2 space-y-3">
                  <Label className="text-slate-600">Address <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" value={addressParts.city} onChange={handleCityChange}>
                        <option value="">Select City</option>
                        {listProvinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                      </select>
                      <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" value={addressParts.district} onChange={e => setAddressParts({...addressParts, district: e.target.value})} disabled={!addressParts.city}>
                        <option value="">Select District</option>
                        {listDistricts.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
                      </select>
                      <div className="flex-1">
                          <Input 
                            placeholder="Street / House No." 
                            value={addressParts.street} 
                            onChange={e => setAddressParts({...addressParts, street: e.target.value})} 
                            className={errors.street ? "border-red-500 focus-visible:ring-red-500" : ""}
                          />
                          {errors.street && <p className="text-xs text-red-500 font-medium mt-1">{errors.street}</p>}
                      </div>
                  </div>
               </div>
            </div>
          </div>

          {/* EMERGENCY CONTACT */}
          <div className="bg-white dark:bg-[#1a2831] p-6 rounded-xl border shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 id="emergency-section" className="text-xl font-bold text-slate-800 dark:text-white">Emergency Contact</h2>
                <Button variant="ghost" size="sm" onClick={handleAddContact} className="text-blue-600 hover:bg-blue-50"><Plus className="w-4 h-4 mr-1"/> Add Contact</Button>
            </div>
            
            {errors.emergency && <p className="text-sm text-red-500 bg-red-50 p-2 rounded text-center font-medium border border-red-200">{errors.emergency}</p>}
            
            <div className="space-y-6">
                {emergencyContacts.map((contact, index) => (
                    <div key={index} className="relative p-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 transition hover:border-blue-200">
                        {emergencyContacts.length > 1 && (<button onClick={() => handleRemoveContact(index)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition p-1 rounded-full hover:bg-white"><Trash2 className="w-4 h-4"/></button>)}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-slate-500 font-bold">Contact Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    id={`ec_name_${index}`} // <--- ID ĐỂ SCROLL
                                    value={contact.name} 
                                    onChange={e => handleContactChange(index, 'name', e.target.value)} 
                                    placeholder="Full Name" 
                                    className={`bg-white ${errors[`ec_name_${index}`] ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                                />
                                {errors[`ec_name_${index}`] && <p className="text-xs text-red-500 font-medium">{errors[`ec_name_${index}`]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-slate-500 font-bold">Relationship <span className="text-red-500">*</span></Label>
                                <Input 
                                    id={`ec_relation_${index}`} // <--- ID ĐỂ SCROLL
                                    value={contact.relation} 
                                    onChange={e => handleContactChange(index, 'relation', e.target.value)} 
                                    placeholder="e.g. Spouse" 
                                    className={`bg-white ${errors[`ec_relation_${index}`] ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                                />
                                {errors[`ec_relation_${index}`] && <p className="text-xs text-red-500 font-medium">{errors[`ec_relation_${index}`]}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs uppercase text-slate-500 font-bold">Phone Number <span className="text-red-500">*</span></Label>
                                <Input 
                                    id={`ec_phone_${index}`} // <--- ID ĐỂ SCROLL
                                    value={contact.phone} 
                                    onChange={e => handleContactChange(index, 'phone', e.target.value)} 
                                    placeholder="09xxxxxxxx" 
                                    className={`bg-white ${errors[`ec_phone_${index}`] ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                                />
                                {errors[`ec_phone_${index}`] && <p className="text-xs text-red-500 font-medium">{errors[`ec_phone_${index}`]}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* SENSITIVE INFO */}
          <div className="bg-yellow-50/60 dark:bg-yellow-900/10 border border-yellow-200 p-6 rounded-xl space-y-6">
            <div className="flex items-start gap-3">
               <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700 mt-1"><Lock className="w-5 h-5" /></div>
               <div><h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-500">Sensitive Information Request</h2><p className="text-sm text-yellow-700/80 dark:text-yellow-400/80 mt-1">Updates require OTP verification and HR Approval.</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                <div className="space-y-2">
                    <Label className="text-yellow-900 font-medium">Request New First Name</Label>
                    <Input 
                        id="reqFirstName" // <--- ID ĐỂ SCROLL
                        placeholder="Enter new first name" 
                        value={formData.reqFirstName} 
                        onChange={e => setFormData({...formData, reqFirstName: e.target.value})} 
                        className={`border-yellow-200 bg-white ${errors.reqFirstName ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                    />
                    {errors.reqFirstName && <p className="text-xs text-red-500 font-medium mt-1">{errors.reqFirstName}</p>}
                </div>
                <div className="space-y-2">
                    <Label className="text-yellow-900 font-medium">Request New Last Name</Label>
                    <Input 
                        id="reqLastName" // <--- ID ĐỂ SCROLL
                        placeholder="Enter new last name" 
                        value={formData.reqLastName} 
                        onChange={e => setFormData({...formData, reqLastName: e.target.value})} 
                        className={`border-yellow-200 bg-white ${errors.reqLastName ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                    />
                    {errors.reqLastName && <p className="text-xs text-red-500 font-medium mt-1">{errors.reqLastName}</p>}
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label className="text-yellow-900 font-medium">Request New ID/CCCD</Label>
                    <Input 
                        id="reqIdNumber" // <--- ID ĐỂ SCROLL
                        placeholder="Enter new ID (12 digits)" 
                        value={formData.reqIdNumber} 
                        onChange={e => setFormData({...formData, reqIdNumber: e.target.value})} 
                        className={`border-yellow-200 bg-white ${errors.reqIdNumber ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                    />
                    {errors.reqIdNumber && <p className="text-xs text-red-500 font-medium mt-1">{errors.reqIdNumber}</p>}
                </div>
                <div className="md:col-span-2 space-y-2">
                   <Label className="text-yellow-900 font-medium">Bank Account Information</Label>
                   <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-[30%]">
                          <select 
                            className="w-full h-10 rounded-md border border-yellow-200 bg-white px-3 py-2 text-sm" 
                            value={bankParts.bankName} 
                            onChange={e => setBankParts({...bankParts, bankName: e.target.value})}
                          >
                            <option value="">Select Bank</option>
                            {listBanks.map(b => <option key={b.id} value={b.shortName}>({b.code}) {b.shortName}</option>)}
                          </select>
                      </div>
                      <div className="flex-1">
                          <Input 
                            id="bank" // <--- ID ĐỂ SCROLL
                            className={`border-yellow-200 bg-white h-10 ${errors.bank ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                            placeholder="Enter Account Number (Digits only)" 
                            value={bankParts.accountNumber} 
                            onChange={e => setBankParts({...bankParts, accountNumber: e.target.value})} 
                          />
                      </div>
                   </div>
                   {errors.bank && <p className="text-xs text-red-500 font-medium mt-1">{errors.bank}</p>}
                </div>

                {/* Supporting Document Upload */}
                <div className="md:col-span-2 space-y-2">
                   <Label className="text-yellow-900 font-medium">Supporting Document (Optional)</Label>
                   <p className="text-sm text-yellow-700 mb-2">
                     Upload proof of your changes (ID card photo, bank statement, etc.)
                   </p>
                   
                   {/* File upload area - always show if under limit */}
                   {supportingDocs.length < 5 && (
                     <label 
                       htmlFor="supportingDoc"
                       className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-yellow-300 rounded-lg cursor-pointer bg-yellow-50/50 hover:bg-yellow-100/50 transition-colors"
                     >
                       <div className="flex flex-col items-center justify-center py-4">
                         <Upload className="w-6 h-6 mb-1.5 text-yellow-500" />
                         <p className="text-sm text-yellow-700">
                           <span className="font-semibold">Click to upload</span> or drag and drop
                         </p>
                         <p className="text-xs text-yellow-600">
                           JPG, PNG or PDF • Max 5MB/file • 10MB total • {5 - supportingDocs.length} files remaining
                         </p>
                       </div>
                       <input
                         id="supportingDoc"
                         type="file"
                         className="hidden"
                         accept=".jpg,.jpeg,.png,.pdf"
                         multiple
                         onChange={handleSupportingDocsChange}
                       />
                     </label>
                   )}

                   {/* Display uploaded files with preview */}
                   {supportingDocs.length > 0 && (
                     <div className="space-y-3 mt-3">
                       <p className="text-xs text-yellow-700 font-medium">
                         {supportingDocs.length} file(s) selected • {(supportingDocs.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)} KB total
                       </p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {supportingDocPreviews.map((preview) => (
                           <div key={preview.id} className="relative group border-2 border-yellow-200 rounded-lg overflow-hidden bg-white hover:border-yellow-400 transition-all">
                             {/* Preview Area - Clickable */}
                             <div 
                               className="aspect-video bg-yellow-50 flex items-center justify-center p-4 cursor-pointer hover:bg-yellow-100 transition-colors relative"
                               onClick={() => setViewingFile(preview)}
                               title="Click to view full size"
                             >
                               {preview.file.type.startsWith('image/') ? (
                                 <>
                                   <img 
                                     src={preview.preview} 
                                     alt={preview.file.name}
                                     className="max-w-full max-h-full object-contain"
                                   />
                                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                     <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                                       Click to view
                                     </div>
                                   </div>
                                 </>
                               ) : (
                                 <div className="flex flex-col items-center justify-center gap-2">
                                   <FileText className="w-16 h-16 text-yellow-500" />
                                   <p className="text-xs text-yellow-700 font-medium">PDF Document</p>
                                   <p className="text-xs text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity">Click to download</p>
                                 </div>
                               )}
                             </div>
                             
                             {/* File Info */}
                             <div className="p-3 bg-yellow-50/50 border-t border-yellow-200">
                               <div className="flex items-start gap-2">
                                 <div className="flex-1 min-w-0">
                                   <p className="text-sm font-medium text-yellow-900 truncate" title={preview.file.name}>
                                     {preview.file.name}
                                   </p>
                                   <p className="text-xs text-yellow-600 mt-0.5">
                                     {(preview.file.size / 1024).toFixed(1)} KB • {preview.file.type.split('/')[1].toUpperCase()}
                                   </p>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => removeSupportingDoc(preview.id)}
                                   className="p-1.5 hover:bg-red-100 rounded-full transition-colors group-hover:opacity-100 opacity-70"
                                   title="Remove file"
                                 >
                                   <X className="w-4 h-4 text-red-600" />
                                 </button>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                   
                   {supportingDocError && (
                     <p className="text-xs text-red-500 font-medium mt-1">{supportingDocError}</p>
                   )}
                </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 pt-4">
             <Button variant="outline" size="lg" onClick={() => router.back()} className="px-6 h-11"><ArrowLeft className="w-4 h-4 mr-2"/> Cancel</Button>
             <Button 
               onClick={handleSaveAll} 
               disabled={saving || !hasAnyChanges()} 
               size="lg" 
               className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] font-semibold h-11 disabled:opacity-50 disabled:cursor-not-allowed"
               title={!hasAnyChanges() ? "No changes to save" : ""}
             >
                {saving ? <Loader2 className="animate-spin mr-2" /> : null} Save Changes
             </Button>
          </div>
        </div>
        <div className="hidden lg:block">
           <div className="sticky top-6 p-5 border rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3">Profile Guidelines</h3>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 list-disc list-inside">
                  <li><span className="font-medium text-slate-700">Phone:</span> Must be 10 digits.</li>
                  <li><span className="font-medium text-slate-700">Name:</span> No numbers allowed.</li>
              </ul>
           </div>
        </div>
      </div>
      
      {/* File Viewer Modal */}
      {viewingFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setViewingFile(null)}
        >
          <div 
            className="relative max-w-6xl max-h-[90vh] w-full bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {viewingFile.file.type.startsWith('image/') ? (
                    <FileText className="h-5 w-5 text-blue-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{viewingFile.file.name}</p>
                  <p className="text-xs text-slate-600">
                    {(viewingFile.file.size / 1024).toFixed(1)} KB • {viewingFile.file.type.split('/')[1].toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-auto max-h-[calc(90vh-80px)] bg-slate-900 flex items-center justify-center p-8">
              {viewingFile.file.type.startsWith('image/') ? (
                <img 
                  src={viewingFile.preview} 
                  alt={viewingFile.file.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-12 bg-white rounded-lg">
                  <FileText className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">PDF Document</h3>
                  <p className="text-slate-600 mb-4">
                    Cannot preview PDF files in browser
                  </p>
                  <a
                    href={viewingFile.preview}
                    download={viewingFile.file.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <OtpModal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} onSubmit={handleVerifyOtp} message={otpMessage} onResend={() => {}} />
    </div>
  );
}