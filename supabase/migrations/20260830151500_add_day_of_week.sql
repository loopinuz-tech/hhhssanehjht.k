-- Add day_of_week column to planner_tasks
ALTER TABLE planner_tasks ADD COLUMN day_of_week TEXT;

-- For existing tasks, you might want to default them to Monday or something, 
-- but since this is a new feature we can just leave it as NULL and handle it in the app.
