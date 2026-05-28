ALTER TABLE tasks
ADD INDEX idx_user_id_due_date_id (user_id, due_date, id);
