-- Add task_date column to planner_tasks (for specific date assignment)
ALTER TABLE planner_tasks ADD COLUMN IF NOT EXISTS task_date DATE;

-- Create index for date queries
CREATE INDEX IF NOT EXISTS planner_tasks_date_idx ON planner_tasks (user_id, task_date);
