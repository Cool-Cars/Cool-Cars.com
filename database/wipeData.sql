-- Disable foreign key constraints to avoid issues during truncation
ALTER TABLE Cars DISABLE TRIGGER ALL;
ALTER TABLE Images DISABLE TRIGGER ALL;
ALTER TABLE UserFavorites DISABLE TRIGGER ALL;

-- Truncate all tables
TRUNCATE TABLE Images RESTART IDENTITY CASCADE;
TRUNCATE TABLE Bodies RESTART IDENTITY CASCADE;
TRUNCATE TABLE Users RESTART IDENTITY CASCADE;
TRUNCATE TABLE FuelType RESTART IDENTITY CASCADE;
TRUNCATE TABLE Cars RESTART IDENTITY CASCADE;
TRUNCATE TABLE Makes RESTART IDENTITY CASCADE;
TRUNCATE TABLE Colors RESTART IDENTITY CASCADE;
TRUNCATE TABLE Promotions RESTART IDENTITY CASCADE;
TRUNCATE TABLE Models RESTART IDENTITY CASCADE;
TRUNCATE TABLE UserFavorites RESTART IDENTITY CASCADE;

-- Enable foreign key constraints again
ALTER TABLE Cars ENABLE TRIGGER ALL;
ALTER TABLE Images ENABLE TRIGGER ALL;
ALTER TABLE UserFavorites ENABLE TRIGGER ALL;
