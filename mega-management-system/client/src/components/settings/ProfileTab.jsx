import React, { useState, useRef } from 'react';
import { User, Mail, Calendar, Shield, Lock, Save, Eye, EyeOff, Check, AlertCircle, Camera, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const ProfileTab = () => {
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });

    // Validate new password
    if (name === 'newPassword') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasUpperCase: /[A-Z]/.test(value),
        hasLowerCase: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await authService.updateProfile(profileForm.name, profileForm.email);
      if (response.success) {
        toast.success(response.message || 'Profile updated successfully!');
        setIsEditingProfile(false);
        // Optionally refresh user data in context
        window.location.reload(); // Simple way to refresh user data
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const allValid = Object.values(passwordValidation).every(v => v);
    if (!allValid) {
      toast.error('Password does not meet requirements');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      if (response.success) {
        toast.success(response.message || 'Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsChangingPassword(false);
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploadingAvatar(true);
    try {
      const response = await authService.uploadAvatar(file);
      if (response.success) {
        toast.success(response.message || 'Avatar uploaded successfully!');
        // Optionally refresh user data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(response.message || 'Failed to upload avatar');
        setAvatarPreview(user?.avatar || null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to upload avatar';
      toast.error(errorMessage);
      setAvatarPreview(user?.avatar || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Profile Information Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Profile Information
        </h2>

        <div className="space-y-4">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="User avatar"
                  className="h-20 w-20 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:bg-blue-400"
                title="Upload avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <div className="flex items-center mt-1">
                <Shield className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs font-medium text-blue-600 capitalize">
                  {user?.role || 'User'}
                </span>
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center disabled:text-blue-400"
              >
                <Upload className="h-3 w-3 mr-1" />
                {isUploadingAvatar ? 'Uploading...' : 'Change avatar'}
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-2" />
              <span className="capitalize">
                Role: {user?.role || 'User'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileForm({ name: user?.name || '', email: user?.email || '' });
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Change Password
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update your password to keep your account secure
            </p>
          </div>
          <Lock className="h-8 w-8 text-gray-400" />
        </div>

        {!isChangingPassword ? (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Password Requirements:
              </h4>
              <ul className="space-y-1">
                {[
                  { label: 'At least 8 characters', valid: passwordValidation.minLength },
                  { label: 'One uppercase letter', valid: passwordValidation.hasUpperCase },
                  { label: 'One lowercase letter', valid: passwordValidation.hasLowerCase },
                  { label: 'One number', valid: passwordValidation.hasNumber },
                  { label: 'One special character', valid: passwordValidation.hasSpecialChar }
                ].map((req, index) => (
                  <li key={index} className="flex items-center text-sm">
                    {req.valid ? (
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                    )}
                    <span className={req.valid ? 'text-green-700' : 'text-gray-600'}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
