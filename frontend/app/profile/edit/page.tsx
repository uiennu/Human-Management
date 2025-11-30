'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Để chuyển trang
import OtpModal from '@/components/OtpModal';

export default function EditProfilePage() {
  const router = useRouter();
  
  // --- DỮ LIỆU GIẢ (MOCK DATA) ĐỂ TEST GIAO DIỆN ---
  // Thay vì gọi API loadProfile, mình gán thẳng dữ liệu vào đây
  const [formData, setFormData] = useState({
    phoneNumber: '+1 (555) 123-4567',
    address: '123 Market St, San Francisco, CA 94103',
    personalEmail: 'john.doe@email.com',
    ecName: 'Jane Doe',
    ecRelation: 'Spouse',
    ecPhone: '+1 (555) 987-6543',
    // Sensitive inputs
    idNumberNew: '',
    bankAccountNew: ''
  });

  // Giả lập thông tin nhạy cảm hiện tại
  const currentSensitiveInfo = {
    idNumber: '•••-••-1234',
    bankAccount: '•••• •••• •••• 5678'
  };

  const [showOtpModal, setShowOtpModal] = useState(false);

  // Xử lý nhập liệu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý nút Save (Giả lập)
  const handleSaveAll = () => {
      // 1. Giả bộ kiểm tra logic
      console.log("Saving data...", formData);

      // 2. Nếu có nhập thông tin nhạy cảm -> Hiện OTP giả
      if (formData.idNumberNew || formData.bankAccountNew) {
          setShowOtpModal(true);
      } else {
          // 3. Nếu chỉ sửa thông tin thường -> Alert thành công & Quay về
          alert('Đã cập nhật thông tin cơ bản (Demo)!');
          router.push('/profile'); 
      }
  };

  // Xử lý verify OTP (Giả lập)
  const handleVerifyOtp = (otpCode: string) => {
      // Giả bộ check OTP đúng
      if (otpCode === "123456") { 
          setShowOtpModal(false);
          alert("Gửi yêu cầu cập nhật thông tin nhạy cảm thành công! (Demo)");
          router.push('/profile');
      } else {
          alert("OTP sai rồi! (Thử nhập 123456 xem)");
      }
  };

  return (
    <div className="w-full p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between gap-3 mb-8">
          <p className="text-4xl font-black dark:text-white">Edit Profile (Demo Mode)</p>
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
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="form-input rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white h-12 px-4" />
                 </label>
                 <label className="flex flex-col">
                    <span className="pb-2 text-sm font-medium dark:text-white">Personal Email</span>
                    <input name="personalEmail" value={formData.personalEmail} onChange={handleInputChange} className="form-input rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white h-12 px-4" />
                 </label>
                 <label className="flex flex-col md:col-span-2">
                    <span className="pb-2 text-sm font-medium dark:text-white">Address</span>
                    <textarea name="address" value={formData.address} onChange={handleInputChange} className="form-input rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white min-h-28 p-4"/>
                 </label>
              </div>

              {/* Emergency Contact */}
              <div className="mt-10">
                <h2 className="text-[22px] font-bold pb-6 dark:text-white">Emergency Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col">
                        <span className="pb-2 text-sm font-medium dark:text-white">Contact Name</span>
                        <input name="ecName" value={formData.ecName} onChange={handleInputChange} className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"/>
                    </label>
                    <label className="flex flex-col">
                        <span className="pb-2 text-sm font-medium dark:text-white">Relationship</span>
                        <input name="ecRelation" value={formData.ecRelation} onChange={handleInputChange} className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"/>
                    </label>
                     <label className="flex flex-col md:col-span-2">
                        <span className="pb-2 text-sm font-medium dark:text-white">EC Phone</span>
                        <input name="ecPhone" value={formData.ecPhone} onChange={handleInputChange} className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"/>
                    </label>
                </div>
              </div>

              {/* Sensitive Info Section */}
              <div className="mt-10 p-4 border border-yellow-500/30 rounded-lg bg-yellow-50/5 dark:bg-yellow-900/10">
                <h2 className="text-[22px] font-bold pb-2 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500">lock</span>
                    Sensitive Information
                </h2>
                <p className="text-sm text-gray-500 mb-4">Editing these fields requires OTP verification.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <span className="pb-2 text-sm font-medium dark:text-white">ID Number (Current: {currentSensitiveInfo.idNumber})</span>
                        <input name="idNumberNew" placeholder="Enter new ID to update" value={formData.idNumberNew} onChange={handleInputChange} className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"/>
                    </div>
                    <div className="flex flex-col">
                        <span className="pb-2 text-sm font-medium dark:text-white">Bank Account (Current: {currentSensitiveInfo.bankAccount})</span>
                        <input name="bankAccountNew" placeholder="Enter new Bank Acc to update" value={formData.bankAccountNew} onChange={handleInputChange} className="form-input h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#101c22] dark:text-white"/>
                    </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => router.back()} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 dark:text-white hover:bg-gray-300">Cancel</button>
                <button onClick={handleSaveAll} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#13a4ec] text-white hover:bg-[#13a4ec]/90">Save Changes</button>
              </div>

            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white dark:bg-[#1a2831] rounded-xl shadow-sm p-8 sticky top-12">
                 <h2 className="text-xl font-bold dark:text-white mb-4">Summary</h2>
                 <p className="text-gray-500 text-sm">Any edits you make will appear here.</p>
             </div>
          </div>

        </div>
      </div>

      <OtpModal 
        isOpen={showOtpModal} 
        onClose={() => setShowOtpModal(false)}
        onSubmit={handleVerifyOtp}
        message="Please enter OTP: 123456 (Demo)"
      />
    </div>
  );
}