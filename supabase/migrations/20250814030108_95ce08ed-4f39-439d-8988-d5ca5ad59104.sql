-- Create app roles enum (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('parent', 'kid');
    END IF;
END
$$;

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_members table for parent-kid relationships
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- Create kids table (linked to authenticated kid users)
CREATE TABLE public.kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_points INTEGER NOT NULL DEFAULT 0,
  monthly_goal INTEGER NOT NULL DEFAULT 1000,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scoring_rules table
CREATE TABLE public.scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE NOT NULL,
  activity TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  bonus INTEGER NOT NULL DEFAULT 0,
  max_daily INTEGER,
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kid_id, activity)
);

-- Create daily_reports table
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  activities JSONB NOT NULL DEFAULT '{}',
  total_points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kid_id, date)
);

-- Create score_entries table
CREATE TABLE public.score_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  activity TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prizes table
CREATE TABLE public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prize_redemptions table
CREATE TABLE public.prize_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE NOT NULL,
  prize_id UUID REFERENCES public.prizes(id) ON DELETE CASCADE NOT NULL,
  date_requested TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  date_processed TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_redemptions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is in same family
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id UUID, _kid_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    JOIN public.kids k ON k.user_id = fm2.user_id
    WHERE fm1.user_id = _user_id
      AND k.id = _kid_id
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for families
CREATE POLICY "Family members can view their family" ON public.families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create families" ON public.families
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND 
    public.has_role(auth.uid(), 'parent')
  );

-- RLS policies for family_members
CREATE POLICY "Family members can view family membership" ON public.family_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.family_id = family_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage family membership" ON public.family_members
  FOR ALL USING (
    public.has_role(auth.uid(), 'parent') AND
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.family_id = family_id AND fm.user_id = auth.uid()
    )
  );

-- RLS policies for kids
CREATE POLICY "Kids can view their own data" ON public.kids
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Parents can view family kids" ON public.kids
  FOR SELECT USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), id)
  );

CREATE POLICY "Kids can update their own data" ON public.kids
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Parents can update family kids" ON public.kids
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), id)
  );

-- RLS policies for daily_reports
CREATE POLICY "Kids can manage their own reports" ON public.daily_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
  );

CREATE POLICY "Parents can view family reports" ON public.daily_reports
  FOR SELECT USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), kid_id)
  );

CREATE POLICY "Parents can approve family reports" ON public.daily_reports
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), kid_id)
  );

-- RLS policies for score_entries
CREATE POLICY "Kids can view their own scores" ON public.score_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
  );

CREATE POLICY "Parents can view family scores" ON public.score_entries
  FOR SELECT USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), kid_id)
  );

-- RLS policies for prizes (visible to all authenticated users)
CREATE POLICY "Authenticated users can view prizes" ON public.prizes
  FOR SELECT TO authenticated USING (true);

-- RLS policies for prize_redemptions
CREATE POLICY "Kids can manage their own redemptions" ON public.prize_redemptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
  );

CREATE POLICY "Parents can view family redemptions" ON public.prize_redemptions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), kid_id)
  );

CREATE POLICY "Parents can process family redemptions" ON public.prize_redemptions
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), kid_id)
  );

-- RLS policies for scoring_rules
CREATE POLICY "Kids can manage their own scoring rules" ON public.scoring_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.kids WHERE id = kid_id AND user_id = auth.uid())
  );

CREATE POLICY "Parents can manage family scoring rules" ON public.scoring_rules
  FOR ALL USING (
    public.has_role(auth.uid(), 'parent') AND
    public.is_family_member(auth.uid(), kid_id)
  );

-- RLS policies for activities (readable by all authenticated users)
CREATE POLICY "Authenticated users can view activities" ON public.activities
  FOR SELECT TO authenticated USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kids_updated_at
  BEFORE UPDATE ON public.kids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scoring_rules_updated_at
  BEFORE UPDATE ON public.scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at
  BEFORE UPDATE ON public.prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default activities
INSERT INTO public.activities (name, category) VALUES
  ('Homework', 'Education'),
  ('Reading', 'Education'),
  ('Chores', 'Household'),
  ('Exercise', 'Health'),
  ('Practice Music', 'Skills'),
  ('Help Others', 'Social'),
  ('Good Behavior', 'Behavior'),
  ('Extra Credit', 'Education');

-- Insert default prizes
INSERT INTO public.prizes (name, cost, description, category, requires_approval) VALUES
  ('Extra Screen Time (30 min)', 50, '30 minutes of additional screen time', 'Entertainment', false),
  ('Choose Dinner', 100, 'Pick what the family has for dinner', 'Food', false),
  ('Stay up Late (30 min)', 150, 'Stay up 30 minutes past bedtime', 'Privileges', true),
  ('Small Toy/Game', 200, 'Pick a small toy or game under $10', 'Rewards', true),
  ('Special Outing', 300, 'Choose a special family activity', 'Experiences', true),
  ('Friend Sleepover', 400, 'Have a friend over for a sleepover', 'Social', true),
  ('Big Reward', 500, 'Something special worth $25', 'Rewards', true);