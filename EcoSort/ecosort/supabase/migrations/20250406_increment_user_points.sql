
-- Create a function to safely increment user points and scan count
CREATE OR REPLACE FUNCTION increment_user_points(user_id_param UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    points = COALESCE(points, 0) + points_to_add,
    scans = COALESCE(scans, 0) + 1
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
