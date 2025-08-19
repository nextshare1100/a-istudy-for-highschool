-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Interview questions table
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  sample_answers JSONB NOT NULL,
  key_points TEXT[] NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  university TEXT,
  faculty TEXT,
  created_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview practices table
CREATE TABLE interview_practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  answer_audio_url TEXT,
  mode TEXT CHECK (mode IN ('normal', 'karaoke')),
  evaluation_score INTEGER,
  evaluation_feedback JSONB,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice analyses table
CREATE TABLE voice_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID REFERENCES interview_practices(id) ON DELETE CASCADE,
  average_volume DECIMAL(5,2),
  volume_advice TEXT,
  speech_rate INTEGER,
  pause_count INTEGER,
  transcription TEXT,
  corrections JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Karaoke practice sessions table
CREATE TABLE karaoke_practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  target_duration INTEGER NOT NULL,
  actual_duration INTEGER,
  average_pace DECIMAL(5,2),
  pace_consistency DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essay themes table
CREATE TABLE essay_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  faculties TEXT[],
  description TEXT NOT NULL,
  requirements JSONB NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  evaluation_criteria TEXT[],
  sample_outline TEXT[],
  graph_data JSONB,
  is_graph_problem BOOLEAN DEFAULT false,
  universities TEXT[],
  year INTEGER,
  tags TEXT[],
  created_by_ai BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essay submissions table
CREATE TABLE essay_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES essay_themes(id),
  content TEXT NOT NULL,
  word_count INTEGER,
  time_spent_seconds INTEGER,
  evaluation_score INTEGER,
  evaluation_details JSONB,
  is_draft BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, theme_id, is_draft)
);

-- Current affairs table
CREATE TABLE current_affairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT,
  keywords TEXT[],
  related_themes TEXT[],
  importance_score INTEGER CHECK (importance_score >= 1 AND importance_score <= 5),
  essay_prompts TEXT[],
  sources TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_interview_practices_user_id ON interview_practices(user_id);
CREATE INDEX idx_interview_practices_created_at ON interview_practices(created_at);
CREATE INDEX idx_essay_submissions_user_id ON essay_submissions(user_id);
CREATE INDEX idx_essay_submissions_theme_id ON essay_submissions(theme_id);
CREATE INDEX idx_essay_themes_category ON essay_themes(category);
CREATE INDEX idx_essay_themes_faculties ON essay_themes USING GIN(faculties);
CREATE INDEX idx_current_affairs_category ON current_affairs(category);
CREATE INDEX idx_current_affairs_importance ON current_affairs(importance_score);

-- Row Level Security (RLS)
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE karaoke_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all interview questions" ON interview_questions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own interview questions" ON interview_questions
  CREATE POLICY "Users can update their own interview questions" ON interview_questions
 FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview questions" ON interview_questions
 FOR DELETE USING (auth.uid() = user_id);

-- Interview practices policies
CREATE POLICY "Users can view their own interview practices" ON interview_practices
 FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview practices" ON interview_practices
 FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview practices" ON interview_practices
 FOR UPDATE USING (auth.uid() = user_id);

-- Voice analyses policies
CREATE POLICY "Users can view voice analyses for their practices" ON voice_analyses
 FOR SELECT USING (
   EXISTS (
     SELECT 1 FROM interview_practices
     WHERE interview_practices.id = voice_analyses.practice_id
     AND interview_practices.user_id = auth.uid()
   )
 );

CREATE POLICY "Users can create voice analyses for their practices" ON voice_analyses
 FOR INSERT WITH CHECK (
   EXISTS (
     SELECT 1 FROM interview_practices
     WHERE interview_practices.id = practice_id
     AND interview_practices.user_id = auth.uid()
   )
 );

-- Karaoke practice sessions policies
CREATE POLICY "Users can view their own karaoke sessions" ON karaoke_practice_sessions
 FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own karaoke sessions" ON karaoke_practice_sessions
 FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Essay themes policies
CREATE POLICY "Users can view all essay themes" ON essay_themes
 FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create essay themes" ON essay_themes
 FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own essay themes" ON essay_themes
 FOR UPDATE USING (auth.uid() = created_by);

-- Essay submissions policies
CREATE POLICY "Users can view their own essay submissions" ON essay_submissions
 FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own essay submissions" ON essay_submissions
 FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own essay submissions" ON essay_submissions
 FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own essay submissions" ON essay_submissions
 FOR DELETE USING (auth.uid() = user_id);

-- Functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
 NEW.updated_at = NOW();
 RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_interview_questions_updated_at BEFORE UPDATE ON interview_questions
 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_essay_themes_updated_at BEFORE UPDATE ON essay_themes
 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_essay_submissions_updated_at BEFORE UPDATE ON essay_submissions
 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();