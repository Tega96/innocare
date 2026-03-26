// frontend/src/components/patient/AppointmentBooking.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaVideo, 
  FaMapMarkerAlt, 
  FaUserMd,
  FaArrowLeft,
  FaCheckCircle,
  FaCreditCard
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AppointmentBooking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [appointmentType, setAppointmentType] = useState('video');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await axios.get(`/api/doctors/${doctorId}`);
      setDoctor(response.data.doctor);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      toast.error('Failed to load doctor details');
      navigate('/patient/search-doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(`/api/appointments/available-slots/${doctorId}?date=${selectedDate}`);
      setAvailableSlots(response.data.slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available time slots');
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }
    
    setBooking(true);
    
    try {
      const bookingData = {
        doctorId,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        type: appointmentType,
        symptoms,
        notes,
        recordingConsent: appointmentType === 'video' ? recordingConsent : false
      };
      
      const response = await axios.post('/api/appointments/book', bookingData);
      
      toast.success('Appointment booked successfully!');
      
      // Redirect to payment if needed
      if (response.data.paymentRequired) {
        navigate(`/payment?appointmentId=${response.data.appointment.id}&amount=${response.data.paymentRequired}`);
      } else {
        navigate('/patient/appointments');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    // Get next 14 days
    for (let i = 1; i <= 14; i++) {
      const date = addDays(today, i);
      const dayOfWeek = format(date, 'EEEE');
      
      // Check if doctor works on this day
      if (doctor?.available_days?.includes(dayOfWeek)) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-linear-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/patient/search-doctors')}
              className="mr-4 text-white hover:text-primary-200"
            >
              <FaArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Book Appointment</h1>
              <p className="mt-2 text-primary-100">
                with Dr. {doctor?.first_name} {doctor?.last_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex-1 text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <p className="text-sm text-gray-600">Select Date & Time</p>
                </div>
                <div className="flex-1 h-px bg-gray-200"></div>
                <div className="flex-1 text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <p className="text-sm text-gray-600">Appointment Details</p>
                </div>
                <div className="flex-1 h-px bg-gray-200"></div>
                <div className="flex-1 text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <p className="text-sm text-gray-600">Confirm & Pay</p>
                </div>
              </div>

              <form onSubmit={handleBooking}>
                {/* Step 1: Select Date & Time */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Appointment Type
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setAppointmentType('video')}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            appointmentType === 'video'
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <FaVideo className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                          <p className="font-medium">Video Consultation</p>
                          <p className="text-sm text-gray-500">Consult from home</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppointmentType('in_person')}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            appointmentType === 'in_person'
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <FaMapMarkerAlt className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                          <p className="font-medium">In-Person Visit</p>
                          <p className="text-sm text-gray-500">Visit at hospital</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Date
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {getAvailableDates().map((date) => (
                          <button
                            key={date.toString()}
                            type="button"
                            onClick={() => handleDateSelect(format(date, 'yyyy-MM-dd'))}
                            className={`p-3 border rounded-lg text-center transition-all ${
                              selectedDate === format(date, 'yyyy-MM-dd')
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className="font-medium">{format(date, 'EEE')}</p>
                            <p className="text-lg font-bold">{format(date, 'dd')}</p>
                            <p className="text-sm text-gray-500">{format(date, 'MMM')}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Select Time
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`p-2 border rounded-lg text-center transition-all ${
                                selectedTime === slot.time
                                  ? 'border-primary-600 bg-primary-50'
                                  : slot.available
                                  ? 'border-gray-200 hover:border-gray-300'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <FaClock className="h-4 w-4 mx-auto mb-1" />
                              {slot.time.slice(0, 5)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!selectedDate || !selectedTime}
                        className="btn-primary"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Appointment Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Describe Your Symptoms
                      </label>
                      <textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        rows="3"
                        className="input-field"
                        placeholder="Please describe your symptoms, how long you've been experiencing them, and any other relevant information..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="2"
                        className="input-field"
                        placeholder="Any other information you'd like the doctor to know..."
                      />
                    </div>

                    {appointmentType === 'video' && (
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="recordingConsent"
                          checked={recordingConsent}
                          onChange={(e) => setRecordingConsent(e.target.checked)}
                          className="mt-1 mr-3"
                        />
                        <label htmlFor="recordingConsent" className="text-sm text-gray-700">
                          I consent to having this video consultation recorded for medical records.
                          The recording will be stored securely and only accessible to authorized medical personnel.
                        </label>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn-secondary"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="btn-primary"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirm & Pay */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Appointment Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Doctor:</span>
                          <span className="font-medium">Dr. {doctor?.first_name} {doctor?.last_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Specialization:</span>
                          <span>{doctor?.specialization}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span>{format(new Date(selectedDate), 'EEEE, MMMM do, yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span>{selectedTime.slice(0, 5)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="capitalize">{appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit'}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">Consultation Fee:</span>
                            <span className="font-bold text-primary-600">₦{doctor?.consultation_fee}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Platform fee (10%):</span>
                            <span className="text-gray-500">₦{Math.round(doctor?.consultation_fee * 0.1)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Doctor earnings:</span>
                            <span className="text-gray-500">₦{Math.round(doctor?.consultation_fee * 0.9)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {symptoms && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Symptoms</h3>
                        <p className="text-sm text-gray-600">{symptoms}</p>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-secondary"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={booking}
                        className="btn-primary flex items-center"
                      >
                        {booking ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCreditCard className="mr-2" />
                            Proceed to Payment (₦{doctor?.consultation_fee})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Doctor Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center">
                  <FaUserMd className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Dr. {doctor?.first_name} {doctor?.last_name}
                  </h3>
                  <p className="text-sm text-primary-600">{doctor?.specialization}</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Experience</p>
                  <p className="font-medium">{doctor?.years_of_experience}+ years</p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{doctor?.hospital_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Available Hours</p>
                  <p className="font-medium">
                    {doctor?.available_time_start} - {doctor?.available_time_end}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Consultation Fee</p>
                  <p className="text-xl font-bold text-primary-600">₦{doctor?.consultation_fee}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center text-green-600 text-sm">
                  <FaCheckCircle className="mr-2" />
                  Verified Doctor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;