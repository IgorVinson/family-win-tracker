-- Fix the existing user by inserting their role manually
-- Using the user ID from the network logs: 984267ba-c487-43cd-945e-ac469f1bd9e6
INSERT INTO public.user_roles (user_id, role) 
VALUES ('984267ba-c487-43cd-945e-ac469f1bd9e6', 'parent')
ON CONFLICT (user_id, role) DO NOTHING;