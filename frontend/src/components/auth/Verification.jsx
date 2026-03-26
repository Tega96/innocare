// frontend/src/components/auth/Verification.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaPhone, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import OtpInput from 'react-otp-input';
import toast from 'react-hot-toast';

const Verification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, verifyEmail, verifyPhone } = useAuth();
  
  const [verificationType, setVerificationType] = useState('email');
  const [emailToken, setEmailToken] = useState(searchParams.get('token'));
  const [phoneCode, setPhoneCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // If email token is present in URL, verify email automatically
    if (emailToken) {
      handleEmailVerification();
    }
  }, [emailToken]);

  const handleEmailVerification = async () => {
    setVerifying(true);
    const result = await verifyEmail(emailToken);
    if (result.success) {
      toast.success('Email verified successfully!');
      setTimeout(() => navigate('/login'), 2000);
    }
    setVerifying(false);
  };

  const handlePhoneVerification = async () => {
    if (!phoneCode || phoneCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    
    setVerifying(true);
    const result = await verifyPhone(user?.id, phoneCode);
    if (result.success) {
      toast.success('Phone verified successfully!');
      setTimeout(() => navigate('/login'), 2000);
    }
    setVerifying(false);
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      // API call to resend verification
      if (verificationType === 'email') {
        await axios.post('/api/auth/resend-verification-email', { email: user?.email });
        toast.success('Verification email sent!');
      } else {
        // Resend SMS
        await axios.post('/api/auth/resend-verification-sms', { phone: user?.phone });
        toast.success('Verification code sent via SMS!');
      }
    } catch (error) {
      toast.error('Failed to resend verification');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 p-3 rounded-full">
              {verificationType === 'email' ? (
                <FaEnvelope className="h-8 w-8 text-primary-600" />
              ) : (
                <FaPhone className="h-8 w-8 text-primary-600" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Verify Your {verificationType === 'email' ? 'Email' : 'Phone'}
          </h2>
          <p className="mt-2 text-gray-600">
            {verificationType === 'email' 
              ? `We've sent a verification link to ${user?.email || 'your email'}`
              : `We've sent a 6-digit code to ${user?.phone || 'your phone'}`}
          </p>
        </div>

        <div className="mt-8">
          {/* Toggle between email and phone verification */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setVerificationType('email')}
              className={`flex-1 pb-2 text-center ${
                verificationType === 'email'
                  ? 'border-b-2 border-primary-600 text-primary-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setVerificationType('phone')}
              className={`flex-1 pb-2 text-center ${
                verificationType === 'phone'
                  ? 'border-b-2 border-primary-600 text-primary-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Phone
            </button>
          </div>

          {verificationType === 'email' ? (
            <div className="space-y-4">
              {!emailToken ? (
                <>
                  <p className="text-center text-sm text-gray-600">
                    Click the button below to receive a verification email
                  </p>
                  <button
                    onClick={resendVerification}
                    disabled={resending}
                    className="btn-primary w-full"
                  >
                    {resending ? (
                      <FaSpinner className="animate-spin inline mr-2" />
                    ) : (
                      <FaEnvelope className="inline mr-2" />
                    )}
                    Send Verification Email
                  </button>
                </>
              ) : (
                <div className="text-center">
                  {verifying ? (
                    <div className="flex flex-col items-center">
                      <FaSpinner className="animate-spin h-8 w-8 text-primary-600 mb-2" />
                      <p>Verifying your email...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FaCheckCircle className="h-12 w-12 text-green-500 mb-2" />
                      <p className="text-green-600 font-medium">Email verified!</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Redirecting to login...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <OtpInput
                  value={phoneCode}
                  onChange={setPhoneCode}
                  numInputs={6}
                  renderSeparator={<span className="mx-2">-</span>}
                  renderInput={(props) => (
                    <input
                      {...props}
                      className="w-12 h-12 text-center border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                    />
                  )}
                  inputStyle={{
                    fontSize: '1.5rem',
                  }}
                />
              </div>
              
              <button
                onClick={handlePhoneVerification}
                disabled={verifying || phoneCode.length !== 6}
                className="btn-primary w-full"
              >
                {verifying ? (
                  <FaSpinner className="animate-spin inline mr-2" />
                ) : (
                  'Verify Code'
                )}
              </button>
              
              <div className="text-center">
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {resending ? 'Sending...' : "Didn't receive code? Resend"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By verifying your account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Verification;