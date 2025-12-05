'use client';
import React, { useState, useEffect } from 'react';
import Toast from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import OtpModal from '@/components/OtpModal';
import { Loader2 } from 'lucide-react';
import type { EmployeeProfile } from '@/types/profile';
import { profileApi } from '@/lib/api/profile';

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
    // Sensitive inputs
    idNumberNew: '',
    bankAccountNew: ''
  });

  // Toast state
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

      // Populate form with existing data
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
      setTimeout(() => router.push('/profile'), 2000);
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

      // Check if sensitive data is being updated
      const hasSensitiveUpdate = formData.idNumberNew || formData.bankAccountNew;

      if (!hasSensitiveUpdate) {
        // Only update basic info
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
        // setTimeout(() => router.push('/profile'), 1500);
      } else {
        // First update basic info if changed
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

        // Then request sensitive update with OTP
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
      setToast({ open: true, type: 'success', message: response.message || 'Sensitive information update request submitted for HR approval!' });
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      setToast({ open: true, type: 'error', message: err instanceof Error ? err.message : 'Invalid OTP. Please try again.' });
    }
  };

  const handleResendOtp = async () => {
    if (!pendingRequestId) return;
    try {
      // Gửi lại OTP bằng API requestSensitiveUpdate với dữ liệu cũ
      const response = await profileApi.requestSensitiveUpdate({
        idNumber: formData.idNumberNew,
        bankAccount: formData.bankAccountNew
      });
      setPendingRequestId(response.requestId);
      setOtpMessage(response.message || "OTP resent. Please check your email.");
      setToast({ open: true, type: 'success', message: 'OTP resent. Please check your email.' });
    } catch (err) {
      setToast({ open: true, type: 'error', message: 'Failed to resend OTP. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">Failed to load profile</p>
        <button onClick={() => router.push('/profile')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-8 lg:p-12">
      <Toast
        open={toast.open}
        type={toast.type as any}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between gap-3 mb-8">
          <p className="text-4xl font-black dark:text-white">Edit Profile</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1a2831] rounded-xl shadow-sm p-8">

              {/* Personal Info */}
              <h2 className="text-[22px] font-bold pb-6 dark:text-white">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col">
                  <span className="pb-2 text-sm font-medium dark:text-white">Phone Number</span>
                  <input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder={profile?.basicInfo?.phoneNumber || "Enter phone number"}
                    className="form-input rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white h-12 px-4"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="pb-2 text-sm font-medium dark:text-white">Personal Email</span>
                  <input
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleInputChange}
                    placeholder={profile?.basicInfo?.personalEmail || "Enter personal email"}
                    className="form-input rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white h-12 px-4"
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  <span className="pb-2 text-sm font-medium dark:text-white">Address</span>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={profile?.basicInfo?.address || "Enter address"}
                    className="form-input rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white min-h-28 p-4"
                  />
                </label>
              </div>

              {/* Emergency Contact */}
              <div className="mt-10">
                <h2 className="text-[22px] font-bold pb-6 dark:text-white">Emergency Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col">
                    <span className="pb-2 text-sm font-medium dark:text-white">Contact Name</span>
                    <input
                      name="ecName"
                      value={formData.ecName}
                      onChange={handleInputChange}
                      placeholder={profile?.basicInfo?.emergencyContact?.name || "Enter contact name"}
                      className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="pb-2 text-sm font-medium dark:text-white">Relationship</span>
                    <input
                      name="ecRelation"
                      value={formData.ecRelation}
                      onChange={handleInputChange}
                      placeholder={profile?.basicInfo?.emergencyContact?.relation || "Enter relationship"}
                      className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"
                    />
                  </label>
                  <label className="flex flex-col md:col-span-2">
                    <span className="pb-2 text-sm font-medium dark:text-white">EC Phone</span>
                    <input
                      name="ecPhone"
                      value={formData.ecPhone}
                      onChange={handleInputChange}
                      placeholder={profile?.basicInfo?.emergencyContact?.phone || "Enter emergency phone"}
                      className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"
                    />
                  </label>
                </div>
              </div>

              {/* Sensitive Info Section */}
              <div className="mt-10 p-4 border border-yellow-500/30 rounded-lg bg-yellow-50/5 dark:bg-yellow-900/10">
                <h2 className="text-[22px] font-bold pb-2 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-500">lock</span>
                  Sensitive Information
                </h2>
                <p className="text-sm text-gray-500 mb-4">Editing these fields requires OTP verification and HR approval.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="pb-2 text-sm font-medium dark:text-white">
                      Tax ID (Current: {profile.sensitiveInfo?.idNumber || 'Not set'})
                    </span>
                    <input
                      name="idNumberNew"
                      placeholder="Enter new Tax ID to update"
                      value={formData.idNumberNew}
                      onChange={handleInputChange}
                      className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="pb-2 text-sm font-medium dark:text-white">
                      Bank Account (Current: {profile.sensitiveInfo?.bankAccount || 'Not set'})
                    </span>
                    <input
                      name="bankAccountNew"
                      placeholder="Enter new Bank Account to update"
                      value={formData.bankAccountNew}
                      onChange={handleInputChange}
                      className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => router.back()}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#13a4ec] text-white hover:bg-[#13a4ec]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1a2831] rounded-xl shadow-sm p-8 sticky top-12">
              <h2 className="text-xl font-bold dark:text-white mb-4">Summary</h2>
              <p className="text-gray-500 text-sm mb-6">Changes from current profile:</p>

              <div className="space-y-4 text-sm">
                {/* Personal Info Changes */}
                {formData.phoneNumber !== (profile?.basicInfo?.phoneNumber || '') && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Phone Number</p>
                    <p className="text-xs text-red-500 line-through">{profile?.basicInfo?.phoneNumber || 'Not set'}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{formData.phoneNumber || 'Empty'}</p>
                  </div>
                )}

                {formData.personalEmail !== (profile?.basicInfo?.personalEmail || '') && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Personal Email</p>
                    <p className="text-xs text-red-500 line-through">{profile?.basicInfo?.personalEmail || 'Not set'}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{formData.personalEmail || 'Empty'}</p>
                  </div>
                )}

                {formData.address !== (profile?.basicInfo?.address || '') && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">Address</p>
                    <p className="text-xs text-red-500 line-through">{profile?.basicInfo?.address || 'Not set'}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{formData.address || 'Empty'}</p>
                  </div>
                )}

                {/* Emergency Contact Changes */}
                {formData.ecName !== (profile?.basicInfo?.emergencyContact?.name || '') && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">EC Name</p>
                    <p className="text-xs text-red-500 line-through">{profile?.basicInfo?.emergencyContact?.name || 'Not set'}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{formData.ecName || 'Empty'}</p>
                  </div>
                )}

                {formData.ecRelation !== (profile?.basicInfo?.emergencyContact?.relation || '') && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">EC Relation</p>
                    <p className="text-xs text-red-500 line-through">{profile?.basicInfo?.emergencyContact?.relation || 'Not set'}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{formData.ecRelation || 'Empty'}</p>
                  </div>
                )}

                {formData.ecPhone !== (profile?.basicInfo?.emergencyContact?.phone || '') && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-slate-700 dark:text-slate-300">EC Phone</p>
                    <p className="text-xs text-red-500 line-through">{profile?.basicInfo?.emergencyContact?.phone || 'Not set'}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{formData.ecPhone || 'Empty'}</p>
                  </div>
                )}

                {/* Sensitive Info Changes */}
                {formData.idNumberNew && (
                  <div className="pb-3 border-b border-yellow-300 dark:border-yellow-700">
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">Tax ID (Requires OTP)</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">{formData.idNumberNew}</p>
                  </div>
                )}

                {formData.bankAccountNew && (
                  <div className="pb-3 border-b border-yellow-300 dark:border-yellow-700">
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">Bank Account (Requires OTP)</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">{formData.bankAccountNew}</p>
                  </div>
                )}

                {/* No changes message */}
                {!formData.phoneNumber && !formData.personalEmail && !formData.address &&
                  !formData.ecName && !formData.ecRelation && !formData.ecPhone &&
                  !formData.idNumberNew && !formData.bankAccountNew && (
                    <p className="text-gray-400 text-xs italic">No changes yet</p>
                  )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
        message={otpMessage || "Please enter the OTP sent to your registered email"}
      />
    </div>
  );
}