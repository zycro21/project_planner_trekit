-- Membuat tabel users
CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Membuat tabel itineraries
CREATE TABLE itineraries (
  itinerary_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel destinations
CREATE TABLE destinations (
  destination_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  country VARCHAR(255),
  city VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  description TEXT,
  image_url TEXT
);

-- Membuat tabel itinerary_destinations
CREATE TABLE itinerary_destinations (
  id VARCHAR(50) PRIMARY KEY,
  itinerary_id VARCHAR(50) REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
  destination_id VARCHAR(50) REFERENCES destinations(destination_id) ON DELETE CASCADE,
  day INT CHECK (day > 0),
  order_index INT
);

-- Membuat tabel reviews
CREATE TABLE reviews (
  review_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  destination_id VARCHAR(50) REFERENCES destinations(destination_id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel wishlist
CREATE TABLE wishlist (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  destination_id VARCHAR(50) REFERENCES destinations(destination_id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel settings
CREATE TABLE settings (
  setting_id VARCHAR(50) PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT
);
