'use client';

import React, { useState, useEffect } from 'react';
import Toast from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import OtpModal from '@/components/OtpModal';
import { Loader2, Lock } from 'lucide-react'; 
import type { EmployeeProfile } from '@/types/profile';
import { profileApi } from '@/lib/api/profile';

// Import các UI components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; 

export default function EditProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    address: '',
    personalEmail: '',
    ecName: '',
    ecRelation: '',
    ecPhone: '',
    idNumberNew: '',
    bankAccountNew: ''
  });

  const [toast, setToast] = useState({ open: false, type: 'info', message: '' });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [otpMessage, setOtpMessage] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getProfile();
      setProfile(data);

      setFormData({
        phoneNumber: data.basicInfo?.phoneNumber || '',
        address: data.basicInfo?.address || '',
        personalEmail: data.basicInfo?.personalEmail || '',
        ecName: data.basicInfo?.emergencyContact?.name || '',
        ecRelation: data.basicInfo?.emergencyContact?.relation || '',
        ecPhone: data.basicInfo?.emergencyContact?.phone || '',
        idNumberNew: '',
        bankAccountNew: ''
      });
    } catch (err) {
      setToast({ open: true, type: 'error', message: err instanceof Error ? err.message : 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const hasSensitiveUpdate = formData.idNumberNew || formData.bankAccountNew;

      if (!hasSensitiveUpdate) {
        await profileApi.updateBasicInfo({
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          personalEmail: formData.personalEmail,
          emergencyContact: {
            name: formData.ecName,
            phone: formData.ecPhone,
            relation: formData.ecRelation
          }
        });
        setToast({ open: true, type: 'success', message: 'Profile updated successfully!' });
      } else {
         const hasBasicChanges =
          formData.phoneNumber !== (profile?.basicInfo?.phoneNumber || '') ||
          formData.address !== (profile?.basicInfo?.address || '') ||
          formData.personalEmail !== (profile?.basicInfo?.personalEmail || '') ||
          formData.ecName !== (profile?.basicInfo?.emergencyContact?.name || '') ||
          formData.ecPhone !== (profile?.basicInfo?.emergencyContact?.phone || '') ||
          formData.ecRelation !== (profile?.basicInfo?.emergencyContact?.relation || '');

        if (hasBasicChanges) {
          await profileApi.updateBasicInfo({
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            personalEmail: formData.personalEmail,
            emergencyContact: {
              name: formData.ecName,
              phone: formData.ecPhone,
              relation: formData.ecRelation
            }
          });
        }

        const response = await profileApi.requestSensitiveUpdate({
          idNumber: formData.idNumberNew,
          bankAccount: formData.bankAccountNew
        });

        setPendingRequestId(response.requestId);
        setOtpMessage(response.message);
        setShowOtpModal(true);
      }
    } catch (err) {
      setToast({ open: true, type: 'error', message: err instanceof Error ? err.message : 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
      if (!pendingRequestId) return;
      try {
        const response = await profileApi.verifyOtp({
          requestId: pendingRequestId,
          otpCode: otpCode
        });
        setShowOtpModal(false);
        setToast({ open: true, type: 'success', message: response.message || 'Submitted for HR approval!' });
        setTimeout(() => router.push('/profile'), 1500);
      } catch (err) {
        setToast({ open: true, type: 'error', message: err instanceof Error ? err.message : 'Invalid OTP.' });
      }
  };
  
  const handleResendOtp = async () => {
       if (!pendingRequestId) return;
        try {
        const response = await profileApi.requestSensitiveUpdate({
            idNumber: formData.idNumberNew,
            bankAccount: formData.bankAccountNew
        });
        setPendingRequestId(response.requestId);
        setOtpMessage(response.message || "OTP resent.");
        setToast({ open: true, type: 'success', message: 'OTP resent.' });
        } catch (err) {
        setToast({ open: true, type: 'error', message: 'Failed to resend OTP.' });
        }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full space-y-6">
      <Toast
        open={toast.open}
        type={toast.type as any}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form Section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information Card */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6 bg-white dark:bg-[#1a2831] dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder={profile?.basicInfo?.phoneNumber || "Enter phone number"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="personalEmail">Personal Email</Label>
                <Input
                  id="personalEmail"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleInputChange}
                  placeholder={profile?.basicInfo?.personalEmail || "Enter personal email"}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={profile?.basicInfo?.address || "Enter address"}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6 bg-white dark:bg-[#1a2831] dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="ecName">Contact Name</Label>
                <Input
                  id="ecName"
                  name="ecName"
                  value={formData.ecName}
                  onChange={handleInputChange}
                  placeholder={profile?.basicInfo?.emergencyContact?.name}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ecRelation">Relationship</Label>
                <Input
                  id="ecRelation"
                  name="ecRelation"
                  value={formData.ecRelation}
                  onChange={handleInputChange}
                  placeholder={profile?.basicInfo?.emergencyContact?.relation}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="ecPhone">Emergency Phone</Label>
                <Input
                  id="ecPhone"
                  name="ecPhone"
                  value={formData.ecPhone}
                  onChange={handleInputChange}
                  placeholder={profile?.basicInfo?.emergencyContact?.phone}
                />
              </div>
            </div>
          </div>

          {/* Sensitive Info Section */}
          <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-6 dark:bg-yellow-900/10 dark:border-yellow-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-500">
                Sensitive Information
              </h2>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400/80 mb-6 ml-7">
              Editing these fields requires OTP verification and HR approval.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="text-yellow-900 dark:text-yellow-200">
                  Tax ID (Current: {profile.sensitiveInfo?.idNumber || 'Not set'})
                </Label>
                <Input
                  name="idNumberNew"
                  placeholder="Enter new Tax ID"
                  value={formData.idNumberNew}
                  onChange={handleInputChange}
                  className="border-yellow-200 focus-visible:ring-yellow-400 dark:border-yellow-800"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-yellow-900 dark:text-yellow-200">
                  Bank Account (Current: {profile.sensitiveInfo?.bankAccount || 'Not set'})
                </Label>
                <Input
                  name="bankAccountNew"
                  placeholder="Enter new Bank Account"
                  value={formData.bankAccountNew}
                  onChange={handleInputChange}
                  className="border-yellow-200 focus-visible:ring-yellow-400 dark:border-yellow-800"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border bg-card text-card-foreground shadow p-6 bg-white dark:bg-[#1a2831] dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Change Summary</h2>
            <div className="space-y-4 text-sm">
                
                 {!formData.phoneNumber && !formData.personalEmail && !formData.address &&
                 !formData.ecName && !formData.ecRelation && !formData.ecPhone &&
                 !formData.idNumberNew && !formData.bankAccountNew && (
                  <p className="text-slate-500 italic text-center py-4">No changes detected</p>
                 )}

                 {/* Phone Number Changes */}
                 {formData.phoneNumber !== (profile?.basicInfo?.phoneNumber || '') && (
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Phone Number</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-400 line-through opacity-70">{profile?.basicInfo?.phoneNumber || 'Empty'}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs text-green-600 font-medium">{formData.phoneNumber}</span>
                    </div>
                  </div>
                )}

                {/* Email Changes */}
                {formData.personalEmail !== (profile?.basicInfo?.personalEmail || '') && (
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Personal Email</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-400 line-through opacity-70">{profile?.basicInfo?.personalEmail || 'Empty'}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs text-green-600 font-medium">{formData.personalEmail}</span>
                    </div>
                  </div>
                )}

                {/* Address Changes */}
                {formData.address !== (profile?.basicInfo?.address || '') && (
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Address</p>
                    <div className="flex flex-col gap-1 mt-1">
                        <span className="text-xs text-red-400 line-through opacity-70 truncate">{profile?.basicInfo?.address || 'Empty'}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-400">→</span>
                           <span className="text-xs text-green-600 font-medium truncate">{formData.address}</span>
                        </div>
                    </div>
                  </div>
                )}

                {/* Emergency Contact Name Changes */}
                {formData.ecName !== (profile?.basicInfo?.emergencyContact?.name || '') && (
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Contact Name</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-400 line-through opacity-70">{profile?.basicInfo?.emergencyContact?.name || 'Empty'}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs text-green-600 font-medium">{formData.ecName}</span>
                    </div>
                  </div>
                )}

                {/* Emergency Contact Relation Changes */}
                {formData.ecRelation !== (profile?.basicInfo?.emergencyContact?.relation || '') && (
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Relation</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-400 line-through opacity-70">{profile?.basicInfo?.emergencyContact?.relation || 'Empty'}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs text-green-600 font-medium">{formData.ecRelation}</span>
                    </div>
                  </div>
                )}

                {/* Emergency Contact Phone Changes */}
                {formData.ecPhone !== (profile?.basicInfo?.emergencyContact?.phone || '') && (
                  <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Emergency Phone</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-400 line-through opacity-70">{profile?.basicInfo?.emergencyContact?.phone || 'Empty'}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs text-green-600 font-medium">{formData.ecPhone}</span>
                    </div>
                  </div>
                )}

                {/* Sensitive Info Changes - Tax ID */}
                {formData.idNumberNew && (
                  <div className="pb-3 border-b border-yellow-200 dark:border-yellow-900">
                    <p className="font-medium text-yellow-700 dark:text-yellow-500">Tax ID Update</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">New:</span>
                        <span className="text-xs text-yellow-600 font-medium">{formData.idNumberNew}</span>
                    </div>
                  </div>
                )}

                {/* Sensitive Info Changes - Bank Account */}
                {formData.bankAccountNew && (
                  <div className="pb-3 border-b border-yellow-200 dark:border-yellow-900">
                    <p className="font-medium text-yellow-700 dark:text-yellow-500">Bank Update</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">New:</span>
                        <span className="text-xs text-yellow-600 font-medium">{formData.bankAccountNew}</span>
                    </div>
                  </div>
                )}

            </div>
          </div>
        </div>
      </div>

      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
        message={otpMessage}
      />
    </div>
  );
}