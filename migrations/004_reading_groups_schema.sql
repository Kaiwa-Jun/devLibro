
DROP TABLE IF EXISTS circle_meetings CASCADE;
DROP TABLE IF EXISTS circle_messages CASCADE;
DROP TABLE IF EXISTS circle_progress CASCADE;
DROP TABLE IF EXISTS circle_schedules CASCADE;
DROP TABLE IF EXISTS circle_participants CASCADE;
DROP TABLE IF EXISTS reading_circles CASCADE;
DROP TYPE IF EXISTS circle_status_enum CASCADE;
DROP TYPE IF EXISTS participant_role_enum CASCADE;
DROP TYPE IF EXISTS participant_status_enum CASCADE;

CREATE TYPE circle_status_enum AS ENUM ('planning', 'active', 'completed', 'cancelled');
CREATE TYPE participant_role_enum AS ENUM ('host', 'co-host', 'participant');
CREATE TYPE participant_status_enum AS ENUM ('pending', 'approved', 'declined', 'left');

CREATE TABLE reading_circles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status circle_status_enum NOT NULL DEFAULT 'planning',
    max_participants INTEGER NOT NULL DEFAULT 10,
    is_private BOOLEAN NOT NULL DEFAULT false,
    start_date DATE,
    end_date DATE,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE circle_participants (
    id SERIAL PRIMARY KEY,
    circle_id INTEGER NOT NULL REFERENCES reading_circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role participant_role_enum NOT NULL DEFAULT 'participant',
    status participant_status_enum NOT NULL DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_circle_participant UNIQUE (circle_id, user_id)
);

CREATE TABLE circle_schedules (
    id SERIAL PRIMARY KEY,
    circle_id INTEGER NOT NULL REFERENCES reading_circles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_page INTEGER,
    end_page INTEGER,
    scheduled_date DATE NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE circle_progress (
    id SERIAL PRIMARY KEY,
    circle_id INTEGER NOT NULL REFERENCES reading_circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES circle_schedules(id) ON DELETE CASCADE,
    current_page INTEGER,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completion_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_schedule_progress UNIQUE (user_id, schedule_id)
);

CREATE TABLE circle_messages (
    id SERIAL PRIMARY KEY,
    circle_id INTEGER NOT NULL REFERENCES reading_circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    parent_id INTEGER REFERENCES circle_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE circle_meetings (
    id SERIAL PRIMARY KEY,
    circle_id INTEGER NOT NULL REFERENCES reading_circles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_url TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_pattern VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reading_circles_book_id ON reading_circles (book_id);
CREATE INDEX idx_reading_circles_created_by ON reading_circles (created_by);
CREATE INDEX idx_reading_circles_status ON reading_circles (status);
CREATE INDEX idx_reading_circles_start_date ON reading_circles (start_date);

CREATE INDEX idx_circle_participants_circle_id ON circle_participants (circle_id);
CREATE INDEX idx_circle_participants_user_id ON circle_participants (user_id);
CREATE INDEX idx_circle_participants_status ON circle_participants (status);

CREATE INDEX idx_circle_schedules_circle_id ON circle_schedules (circle_id);
CREATE INDEX idx_circle_schedules_scheduled_date ON circle_schedules (scheduled_date);

CREATE INDEX idx_circle_progress_circle_id ON circle_progress (circle_id);
CREATE INDEX idx_circle_progress_user_id ON circle_progress (user_id);
CREATE INDEX idx_circle_progress_schedule_id ON circle_progress (schedule_id);

CREATE INDEX idx_circle_messages_circle_id ON circle_messages (circle_id);
CREATE INDEX idx_circle_messages_user_id ON circle_messages (user_id);
CREATE INDEX idx_circle_messages_parent_id ON circle_messages (parent_id);

CREATE INDEX idx_circle_meetings_circle_id ON circle_meetings (circle_id);
CREATE INDEX idx_circle_meetings_meeting_date ON circle_meetings (meeting_date);

CREATE TRIGGER update_reading_circles_updated_at
BEFORE UPDATE ON reading_circles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circle_participants_updated_at
BEFORE UPDATE ON circle_participants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circle_schedules_updated_at
BEFORE UPDATE ON circle_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circle_progress_updated_at
BEFORE UPDATE ON circle_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circle_messages_updated_at
BEFORE UPDATE ON circle_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circle_meetings_updated_at
BEFORE UPDATE ON circle_meetings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE reading_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public circles are viewable by everyone" ON reading_circles
    FOR SELECT USING (NOT is_private);

CREATE POLICY "Private circles are viewable by participants" ON reading_circles
    FOR SELECT USING (
        is_private AND EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = reading_circles.id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Users can create circles" ON reading_circles
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Hosts can update circles" ON reading_circles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = reading_circles.id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Hosts can delete circles" ON reading_circles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = reading_circles.id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role = 'host'
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Circle participants are viewable by circle members" ON circle_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_participants AS cp
            WHERE cp.circle_id = circle_participants.circle_id
            AND cp.user_id = auth.uid()
            AND cp.status = 'approved'
        )
    );

CREATE POLICY "Users can request to join circles" ON circle_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        role = 'participant' AND
        status = 'pending'
    );

CREATE POLICY "Users can update own participant status" ON circle_participants
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Hosts can update any participant" ON circle_participants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM circle_participants AS cp
            WHERE cp.circle_id = circle_participants.circle_id
            AND cp.user_id = auth.uid()
            AND cp.role IN ('host', 'co-host')
            AND cp.status = 'approved'
        )
    );

CREATE POLICY "Circle schedules are viewable by circle members" ON circle_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_schedules.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Hosts can create schedules" ON circle_schedules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_schedules.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Hosts can update schedules" ON circle_schedules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_schedules.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Hosts can delete schedules" ON circle_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_schedules.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Users can view own progress" ON circle_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Hosts can view all progress" ON circle_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_progress.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Users can create own progress" ON circle_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON circle_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Circle messages are viewable by circle members" ON circle_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_messages.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Circle members can create messages" ON circle_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_messages.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Users can update own messages" ON circle_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Hosts can update any message" ON circle_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_messages.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Users can delete own messages" ON circle_messages
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Hosts can delete any message" ON circle_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_messages.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Circle meetings are viewable by circle members" ON circle_meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_meetings.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Hosts can create meetings" ON circle_meetings
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_meetings.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Hosts can update meetings" ON circle_meetings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_meetings.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );

CREATE POLICY "Hosts can delete meetings" ON circle_meetings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM circle_participants
            WHERE circle_participants.circle_id = circle_meetings.circle_id
            AND circle_participants.user_id = auth.uid()
            AND circle_participants.role IN ('host', 'co-host')
            AND circle_participants.status = 'approved'
        )
    );
