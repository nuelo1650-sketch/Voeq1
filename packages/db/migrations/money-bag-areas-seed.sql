-- MONEY BAG B3 — areas seed (36 states + FCT, Delta-complete national taxonomy).
-- Idempotent: ON CONFLICT DO NOTHING. Never renames/deactivates (same rule as niche categories).
-- States ship with their capital city + 1-2 major commercial areas as the first wave.
INSERT INTO areas (id, state_name, area_name, subarea_name) VALUES
-- Abia
('abia-aba', 'Abia', 'Aba', NULL),
('abia-umuahia', 'Abia', 'Umuahia', NULL),
-- Adamawa
('adamawa-yola', 'Adamawa', 'Yola', NULL),
-- Akwa Ibom
('akwaibom-uyo', 'Akwa Ibom', 'Uyo', NULL),
('akwaibom-eket', 'Akwa Ibom', 'Eket', NULL),
-- Anambra
('anambra-awka', 'Anambra', 'Awka', NULL),
('anambra-onitsha', 'Anambra', 'Onitsha', NULL),
('anambra-nnewi', 'Anambra', 'Nnewi', NULL),
-- Bauchi
('bauchi-bauchi', 'Bauchi', 'Bauchi', NULL),
-- Bayelsa
('bayelsa-yenagoa', 'Bayelsa', 'Yenagoa', NULL),
-- Benue
('benue-makurdi', 'Benue', 'Makurdi', NULL),
-- Borno
('borno-maiduguri', 'Borno', 'Maiduguri', NULL),
-- Cross River
('crossriver-calabar', 'Cross River', 'Calabar', NULL),
-- Delta
('delta-asaba', 'Delta', 'Asaba', NULL),
('delta-warri', 'Delta', 'Warri', NULL),
('delta-okerenkoko', 'Delta', 'Okerenkoko', NULL),
('delta-kurutie', 'Delta', 'Kurutie', NULL),
('delta-ugbomro', 'Delta', 'Ugbomro', NULL),
-- Ebonyi
('ebonyi-abakaliki', 'Ebonyi', 'Abakaliki', NULL),
-- Edo
('edo-benin-city', 'Edo', 'Benin City', NULL),
('edo-ekpoma', 'Edo', 'Ekpoma', NULL),
-- Ekiti
('ekiti-ado-ekiti', 'Ekiti', 'Ado Ekiti', NULL),
-- Enugu
('enugu-enugu', 'Enugu', 'Enugu', NULL),
-- FCT
('fct-abuja-central', 'FCT', 'Abuja', 'Central'),
('fct-abuja-garki', 'FCT', 'Abuja', 'Garki'),
('fct-abuja-wuse', 'FCT', 'Abuja', 'Wuse'),
('fct-abuja-nyanya', 'FCT', 'Abuja', 'Nyanya'),
-- Gombe
('gombe-gombe', 'Gombe', 'Gombe', NULL),
-- Imo
('imo-owerri', 'Imo', 'Owerri', NULL),
-- Jigawa
('jigawa-dutse', 'Jigawa', 'Dutse', NULL),
-- Kaduna
('kaduna-kaduna', 'Kaduna', 'Kaduna', NULL),
('kaduna-zaria', 'Kaduna', 'Zaria', NULL),
-- Kano
('kano-kano', 'Kano', 'Kano', NULL),
-- Katsina
('katsina-katsina', 'Katsina', 'Katsina', NULL),
-- Kebbi
('kebbi-birnin-kebbi', 'Kebbi', 'Birnin Kebbi', NULL),
-- Kogi
('kogi-lokoja', 'Kogi', 'Lokoja', NULL),
-- Kwara
('kwara-ilorin', 'Kwara', 'Ilorin', NULL),
-- Lagos
('lagos-ikeja', 'Lagos', 'Ikeja', NULL),
('lagos-yaba', 'Lagos', 'Yaba', NULL),
('lagos-surulere', 'Lagos', 'Surulere', NULL),
('lagos-lekki', 'Lagos', 'Lekki', NULL),
('lagos-ibadan-express', 'Lagos', 'Ikorodu', NULL),
-- Nasarawa
('nasarawa-keffi', 'Nasarawa', 'Keffi', NULL),
-- Niger
('niger-minna', 'Niger', 'Minna', NULL),
-- Ogun
('ogun-abeokuta', 'Ogun', 'Abeokuta', NULL),
('ogun-ago-iwoye', 'Ogun', 'Ago Iwoye', NULL),
-- Ondo
('ondo-akure', 'Ondo', 'Akure', NULL),
-- Osun
('osun-osogbo', 'Osun', 'Osogbo', NULL),
('osun-ile-ife', 'Osun', 'Ile-Ife', NULL),
-- Oyo
('oyo-ibadan', 'Oyo', 'Ibadan', NULL),
('oyo-ogbomoso', 'Oyo', 'Ogbomoso', NULL),
-- Plateau
('plateau-jos', 'Plateau', 'Jos', NULL),
-- Rivers
('rivers-port-harcourt', 'Rivers', 'Port Harcourt', NULL),
('rivers-bori', 'Rivers', 'Bori', NULL),
-- Sokoto
('sokoto-sokoto', 'Sokoto', 'Sokoto', NULL),
-- Taraba
('taraba-jalingo', 'Taraba', 'Jalingo', NULL),
-- Yobe
('yobe-damaturu', 'Yobe', 'Damaturu', NULL),
-- Zamfara
('zamfara-gusau', 'Zamfara', 'Gusau', NULL)
ON CONFLICT (state_name, area_name, subarea_name) DO NOTHING;
