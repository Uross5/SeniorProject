SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS basketball_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE basketball_project;

CREATE TABLE IF NOT EXISTS seasons (
    season_id INT AUTO_INCREMENT PRIMARY KEY,
    year_label INT NOT NULL,
    display_name VARCHAR(50) NULL,
    UNIQUE (year_label)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    coach_name VARCHAR(100) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    email VARCHAR(100) NULL,
    UNIQUE (username),
    CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams (team_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS athletes (
    athlete_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NULL,
    position VARCHAR(50) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rosters (
    roster_id INT AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT NOT NULL,
    team_id INT NOT NULL,
    season_id INT NOT NULL,
    jersey_number INT NULL,
    UNIQUE (athlete_id, team_id, season_id),
    CONSTRAINT fk_rosters_athlete FOREIGN KEY (athlete_id) REFERENCES athletes (athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_rosters_team FOREIGN KEY (team_id) REFERENCES teams (team_id) ON DELETE CASCADE,
    CONSTRAINT fk_rosters_season FOREIGN KEY (season_id) REFERENCES seasons (season_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    opponent_team_id INT NOT NULL,
    game_date DATE NOT NULL,
    season_id INT NOT NULL,
    home_away VARCHAR(1) NOT NULL,
    CONSTRAINT chk_games_teams CHECK (team_id <> opponent_team_id),
    CONSTRAINT chk_games_home_away CHECK (home_away IN ('H', 'A')),
    CONSTRAINT fk_games_team FOREIGN KEY (team_id) REFERENCES teams (team_id) ON DELETE RESTRICT,
    CONSTRAINT fk_games_opponent FOREIGN KEY (opponent_team_id) REFERENCES teams (team_id) ON DELETE RESTRICT,
    CONSTRAINT fk_games_season FOREIGN KEY (season_id) REFERENCES seasons (season_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS performance_stats (
    stat_id INT AUTO_INCREMENT PRIMARY KEY,
    roster_id INT NOT NULL,
    game_id INT NOT NULL,
    points_scored INT NOT NULL DEFAULT 0,
    assists INT NOT NULL DEFAULT 0,
    rebounds INT NOT NULL DEFAULT 0,
    turnovers INT NOT NULL DEFAULT 0,
    UNIQUE (roster_id, game_id),
    CONSTRAINT fk_stats_roster FOREIGN KEY (roster_id) REFERENCES rosters (roster_id) ON DELETE CASCADE,
    CONSTRAINT fk_stats_game FOREIGN KEY (game_id) REFERENCES games (game_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS percentiles (
    percentile_id INT AUTO_INCREMENT PRIMARY KEY,
    athlete_id INT NOT NULL,
    season_id INT NOT NULL,
    stat_category VARCHAR(50) NOT NULL,
    percentile_value DECIMAL(5, 2) NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (athlete_id, season_id, stat_category),
    CONSTRAINT fk_pct_athlete FOREIGN KEY (athlete_id) REFERENCES athletes (athlete_id) ON DELETE CASCADE,
    CONSTRAINT fk_pct_season FOREIGN KEY (season_id) REFERENCES seasons (season_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NULL,
    generated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    team_id INT NULL,
    season_id INT NULL,
    CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_team FOREIGN KEY (team_id) REFERENCES teams (team_id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_season FOREIGN KEY (season_id) REFERENCES seasons (season_id) ON DELETE SET NULL
) ENGINE=InnoDB;
