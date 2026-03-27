-- Insert sample medications
INSERT INTO medications (id, name, generic_name, category, description, price, requires_prescription, stock_quantity, unit, manufacturer, expiry_date) VALUES
(gen_random_uuid(), 'Prenatal Vitamins', 'Prenatal Multivitamin', 'Vitamins', 'Essential vitamins for pregnancy', 25.00, false, 500, 'bottle', 'Maternal Health Inc', '2025-12-31'),
(gen_random_uuid(), 'Folic Acid', 'Folic Acid', 'Vitamins', 'Prevents neural tube defects', 15.00, false, 1000, 'tablet', 'Vitamin Corp', '2025-06-30'),
(gen_random_uuid(), 'Iron Supplement', 'Ferrous Sulfate', 'Minerals', 'Prevents anemia during pregnancy', 20.00, true, 300, 'tablet', 'Mineral Health', '2025-03-31'),
(gen_random_uuid(), 'Calcium with Vitamin D', 'Calcium Carbonate', 'Minerals', 'Supports bone development', 30.00, false, 400, 'tablet', 'Bone Health Co', '2025-08-31'),
(gen_random_uuid(), 'Paracetamol', 'Acetaminophen', 'Pain Relief', 'Safe for mild pain during pregnancy', 10.00, false, 800, 'tablet', 'Pain Relief Inc', '2025-05-31'),
(gen_random_uuid(), 'Antacid', 'Calcium Carbonate', 'Digestive', 'Relieves heartburn', 12.00, false, 600, 'tablet', 'Digestive Health', '2025-09-30');

-- Insert sample doctors for maternity care
INSERT INTO doctors (id, user_id, first_name, last_name, specialization, qualifications, years_of_experience, consultation_fee, hospital_name, hospital_address, available_days, available_time_start, available_time_end, max_appointments_per_day, is_verified) VALUES
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'dr.sarah@InnoCare.com'), 'Sarah', 'Johnson', 'Obstetrician', 'MD, FACOG', 12, 150.00, 'Maternity Care Hospital', '123 Health St, Lagos', ARRAY['Monday', 'Wednesday', 'Friday'], '09:00:00', '17:00:00', 8, true),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'dr.michael@InnoCare.com'), 'Michael', 'Okafor', 'Maternal-Fetal Medicine', 'MD, PhD', 15, 200.00, 'Maternity Care Hospital', '123 Health St, Lagos', ARRAY['Tuesday', 'Thursday', 'Saturday'], '10:00:00', '18:00:00', 6, true),
(gen_random_uuid(), (SELECT id FROM users WHERE email = 'dr.amara@InnoCare.com'), 'Amara', 'Nwosu', 'Obstetrician', 'MD, MRCOG', 8, 120.00, 'Maternity Care Hospital', '123 Health St, Lagos', ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday'], '08:00:00', '16:00:00', 10, true);

-- Note: Users for these doctors need to be created first
-- INSERT INTO users (email, phone, password_hash, role, is_email_verified, is_phone_verified, is_active) VALUES
-- ('dr.sarah@InnoCare.com', '+2348012345678', '$2b$10$...', 'doctor', true, true, true),
-- ('dr.michael@InnoCare.com', '+2348023456789', '$2b$10$...', 'doctor', true, true, true),
-- ('dr.amara@InnoCare.com', '+2348034567890', '$2b$10$...', 'doctor', true, true, true);