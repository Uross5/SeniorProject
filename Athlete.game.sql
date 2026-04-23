-- Pokreni ako već imaš staru bazu bez team_id na users.
USE basketball_project;

-- Ako teams tabela ne postoji pre users, prvo kreiraj teams ili ukloni FK ispod.

ALTER TABLE users
    ADD COLUMN team_id INT NULL AFTER email;

ALTER TABLE users
    ADD CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams (team_id) ON DELETE SET NULL;
    
ALTER TABLE athletes
    ADD COLUMN team_id INT ;
    
ALTER TABLE athletes
ADD CONSTRAINT fk_athletes_team
FOREIGN KEY (team_id)
REFERENCES teams(team_id);

SELECT * From athletes Where athletes.team_id = teams.team_id;

SELECT *
FROM athletes
JOIN teams ON athletes.team_id = teams.team_id;